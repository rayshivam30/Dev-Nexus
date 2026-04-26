import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { ProjectsClient } from "@/components/dashboard/admin/ProjectsClient";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  // 🔐 GET USER FROM TOKEN
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;

  if (!token) throw new Error("Unauthorized");

  let user: any;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    throw new Error("Invalid token");
  }

  // 🔥 MAIN FIX: FILTER BY orgId
  const projects = await prisma.project.findMany({
    where: {
      orgId: user.orgId,
    },
    include: {
      teams: true,
      managers: true,
    },
  });

  return <ProjectsClient initialProjects={projects} />;
}
