import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { getPrometheusMetrics, register, aiQueueDepth, emailQueueDepth } from "@/lib/metrics";
import { getEmailQueueStats } from "@/lib/mailer";

/**
 * GET /api/metrics
 *
 * Prometheus / OpenTelemetry compatible metrics endpoint.
 * Scraped by Prometheus, Datadog Agent, Grafana Agent, or VictoriaMetrics.
 */
export async function GET(req: NextRequest) {
  // Optional security: If METRICS_BEARER_TOKEN is configured in production, require it
  const requiredToken = process.env.METRICS_BEARER_TOKEN;
  if (process.env.NODE_ENV === "production" && !requiredToken) {
    return new Response("Metrics authentication is not configured", { status: 503 });
  }
  if (requiredToken) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${requiredToken}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  // Update dynamic queue gauges before output
  try {
    const aiJobs = await prisma.issue.count({
      where: {
        OR: [
          { logs: { path: ["aiJobStatus"], equals: "PENDING" } },
          { logs: { path: ["aiJobStatus"], equals: "PROCESSING" } },
        ],
      },
    });
    aiQueueDepth.set(aiJobs);

    const emailStats = await getEmailQueueStats();
    emailQueueDepth.set(emailStats.queueLength);
  } catch {
    // Keep serving metrics when the database is temporarily unavailable.
  }

  const metrics = await getPrometheusMetrics();

  return new Response(metrics, {
    status: 200,
    headers: {
      "Content-Type": register.contentType,
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
