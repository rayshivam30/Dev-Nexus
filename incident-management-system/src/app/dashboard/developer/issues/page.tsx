import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { DeveloperIssuesClient } from "@/components/dashboard/developer/DeveloperIssuesClient";
import { formatTimeAgo } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export const dynamic = "force-dynamic";

export default async function DeveloperIssuesPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "DEVELOPER") redirect("/auth/login");

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
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
    timeAgo: formatTimeAgo(issue.createdAt),
    status: issue.status,
    logs: issue.logs,
    teamName: issue.team?.name || "",
    assignedToEmail: user.email,
  }));

  return <DeveloperIssuesClient issues={issues} />;
}
