import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { DeveloperIssuesClient } from "@/components/dashboard/developer/DeveloperIssuesClient";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { getCurrentUser } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export default async function DeveloperIssuesPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "DEVELOPER") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId, status: "ACTIVE" }
  });
  if (!user) redirect("/auth/login");

  const issuesRaw = await prisma.issue.findMany({
    where: {
      assignedToId: user.id,
      status: { not: "RESOLVED" },
    },
    orderBy: [{ severity: "desc" }, { createdAt: "desc" }],
    include: { team: true },
  });

  const issues: Issue[] = issuesRaw.map((issue) => ({
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

  return <DeveloperIssuesClient issues={issues} />;
}
