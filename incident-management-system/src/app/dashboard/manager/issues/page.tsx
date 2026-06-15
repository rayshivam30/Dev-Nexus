import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { ManagerIssuesClient } from "@/components/dashboard/manager/ManagerIssuesClient";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export const dynamic = "force-dynamic";

export default async function ManagerIssuesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { id: currentUser.userId, status: "ACTIVE" } });
  if (!user || !user.projectId) redirect("/dashboard/manager");

  const [issuesData, teamsData, developersData] = await Promise.all([
    prisma.issue.findMany({
      where: { projectId: user.projectId },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { team: true, assignedTo: true },
    }),
    prisma.team.findMany({
      where: { projectId: user.projectId },
    }),
    prisma.user.findMany({
      select: { id: true, email: true, teamId: true, name: true },
      where: { team: { projectId: user.projectId }, role: "DEVELOPER" },
    }),
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
