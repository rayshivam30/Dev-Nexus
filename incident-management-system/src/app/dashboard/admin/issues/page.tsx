import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { AdminIssuesClient } from "@/components/dashboard/admin/AdminIssuesClient";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "ADMIN") redirect("/auth/login");

  const user = await prisma.user.findUnique({ select: { orgId: true }, where: { id: decoded.userId } });
  
  // Fetch only unassigned issues (assignedToId: null) across admin's organization
  const issuesRaw = await prisma.issue.findMany({
    where: { 
      assignedToId: null,
      project: { orgId: user?.orgId ?? undefined }
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    include: { team: true, assignedTo: true, project: { select: { id: true, name: true } } },
  });

  const [allTeams, allDevelopers] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, projectId: true }, where: { project: { orgId: user?.orgId ?? undefined } } }),
    prisma.user.findMany({ select: { id: true, email: true, teamId: true, name: true }, where: { role: 'DEVELOPER', team: { project: { orgId: user?.orgId ?? undefined } } } })
  ]);

  const mappedIssues: Issue[] = issuesRaw.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    status: issue.status,
    createdAt: issue.createdAt,
    projectId: issue.projectId,
    teamId: issue.teamId,
    teamName: issue.team?.name || "—",
    assignedToEmail: issue.assignedTo?.email || "—",
    timeAgo: formatTimeAgo(new Date(issue.createdAt)),
    logs: issue.logs as Record<string, unknown> | null,
    rootCause: issue.rootCause,
    source: issue.source,
    project: issue.project ? { id: issue.project.id, name: issue.project.name } : null
  }));

  return (
    <div className="space-y-8 pb-20">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Unassigned Incidents</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Issues awaiting assignment. Resolve or assign to avoid SLA breach.
        </p>
      </div>

      {issuesRaw.length === 0 ? (
        <div className="p-16 border border-white/[0.06] rounded-2xl bg-white/[0.02] text-center">
          <p className="text-sm text-zinc-500">No unassigned incidents found</p>
          <p className="text-xs text-zinc-700 mt-2">All clear</p>
        </div>
      ) : (
        <AdminIssuesClient issues={mappedIssues} teams={allTeams} developers={allDevelopers} />
      )}
    </div>
  );
}
