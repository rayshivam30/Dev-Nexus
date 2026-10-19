import { createPrismaMock } from "./mock-db";
import { mock, describe, it, expect, beforeEach } from "bun:test";

const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

import {
  createProjectApiKey,
  listProjectApiKeys,
  revokeProjectApiKey,
  validateApiKey,
  hashApiKey,
} from "../src/services/api-key-service";

describe("API Key Service (Multi-Key Rotation)", () => {
  const projectId = "proj-123";

  beforeEach(() => {
    prismaMock.project.findUnique.mockClear();
    prismaMock.projectApiKey.create.mockClear();
    prismaMock.projectApiKey.findUnique.mockClear();
    prismaMock.projectApiKey.findMany.mockClear();
    prismaMock.projectApiKey.update.mockClear();
    prismaMock.projectApiKey.updateMany.mockClear();
  });

  it("createProjectApiKey generates a secure key with devnexus_sk_live_ prefix", async () => {
    prismaMock.project.findUnique.mockResolvedValue({ id: projectId, name: "Test Project" });
    prismaMock.projectApiKey.create.mockImplementation((args: any) =>
      Promise.resolve({
        id: "key-1",
        name: args.data.name,
        keyPrefix: args.data.keyPrefix,
        createdAt: new Date(),
      })
    );

    const result = await createProjectApiKey(projectId, "Staging Backend");

    expect(result.id).toBe("key-1");
    expect(result.name).toBe("Staging Backend");
    expect(result.rawKey.startsWith("devnexus_sk_live_")).toBe(true);
    expect(result.keyPrefix.includes("devnexus_sk_live_")).toBe(true);
    expect(prismaMock.projectApiKey.create).toHaveBeenCalled();
  });

  it("createProjectApiKey throws if project not found", async () => {
    prismaMock.project.findUnique.mockResolvedValue(null);
    expect(createProjectApiKey("invalid-id", "Test")).rejects.toThrow("Project not found");
  });

  it("listProjectApiKeys returns keys for project", async () => {
    prismaMock.projectApiKey.findMany.mockResolvedValue([
      { id: "key-1", name: "Prod", keyPrefix: "devnexus_sk_...1234", createdAt: new Date(), lastUsedAt: null, revokedAt: null },
    ]);

    const keys = await listProjectApiKeys(projectId);
    expect(keys.length).toBe(1);
    expect(keys[0].name).toBe("Prod");
  });

  it("revokeProjectApiKey marks revokedAt timestamp", async () => {
    prismaMock.projectApiKey.updateMany.mockResolvedValue({ count: 1 });

    const res = await revokeProjectApiKey("key-1", projectId);
    expect(prismaMock.projectApiKey.updateMany).toHaveBeenCalledWith({
      where: { id: "key-1", projectId },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("validateApiKey successfully authenticates valid multi-key", async () => {
    const rawKey = "devnexus_sk_live_abcdef1234567890";
    const hashed = hashApiKey(rawKey);

    prismaMock.projectApiKey.findUnique.mockResolvedValue({
      id: "key-1",
      revokedAt: null,
      project: { id: projectId, name: "Test Project" },
    });

    const project = await validateApiKey(rawKey);
    expect(project).toBeDefined();
    expect(project?.id).toBe(projectId);
  });

  it("validateApiKey rejects revoked key", async () => {
    const rawKey = "devnexus_sk_live_revoked_key_1234";

    prismaMock.projectApiKey.findUnique.mockResolvedValue({
      id: "key-1",
      revokedAt: new Date(), // revoked!
      project: { id: projectId, name: "Test Project" },
    });

    const project = await validateApiKey(rawKey);
    expect(project).toBeNull();
  });

  it("validateApiKey falls back to legacy project.sdkApiKey", async () => {
    const legacyKey = "legacy-secret-key-123";
    const hashed = hashApiKey(legacyKey);

    // Multi-key table returns null
    prismaMock.projectApiKey.findUnique.mockResolvedValue(null);
    // Legacy project table returns project
    prismaMock.project.findUnique.mockResolvedValue({
      id: projectId,
      name: "Legacy Project",
      sdkApiKey: hashed,
    });

    const project = await validateApiKey(legacyKey);
    expect(project).toBeDefined();
    expect(project?.id).toBe(projectId);
  });
});
