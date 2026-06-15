import { prisma } from "@/lib/db";
import { JwtPayload } from "@/lib/jwt";
import { Role, UserStatus } from "@devnexus/prisma-client";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  orgId: string | null;
  projectId: string | null;
  teamId: string | null;
}

export interface IssueAccessTarget {
  projectId: string;
  assignedToId: string | null;
  teamId: string | null;
  project: {
    orgId: string;
  };
}

export async function getActiveSessionUser(
  decoded: JwtPayload
): Promise<SessionUser | null> {
  if (!decoded.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      orgId: true,
      projectId: true,
      teamId: true,
    },
  });

  return user?.status === "ACTIVE" ? user : null;
}

export function sessionUserToPayload(user: SessionUser): JwtPayload {
  return {
    userId: user.id,
    email: user.email,
    role: user.role,
    orgId: user.orgId || undefined,
    projectId: user.projectId || undefined,
    teamId: user.teamId || undefined,
  };
}

export function canAccessIssue(
  user: SessionUser,
  issue: IssueAccessTarget
): boolean {
  if (!user.orgId || issue.project.orgId !== user.orgId) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "MANAGER") return user.projectId === issue.projectId;
  return issue.assignedToId === user.id;
}

export async function getAuthorizedIssue(
  issueId: string,
  user: SessionUser
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { select: { orgId: true } },
    },
  });

  return issue && canAccessIssue(user, issue) ? issue : null;
}
