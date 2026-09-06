import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createProject, deleteProject, getProjectsByOrg } from "@/services/project-service";
import { PlanType } from "@devnexus/prisma-client";
import { logAuditEvent } from "@/lib/audit-logger";
import { logger } from "@/lib/logger";

export const GET = withAuth(async (_req, { decoded }) => {
  if (!decoded.orgId) return apiError("Organization ID is missing in token", 401);
  try {
    const projects = await getProjectsByOrg(decoded.orgId);
    return apiResponse("Projects fetched successfully", { projects });
  } catch (error) {
    logger.error({ err: error }, "Fetch projects error");
    return apiError("Failed to fetch projects", 500);
  }
});

export const POST = withAuth(async (req, { decoded, body }) => {
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

  const { name, description, plan, githubRepoUrl } = body as {
    name?: string;
    description?: string;
    plan?: PlanType;
    githubRepoUrl?: string;
  };

  if (!name) return apiError("Project name is required", 400);
  if (!decoded.orgId) return apiError("Organization ID is missing in token", 401);

  try {
    const project = await createProject(name, decoded.orgId, description, plan as PlanType, githubRepoUrl, decoded.userId);
    logAuditEvent({
      action: "project_created",
      userId: decoded.userId,
      resource: "project",
      resourceId: project.id,
      success: true,
      changes: { name, plan, githubRepoUrl },
      ipAddress,
      userAgent,
    });
    return apiResponse("Project created successfully!", { project }, 201);
  } catch (error) {
    logAuditEvent({
      action: "project_creation_failed",
      userId: decoded.userId,
      resource: "project",
      success: false,
      changes: { name, error: error instanceof Error ? error.message : String(error) },
      ipAddress,
      userAgent,
    });
    logger.error({ err: error }, "Project creation error");
    return apiError("Failed to create project", 500);
  }
}, ["ADMIN"]);

export const DELETE = withAuth(async (req, { decoded }) => {
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;

  const url = new URL(req.url);
  const id = url.searchParams.get("id");

  if (!id) return apiError("Project ID is required", 400);
  if (!decoded.orgId) return apiError("Organization ID is missing", 403);

  try {
    const result = await deleteProject(id, decoded.orgId);
    if (result.count !== 1) {
      logAuditEvent({
        action: "project_deletion_failed_not_found",
        userId: decoded.userId,
        resource: "project",
        resourceId: id,
        success: false,
        ipAddress,
        userAgent,
      });
      return apiError("Project not found", 404);
    }
    logAuditEvent({
      action: "project_deleted",
      userId: decoded.userId,
      resource: "project",
      resourceId: id,
      success: true,
      ipAddress,
      userAgent,
    });
    return apiResponse("Project deleted successfully!");
  } catch (error) {
    logAuditEvent({
      action: "project_deletion_failed",
      userId: decoded.userId,
      resource: "project",
      resourceId: id,
      success: false,
      changes: { error: error instanceof Error ? error.message : String(error) },
      ipAddress,
      userAgent,
    });
    logger.error({ err: error }, "Project deletion error");
    return apiError("Failed to delete project", 500);
  }
}, ["ADMIN"]);

