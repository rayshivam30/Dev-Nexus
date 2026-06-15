import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-utils";
import { ManagerTeamClient } from "@/components/dashboard/manager/ManagerTeamClient";

export const dynamic = "force-dynamic";

export default async function ManagerTeamPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: currentUser.userId, status: "ACTIVE" },
    include: { project: true },
  });
  if (!user || !user.projectId || !user.project) redirect("/dashboard/manager");

  const teams = await prisma.team.findMany({
    where: { projectId: user.projectId },
    include: {
      _count: { select: { issues: { where: { status: { not: "RESOLVED" } } } } },
      members: { select: { id: true, email: true, status: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ManagerTeamClient
      projectId={user.projectId}
      projectName={user.project.name}
      teams={teams.map((t) => ({
        id: t.id,
        name: t.name,
        issueCount: t._count.issues,
        members: t.members,
      }))}
    />
  );
}
