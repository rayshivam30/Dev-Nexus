import { NextRequest, NextResponse } from "next/server";
import { getPrometheusMetrics, register, aiQueueDepth, emailQueueDepth } from "@/lib/metrics";
import { getQueueStats } from "@/lib/ai-queue";
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
  if (requiredToken) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${requiredToken}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  // Update dynamic queue gauges before output
  try {
    const aiStats = getQueueStats();
    aiQueueDepth.set(aiStats.queueLength);

    const emailStats = getEmailQueueStats();
    emailQueueDepth.set(emailStats.queueLength);
  } catch {
    // Queues might not be initialized in certain environments
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
