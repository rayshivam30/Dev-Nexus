import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";
const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

import { expect, test, describe } from "bun:test";
import { createProject, getProjectsByOrg, deleteProject } from "../src/services/project-service";
import crypto from "crypto";

interface BunMock {
  mock: {
    calls: unknown[][];
  };
}


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

    // The data passed to prismaMock.create should be the HASH, not the plain text
    const calls = (prismaMock.project.create as unknown as BunMock).mock.calls;
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
  test("getProjectsByOrg returns projects for an org", async () => {
    const projects = await getProjectsByOrg("org-123");
    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe("P1");
  });

  test("deleteProject calls delete correctly", async () => {
    const result = await deleteProject("p1");
    expect(result.id).toBe("deleted-id");
    expect(prismaMock.project.delete as any).toHaveBeenCalledWith({
      where: { id: "p1" }
    });
  });
});
