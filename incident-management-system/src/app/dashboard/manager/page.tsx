import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { ManagerDashboardClient } from "@/components/dashboard/manager/ManagerDashboardClient";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { getUserProjectIds } from "@/services/membership-service";

export const dynamic = "force-dynamic";

export default async function ManagerDashboardPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId, status: "ACTIVE" },
    include: { projectMemberships: { where: { role: "MANAGER" }, include: { project: true }, orderBy: { createdAt: "asc" } } },
  });
  if (!user) redirect("/auth/login");
  const projectIds = user.projectMemberships.map((membership) => membership.projectId);
  const primaryProject = user.projectMemberships[0]?.project;

  // If manager has no project yet assigned (edge case), show a message
  if (projectIds.length === 0 || !primaryProject) {
    return (
      <div className="flex h-full items-center justify-center p-20">
        <div className="max-w-md w-full p-8 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06] backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-3">No Project Assigned</h2>
          <p className="text-sm text-zinc-400">
            You currently do not have a project assigned to your manager profile. Contact your Admin to receive a valid assignment.
          </p>
        </div>
      </div>
    );
  }

  const projectId = primaryProject.id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [teams, recentIssuesRaw, openIssuesCount, resolvedTodayCount, developerCount] = await Promise.all([
    prisma.team.findMany({
      where: { projectId: { in: projectIds } },
      include: { _count: { select: { issues: { where: { status: { not: "RESOLVED" } } } } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.issue.findMany({
      where: { projectId: { in: projectIds } },
      take: 6,
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { team: true },
    }),
    prisma.issue.count({
      where: { projectId: { in: projectIds }, status: { in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] } },
    }),
    prisma.issue.count({
      where: {
        projectId: { in: projectIds },
        status: "RESOLVED",
        resolvedAt: { gte: startOfToday },
      },
    }),
    prisma.teamMembership.findMany({
      where: { role: "DEVELOPER", team: { projectId: { in: projectIds } } },
      select: { teamId: true, user: { select: { id: true, email: true, name: true } } },
    }).then((memberships) => memberships.map(({ teamId, user }) => ({ ...user, teamId }))),
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
      project={{ id: primaryProject.id, name: primaryProject.name, description: primaryProject.description ?? "" }}
      openIssuesCount={openIssuesCount}
      resolvedTodayCount={resolvedTodayCount}
      developerCount={developerCount.length}
      allDevelopers={developerCount}
      recentIssues={recentIssues}
      teams={teams.map((t) => ({ id: t.id, name: t.name, issueCount: t._count.issues, projectId: t.projectId }))}
    />
  );
}
