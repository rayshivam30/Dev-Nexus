import { expect, test, describe, mock } from "bun:test";
import { createProject } from "../src/services/project-service";
import { prisma } from "../src/lib/db";
import crypto from "crypto";

interface BunMock {
  mock: {
    calls: unknown[][];
  };
}

// Mock Prisma
mock.module("../src/lib/db", () => ({
  prisma: {
    project: {
      create: mock((args) => Promise.resolve({ id: "test-id", ...args.data })),
    },
  },
}));

describe("Project Service (Security)", () => {
  test("createProject hashes SDK API Key for ADVANCED plan", async () => {
    const project = await createProject(
      "Test Project",
      "org-123",
      "Desc",
      "ADVANCED"
    );

    // Should return a plain text key for the user to see once
    expect(project.sdkApiKey).not.toBeNull();
    expect(project.sdkApiKey).toStartWith("devnexus_sk_");

    // The data passed to prisma.create should be the HASH, not the plain text
    const calls = (prisma.project.create as unknown as BunMock).mock.calls;
    const lastCallData = calls[calls.length - 1][0] as { data: { sdkApiKey: string } };
    
    expect(lastCallData.data.sdkApiKey).not.toBe(project.sdkApiKey);
    
    // Verify the hash is SHA-256 (64 hex chars)
    expect(lastCallData.data.sdkApiKey).toHaveLength(64);
    
    const expectedHash = crypto.createHash("sha256").update(project.sdkApiKey!).digest("hex");
    expect(lastCallData.data.sdkApiKey).toBe(expectedHash);
  });

  test("createProject does not generate key for BASIC plan", async () => {
    const project = await createProject(
      "Test Project",
      "org-123",
      "Desc",
      "BASIC"
    );

    expect(project.sdkApiKey).toBeNull();
  });
});
