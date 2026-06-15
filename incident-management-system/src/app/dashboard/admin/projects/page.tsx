import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { ProjectsClient } from "@/components/dashboard/admin/ProjectsClient";
import { getCurrentUser } from "@/lib/api-utils";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== "ADMIN" || !currentUser.orgId) {
    redirect("/auth/login");
  }

  // 🔥 MAIN FIX: FILTER BY orgId
  const projects = await prisma.project.findMany({
    where: {
      orgId: currentUser.orgId,
    },
    include: {
      teams: true,
      managers: true,
    },
  });

  return <ProjectsClient initialProjects={projects} />;
}
