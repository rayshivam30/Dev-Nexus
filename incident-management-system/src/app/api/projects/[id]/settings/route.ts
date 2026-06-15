import { prisma } from "@/lib/db";
import { withAuth, apiError, apiResponse } from "@/lib/api-utils";

function normalizeOrigin(value: string) {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export const PATCH = withAuth(async (_req, { decoded, body, params }) => {
  const { id } = await (params as { id: string });
  const { allowedOrigins } =
    (body as { allowedOrigins?: unknown }) || {};

  if (!decoded.orgId) return apiError("Organization is required", 403);
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length > 20) {
    return apiError("allowedOrigins must be an array with at most 20 entries", 400);
  }

  const normalized = allowedOrigins.map((origin) =>
    typeof origin === "string" ? normalizeOrigin(origin.trim()) : null
  );
  if (normalized.some((origin) => !origin)) {
    return apiError("Every allowed origin must be a valid http(s) URL", 400);
  }

  const project = await prisma.project.findFirst({
    where: { id, orgId: decoded.orgId },
    select: { id: true },
  });
  if (!project) return apiError("Project not found", 404);

  const updated = await prisma.project.update({
    where: { id },
    data: { allowedOrigins: [...new Set(normalized as string[])] },
    select: { id: true, allowedOrigins: true },
  });

  return apiResponse("Project settings updated", { project: updated });
}, ["ADMIN"]);
