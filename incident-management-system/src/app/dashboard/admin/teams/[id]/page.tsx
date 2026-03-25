import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { TeamDetailClient } from "@/components/dashboard/admin/TeamDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export const dynamic = "force-dynamic";

export default async function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const teamRaw = await prisma.team.findUnique({
    where: { id },
    include: {
      project: { select: { name: true, id: true } },
      members: { select: { id: true, email: true, status: true, role: true } },
      issues: {
        include: {
          assignedTo: { select: { email: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!teamRaw) return notFound();

  const issues: Issue[] = teamRaw.issues.map(issue => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    severity: issue.severity,
    status: issue.status,
    createdAt: issue.createdAt,
    projectId: issue.projectId,
    teamId: issue.teamId,
    teamName: teamRaw.name,
    assignedToEmail: issue.assignedTo?.email || "—",
    timeAgo: formatTimeAgo(new Date(issue.createdAt)),
    logs: issue.logs as Record<string, unknown> | null,
    rootCause: issue.rootCause
  }));

  const team = {
    ...teamRaw,
    issues
  };

  return (
    <div className="space-y-6">
      <Link 
        href={`/dashboard/admin/projects/${teamRaw.project.id}`} 
        className="text-sm font-medium text-foreground/60 hover:text-foreground flex items-center w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
      </Link>
      <TeamDetailClient team={team} />
    </div>
  );
}
