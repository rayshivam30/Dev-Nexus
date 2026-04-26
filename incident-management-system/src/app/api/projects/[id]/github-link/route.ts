import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";

export const POST = withAuth(async (_req, { decoded, body, params }) => {
  const { id } = await (params as { id: string });
  const { installationId } = body as { installationId: string };

  if (!installationId) {
    return apiError("installationId is required", 400);
  }

  try {
    const project = await prisma.project.findUnique({
      where: { id },
    });

    if (!project) return apiError("Project not found", 404);

    // Verify user belongs to the same org
    if (project.orgId !== decoded.orgId) {
      return apiError("Unauthorized", 403);
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        githubInstallationId: String(installationId),
      },
    });

    return apiResponse("GitHub linked successfully", { project: updatedProject });
  } catch (error) {
    console.error("GitHub link error:", error);
    return apiError("Failed to link GitHub", 500);
  }
});
