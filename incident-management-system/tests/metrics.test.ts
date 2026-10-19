import { describe, it, expect } from "bun:test";
import {
  getPrometheusMetrics,
  httpRequestsTotal,
  incidentsIngestedTotal,
  aiQueueDepth,
  emailQueueDepth,
} from "../src/lib/metrics";
import { GET } from "../src/app/api/metrics/route";
import { NextRequest } from "next/server";

describe("Prometheus Metrics Service (/api/metrics)", () => {
  it("exports Prometheus formatted string with devnexus_ prefix", async () => {
    httpRequestsTotal.inc({ method: "POST", route: "/api/ingest", status_code: "201" });
    incidentsIngestedTotal.inc({ project_id: "p1", severity: "HIGH", source: "SDK" });
    aiQueueDepth.set(5);
    emailQueueDepth.set(2);

    const metricsOutput = await getPrometheusMetrics();

    expect(metricsOutput).toContain("devnexus_http_requests_total");
    expect(metricsOutput).toContain("devnexus_incidents_ingested_total");
    expect(metricsOutput).toContain("devnexus_ai_queue_depth");
    expect(metricsOutput).toContain("devnexus_email_queue_depth");
    expect(metricsOutput).toContain('method="POST"');
    expect(metricsOutput).toContain('status_code="201"');
  });

  it("GET /api/metrics endpoint returns HTTP 200 with text/plain content type", async () => {
    const req = new NextRequest("http://localhost:3000/api/metrics");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const contentType = res.headers.get("content-type");
    expect(contentType).toContain("text/plain");

    const body = await res.text();
    expect(body.includes("devnexus_")).toBe(true);
  });

  it("GET /api/metrics requires token when METRICS_BEARER_TOKEN is configured", async () => {
    process.env.METRICS_BEARER_TOKEN = "secret-scrape-token";
    try {
      // Missing token -> 401
      const reqUnauthorized = new NextRequest("http://localhost:3000/api/metrics");
      const resUnauthorized = await GET(reqUnauthorized);
      expect(resUnauthorized.status).toBe(401);

      // Valid token -> 200
      const reqAuthorized = new NextRequest("http://localhost:3000/api/metrics", {
        headers: { authorization: "Bearer secret-scrape-token" },
      });
      const resAuthorized = await GET(reqAuthorized);
      expect(resAuthorized.status).toBe(200);
    } finally {
      delete process.env.METRICS_BEARER_TOKEN;
    }
  });
});
