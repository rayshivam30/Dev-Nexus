import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";
import { ManagerTeamClient } from "@/components/dashboard/manager/ManagerTeamClient";

export const dynamic = "force-dynamic";

export default async function ManagerTeamPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "MANAGER") redirect("/auth/login");

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
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
