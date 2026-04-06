import AdminIssueDetailClient from "@/components/dashboard/admin/issue-detail/AdminIssueDetailClient";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Fetch data sequentially to avoid connection pool exhaustion
  const teams = await prisma.team.findMany({
    select: { id: true, name: true, projectId: true }
  });
  
  const developers = await prisma.user.findMany({
    where: { role: "DEVELOPER" },
    select: { id: true, name: true, email: true, teamId: true }
  });

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
