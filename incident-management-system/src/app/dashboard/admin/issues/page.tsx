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

  // Fetch only unassigned issues (assignedToId: null) across all projects
  const issuesRaw = await prisma.issue.findMany({
    where: { assignedToId: null },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    include: { team: true, assignedTo: true },
  });

  const [allTeams, allDevelopers] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, projectId: true } }),
    prisma.user.findMany({ select: { id: true, email: true, teamId: true, name: true }, where: { role: 'DEVELOPER' } })
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
    rootCause: issue.rootCause
  }));

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col gap-4">
        <h1 className="text-5xl md:text-7xl font-[900] tracking-tighter uppercase italic leading-none border-l-8 border-black pl-8">
          UNASSIGNED <br />
          <span className="bg-[#00D1FF] border-4 border-black px-4 shadow-[6px_6px_0_0_black]">INCIDENTS_ALL</span>
        </h1>
        <p className="text-black font-black uppercase text-xs tracking-widest mt-4 opacity-60 max-w-xl">
          Critical operations center for unallocated organizational issues. Resolve or assign immediately to avoid SLA breach.
        </p>
      </div>

      {issuesRaw.length === 0 ? (
        <div className="p-20 border-4 border-black bg-white shadow-[12px_12px_0_0_#32CD32] text-center">
          <p className="text-2xl font-black uppercase italic text-black">NO_UNASSIGNED_INCIDENTS_FOUND</p>
          <p className="text-xs font-bold text-black/40 mt-4 uppercase tracking-widest">System node status: ALL_CLEAR</p>
        </div>
      ) : (
        <AdminIssuesClient issues={mappedIssues} teams={allTeams} developers={allDevelopers} />
      )}
    </div>
  );
}
