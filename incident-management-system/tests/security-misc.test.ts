import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";

const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));
// Tests use an in-memory blacklist and must not contact credentials loaded from a developer .env.
mock.module("@/lib/redis", () => ({ redis: null }));
mock.module("../src/lib/redis", () => ({ redis: null }));

mock.module("@/lib/jwt", () => ({
  verifyToken: () => ({
    userId: "user-1",
    role: "ADMIN",
    orgId: "org-1"
  }),
}));
mock.module("../src/lib/jwt", () => ({
  verifyToken: () => ({
    userId: "user-1",
    role: "ADMIN",
    orgId: "org-1"
  }),
}));

mock.module("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const res = new Response(JSON.stringify(data), init) as Response & { json: () => Promise<unknown> };
      res.json = () => Promise.resolve(data);
      return res;
    },
    redirect: (url: string) => {
      const res = new Response(null, { status: 307 });
      res.headers.set("Location", url);
      return res;
    },
  },
}));

import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { GET as verifyGET } from "../src/app/api/auth/verify/route";
import { getNotifications } from "../src/services/notification-service";
import { profileUpdateSchema } from "../src/lib/validations";
import { POST as registerPOST } from "../src/app/api/auth/register/route";
import { POST as invitePOST } from "../src/app/api/auth/invite/route";
import { sendMail, getEmailQueueStats } from "../src/lib/mailer";
import { verifyCsrf, withAuth } from "../src/lib/api-utils";
import { NextRequest, NextResponse } from "next/server";

