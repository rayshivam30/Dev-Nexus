import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createProject } from "@/services/project-service";

export const POST = withAuth(async (req, { decoded, body }) => {
  const { name, description } = body;

  if (!name) return apiError("Project name is required", 400);
  if (!decoded.orgId) return apiError("Organization ID is missing in token", 401);

  try {
    const project = await createProject(name, decoded.orgId, description);
    return apiResponse("Project created successfully!", { project }, 201);
  } catch (error) {
    console.error("Project creation error:", error);
    return apiError("Failed to create project", 500);
  }
}, ["ADMIN"]);
