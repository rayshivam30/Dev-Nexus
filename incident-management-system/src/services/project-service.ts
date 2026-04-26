import { prisma } from "@/lib/db";
import { PlanType } from "@prisma/client";
import crypto from "crypto";

export async function createProject(
  name: string, 
  orgId: string, 
  description?: string,
  plan?: PlanType,
  githubRepoUrl?: string,
  createdBy?: string
) {
  const projectPlan = plan || "BASIC";
  const sdkApiKey = projectPlan === "ADVANCED" ? `devnexus_sk_${crypto.randomUUID()}` : null;

  return await prisma.project.create({
    data: {
      name,
      orgId,
      description: description || "",
      plan: projectPlan,
      githubRepoUrl: githubRepoUrl || null,
      sdkApiKey,
      createdBy
    },
  });
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
