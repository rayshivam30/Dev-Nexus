import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { signToken } from "@/lib/jwt";

export const POST = withAuth(async (_req, { decoded, body, params }) => {
  const { id } = await (params as { id: string });
  const { installationId, githubRepoUrl, createInstallationState } = body as {
    installationId?: string; 
    githubRepoUrl?: string;
    createInstallationState?: boolean;
  };

  if (
    installationId === undefined &&
    githubRepoUrl === undefined &&
    !createInstallationState
  ) {
    return apiError("installationId or githubRepoUrl is required", 400);
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

    if (createInstallationState) {
      if (decoded.role !== "ADMIN" || !decoded.userId || !decoded.orgId) {
        return apiError("Only organization admins can connect GitHub", 403);
      }
      const state = signToken(
        {
          userId: decoded.userId,
          role: decoded.role,
          orgId: decoded.orgId,
          projectId: project.id,
        },
        "10m"
      );
      return apiResponse("GitHub installation state created", { state });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(installationId !== undefined && { githubInstallationId: installationId ? String(installationId) : null }),
        ...(githubRepoUrl !== undefined && { githubRepoUrl: githubRepoUrl || null }),
      },
    });

    return apiResponse("GitHub settings updated successfully", { project: updatedProject });
  } catch (error) {
    console.error("GitHub link error:", error);
    return apiError("Failed to link GitHub", 500);
  }
}, ["ADMIN"]);
