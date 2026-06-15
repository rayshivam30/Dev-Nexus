import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DeveloperResolvedClient } from "@/components/dashboard/developer/DeveloperResolvedClient";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { getCurrentUser } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export default async function DeveloperResolvedPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "DEVELOPER") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId, status: "ACTIVE" }
  });
  if (!user) redirect("/auth/login");

  const resolvedIssuesRaw = await prisma.issue.findMany({
    where: { assignedToId: user.id, status: "RESOLVED" },
    orderBy: { resolvedAt: "desc" },
    include: { team: true },
  });

  const resolvedIssues: Issue[] = resolvedIssuesRaw.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    rootCause: issue.description.substring(0, 100) + "...",
    severity: issue.severity,
    timeAgo: formatTimeAgo(new Date(issue.createdAt)),
    status: issue.status,
    logs: issue.logs as Record<string, unknown> | null,
    teamName: issue.team?.name || "",
    assignedToEmail: user.email,
  }));

  return <DeveloperResolvedClient resolvedIssues={resolvedIssues} />;
}
