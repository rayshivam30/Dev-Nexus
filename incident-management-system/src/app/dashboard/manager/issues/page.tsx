import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { ManagerIssuesClient } from "@/components/dashboard/manager/ManagerIssuesClient";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { getUserProjectIds } from "@/services/membership-service";

export const dynamic = "force-dynamic";

export default async function ManagerIssuesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { id: currentUser.userId, status: "ACTIVE" } });
  if (!user) redirect("/dashboard/manager");
  const projectIds = await getUserProjectIds(user.id, ["MANAGER"]);
  if (projectIds.length === 0) redirect("/dashboard/manager");

  const [issuesData, teamsData, developersData] = await Promise.all([
    prisma.issue.findMany({
      where: { projectId: { in: projectIds } },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { team: true, assignedTo: true },
    }),
    prisma.team.findMany({
      where: { projectId: { in: projectIds } },
    }),
    prisma.teamMembership.findMany({
      where: { role: "DEVELOPER", team: { projectId: { in: projectIds } } },
      select: { teamId: true, user: { select: { id: true, email: true, name: true } } },
    }).then((memberships) => memberships.map(({ teamId, user }) => ({ ...user, teamId }))),
  ]);

  const now = new Date().getTime();
  const issues: Issue[] = issuesData.map((issue) => {
    const diffMins = Math.floor((now - issue.createdAt.getTime()) / 60000);
    const timeAgo = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;
    return {
      id: issue.id,
      title: issue.title,
      rootCause: issue.description.substring(0, 100) + "...",
      description: issue.description,
      severity: issue.severity,
      timeAgo,
      status: issue.status,
      logs: issue.logs as Record<string, unknown>,
      teamName: issue.team?.name,
      assignedToEmail: issue.assignedTo?.email,
      projectId: issue.projectId,
      teamId: issue.teamId,
      createdAt: issue.createdAt,
    };
  });

  return (
    <ManagerIssuesClient 
      initialIssues={issues}
      teams={teamsData}
      allDevelopers={developersData}
    />
  );
}
