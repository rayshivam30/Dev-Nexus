import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";
const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

import { expect, test, describe, beforeEach } from "bun:test";
import { POST } from "../src/app/api/teams/route";
import { verifyToken } from "../src/lib/jwt";

mock.module("../src/lib/jwt", () => ({
  verifyToken: mock(() => ({
    userId: "user-1",
    role: "ADMIN",
    orgId: "org-1"
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
}));

describe("API Teams Route", () => {
  beforeEach(() => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "admin@example.com",
      role: "ADMIN",
      status: "ACTIVE",
      orgId: "org-1",
      projectId: null,
      teamId: null,
    });
    prismaMock.project.findUnique.mockClear();
    prismaMock.project.findUnique.mockResolvedValue({ id: "project-1", orgId: "org-1" });
    prismaMock.team.create.mockClear();
    (verifyToken as unknown as { mockClear: () => void; mockReturnValue: (val: unknown) => void }).mockClear();
    (verifyToken as unknown as { mockClear: () => void; mockReturnValue: (val: unknown) => void }).mockReturnValue({
      userId: "user-1",
      role: "ADMIN",
      orgId: "org-1"
    });
  });

  test("returns 401 if Authorization header is missing", async () => {
    const req = new Request("http://localhost/api/teams", {
      method: "POST",
      body: JSON.stringify({ name: "Team A", projectId: "p1" }),
    });

    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(401);
  });

  test("returns 403 if user is not ADMIN or MANAGER", async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "developer@example.com",
      role: "DEVELOPER",
      status: "ACTIVE",
      orgId: "org-1",
      projectId: null,
      teamId: "team-1",
    });

    const req = new Request("http://localhost/api/teams", {
      method: "POST",
      headers: { "Authorization": "Bearer some-token" },
      body: JSON.stringify({ name: "Team A", projectId: "p1" }),
    });

    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(403);
  });

  test("returns 400 if fields are missing", async () => {
    const req = new Request("http://localhost/api/teams", {
      method: "POST",
      headers: { "Authorization": "Bearer some-token" },
      body: JSON.stringify({ name: "Team A" }), // missing projectId
    });

    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
  });

  test("returns 404 if project not found or org mismatch", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);

    const req = new Request("http://localhost/api/teams", {
      method: "POST",
      headers: { "Authorization": "Bearer some-token" },
      body: JSON.stringify({ name: "Team A", projectId: "p-wrong" }),
    });

    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(404);
  });

  test("returns 201 and creates team on success", async () => {
    const req = new Request("http://localhost/api/teams", {
      method: "POST",
      headers: { "Authorization": "Bearer some-token" },
      body: JSON.stringify({ name: "Success Team", projectId: "project-1" }),
    });

    const res = await POST(req as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.team.name).toBe("Success Team");
    expect(prismaMock.team.create).toHaveBeenCalled();
  });
});
