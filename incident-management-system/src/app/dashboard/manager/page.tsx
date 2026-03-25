import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { ManagerDashboardClient } from "@/components/dashboard/manager/ManagerDashboardClient";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;

  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { project: true },
  });
  if (!user) redirect("/auth/login");

  // If manager has no project yet assigned (edge case), show a message
  if (!user.projectId || !user.project) {
    return (
      <div className="p-8 text-center text-foreground/60 border border-border rounded-xl mt-8">
        <p className="text-lg font-semibold">No project assigned</p>
        <p className="text-sm mt-2">Ask your Admin to re-send the invite with a project attached.</p>
      </div>
    );
  }

  const projectId = user.projectId;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [teams, recentIssuesRaw, openIssuesCount, resolvedTodayCount, developerCount] = await Promise.all([
    prisma.team.findMany({
      where: { projectId },
      include: { _count: { select: { issues: { where: { status: { not: "RESOLVED" } } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.issue.findMany({
      where: { projectId },
      take: 6,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { team: true },
    }),
    prisma.issue.count({
      where: { projectId, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    prisma.issue.count({
      where: {
        projectId,
        status: "RESOLVED",
        resolvedAt: { gte: startOfToday },
      },
    }),
    prisma.user.findMany({
      select: { id: true, email: true, teamId: true, name: true },
      where: { team: { projectId }, role: "DEVELOPER" },
    }),
  ]);

  const now = new Date().getTime();
  const recentIssues: Issue[] = recentIssuesRaw.map((issue) => {
    const diffMins = Math.floor((now - issue.createdAt.getTime()) / 60000);
    const timeAgo = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      rootCause: issue.description.substring(0, 100) + "...",
      severity: issue.severity,
      timeAgo,
      status: issue.status,
      logs: issue.logs as Record<string, unknown>,
      teamId: issue.teamId,
      projectId: issue.projectId,
      createdAt: issue.createdAt,
    };

  });

  return (
    <ManagerDashboardClient
      managerEmail={user.email}
      project={{ id: user.project.id, name: user.project.name, description: user.project.description ?? "" }}
      openIssuesCount={openIssuesCount}
      resolvedTodayCount={resolvedTodayCount}
      developerCount={developerCount.length}
      allDevelopers={developerCount}
      recentIssues={recentIssues}
      teams={teams.map((t) => ({ id: t.id, name: t.name, issueCount: t._count.issues, projectId: t.projectId }))}
    />
  );
}
