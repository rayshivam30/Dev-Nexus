import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/dashboard/admin/ProjectDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { issues: { where: { status: { not: 'RESOLVED' } } } } },
      managers: { select: { id: true, email: true, status: true } },
      teams: {
        include: {
          _count: { select: { issues: true } },
          members: { select: { id: true, email: true, status: true } },
        }
      },
      issues: {
        where: { teamId: null, assignedToId: null, status: { not: 'RESOLVED' } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, title: true, severity: true, status: true, createdAt: true }
      }
    }
  });

  if (!project) return notFound();

  const hasSdkIssues = await prisma.issue.findFirst({
    where: { projectId: id, source: 'SDK' },
    select: { id: true }
  });

  return (
    <div className="space-y-6">
      <Link href="/dashboard/admin/projects" className="text-sm font-medium text-foreground/60 hover:text-foreground flex items-center w-fit">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
      </Link>
      <ProjectDetailClient project={{ ...project, isSdkConnected: !!hasSdkIssues }} />
    </div>
  );
}

// Triggering NextJS Dev Server Rebuild
