import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { revokeProjectApiKey } from "@/services/api-key-service";
import { logAuditEvent } from "@/lib/audit-logger";
import { hasProjectMembership } from "@/services/membership-service";

/**
 * DELETE /api/projects/[id]/keys/[keyId]
 * Revoke an API key immediately.
 */
export const DELETE = withAuth(async (req, { decoded, params }) => {
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
  const { id, keyId } = await (params as { id: string; keyId: string });

  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true },
  });

  if (!project || project.orgId !== decoded.orgId || (decoded.role !== "ADMIN" && !(await hasProjectMembership(decoded.userId as string, id, ["MANAGER"])))) {
    return apiError("Project not found", 404);
  }

  await revokeProjectApiKey(keyId, id);

  logAuditEvent({
    action: "project_api_key_revoked",
    userId: decoded.userId,
    resource: "project_api_key",
    resourceId: keyId,
    success: true,
    ipAddress,
    userAgent,
  });

  return apiResponse("API key revoked successfully");
}, ["ADMIN", "MANAGER"]);
