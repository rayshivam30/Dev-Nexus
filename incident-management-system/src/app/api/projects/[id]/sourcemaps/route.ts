import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { uploadSourceMap, listSourceMaps, deleteSourceMap } from "@/services/sourcemap-service";
import { logAuditEvent } from "@/lib/audit-logger";

/**
 * GET /api/projects/[id]/sourcemaps
 * List all uploaded source maps for a project.
 */
export const GET = withAuth(async (req, { decoded, params }) => {
  const { id } = await (params as { id: string });
  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true },
  });

  if (!project || project.orgId !== decoded.orgId) {
    return apiError("Project not found", 404);
  }

  const url = new URL(req.url);
  const release = url.searchParams.get("release") || undefined;

  const maps = await listSourceMaps(id, release);
  return apiResponse("Project source maps", { sourceMaps: maps });
}, ["ADMIN", "MANAGER", "DEVELOPER"]);

/**
 * POST /api/projects/[id]/sourcemaps
 * Upload one or multiple source maps for a release.
 */
export const POST = withAuth(async (req, { decoded, body, params }) => {
  const userAgent = req.headers.get("user-agent") || undefined;
  const ipAddress = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || undefined;
  const { id } = await (params as { id: string });

  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true },
  });

  if (!project || project.orgId !== decoded.orgId) {
    return apiError("Project not found", 404);
  }

  const payload = body as {
    release: string;
    filename?: string;
    content?: string;
    files?: Array<{ filename: string; content: string }>;
  };

  if (!payload || !payload.release) {
    return apiError("Missing 'release' identifier (e.g. version or git commit)", 400);
  }

  const uploaded = [];

  // Support batch upload of multiple files
  if (Array.isArray(payload.files) && payload.files.length > 0) {
    for (const file of payload.files) {
      if (file.filename && file.content) {
        const record = await uploadSourceMap(id, payload.release, file.filename, file.content);
        uploaded.push(record);
      }
    }
  } else if (payload.filename && payload.content) {
    const record = await uploadSourceMap(id, payload.release, payload.filename, payload.content);
    uploaded.push(record);
  } else {
    return apiError("Missing source map 'filename' and 'content' or 'files' array", 400);
  }

  logAuditEvent({
    action: "sourcemap_uploaded",
    userId: decoded.userId,
    resource: "sourcemap",
    resourceId: id,
    changes: { release: payload.release, fileCount: uploaded.length },
    success: true,
    ipAddress,
    userAgent,
  });

  return apiResponse("Source maps uploaded successfully", { uploaded, count: uploaded.length }, 201);
}, ["ADMIN", "MANAGER"]);

/**
 * DELETE /api/projects/[id]/sourcemaps?id=xxx
 * Delete a specific source map.
 */
export const DELETE = withAuth(async (req, { decoded, params }) => {
  const { id } = await (params as { id: string });
  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findUnique({
    where: { id },
    select: { orgId: true },
  });

  if (!project || project.orgId !== decoded.orgId) {
    return apiError("Project not found", 404);
  }

  const url = new URL(req.url);
  const mapId = url.searchParams.get("id");
  if (!mapId) {
    return apiError("Query parameter 'id' is required", 400);
  }

  await deleteSourceMap(mapId, id);
  return apiResponse("Source map deleted successfully");
}, ["ADMIN", "MANAGER"]);
