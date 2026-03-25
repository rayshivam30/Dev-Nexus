import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createProject, deleteProject } from "@/services/project-service";
import { PlanType } from "@prisma/client";

export const POST = withAuth(async (req, { decoded, body }) => {
  const { name, description, plan, githubRepoUrl } = body as {
    name?: string;
    description?: string;
    plan?: PlanType;
    githubRepoUrl?: string;
  };

  if (!name) return apiError("Project name is required", 400);
  if (!decoded.orgId) return apiError("Organization ID is missing in token", 401);

  try {
    const project = await createProject(name, decoded.orgId, description, plan as PlanType, githubRepoUrl);
    return apiResponse("Project created successfully!", { project }, 201);
  } catch (error) {
    console.error("Project creation error:", error);
    return apiError("Failed to create project", 500);
  }
}, ["ADMIN"]);

export const DELETE = withAuth(async (req) => {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return apiError("Project ID is required", 400);

  try {
    await deleteProject(id);
    return apiResponse("Project deleted successfully!");
  } catch (error) {
    console.error("Project deletion error:", error);
    return apiError("Failed to delete project", 500);
  }
}, ["ADMIN"]);
