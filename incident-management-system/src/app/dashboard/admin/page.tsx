import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { DashboardClient } from "@/components/dashboard/admin/DashboardClient";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { ProjectStats } from "@/components/dashboard/shared/ActiveProjects";
import { formatTimeAgo } from "@/lib/utils";
import { getCurrentUser } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const organization = await prisma.organization.findFirst();
  
  if (!organization) {
    return (
      <div className="p-8 text-center text-foreground/60 w-full rounded border border-border mt-8">
        No organization found in the database. Please register an admin account first.
      </div>
    );
  }

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    redirect("/auth/login");
  }

  // Parallel batch 1: independent count queries (safe now that pool is sized)
  const [openIssuesCount, breachedCount, resolvedTodayCount] = await Promise.all([
    prisma.issue.count({ where: { status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] }, project: { orgId: currentUser.orgId } } }),
    prisma.issue.count({ where: { OR: [{ responseBreached: true }, { resolutionBreached: true }], project: { orgId: currentUser.orgId } } }),
    prisma.issue.count({ 
      where: { 
        status: 'RESOLVED', 
        resolvedAt: { gte: new Date(new Date().setHours(0,0,0,0)) },
        project: { orgId: currentUser.orgId }
      } 
    }),
  ]);

  // Parallel batch 2: independent findMany queries
  const [recentIssuesRaw, projectsRaw, allProjects, allTeams, allDevelopers] = await Promise.all([
    prisma.issue.findMany({
      where: { assignedToId: null, project: { orgId: currentUser.orgId } },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { team: true, assignedTo: true, project: { select: { id: true, name: true } } }
    }),
    prisma.project.findMany({
      where: { orgId: currentUser.orgId },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { 
          select: { 
            teams: true,
            issues: { where: { status: { not: 'RESOLVED' } } }
          } 
        }
      }
    }),
    prisma.project.findMany({ where: { orgId: currentUser.orgId }, select: { id: true, name: true } }),
    prisma.team.findMany({ where: { project: { orgId: currentUser.orgId } }, select: { id: true, name: true, projectId: true } }),
    prisma.user.findMany({ select: { id: true, email: true, teamId: true, name: true }, where: { role: 'DEVELOPER', project: { orgId: currentUser.orgId } } }),
  ]);

  const recentIssues: Issue[] = recentIssuesRaw.map((issue) => {
    return {
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
    };
  });

  const activeProjects: ProjectStats[] = projectsRaw.map(p => {
    const issuesCount = p._count.issues || 0;
    const slaPercentage = issuesCount === 0 ? 100 : Math.max(50, 100 - (issuesCount * 2));
    const colorClass = slaPercentage > 90 ? "text-emerald-500" : slaPercentage > 75 ? "text-amber-500" : "text-destructive";
    return {
      id: p.id,
      name: p.name,
      teamsCount: p._count.teams,
      issuesCount,
      slaPercentage,
      colorClass
    };
  });

  return (
    <DashboardClient 
      orgName={organization.name}
      openIssuesCount={openIssuesCount}
      breachedCount={breachedCount}
      resolvedTodayCount={resolvedTodayCount}
      recentIssues={recentIssues}
      activeProjects={activeProjects}
      allProjects={allProjects}
      allTeams={allTeams}
      allDevelopers={allDevelopers}
    />
  );
}
