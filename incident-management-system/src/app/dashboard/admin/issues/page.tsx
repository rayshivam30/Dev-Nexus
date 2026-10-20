import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { AdminIssuesClient } from "@/components/dashboard/admin/AdminIssuesClient";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage({ searchParams }: { searchParams: Promise<{ release?: string | string[] }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN") redirect("/auth/login");
  if (!currentUser.orgId) redirect("/auth/login");

  const orgId = currentUser.orgId;
  const releaseParam = (await searchParams).release;
  const release = Array.isArray(releaseParam) ? releaseParam[0] : releaseParam;
  const [availableReleases, issuesRaw] = await Promise.all([
    prisma.issue.findMany({
      where: { release: { not: null }, project: { orgId } },
      select: { release: true },
      distinct: ["release"],
      orderBy: { release: "desc" },
    }),
    prisma.issue.findMany({
      where: {
        assignedToId: null,
        project: { orgId },
        ...(release ? { release } : {}),
      },
      orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
      include: { team: true, assignedTo: true, project: { select: { id: true, name: true } } },
    }),
  ]);

  const [allTeams, allDevelopers] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, projectId: true }, where: { project: { orgId } } }),
    prisma.teamMembership.findMany({
      where: { role: "DEVELOPER", team: { project: { orgId } } },
      select: { teamId: true, user: { select: { id: true, email: true, name: true } } },
    }).then((memberships) => memberships.map(({ teamId, user }) => ({ ...user, teamId })))
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
    timeAgo: formatTimeAgo(new Date(issue.lastSeenAt)),
    timesSeen: issue.timesSeen,
    logs: issue.logs as Record<string, unknown> | null,
    rootCause: issue.rootCause,
    source: issue.source,
    release: issue.release,
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

      <form method="get" className="flex flex-wrap items-center gap-2">
        <label htmlFor="release-filter" className="text-xs text-zinc-500">Release</label>
        <select id="release-filter" name="release" defaultValue={release || ""} className="rounded-lg border border-white/10 bg-[#111114] px-3 py-2 text-sm text-zinc-200">
          <option value="">All releases</option>
          {availableReleases.filter((row) => row.release).map((row) => <option key={row.release} value={row.release!}>{row.release}</option>)}
        </select>
        <button className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-black">Filter</button>
        {release && <a href="/dashboard/admin/issues" className="px-2 py-2 text-xs text-zinc-500 hover:text-white">Clear</a>}
      </form>

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
