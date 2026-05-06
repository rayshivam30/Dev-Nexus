import AdminIssueDetailClient from "@/components/dashboard/admin/issue-detail/AdminIssueDetailClient";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ManagerIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { projectId: true },
  });

  if (!user?.projectId) redirect("/dashboard/manager");

  const resolvedParams = await params;
  const issueId = resolvedParams.id;

  const issue = await prisma.issue.findUnique({
    where: { id: issueId },
    select: { projectId: true },
  });

  if (!issue || issue.projectId !== user.projectId) {
    redirect("/dashboard/manager/issues");
  }

  const teams = await prisma.team.findMany({
    where: { projectId: user.projectId },
    select: { id: true, name: true, projectId: true },
  });

  const developers = await prisma.user.findMany({
    where: { team: { projectId: user.projectId }, role: "DEVELOPER" },
    select: { id: true, name: true, email: true, teamId: true },
  });

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
