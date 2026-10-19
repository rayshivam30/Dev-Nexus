import client from "prom-client";

// Prevent multiple registrations in Next.js development hot-reload
const globalForMetrics = globalThis as unknown as {
  prometheusRegister?: client.Registry;
};

export const register = globalForMetrics.prometheusRegister || new client.Registry();

if (!globalForMetrics.prometheusRegister) {
  // Add default node runtime metrics (CPU, memory, event loop, gc)
  client.collectDefaultMetrics({
    register,
    prefix: "devnexus_",
  });
  globalForMetrics.prometheusRegister = register;
}

// ── HTTP Metrics ─────────────────────────────────────────────────────────────
export const httpRequestsTotal =
  (register.getSingleMetric("devnexus_http_requests_total") as client.Counter<string>) ||
  new client.Counter({
    name: "devnexus_http_requests_total",
    help: "Total count of HTTP requests processed by DevNexus",
    labelNames: ["method", "route", "status_code"],
    registers: [register],
  });

export const httpRequestDuration =
  (register.getSingleMetric("devnexus_http_request_duration_seconds") as client.Histogram<string>) ||
  new client.Histogram({
    name: "devnexus_http_request_duration_seconds",
    help: "Duration of HTTP requests in seconds",
    labelNames: ["method", "route"],
    buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    registers: [register],
  });

// ── Incident & Ingest Metrics ────────────────────────────────────────────────
export const incidentsIngestedTotal =
  (register.getSingleMetric("devnexus_incidents_ingested_total") as client.Counter<string>) ||
  new client.Counter({
    name: "devnexus_incidents_ingested_total",
    help: "Total number of incident reports ingested via SDK",
    labelNames: ["project_id", "severity", "source"],
    registers: [register],
  });

// ── Queue Metrics ────────────────────────────────────────────────────────────
export const aiQueueDepth =
  (register.getSingleMetric("devnexus_ai_queue_depth") as client.Gauge<string>) ||
  new client.Gauge({
    name: "devnexus_ai_queue_depth",
    help: "Current number of AI analysis tasks in queue",
    registers: [register],
  });

export const emailQueueDepth =
  (register.getSingleMetric("devnexus_email_queue_depth") as client.Gauge<string>) ||
  new client.Gauge({
    name: "devnexus_email_queue_depth",
    help: "Current number of email jobs waiting in memory queue",
    registers: [register],
  });

/**
 * Returns Prometheus formatted metrics string.
 */
export async function getPrometheusMetrics(): Promise<string> {
  return await register.metrics();
}
