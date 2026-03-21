import { prisma } from "@/lib/db";

export async function createProject(name: string, orgId: string, description?: string) {
  return await prisma.project.create({
    data: {
      name,
      orgId,
      description: description || "",
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
