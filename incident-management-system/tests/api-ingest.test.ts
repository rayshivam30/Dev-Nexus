import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";
const prismaMock = createPrismaMock();

// Register all mock modules BEFORE standard imports
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/logger", () => ({
  logger: {
    error: mock(() => {}),
    info: mock(() => {}),
  },
}));
mock.module("@upstash/redis", () => ({
  Redis: mock(() => ({
    incr: mock(() => Promise.resolve(1)),
    pexpire: mock(() => Promise.resolve(1)),
    pttl: mock(() => Promise.resolve(1000)),
  })),
}));
mock.module("next/server", () => ({
  NextResponse: {
    json: (data: unknown, init?: ResponseInit) => {
      const res = new Response(JSON.stringify(data), init);
      (res as unknown as { json: () => Promise<unknown> }).json = () => Promise.resolve(data);
      return res;
    },
  },
  after: mock(() => {}), // Mock 'after' to do nothing or track calls
}));
mock.module("@/services/notification-service", () => ({
  notifyOrgStaff: mock(() => Promise.resolve()),
}));

import { expect, test, describe, beforeEach } from "bun:test";
import { POST } from "../src/app/api/ingest/route";
import { createHash } from "crypto";

describe("API Ingest Route", () => {
  beforeEach(() => {
    const validHashedKey = createHash("sha256").update("valid-key").digest("hex");
    prismaMock.project.findUnique.mockClear();
    prismaMock.project.findUnique.mockResolvedValue({ id: "project-1", sdkApiKey: validHashedKey, orgId: "org-1", plan: "ADVANCED" });
    prismaMock.issue.create.mockClear();
  });

  test("returns 401 if Authorization header is missing", async () => {
    const req = new Request("http://localhost/api/ingest", {
      method: "POST",
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Unauthorized");
  });

  test("returns 401 if API key is invalid", async () => {
    (prismaMock.project.findUnique as unknown as { mockResolvedValue: (val: unknown) => void }).mockResolvedValue(null);

    const req = new Request("http://localhost/api/ingest", {
      method: "POST",
      headers: { "Authorization": "Bearer invalid-key" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe("Invalid API Key");
  });

  test("returns 201 and creates issue for valid payload", async () => {
    const req = new Request("http://localhost/api/ingest", {
      method: "POST",
      headers: { 
        "Authorization": "Bearer valid-key",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        message: "Runtime Error",
        severity: "HIGH",
        source: "SDK"
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.issueId).toBeDefined();

    expect(prismaMock.issue.create).toHaveBeenCalled();
  });

  test("handles batch reports", async () => {
    const req = new Request("http://localhost/api/ingest", {
      method: "POST",
      headers: { 
        "Authorization": "Bearer valid-key",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        isBatch: true,
        reports: [
          { message: "Error 1" },
          { message: "Error 2" }
        ]
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.issueIds).toHaveLength(2);

    expect(prismaMock.issue.create.mock.calls.length).toBe(2);
  });
});
