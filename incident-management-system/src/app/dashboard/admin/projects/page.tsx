import { prisma } from "@/lib/db";
import { ProjectsClient } from "@/components/dashboard/admin/ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: { teams: true, managers: true }
  });

  return <ProjectsClient initialProjects={projects} />;
}
