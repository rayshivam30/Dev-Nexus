import { prisma } from "@/lib/db";
import { PlanType } from "@prisma/client";
import crypto from "crypto";

/**
 * Hashes an API key for secure storage.
 */
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function createProject(
  name: string, 
  orgId: string, 
  description?: string,
  plan?: PlanType,
  githubRepoUrl?: string,
  createdBy?: string
) {
  const projectPlan = plan || "BASIC";
  let plainTextKey: string | null = null;
  let hashedKey: string | null = null;

  if (projectPlan === "ADVANCED") {
    plainTextKey = `devnexus_sk_${crypto.randomUUID().replace(/-/g, "")}`;
    hashedKey = hashApiKey(plainTextKey);
  }

  const project = await prisma.project.create({
    data: {
      name,
      orgId,
      description: description || "",
      plan: projectPlan,
      githubRepoUrl: githubRepoUrl || null,
      sdkApiKey: hashedKey,
      createdBy
    },
  });

  // Return the plainTextKey so the UI can show it once
  return {
    ...project,
    sdkApiKey: plainTextKey
  };
}

export async function getProjectsByOrg(orgId: string) {
  return await prisma.project.findMany({
    where: { orgId },
    include: {
      teams: true,
      _count: {
        select: { issues: true }
      }
}
  });
}

export async function deleteProject(id: string) {
  return await prisma.project.delete({
    where: { id }
  });
}
