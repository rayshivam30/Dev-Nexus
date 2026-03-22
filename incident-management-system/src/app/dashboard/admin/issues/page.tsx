import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { AdminIssuesClient } from "@/components/dashboard/admin/AdminIssuesClient";
import { formatTimeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminIssuesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "ADMIN") redirect("/auth/login");

  // Fetch only unassigned issues (assignedToId: null) across all projects
  const issues = await prisma.issue.findMany({
    where: { assignedToId: null },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    include: { team: true, assignedTo: true },
  });

  const [allTeams, allDevelopers] = await Promise.all([
    prisma.team.findMany({ select: { id: true, name: true, projectId: true } }),
    prisma.user.findMany({ select: { id: true, email: true, teamId: true }, where: { role: 'DEVELOPER' } })
  ]);

  const mappedIssues = issues.map(issue => ({
    ...issue,
    projectId: issue.projectId,
    teamName: (issue as any).team?.name || "—",
    assignedToEmail: (issue as any).assignedTo?.email || "—",
    timeAgo: formatTimeAgo(new Date(issue.createdAt))
  }));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Unassigned Issues</h1>
        <p className="text-foreground/60 mt-1">Issues not yet assigned to a developer.</p>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-foreground/50">
          No unassigned issues found.
        </div>
      ) : (
        <AdminIssuesClient issues={mappedIssues} teams={allTeams} developers={allDevelopers} />
      )}
    </div>
  );
}