describe("Phase 3 Security & Enhancements Tests", () => {
  describe("Email Verification Endpoint format verification", () => {
    test("rejects verification token if it is not 64 characters", async () => {
      const req = new Request("http://localhost/api/auth/verify?token=short-token");
      const res = await verifyGET(req);
      
      expect(res.status).toBe(307);
      expect(res.headers.get("Location")).toContain("error=verification_failed");
    });

    test("rejects verification token if it contains non-hex characters", async () => {
      const nonHexToken = "z".repeat(64);
      const req = new Request(`http://localhost/api/auth/verify?token=${nonHexToken}`);
      const res = await verifyGET(req);
      
      expect(res.status).toBe(307);
      expect(res.headers.get("Location")).toContain("error=verification_failed");
    });

    test("passes verification if token is a valid 64 character hex string", async () => {
      const validHexToken = "a".repeat(64);
      
      // Stub verificationToken query
      prismaMock.verificationToken.findUnique.mockResolvedValue({
        email: "test@example.com",
        token: "hashed-token",
        expiresAt: new Date(Date.now() + 3600000),
      });

      const req = new Request(`http://localhost/api/auth/verify?token=${validHexToken}`);
      const res = await verifyGET(req);
      
      expect(res.status).toBe(307);
      expect(res.headers.get("Location")).toContain("verified=true");
    });
  });

  describe("Notifications Service Pagination", () => {
    beforeEach(() => {
      prismaMock.notification.findMany.mockClear();
    });

    test("getNotifications queries with correct skip and take skip values", async () => {
      await getNotifications("user-1", 10, 15);
      
      expect(prismaMock.notification.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
          skip: 10,
          take: 15,
        })
      );
    });
  });

  describe("Profile Update Schema Picture Domain Check", () => {
    test("allows images from whitelisted hostnames", () => {
      const validUrls = [
        "https://github.com/avatar.png",
        "https://avatars.githubusercontent.com/u/123",
        "https://cdn.example.com/images/123.jpg",
      ];

      for (const url of validUrls) {
        const result = profileUpdateSchema.safeParse({ image: url });
        expect(result.success).toBe(true);
      }
    });

    test("rejects images from non-whitelisted hostnames", () => {
      const invalidUrls = [
        "https://malicious.com/avatar.png",
        "https://someotherwebsite.org/pic.png",
      ];

      for (const url of invalidUrls) {
        const result = profileUpdateSchema.safeParse({ image: url });
        expect(result.success).toBe(false);
      }
    });
  });

  describe("Durable Email Queue", () => {
    test("persists queued email and reads queue metrics from Postgres", async () => {
      const prevUser = process.env.GMAIL_USER;
      const prevPass = process.env.GMAIL_APP_PASSWORD;
      const prevNodeEnv = process.env.NODE_ENV;
      const prevEmailSync = process.env.EMAIL_SYNC;
      try {
        delete process.env.GMAIL_USER;
        delete process.env.GMAIL_APP_PASSWORD;
        process.env.SMTP_HOST = "127.0.0.1";
        process.env.SMTP_PORT = "1025";
        (process.env as Record<string, string | undefined>).NODE_ENV = "development"; // to allow queuing
        process.env.EMAIL_SYNC = "false";
        prismaMock.job.count.mockResolvedValueOnce(3).mockResolvedValueOnce(8);
        const result = await sendMail({ to: "queued@example.com", subject: "Durable", html: "<p>Hello</p>" });
        expect(result).toEqual({ queued: true });
        expect(prismaMock.job.create).toHaveBeenCalledWith({ data: {
          type: "EMAIL",
          payload: { to: "queued@example.com", subject: "Durable", html: "<p>Hello</p>" },
        } });
        expect(await getEmailQueueStats()).toMatchObject({ queueLength: 3, dailySentCount: 8, dailyRemaining: 442 });
      } finally {
        process.env.GMAIL_USER = prevUser;
        process.env.GMAIL_APP_PASSWORD = prevPass;
        (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
        process.env.EMAIL_SYNC = prevEmailSync;
        delete process.env.SMTP_HOST;
        delete process.env.SMTP_PORT;
      }
    });
  });

  describe("Route Email Delivery Error Handling Warnings", () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockClear();
      prismaMock.user.create.mockClear();
      prismaMock.organization.create.mockClear();
      prismaMock.verificationToken.create.mockClear();
      prismaMock.team.findFirst.mockClear();
      prismaMock.invite.create.mockClear();
    });

    test("register route warns client when verification email fails to send", async () => {
      const prevUser = process.env.GMAIL_USER;
      const prevPass = process.env.GMAIL_APP_PASSWORD;
      const prevNodeEnv = process.env.NODE_ENV;
      const prevEmailSync = process.env.EMAIL_SYNC;
      try {
        delete process.env.GMAIL_USER;
        delete process.env.GMAIL_APP_PASSWORD;
        (process.env as Record<string, string | undefined>).NODE_ENV = "test";
        process.env.EMAIL_SYNC = "true";

        prismaMock.user.findUnique.mockResolvedValue(null);
        prismaMock.organization.create.mockResolvedValue({ id: "org-1" });
        prismaMock.user.create.mockResolvedValue({ id: "user-1", email: "new@example.com" });
        prismaMock.verificationToken.create.mockResolvedValue({ token: "token-1" });

        const req = new Request("http://localhost/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "new@example.com",
            password: "Password123!",
            orgName: "New Org"
          })
        });

        const res = await registerPOST(req);
        expect(res.status).toBe(201);
        const data = await res.json();
        expect(data.warning).toBe("email_delivery_failed");
        expect(data.message).toContain("could not send the verification email");
      } finally {
        process.env.GMAIL_USER = prevUser;
        process.env.GMAIL_APP_PASSWORD = prevPass;
        (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
        process.env.EMAIL_SYNC = prevEmailSync;
      }
    });

    test("invite route warns client when invitation email fails to send", async () => {
      const prevUser = process.env.GMAIL_USER;
      const prevPass = process.env.GMAIL_APP_PASSWORD;
      const prevNodeEnv = process.env.NODE_ENV;
      const prevEmailSync = process.env.EMAIL_SYNC;
      try {
        delete process.env.GMAIL_USER;
        delete process.env.GMAIL_APP_PASSWORD;
        (process.env as Record<string, string | undefined>).NODE_ENV = "test";
        process.env.EMAIL_SYNC = "true";

        prismaMock.user.findUnique.mockImplementation(async ({ where }) => {
          if (where.id === "user-1") {
            return {
              id: "user-1",
              email: "admin@example.com",
              role: "ADMIN",
              status: "ACTIVE",
              orgId: "org-1",
            };
          }
          return null; // for invitee check
        });
        prismaMock.team.findFirst.mockResolvedValue({ id: "team-1", projectId: "project-1" });
        prismaMock.invite.create.mockResolvedValue({ id: "invite-1" });

        const req = new Request("http://localhost/api/auth/invite", {
          method: "POST",
          headers: {
            "Authorization": "Bearer some-token",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email: "invitee@example.com",
            role: "DEVELOPER",
            teamId: "team-1"
          })
        });

        const res = await invitePOST(req as unknown as NextRequest);
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.warning).toBe("email_delivery_failed");
        expect(data.message).toContain("failed to send email");
        expect(data.inviteLink).toBeDefined();
      } finally {
        process.env.GMAIL_USER = prevUser;
        process.env.GMAIL_APP_PASSWORD = prevPass;
        (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
        process.env.EMAIL_SYNC = prevEmailSync;
      }
    });
  });

  describe("CSRF Protection via Origin/Referer Checking", () => {
    const prevNodeEnv = process.env.NODE_ENV;

    beforeEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    });

    afterEach(() => {
      (process.env as Record<string, string | undefined>).NODE_ENV = prevNodeEnv;
    });

    test("passes when Origin matches Host header and token matches", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Origin": "http://localhost",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "test-csrf-token",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(true);
    });

    test("fails when Origin host does not match Host header", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Origin": "http://malicious.com",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "test-csrf-token",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(false);
    });

    test("fails when Origin is invalid URL", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Origin": "not-a-valid-url",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "test-csrf-token",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(false);
    });

    test("passes when Referer matches Host header and token matches", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Referer": "http://localhost/some-page",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "test-csrf-token",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(true);
    });

    test("fails when Referer host does not match Host header", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Referer": "http://malicious.com/some-page",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "test-csrf-token",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(false);
    });

    test("passes when both Origin and Referer are absent but token matches", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "test-csrf-token",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(true);
    });

    test("fails when CSRF token is missing", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Origin": "http://localhost",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(false);
    });

    test("fails when CSRF token mismatches", () => {
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Origin": "http://localhost",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "wrong-token",
        },
      }) as NextRequest;

      expect(verifyCsrf(req)).toBe(false);
    });

    test("withAuth wrapper rejects POST requests if CSRF check fails", async () => {
      const handler = async () => new Response("OK") as unknown as NextResponse;
      const wrapped = withAuth(handler);
      
      const req = new Request("http://localhost/api/some-endpoint", {
        method: "POST",
        headers: {
          "Host": "localhost",
          "Origin": "http://malicious.com",
          "Cookie": "csrf_token=test-csrf-token",
          "X-CSRF-Token": "test-csrf-token",
        },
      }) as NextRequest;

      const res = await wrapped(req);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain("CSRF check failed");
    });
  });

  describe("API Validation Error Detail Enhancements", () => {
    test("register endpoint returns specific password strength errors", async () => {
      const req = new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "valid@example.com",
          password: "short", // invalid password
          orgName: "Valid Org",
        }),
      });

      const res = await registerPOST(req);
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toBe("Password must be at least 12 characters");
    });
  });
});
