import AdminIssueDetailClient from "@/components/dashboard/admin/issue-detail/AdminIssueDetailClient";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN" || !currentUser.orgId) {
    redirect("/auth/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const issue = await prisma.issue.findFirst({
    where: { id, project: { orgId: currentUser.orgId } },
    select: { id: true },
  });
  if (!issue) redirect("/dashboard/admin/issues");

  const [teams, developers] = await Promise.all([
    prisma.team.findMany({
      where: { project: { orgId: currentUser.orgId } },
      select: { id: true, name: true, projectId: true }
    }),
    prisma.user.findMany({
      where: {
        role: "DEVELOPER",
        orgId: currentUser.orgId,
        status: "ACTIVE",
      },
      select: { id: true, name: true, email: true, teamId: true }
    }),
  ]);

  return (
    <div className="p-4 md:p-8">
      <AdminIssueDetailClient 
         issueId={id} 
         allTeams={teams} 
         allDevelopers={developers} 
      />
    </div>
  );
}
