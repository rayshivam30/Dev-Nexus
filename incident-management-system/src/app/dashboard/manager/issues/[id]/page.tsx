import AdminIssueDetailClient from "@/components/dashboard/admin/issue-detail/AdminIssueDetailClient";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/api-utils";
import { getUserProjectIds } from "@/services/membership-service";

export const dynamic = "force-dynamic";

export default async function ManagerIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "MANAGER") redirect("/auth/login");
  if (!currentUser.userId) redirect("/auth/login");

  const projectIds = await getUserProjectIds(currentUser.userId, ["MANAGER"]);
  if (!projectIds.length) redirect("/dashboard/manager");

  const resolvedParams = await params;
  const issueId = resolvedParams.id;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { projectId: true },
  });

  if (!issue || !projectIds.includes(issue.projectId)) {
    redirect("/dashboard/manager/issues");
  }

  const teams = await prisma.team.findMany({
    where: { projectId: issue.projectId },
    select: { id: true, name: true, projectId: true },
  });

  const developers = await prisma.teamMembership.findMany({
    where: { role: "DEVELOPER", team: { projectId: issue.projectId } },
    select: { teamId: true, user: { select: { id: true, name: true, email: true } } },
  }).then((memberships) => memberships.map(({ teamId, user }) => ({ ...user, teamId })));

  return (
    <div className="p-4 md:p-8">
      <AdminIssueDetailClient
        issueId={issueId}
        allTeams={teams}
        allDevelopers={developers}
        viewerRole="MANAGER"
      />
    </div>
  );
}
