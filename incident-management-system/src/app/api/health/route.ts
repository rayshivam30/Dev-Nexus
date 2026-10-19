import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";
import { getQueueStats } from "@/lib/ai-queue";
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
  } catch (err) {
    checks.database = {
      status: "down",
      latencyMs: Date.now() - dbStart,
      detail: err instanceof Error ? err.message : "Unknown DB error",
    };
  }

  // ── Redis Check ─────────────────────────────────────────────────────────
  if (redis) {
    const redisStart = Date.now();
    try {
      await redis.ping();
      checks.redis = { status: "ok", latencyMs: Date.now() - redisStart };
    } catch (err) {
      checks.redis = {
        status: "degraded",
        latencyMs: Date.now() - redisStart,
        detail: err instanceof Error ? err.message : "Unknown Redis error",
      };
    }
  } else {
    checks.redis = { status: "degraded", detail: "Not configured" };
  }

  // ── Queue Stats ─────────────────────────────────────────────────────────
  const aiQueue = getQueueStats();
  const emailQueue = getEmailQueueStats();

  const overallStatus = Object.values(checks).some((c) => c.status === "down")
    ? "down"
    : Object.values(checks).some((c) => c.status === "degraded")
      ? "degraded"
      : "ok";

  const statusCode = overallStatus === "down" ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "0.1.0",
      checks,
      queues: {
        ai: {
          active: aiQueue.activeCount,
          pending: aiQueue.queueLength,
          successRate: aiQueue.successRate,
        },
        email: {
          pending: emailQueue.queueLength,
          dailySent: emailQueue.dailySentCount,
          dailyRemaining: emailQueue.dailyRemaining,
        },
      },
    },
    { status: statusCode }
  );
}
