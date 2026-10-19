import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createProjectApiKey, listProjectApiKeys } from "@/services/api-key-service";
import { logAuditEvent } from "@/lib/audit-logger";

/**
 * GET /api/projects/[id]/keys
 * List all API keys for this project.
 */
export const GET = withAuth(async (req, { decoded, params }) => {
  const { id } = await (params as { id: string });
  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true },
  });

  if (!project || project.orgId !== decoded.orgId || (decoded.role !== "ADMIN" && decoded.projectId !== id)) {
    return apiError("Project not found", 404);
  }

  const keys = await listProjectApiKeys(id);
  return apiResponse("Project API keys", { keys });
}, ["ADMIN", "MANAGER"]);

/**
 * POST /api/projects/[id]/keys
 * Generate a new named API key for this project.
 */
export const POST = withAuth(async (req, { decoded, body, params }) => {
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
  const { id } = await (params as { id: string });
  const { name } = (body as { name?: string }) || {};

  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true },
  });

  if (!project || project.orgId !== decoded.orgId || (decoded.role !== "ADMIN" && decoded.projectId !== id)) {
    return apiError("Project not found", 404);
  }

  const newKey = await createProjectApiKey(id, name || "API Key");

  logAuditEvent({
    action: "project_api_key_created",
    userId: decoded.userId,
    resource: "project_api_key",
    resourceId: newKey.id,
    success: true,
    changes: { keyName: newKey.name },
    ipAddress,
    userAgent,
  });

  return apiResponse(
    "API key created successfully",
    {
      apiKey: newKey,
      message: "Copy your API key now. You will not be able to see the full key again.",
    },
    201
  );
}, ["ADMIN", "MANAGER"]);
