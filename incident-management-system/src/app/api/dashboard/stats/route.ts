import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { formatTimeAgo } from "@/lib/utils";
import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

// ── Cache Configuration ──────────────────────────────────────────────────────
// Dashboard stats are cached in Redis for CACHE_TTL_SECONDS.
// With 100 concurrent users hitting this endpoint, caching reduces
// DB queries from 400/min (100 users × 4 queries × SWR refresh) to ~8/min.
const CACHE_TTL_SECONDS = 30;

export const GET = withAuth(async (req, { decoded }) => {
  const { orgId } = decoded;
  if (!orgId) return apiError("Organization is required", 403);
  const cacheKey = `dashboard:stats:${orgId}`;

  // ── Try cache first ────────────────────────────────────────────────────
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        const data = typeof cached === 'string' ? JSON.parse(cached) : cached;
        return apiResponse("Stats fetched successfully (cached)", data);
      }
    } catch (err) {
      logger.error({ err }, "Redis cache read error, falling through to DB");
    }
  }

  // ── Fetch from DB (parallelized) ───────────────────────────────────────
  const [openIssuesCount, breachedCount, resolvedTodayCount, recentIssuesRaw] = await Promise.all([
    prisma.issue.count({ 
      where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] }, project: { orgId } } 
    }),
    prisma.issue.count({ 
      where: { OR: [{ responseBreached: true }, { resolutionBreached: true }], project: { orgId } } 
    }),
    prisma.issue.count({ 
      where: { 
        status: 'RESOLVED', 
        resolvedAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
        project: { orgId }
      } 
    }),
    prisma.issue.findMany({
      where: { assignedToId: null, project: { orgId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { team: true, assignedTo: true, project: { select: { id: true, name: true } } }
    }),
  ]);

  const recentIssues = recentIssuesRaw.map((issue) => ({
    id: issue.id,
    title: issue.title,
    rootCause: issue.description.substring(0, 100) + '...',
    description: issue.description,
    status: issue.status,
    severity: issue.severity,
    teamName: issue.team?.name || "—",
    assignedToEmail: issue.assignedTo?.email || "—",
    timeAgo: formatTimeAgo(new Date(issue.createdAt)),
    logs: issue.logs as Record<string, unknown> | null,
    createdAt: issue.createdAt,
    projectId: issue.projectId,
    teamId: issue.teamId,
    source: issue.source,
    project: issue.project ? { id: issue.project.id, name: issue.project.name } : null
  }));

  const responseData = {
    stats: {
      openIssuesCount,
      breachedCount,
      resolvedTodayCount,
    },
    recentIssues
  };

  // ── Write to cache ─────────────────────────────────────────────────────
  if (redis) {
    try {
      await redis.set(cacheKey, JSON.stringify(responseData), { ex: CACHE_TTL_SECONDS });
    } catch (err) {
      logger.error({ err }, "Redis cache write error");
    }
  }

  return apiResponse("Stats fetched successfully", responseData);
});
