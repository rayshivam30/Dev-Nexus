import { prisma } from "@/lib/db";
import { PlanType } from "@devnexus/prisma-client";
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

  // Return flag, not the actual key
  return {
    ...project,
    sdkApiKey: plainTextKey,
    hasSdkKey: !!hashedKey,
    keyCreated: plainTextKey  // Only on initial creation
  };
}

export async function getProjectsByOrg(orgId: string) {
  const projects = await prisma.project.findMany({
    where: { orgId },
    include: {
      teams: true,
      _count: {
        select: { issues: true }
      }
    }
  });
  
  return projects.map(({ sdkApiKey, ...project }) => ({
    ...project,
    hasSdkKey: Boolean(sdkApiKey),
  }));
}

export async function deleteProject(id: string, orgId: string) {
  return await prisma.project.deleteMany({
    where: { id, orgId }
  });
}
