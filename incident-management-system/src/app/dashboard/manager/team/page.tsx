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
    include: { projectMemberships: { where: { role: "MANAGER" }, include: { project: true }, orderBy: { createdAt: "asc" } } },
  });
  const membership = user?.projectMemberships[0];
  if (!user || !membership) redirect("/dashboard/manager");

  const teams = await prisma.team.findMany({
    where: { projectId: membership.projectId },
    include: {
      _count: { select: { issues: { where: { status: { not: "RESOLVED" } } } } },
      memberships: { where: { role: "DEVELOPER" }, include: { user: { select: { id: true, email: true, status: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <ManagerTeamClient
      projectId={membership.projectId}
      projectName={membership.project.name}
      teams={teams.map((t) => ({
        id: t.id,
        name: t.name,
        issueCount: t._count.issues,
        members: t.memberships.map(({ user: member }) => member),
      }))}
    />
  );
}
