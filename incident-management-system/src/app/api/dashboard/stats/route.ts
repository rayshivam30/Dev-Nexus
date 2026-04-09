import { prisma } from "@/lib/db";
import { withAuth, apiResponse } from "@/lib/api-utils";
import { formatTimeAgo } from "@/lib/utils";

export const GET = withAuth(async () => {
  const openIssuesCount = await prisma.issue.count({ 
    where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] } } 
  });
  
  const breachedCount = await prisma.issue.count({ 
    where: { OR: [{ responseBreached: true }, { resolutionBreached: true }] } 
  });
  
  const resolvedTodayCount = await prisma.issue.count({ 
    where: { 
      status: 'RESOLVED', 
      resolvedAt: { gte: new Date(new Date().setHours(0,0,0,0)) } 
    } 
  });

  const recentIssuesRaw = await prisma.issue.findMany({
    where: { assignedToId: null },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { team: true, assignedTo: true }
  });

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
    teamId: issue.teamId
  }));

  return apiResponse("Stats fetched successfully", {
    stats: {
      openIssuesCount,
      breachedCount,
      resolvedTodayCount,
    },
    recentIssues
  });
});
