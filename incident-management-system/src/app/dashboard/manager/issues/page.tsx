import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { IssueSeverity, IssueStatus } from "@prisma/client";
import { ManagerIssuesClient } from "@/components/dashboard/manager/ManagerIssuesClient";

export const dynamic = "force-dynamic";

const severityColor: Record<IssueSeverity, string> = {
  CRITICAL: "text-red-500 bg-red-500/10 border-red-500/20",
  HIGH: "text-orange-500 bg-orange-500/10 border-orange-500/20",
  MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
};

const statusColor: Record<IssueStatus, string> = {
  OPEN: "text-foreground/60 bg-foreground/10",
  ASSIGNED: "text-blue-400 bg-blue-400/10",
  IN_PROGRESS: "text-amber-400 bg-amber-400/10",
  RESOLVED: "text-emerald-400 bg-emerald-400/10",
};

export default async function ManagerIssuesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user || !user.projectId) redirect("/dashboard/manager");

  const [issuesData, teamsData, developersData] = await Promise.all([
    prisma.issue.findMany({
      where: { projectId: user.projectId },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { team: true, assignedTo: true },
    }) as any,
    prisma.team.findMany({
      where: { projectId: user.projectId },
    }),
    prisma.user.findMany({
      select: { id: true, email: true, teamId: true },
      where: { team: { projectId: user.projectId }, role: "DEVELOPER" },
    }),
  ]);

  const issues = issuesData.map((issue: any) => {
    const diffMins = Math.floor((Date.now() - issue.createdAt.getTime()) / 60000);
    const timeAgo = diffMins < 60 ? `${diffMins}m ago` : `${Math.floor(diffMins / 60)}h ago`;
    return {
      id: issue.id,
      title: issue.title,
      rootCause: issue.description.substring(0, 100) + "...",
      description: issue.description,
      severity: issue.severity as any,
      timeAgo,
      status: issue.status,
      logs: issue.logs,
      teamName: issue.team?.name,
      assignedToEmail: issue.assignedTo?.email,
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
