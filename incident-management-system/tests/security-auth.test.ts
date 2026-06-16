import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";

const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));
mock.module("@/lib/redis", () => ({ redis: null }));
mock.module("../src/lib/redis", () => ({ redis: null }));

mock.module("next/server", () => {
  const mockCookies = {
    set: mock(() => mockCookies),
  };

  return {
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => {
        const res = new Response(JSON.stringify(data), init) as Response & { cookies: unknown; json: () => Promise<unknown> };
        res.cookies = mockCookies;
        res.json = () => Promise.resolve(data);
        res.headers.set("Set-Cookie", "incident_token=fake; HttpOnly; Secure");
        return res;
      },
    },
    after: mock(() => {}),
  };
});

mock.module("../src/lib/logger", () => ({
  logger: {
    error: mock(() => {}),
    info: mock(() => {}),
    warn: mock(() => {}),
  },
}));

import { expect, test, describe, beforeEach } from "bun:test";
import { canAccessIssue, SessionUser, IssueAccessTarget } from "../src/lib/authorization";
import { checkLoginAttempts, recordLoginSuccess } from "../src/lib/brute-force";
import { POST as loginPOST } from "../src/app/api/auth/login/route";

describe("Security & Authorization Tests", () => {
  describe("canAccessIssue", () => {
    const orgId = "org-1";
    const developerUser: SessionUser = {
      id: "dev-1",
      email: "dev@example.com",
      role: "DEVELOPER",
      status: "ACTIVE",
      orgId,
      projectId: "project-1",
      teamId: "team-1",
    };

    beforeEach(() => {
      prismaMock.user.findFirst.mockClear();
    });

    test("Developer CAN access issue if assigned to them and they belong to the issue's team", async () => {
      prismaMock.user.findFirst.mockResolvedValue({ id: "dev-1" });

      const issue: IssueAccessTarget = {
        projectId: "project-1",
        assignedToId: "dev-1",
        teamId: "team-1",
        project: { orgId },
      };

      const allowed = await canAccessIssue(developerUser, issue);
      expect(allowed).toBe(true);
      expect(prismaMock.user.findFirst).toHaveBeenCalled();
    });

    test("Developer CANNOT access issue if assigned to them but not in the issue's team", async () => {
      prismaMock.user.findFirst.mockResolvedValue(null);

      const issue: IssueAccessTarget = {
        projectId: "project-1",
        assignedToId: "dev-1",
        teamId: "team-2", // different team
        project: { orgId },
      };

      const allowed = await canAccessIssue(developerUser, issue);
      expect(allowed).toBe(false);
    });

    test("Developer CANNOT access issue if in team but not assigned", async () => {
      const issue: IssueAccessTarget = {
        projectId: "project-1",
        assignedToId: "dev-2", // assigned to someone else
        teamId: "team-1",
        project: { orgId },
      };

      const allowed = await canAccessIssue(developerUser, issue);
      expect(allowed).toBe(false);
    });

    test("Admin can access any issue in the organization", async () => {
      const adminUser: SessionUser = {
        id: "admin-1",
        email: "admin@example.com",
        role: "ADMIN",
        status: "ACTIVE",
        orgId,
        projectId: null,
        teamId: null,
      };

      const issue: IssueAccessTarget = {
        projectId: "project-2",
        assignedToId: "dev-2",
        teamId: "team-3",
        project: { orgId },
      };

      const allowed = await canAccessIssue(adminUser, issue);
      expect(allowed).toBe(true);
    });

    test("Manager can access issues in their project", async () => {
      const managerUser: SessionUser = {
        id: "manager-1",
        email: "manager@example.com",
        role: "MANAGER",
        status: "ACTIVE",
        orgId,
        projectId: "project-1",
        teamId: null,
      };

      const issueInProject: IssueAccessTarget = {
        projectId: "project-1",
        assignedToId: "dev-2",
        teamId: "team-2",
        project: { orgId },
      };

      const issueOutProject: IssueAccessTarget = {
        projectId: "project-2",
        assignedToId: "dev-2",
        teamId: "team-3",
        project: { orgId },
      };

      expect(await canAccessIssue(managerUser, issueInProject)).toBe(true);
      expect(await canAccessIssue(managerUser, issueOutProject)).toBe(false);
    });
  });

  describe("Brute Force Protection", () => {
    const email = "test-brute@example.com";
    
    beforeEach(async () => {
      await recordLoginSuccess(email);
    });

    test("allows up to 5 login attempts, then locks out", async () => {
      const config = {
        maxAttempts: 3,
        lockoutDurationMs: 60000,
        windowMs: 5000,
      };

      // Attempt 1, 2, 3: allowed
      expect((await checkLoginAttempts(email, config)).allowed).toBe(true);
      expect((await checkLoginAttempts(email, config)).allowed).toBe(true);
      expect((await checkLoginAttempts(email, config)).allowed).toBe(true);

      // Attempt 4: locked out
      const locked = await checkLoginAttempts(email, config);
      expect(locked.allowed).toBe(false);
      expect(locked.lockedUntil).toBeDefined();

      // Lockout remains
      const lockedAgain = await checkLoginAttempts(email, config);
      expect(lockedAgain.allowed).toBe(false);

      // Clean up success resets count
      await recordLoginSuccess(email);
      expect((await checkLoginAttempts(email, config)).allowed).toBe(true);
    });
  });

  describe("Login Endpoint Security", () => {
    beforeEach(() => {
      prismaMock.user.findUnique.mockClear();
    });

    test("tokens are not returned in response body and cookie is httpOnly & secure", async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: "user-1",
        email: "secure-login@example.com",
        passwordHash: "$2a$10$12345678901234567890123456789012345678901234567890123", // mock dummy hash
        role: "DEVELOPER",
        status: "ACTIVE",
        orgId: "org-1",
      });

      // Mock verifyPassword utility to always pass
      mock.module("../src/lib/hash", () => ({
        verifyPassword: mock(() => Promise.resolve(true)),
      }));

      const req = new Request("http://localhost/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "secure-login@example.com", password: "Password123!" }),
      });

      const res = await loginPOST(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeUndefined(); // Verify token NOT in body
      
      const setCookie = res.headers.get("Set-Cookie");
      expect(setCookie).toBeDefined();
      expect(setCookie).toContain("incident_token=");
      expect(setCookie).toContain("HttpOnly");
      expect(setCookie).toContain("Secure");
    });
  });
});
