import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getEmailQueueStats } from "@/lib/mailer";

/**
 * GET /api/health
 *
 * Production-grade health check endpoint.
 * Returns connectivity status for all critical dependencies.
 * Used by Docker HEALTHCHECK, Kubernetes readiness probes, and load balancers.
 */
export async function GET() {
  const checks: Record<string, { status: "ok" | "degraded" | "down"; latencyMs?: number; detail?: string }> = {};

  // ── Database Check ──────────────────────────────────────────────────────
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok", latencyMs: Date.now() - dbStart };
  } catch {
    checks.database = {
      status: "down",
      latencyMs: Date.now() - dbStart,
      detail: "Database query failed",
    };
  }

  // ── Redis Check ─────────────────────────────────────────────────────────
  if (redis) {
    const redisStart = Date.now();
    try {
      await redis.ping();
      checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
    } catch {
      checks.redis = {
        status: "degraded",
        latencyMs: Date.now() - redisStart,
        detail: "Redis health check failed",
      };
    }
  } else {
    checks.redis = { status: "degraded", detail: "Not configured" };
  }

  // ── Queue Stats ─────────────────────────────────────────────────────────
  let emailQueue = { queueLength: 0, dailySentCount: 0, dailyLimit: 450, dailyRemaining: 450 };
  try {
    emailQueue = await getEmailQueueStats();
  } catch {
    // Database health above already reports queue storage failure.
  }
  let pendingAiJobs = 0;
  try {
    pendingAiJobs = await prisma.issue.count({
      where: {
        OR: [
          { logs: { path: ["aiJobStatus"], equals: "PENDING" } },
          { logs: { path: ["aiJobStatus"], equals: "PROCESSING" } },
        ],
      },
    });
  } catch {
    // The database check above already determines health status.
  }

  const overallStatus = Object.values(checks).some((c) => c.status === "down")
    ? "down"
    : Object.values(checks).some((c) => c.status === "degraded")
      ? "degraded"
      : "ok";

  const statusCode = overallStatus === "down" ? 503 : 200;

  const response = process.env.NODE_ENV === "production"
    ? { status: overallStatus, timestamp: new Date().toISOString() }
    : {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
      queues: {
        ai: {
          pending: pendingAiJobs,
        },
        email: {
          pending: emailQueue.queueLength,
          dailySent: emailQueue.dailySentCount,
          dailyRemaining: emailQueue.dailyRemaining,
        },
      },
    };
  return NextResponse.json(response, { status: statusCode });
}
