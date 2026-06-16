import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";

const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

const redisStore = new Map<string, string>();
const mockRedis = {
  get: mock(async (key: string) => redisStore.get(key) || null),
  set: mock(async (key: string, value: string) => {
    redisStore.set(key, value);
  }),
  del: mock(async (key: string) => {
    redisStore.delete(key);
  })
};
mock.module("@/lib/redis", () => ({ redis: mockRedis }));
mock.module("../src/lib/redis", () => ({ redis: mockRedis }));

let mockCookieToken = "valid-token";
const mockCookiesStore = {
  get: mock((name: string) => name === "incident_token" ? { value: mockCookieToken } : null),
  set: mock(() => {}),
};
mock.module("next/headers", () => ({
  cookies: mock(() => Promise.resolve(mockCookiesStore)),
}));

mock.module("next/server", () => {
  return {
    NextResponse: {
      json: (data: unknown, init?: ResponseInit) => {
        const res = new Response(JSON.stringify(data), init) as Response & { json: () => Promise<unknown> };
        res.json = () => Promise.resolve(data);
        return res;
      },
    },
  };
});

process.env.JWT_SECRET = "test-secret-at-least-thirty-two-chars-long";

import { expect, test, describe, beforeEach } from "bun:test";
import { isTokenBlacklisted, blacklistToken } from "../src/lib/session-blacklist";
import { POST as logoutPOST } from "../src/app/api/auth/logout/route";
import { withAuth } from "../src/lib/api-utils";
import { signToken } from "../src/lib/jwt";
import { NextRequest, NextResponse } from "next/server";

describe("Session Blacklist Tests", () => {
  beforeEach(() => {
    redisStore.clear();
    mockRedis.get.mockClear();
    mockRedis.set.mockClear();
    mockCookiesStore.get.mockClear();
    mockCookiesStore.set.mockClear();
    prismaMock.user.findUnique.mockClear();
  });

  test("blacklistToken calculates TTL and stores in Redis, isTokenBlacklisted returns true", async () => {
    const payload = {
      userId: "user-1",
      email: "test@example.com",
      role: "DEVELOPER" as const,
    };
    const token = signToken(payload, "1h");

    expect(await isTokenBlacklisted(token)).toBe(false);

    await blacklistToken(token);

    expect(mockRedis.set).toHaveBeenCalled();
    expect(await isTokenBlacklisted(token)).toBe(true);
  });

  test("logout route POST handler blacklists token and clears cookie", async () => {
    const payload = {
      userId: "user-1",
      email: "test@example.com",
      role: "DEVELOPER" as const,
    };
    const token = signToken(payload, "1h");
    mockCookieToken = token;

    const res = await logoutPOST();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.success).toBe(true);

    expect(mockCookiesStore.get).toHaveBeenCalledWith("incident_token");
    expect(mockCookiesStore.set).toHaveBeenCalledWith("incident_token", "", expect.any(Object));
    expect(await isTokenBlacklisted(token)).toBe(true);
  });

  test("withAuth rejects request if token is blacklisted", async () => {
    const payload = {
      userId: "user-1",
      email: "test@example.com",
      role: "DEVELOPER" as const,
    };
    const token = signToken(payload, "1h");

    // Add token to blacklist
    await blacklistToken(token);

    const handler = mock(async () => {
      return NextResponse.json({ ok: true });
    });
    const wrapped = withAuth(handler);

    const req = new Request("http://localhost/api/test", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }) as NextRequest;

    const res = await wrapped(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Session invalidated");
    expect(handler).not.toHaveBeenCalled();
  });
});
