import { prisma } from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import { ProjectDetailClient } from "@/components/dashboard/admin/ProjectDetailClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { getCurrentUser } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export default async function ProjectDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN" || !currentUser.orgId) {
    redirect("/auth/login");
  }

  // 🔥 MAIN SECURITY: FILTER AT PROJECT LEVEL ONLY
  const projectRaw = await prisma.project.findFirst({
    where: {
      id,
      orgId: currentUser.orgId,
    },
    include: {
      _count: {
        select: {
          issues: {
            where: { status: { not: "RESOLVED" } },
          },
        },
      },
      memberships: {
        where: { role: "MANAGER" },
        include: { user: { select: { id: true, email: true, status: true } } },
      },
      teams: {
        include: {
          _count: { select: { issues: true } },
          memberships: {
            where: { role: "DEVELOPER" },
            include: { user: { select: { id: true, email: true, status: true } } },
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
  const today = new Date();
  const usageDay = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  const [hasSdkIssues, dailyUsage] = await Promise.all([
    prisma.issue.findFirst({ where: { projectId: id, source: "SDK" }, select: { id: true } }),
    prisma.projectDailyUsage.findUnique({ where: { projectId_day: { projectId: id, day: usageDay } }, select: { eventCount: true } }),
  ]);
  const dailyEventLimit = ({ BASIC: 1_000, ADVANCED: 10_000, PRO: 100_000, ENTERPRISE: 1_000_000 } as const)[projectRaw.plan];

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
    managers: projectRaw.memberships.map(({ user }) => user),
    teams: projectRaw.teams.map((team) => ({
      ...team,
      members: team.memberships.map(({ user }) => user),
    })),
    sdkApiKey: null,
    hasSdkKey: Boolean(projectRaw.sdkApiKey),
    isSdkConnected: !!hasSdkIssues,
    dailyEventCount: dailyUsage?.eventCount || 0,
    dailyEventLimit,
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
