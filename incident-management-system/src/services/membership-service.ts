import { prisma } from "@/lib/db";
import { Role } from "@devnexus/prisma-client";

export async function hasProjectMembership(userId: string, projectId: string, roles?: Role[]) {
  return !!(await prisma.projectMembership.findFirst({
    where: { userId, projectId, ...(roles ? { role: { in: roles } } : {}) },
    select: { id: true },
  }));
}

export async function hasTeamMembership(userId: string, teamId: string, roles?: Role[]) {
  return !!(await prisma.teamMembership.findFirst({
    where: { userId, teamId, ...(roles ? { role: { in: roles } } : {}) },
    select: { id: true },
  }));
}

export async function getUserProjectIds(userId: string, roles?: Role[]) {
  const memberships = await prisma.projectMembership.findMany({
    where: { userId, ...(roles ? { role: { in: roles } } : {}) },
    select: { projectId: true },
  });
  return memberships.map(({ projectId }) => projectId);
}
