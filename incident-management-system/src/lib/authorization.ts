import { prisma } from "@/lib/db";
import { JwtPayload } from "@/lib/jwt";
import { Role, UserStatus } from "@devnexus/prisma-client";
import { redis } from "@/lib/redis";

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

const localUserCache = new Map<string, { user: SessionUser | null; expiresAt: number }>();
const CACHE_TTL_MS = 10_000; // 10 seconds cache

let cacheHits = 0;
let cacheMisses = 0;

export function getCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRate = total > 0 ? (cacheHits / total) * 100 : 100;
  return {
    cacheHits,
    cacheMisses,
    hitRate: parseFloat(hitRate.toFixed(2)),
  };
}

export async function invalidateUserCache(userId: string): Promise<void> {
  localUserCache.delete(userId);
  if (redis) {
    const cacheKey = `user:session:${userId}`;
    try {
      await redis.del(cacheKey);
    } catch {
      // Ignore
    }
  }
}

export async function getActiveSessionUser(
  decoded: JwtPayload
): Promise<SessionUser | null> {
  if (!decoded.userId) return null;

  const isTest = process.env.NODE_ENV === "test";
  const cacheKey = `user:session:${decoded.userId}`;

  // 1. Try Redis cache
  if (!isTest && redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        cacheHits++;
        if (cached === "null") return null;
        return (typeof cached === "string" ? JSON.parse(cached) : cached) as SessionUser;
      }
    } catch {
      // Fallback
    }
  }

  // 2. Try In-memory local cache
  if (!isTest) {
    const now = Date.now();
    const memCached = localUserCache.get(decoded.userId);
    if (memCached && now < memCached.expiresAt) {
      cacheHits++;
      return memCached.user;
    }
  }

  cacheMisses++;

  // 3. Fetch from DB
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

  const activeUser = user?.status === "ACTIVE" ? user : null;

  // 4. Update caches
  if (!isTest) {
    const now = Date.now();
    localUserCache.set(decoded.userId, {
      user: activeUser,
      expiresAt: now + CACHE_TTL_MS,
    });

    if (redis) {
      try {
        if (activeUser) {
          await redis.set(cacheKey, JSON.stringify(activeUser), { ex: 10 });
        } else {
          await redis.set(cacheKey, "null", { ex: 5 });
        }
      } catch {
        // Ignore
      }
    }
  }

  return activeUser;
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

export async function canAccessIssue(
  user: SessionUser,
  issue: IssueAccessTarget
): Promise<boolean> {
  if (!user.orgId || issue.project.orgId !== user.orgId) return false;
  if (user.role === "ADMIN") return true;
  if (user.role === "MANAGER") return user.projectId === issue.projectId;
  
  if (user.role === "DEVELOPER") {
    if (issue.assignedToId !== user.id) return false;

    // If the issue has no team, direct assignment is sufficient for access
    if (!issue.teamId) return true;

    // Verify developer belongs to the issue's team
    const teamMember = await prisma.user.findFirst({
      where: {
        id: user.id,
        teamId: issue.teamId,
        role: "DEVELOPER",
        status: "ACTIVE"
      },
      select: { id: true }
    });
    return !!teamMember;
  }
  
  return false;
}

export async function getAuthorizedIssue(
  issueId: string,
  user: SessionUser
) {
  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    include: {
      project: { select: { orgId: true } },
      team: { select: { id: true } }
    },
  });

  if (!issue) return null;
  const hasAccess = await canAccessIssue(user, issue);
  return hasAccess ? issue : null;
}
