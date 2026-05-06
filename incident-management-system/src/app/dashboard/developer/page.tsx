import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { DeveloperDashboardClient } from "@/components/dashboard/developer/DeveloperDashboardClient";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { formatTimeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DeveloperDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;

  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "DEVELOPER") redirect("/auth/login");

  const user = await prisma.user.findUnique({ 
    where: { id: decoded.userId },
    include: { team: true }
  });
  if (!user) redirect("/auth/login");

  // Get all issues assigned to this developer
  const [openCount, inProgressCount, resolvedCount, assignedIssuesRaw, allDevelopersRaw] = await Promise.all([
    prisma.issue.count({
      where: { assignedToId: user.id, status: "OPEN" },
    }),
    prisma.issue.count({
      where: { assignedToId: user.id, status: "IN_PROGRESS" },
    }),
    prisma.issue.count({
      where: { assignedToId: user.id, status: "RESOLVED" },
    }),
    prisma.issue.findMany({
      where: {
        assignedToId: user.id,
        status: { not: "RESOLVED" },
      },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { team: true },
    }),
    prisma.user.findMany({
      select: { id: true, email: true, teamId: true, name: true },
      where: { teamId: user.team?.id, role: "DEVELOPER" }
    })
  ]);

  const recentIssues: Issue[] = assignedIssuesRaw.map((issue) => {
    return {
      id: issue.id,
      title: issue.title,
      rootCause: issue.description.substring(0, 100) + "...",
      description: issue.description,
      severity: issue.severity,
      timeAgo: formatTimeAgo(new Date(issue.createdAt)),
      status: issue.status,
      logs: issue.logs as Record<string, unknown> | null,
      teamId: issue.teamId,
      projectId: issue.projectId,
      createdAt: issue.createdAt,
      teamName: issue.team?.name || "",
      assignedToEmail: user.email,
    };
  });

  const teamName = user.team?.name ?? "";
  const teamId = user.team?.id;
  const projectId = user.projectId || user.team?.projectId; // user.projectId for managers, user.team?.projectId for developers


  return (
    <DeveloperDashboardClient
      developerEmail={user.email}
      teamName={teamName}
      teamId={teamId}
      projectId={projectId}
      openCount={openCount}
      inProgressCount={inProgressCount}
      resolvedCount={resolvedCount}
      recentIssues={recentIssues}
      allDevelopers={allDevelopersRaw}
    />
  );
}
