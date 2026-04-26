import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ProjectDetailClient } from "@/components/dashboard/admin/ProjectDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 🔐 GET USER FROM TOKEN
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;

  if (!token) return notFound();

  let user: any;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    return notFound();
  }
  console.log("USER FULL:", JSON.stringify(user, null, 2));
  // 🔥 MAIN SECURITY: FILTER AT PROJECT LEVEL ONLY
  const projectRaw = await prisma.project.findFirst({
    where: {
      id,
      orgId: user.orgId,
    },
    include: {
      _count: {
        select: {
          issues: {
            where: { status: { not: "RESOLVED" } },
          },
        },
      },
      managers: {
        select: { id: true, email: true, status: true },
      },
      teams: {
        include: {
          _count: { select: { issues: true } },
          members: {
            select: { id: true, email: true, status: true },
          },
        },
      },
      issues: {
        where: {
          teamId: null,
          assignedToId: null,
          status: { not: "RESOLVED" },
        },
        orderBy: { createdAt: "desc" },
        include: { team: true, assignedTo: true },
      },
    },
  });

  if (!projectRaw) return notFound();

  // 🔥 SAFE SDK CHECK (project already filtered)
  const hasSdkIssues = await prisma.issue.findFirst({
    where: {
      projectId: id,
      source: "SDK",
    },
    select: { id: true },
  });

  // 🔥 FORMAT ISSUES
  const issues: Issue[] = projectRaw.issues.map((issue) => ({
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
    rootCause: issue.rootCause,
  }));

  const project = {
    ...projectRaw,
    isSdkConnected: !!hasSdkIssues,
    issues,
  };

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/admin/projects"
        className="text-sm font-medium text-foreground/60 hover:text-foreground flex items-center w-fit transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Projects
      </Link>

      <ProjectDetailClient project={project} />
    </div>
  );
}