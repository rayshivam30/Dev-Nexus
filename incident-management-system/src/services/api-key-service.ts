import { prisma } from "@/lib/db";
import crypto from "crypto";
import { Project } from "@devnexus/prisma-client";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Generate a new cryptographically secure API key for a project.
 * The raw plaintext key is returned only once at creation time.
 */
export async function createProjectApiKey(projectId: string, name: string) {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) throw new Error("Project not found");

  const rawKey = `devnexus_sk_live_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = hashApiKey(rawKey);
  const keyPrefix = `${rawKey.substring(0, 20)}...${rawKey.slice(-4)}`;

  const apiKeyRecord = await prisma.projectApiKey.create({
    data: {
      projectId,
      name: name.trim() || "Default API Key",
      keyHash,
      keyPrefix,
    },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
    },
  });

  return {
    ...apiKeyRecord,
    rawKey, // returned once
  };
}

/**
 * List all active and revoked API keys for a project.
 */
export async function listProjectApiKeys(projectId: string) {
  return await prisma.projectApiKey.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
    },
  });
}

/**
 * Revoke an API key so it can no longer be used for ingestion.
 */
export async function revokeProjectApiKey(keyId: string, projectId: string) {
  return await prisma.projectApiKey.updateMany({
    where: { id: keyId, projectId },
    data: { revokedAt: new Date() },
  });
}

/**
 * Validates an incoming API key.
 * Supports both multi-key ProjectApiKey table and legacy Project.sdkApiKey.
 * Asynchronously updates lastUsedAt for auditability.
 */
export async function validateApiKey(rawKey: string): Promise<Project | null> {
  if (!rawKey || typeof rawKey !== "string" || rawKey.length > 256) {
    return null;
  }

  const hashedKey = rawKey.startsWith("devnexus_sk_") ? hashApiKey(rawKey) : rawKey;

  // 1. Check ProjectApiKey table
  const apiKey = await prisma.projectApiKey.findUnique({
    where: { keyHash: hashedKey },
    include: { project: true },
  });

  if (apiKey) {
    if (apiKey.revokedAt) {
      return null; // Key has been revoked
    }

    // Touch lastUsedAt asynchronously
    prisma.projectApiKey
      .update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      })
      .catch(() => {});

    return apiKey.project;
  }

  // 2. Fallback to legacy project.sdkApiKey
  const legacyProject = await prisma.project.findUnique({
    where: { sdkApiKey: hashedKey },
  });

  return legacyProject || null;
}
