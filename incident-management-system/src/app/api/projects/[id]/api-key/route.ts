import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import crypto from "crypto";
import { logAuditEvent } from "@/lib/audit-logger";

function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export const GET = withAuth(async (req, { decoded, params }) => {
  const { id } = await (params as { id: string });
  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true, sdkApiKey: true }
  });

  if (!project || project.orgId !== decoded.orgId) {
    return apiError("Project not found", 404);
  }

  return apiResponse("API key existence status", {
    hasApiKey: !!project.sdkApiKey
  });
}, ["ADMIN", "MANAGER"]);

export const POST = withAuth(async (req, { decoded, body, params }) => {
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
  const { id } = await (params as { id: string });
  const { action } = body as { action?: string };
  if (!decoded.orgId) return apiError("Organization is required", 403);

  if (action !== "regenerate") {
    return apiError("Invalid action", 400);
  }

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true }
  });

  if (!project || project.orgId !== decoded.orgId) {
    return apiError("Project not found", 404);
  }

  const plainTextKey = `devnexus_sk_${crypto.randomUUID().replace(/-/g, "")}`;
  const hashedKey = hashApiKey(plainTextKey);

  await prisma.project.update({
    where: { id },
    data: { sdkApiKey: hashedKey }
  });

  logAuditEvent({
    action: "api_key_regenerated",
    userId: decoded.userId,
    resource: "project",
    resourceId: id,
    success: true,
    ipAddress,
    userAgent,
  });

  return apiResponse("API key regenerated successfully", {
    newKey: plainTextKey,
    message: "Save this key securely. You won't be able to see it again."
  }, 200);
}, ["ADMIN"]);

export const DELETE = withAuth(async (req, { decoded, params }) => {
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
  const { id } = await (params as { id: string });
  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true }
  });

  if (!project || project.orgId !== decoded.orgId) {
    return apiError("Project not found", 404);
  }

  await prisma.project.update({
    where: { id },
    data: { sdkApiKey: null }
  });

  logAuditEvent({
    action: "api_key_revoked",
    userId: decoded.userId,
    resource: "project",
    resourceId: id,
    success: true,
    ipAddress,
    userAgent,
  });

  return apiResponse("API key revoked successfully");
}, ["ADMIN"]);
