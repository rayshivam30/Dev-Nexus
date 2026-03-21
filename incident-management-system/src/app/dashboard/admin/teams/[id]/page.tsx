import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { TeamDetailClient } from "@/components/dashboard/admin/TeamDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const team = await prisma.team.findUnique({
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

  if (!team) return notFound();

  return (
    <div className="space-y-6">
      <Link 
        href={`/dashboard/admin/projects/${team.project.id}`} 
        className="text-sm font-medium text-foreground/60 hover:text-foreground flex items-center w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Project
      </Link>
      <TeamDetailClient team={{
        ...team,
        issues: team.issues.map(issue => ({
          ...issue,
          teamName: team.name, // The team name is already known here
          assignedToEmail: (issue as any).assignedTo?.email || "—",
          timeAgo: formatTimeAgo(new Date(issue.createdAt))
        }))
      }} />
    </div>
  );
}
