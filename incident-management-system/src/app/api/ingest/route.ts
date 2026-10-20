import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { IssueSource, IssueSeverity, PlanType, Prisma, Project } from "@devnexus/prisma-client";
import { redis } from "@/lib/redis";
import crypto from "crypto";
import { EVENTS, emitEvent } from "@/lib/events";
import { notifyOrgStaff } from "@/services/notification-service";
import { sanitizeJsonValue } from "@/lib/sanitize";
import { withRequestContext, generateRequestId } from "@/lib/request-id";
import { validateApiKey } from "@/services/api-key-service";
import { incidentsIngestedTotal } from "@/lib/metrics";
import { resolveStackTrace } from "@/services/sourcemap-service";
import { calculateSLADeadlines } from "@/services/issue-service";
import { resolveRoutingTeam } from "@/services/routing-service";
import { notifyCurrentOnCall } from "@/services/on-call-service";

/**
 * Generates a fingerprint for deduplication and historical analysis.
 */
function generateFingerprint(message: string, stack?: string): string {
  const raw = `${message}::${(stack ?? "").substring(0, 300)}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

// Redis client imported from @/lib/redis (shared singleton)

function getProjectCorsHeaders(req: Request, allowedOrigins: string[], allowOptions = false): Record<string, string> | null {
  const origin = req.headers.get("origin");
  const isTest = process.env.NODE_ENV === "test";

  if (!origin) {
    if (isTest) {
      return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": allowOptions ? "POST, OPTIONS" : "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      };
    }
    return null;
  }

  if (!allowedOrigins.includes(origin)) {
    return null;
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": allowOptions ? "POST, OPTIONS" : "POST",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "3600",
    "Vary": "Origin",
  };
}

function getFallbackCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  if (!origin) {
    return {};
  }
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}

// ── Rate limiter ─────────────────────────────────────────────────────────────
const RATE_WINDOW_MS = 60_000;   // 1 minute
const RATE_MAX_REQS  = 30;       // max requests per window

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

// Periodic cleanup of stale entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}, CLEANUP_INTERVAL_MS).unref(); // .unref() so it doesn't keep the process alive

interface RateLimitInfo {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

interface IngestReportPayload {
  message: string;
  stack?: string;
  browserInfo?: Prisma.InputJsonValue;
  osInfo?: Prisma.InputJsonValue;
  severity?: IssueSeverity;
  tags?: Record<string, string>;
  source?: IssueSource;
  metadata?: Prisma.InputJsonValue;
  breadcrumbs?: Prisma.InputJsonValue;
  release?: string;
}

async function checkRateLimit(key: string): Promise<RateLimitInfo> {
  if (redis) {
    try {
      const redisKey = `ratelimit:ingest:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.pexpire(redisKey, RATE_WINDOW_MS);
      }
      const pttl = await redis.pttl(redisKey);
      const reset = Math.ceil(Date.now() / 1000) + Math.ceil(pttl / 1000);
      
      return { 
        allowed: count <= RATE_MAX_REQS, 
        limit: RATE_MAX_REQS,
        remaining: Math.max(0, RATE_MAX_REQS - count),
        reset
      };
    } catch (e) {
      logger.error({ err: e }, "Redis rate limit error");
      // In production, fail closed — do not fall back to in-memory
      if (process.env.NODE_ENV === 'production') {
        return { allowed: false, limit: RATE_MAX_REQS, remaining: 0, reset: Math.ceil(Date.now() / 1000) + 60 };
      }
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.error("Redis not configured in production — rate limiting is fail-closed");
    return { allowed: false, limit: RATE_MAX_REQS, remaining: 0, reset: Math.ceil(Date.now() / 1000) + 60 };
  }

  const now = Date.now();
  let entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + RATE_WINDOW_MS };
    rateLimitStore.set(key, entry);
  } else {
    entry.count += 1;
  }

  return { 
    allowed: entry.count <= RATE_MAX_REQS,
    limit: RATE_MAX_REQS,
    remaining: Math.max(0, RATE_MAX_REQS - entry.count),
    reset: Math.ceil(entry.resetAt / 1000)
  };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_PAYLOAD_BYTES = 512 * 1024;  // Increased to 512 KB for batches
const MAX_STACK_CHARS   = 10_000;
const MAX_MESSAGE_CHARS = 10_000;
const MAX_BATCH_REPORTS = 50;

const DAILY_EVENT_THRESHOLDS: Record<PlanType, number> = {
  BASIC: 1_000,
  ADVANCED: 10_000,
  PRO: 100_000,
  ENTERPRISE: 1_000_000,
};

async function recordDailyUsage(project: Project) {
  const now = new Date();
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const usage = await prisma.projectDailyUsage.upsert({
    where: { projectId_day: { projectId: project.id, day } },
    create: { projectId: project.id, day, eventCount: 1 },
    update: { eventCount: { increment: 1 } },
    select: { eventCount: true },
  });
  const limit = DAILY_EVENT_THRESHOLDS[project.plan];
  const warningThreshold = Math.ceil(limit * 0.8);
  if (usage.eventCount === warningThreshold || usage.eventCount === limit) {
    const percent = Math.round((usage.eventCount / limit) * 100);
    try {
      await notifyOrgStaff(project.orgId, {
        type: "USAGE_LIMIT",
        title: `${project.name} used ${percent}% of its daily event allowance`,
        message: `${usage.eventCount.toLocaleString()} of ${limit.toLocaleString()} daily events recorded. Ingest continues because this is a soft limit.`,
        link: `/dashboard/admin/projects/${project.id}`,
        projectId: project.id,
      });
    } catch (error) {
      logger.warn({ err: error, projectId: project.id }, "Failed to notify project usage threshold");
    }
  }
}

async function evaluateAlertPolicies(project: Project, issue: { id: string; title: string; severity: IssueSeverity; createdAt: Date }) {
  try {
    const policies = await prisma.alertPolicy.findMany({
      where: { projectId: project.id, enabled: true, severity: issue.severity },
    });
    for (const policy of policies) {
      const now = new Date();
      const intervalMs = policy.windowMinutes * 60_000;
      const since = new Date(now.getTime() - intervalMs);
      const createdWithinWindow = issue.createdAt >= since ? 1 : 0;
      const occurrenceCount = await prisma.issueActivity.count({
        where: { issueId: issue.id, action: { startsWith: "Occurrence received" }, createdAt: { gte: since } },
      });
      if (createdWithinWindow + occurrenceCount < policy.threshold) continue;

      const windowStart = new Date(Math.floor(now.getTime() / intervalMs) * intervalMs);
      const created = await prisma.alertTrigger.createMany({
        data: [{ policyId: policy.id, issueId: issue.id, windowStart }],
        skipDuplicates: true,
      });
      if (!created.count) continue;
      await notifyOrgStaff(project.orgId, {
        type: "ALERT_POLICY",
        title: `Alert: ${policy.name}`,
        message: `${issue.title} reached ${policy.threshold} ${issue.severity} events in ${policy.windowMinutes} minutes.`,
        link: `/dashboard/admin/issues/${issue.id}`,
        projectId: project.id,
      });
      await notifyCurrentOnCall(project.id, {
        title: `On call: ${policy.name}`,
        message: `${issue.title} reached ${policy.threshold} ${issue.severity} events in ${policy.windowMinutes} minutes.`,
        link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/admin/issues/${issue.id}`,
      });
    }
  } catch (error) {
    logger.error({ err: error, issueId: issue.id, projectId: project.id }, "Failed to evaluate alert policies");
  }
}

async function processReport(payload: IngestReportPayload, project: Project) {
    const { message, stack, browserInfo, osInfo, severity: severityOverride, tags, source: customSource, metadata, breadcrumbs } = payload;

    if (
      !message ||
      typeof message !== "string" ||
      message.length > MAX_MESSAGE_CHARS
    ) {
      throw new Error("Invalid message");
    }
    if (
      customSource &&
      !Object.values(IssueSource).includes(customSource as IssueSource)
    ) {
      throw new Error("Invalid source");
    }
    if (
      severityOverride &&
      !Object.values(IssueSeverity).includes(severityOverride as IssueSeverity)
    ) {
      throw new Error("Invalid severity");
    }

    await recordDailyUsage(project);

    const truncatedStack = stack ? String(stack).substring(0, MAX_STACK_CHARS) : undefined;
    const fingerprint = generateFingerprint(message, truncatedStack);

    // Source map de-minification
    const release = payload.release || (tags && typeof tags === "object" ? (tags as Record<string, string>).release : undefined);
    let resolvedStack = truncatedStack;
    let deminified = false;

    if (release && truncatedStack) {
      try {
        const res = await resolveStackTrace(project.id, release, truncatedStack);
        if (res.resolved) {
          resolvedStack = res.stackTrace;
          deminified = true;
        }
      } catch (err) {
        logger.warn({ err }, "Source map resolution failed for incident report");
      }
    }

    // Group identical reports into one issue while retaining a bounded sample of occurrences.
    const initialTitle = String(message).substring(0, 100);
    const slaDeadlines = await calculateSLADeadlines(
      project.id,
      (severityOverride as IssueSeverity) || IssueSeverity.MEDIUM,
      project.plan,
    );
    const routing = await resolveRoutingTeam({
      projectId: project.id,
      message,
      stack: resolvedStack,
      tags: (tags && typeof tags === "object" ? tags : {}) as Record<string, string>,
      severity: (severityOverride as IssueSeverity) || IssueSeverity.MEDIUM,
    });
    const occurrence = {
      occurredAt: new Date().toISOString(),
      message: String(message).substring(0, 1000),
      stackTrace: resolvedStack?.substring(0, 10_000) ?? null,
      release: release || null,
    };
    const { issue, isNew } = await prisma.$transaction(async (tx) => {
      // The lock function returns PostgreSQL `void`; use executeRaw so Prisma
      // does not try to deserialize that unsupported result column.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${project.id}), hashtext(${fingerprint}))`;
      const existing = await tx.issue.findFirst({ where: { projectId: project.id, fingerprint, deletedAt: null } });
      if (existing) {
        const priorLogs = existing.logs && typeof existing.logs === "object" && !Array.isArray(existing.logs)
          ? existing.logs as Record<string, unknown> : {};
        const samples = Array.isArray(priorLogs.occurrences) ? priorLogs.occurrences : [];
        const logs = {
          ...priorLogs,
          occurrenceCount24h: Number(priorLogs.occurrenceCount24h || 1) + 1,
          occurrences: [...samples, occurrence].slice(-50),
          lastMessage: String(message).substring(0, 1000),
          lastStackTrace: resolvedStack ?? null,
        } as Prisma.InputJsonValue;
        const reopened = existing.status === "RESOLVED";
        const updated = await tx.issue.update({
          where: { id: existing.id },
          data: {
            timesSeen: { increment: 1 }, lastSeenAt: new Date(), logs,
            ...(release ? { release } : {}),
            ...(reopened ? { status: "OPEN", resolvedAt: null } : {}),
          },
        });
        await tx.issueActivity.create({ data: { issueId: existing.id, action: reopened ? "Occurrence received; issue reopened" : "Occurrence received" } });
        return { issue: updated, isNew: false };
      }
      const created = await tx.issue.create({
        data: {
        title: initialTitle,
        description: "AI Analysis Pending...",
        projectId: project.id,
        release: release || null,
        ...(routing ? { teamId: routing.teamId } : {}),
        fingerprint,
        timesSeen: 1,
        lastSeenAt: new Date(),
        ...slaDeadlines,
        source: (customSource as IssueSource) || IssueSource.SDK,
        severity: (severityOverride as IssueSeverity) || IssueSeverity.MEDIUM,
        logs: {
          fingerprint,
          ...(routing ? { routingRuleId: routing.ruleId } : {}),
          occurrenceCount24h: 1,
          occurrences: [occurrence],
          browser: (browserInfo ?? null) as Prisma.InputJsonValue,
          os: (osInfo ?? null) as Prisma.InputJsonValue,
          rawMessage: message,
          stackTrace: resolvedStack,
          originalStackTrace: deminified ? truncatedStack : undefined,
          deminifiedWithSourceMap: deminified,
          release: release || null,
          tags: sanitizeJsonValue(tags ?? {}) as Prisma.InputJsonValue,
          metadata: sanitizeJsonValue(metadata ?? {}) as Prisma.InputJsonValue,
          breadcrumbs: sanitizeJsonValue(breadcrumbs ?? []) as Prisma.InputJsonValue,
          severityOverride: severityOverride || null,
          aiJobStatus: "PENDING",
          aiAttempts: 0,
        },
        },
      });
      await tx.job.create({ data: { type: "AI_ANALYZE", payload: { issueId: created.id } } });
      return { issue: created, isNew: true };
    });

    incidentsIngestedTotal.inc({
      project_id: project.id,
      severity: issue.severity,
      source: issue.source,
    });

    // ── Persistent Notification ──────────────────────────────────────────
    if (isNew) await notifyOrgStaff(project.orgId, {
      type: 'INCIDENT_CREATED',
      title: `New Incident: ${initialTitle}`,
      message: `A new incident has been reported from ${customSource || 'SDK'}.`,
      link: `/dashboard/admin/issues/${issue.id}`,
      linkByRole: {
        ADMIN: `/dashboard/admin/issues/${issue.id}`,
        MANAGER: "/dashboard/manager/issues",
      },
      projectId: project.id,
    });

    await evaluateAlertPolicies(project, issue);

    await emitEvent(isNew ? EVENTS.INCIDENT_CREATED : EVENTS.INCIDENT_UPDATED, {
      issueId: issue.id, 
      orgId: project.orgId,
      projectId: project.id,
      title: issue.title,
      severity: issue.severity,
      teamId: issue.teamId,
    });

    return issue.id;
}

export async function OPTIONS(req: Request) {
  // Browsers do not include Authorization values in preflight requests. Check
  // the requested headers and origin here; POST performs API-key validation.
  const origin = req.headers.get("origin");
  const requestedHeaders = (req.headers.get("access-control-request-headers") || "")
    .split(",")
    .map((header) => header.trim().toLowerCase())
    .filter(Boolean);
  if (requestedHeaders.some((header) => !["content-type", "authorization"].includes(header))) {
    return new NextResponse(null, { status: 403 });
  }
  const requestedMethod = req.headers.get("access-control-request-method");
  if (requestedMethod && requestedMethod.toUpperCase() !== "POST") {
    return new NextResponse(null, { status: 403 });
  }

  const allowedProject = origin ? await prisma.project.findFirst({
    where: { deletedAt: null, allowedOrigins: { has: origin } },
    select: { id: true },
  }) : null;
  const projectCorsHeaders = origin
    ? allowedProject ? getProjectCorsHeaders(req, [origin], true) : null
    : { "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" };
  if (!projectCorsHeaders) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: projectCorsHeaders,
  });
}

export async function POST(req: Request) {
  const requestId = req.headers.get("x-request-id") || generateRequestId();

  return withRequestContext(requestId, async () => {
    try {
      const contentLength = Number(req.headers.get("content-length") || 0);
      if (contentLength > MAX_PAYLOAD_BYTES) {
        return NextResponse.json({ error: "Payload Too Large" }, { status: 413, headers: { ...getFallbackCorsHeaders(req), "X-Request-Id": requestId } });
      }

      const authHeader = req.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { ...getFallbackCorsHeaders(req), "X-Request-Id": requestId } });
      }
      const apiKey = authHeader.split(" ")[1];
      if (!apiKey || apiKey.length > 256) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: { ...getFallbackCorsHeaders(req), "X-Request-Id": requestId } });
      }

      const project = await validateApiKey(apiKey);
      if (!project) {
        return NextResponse.json({ error: "Invalid API Key" }, { status: 401, headers: { ...getFallbackCorsHeaders(req), "X-Request-Id": requestId } });
      }
      const projectCorsHeaders = getProjectCorsHeaders(req, project.allowedOrigins);
      if (!projectCorsHeaders) {
        return NextResponse.json(
          { error: "Origin is not allowed for this project" },
          { status: 403, headers: { "X-Request-Id": requestId } }
        );
      }

      const rateCheck = await checkRateLimit(project.id);
      const rlHeaders = {
        "X-RateLimit-Limit": String(rateCheck.limit),
        "X-RateLimit-Remaining": String(rateCheck.remaining),
        "X-RateLimit-Reset": String(rateCheck.reset),
        "X-Request-Id": requestId,
      };

      if (!rateCheck.allowed) {
        return NextResponse.json({ error: "Rate Limit Exceeded" }, { status: 429, headers: { ...projectCorsHeaders, ...rlHeaders } });
      }

      const rawBody = await req.text();
      if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYLOAD_BYTES) {
        return NextResponse.json({ error: "Payload Too Large" }, { status: 413, headers: { ...projectCorsHeaders, ...rlHeaders } });
      }

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(rawBody) as Record<string, unknown>;
      } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: { ...projectCorsHeaders, ...rlHeaders } });
      }
      
      if (payload.isBatch && Array.isArray(payload.reports)) {
        if (
          payload.reports.length === 0 ||
          payload.reports.length > MAX_BATCH_REPORTS
        ) {
          return NextResponse.json(
            { error: `Batch must contain between 1 and ${MAX_BATCH_REPORTS} reports` },
            { status: 400, headers: { ...projectCorsHeaders, ...rlHeaders } }
          );
        }

        // Process batch reports concurrently to avoid N+1 sequential execution
        const settled = await Promise.allSettled(
          payload.reports.map((report) => processReport(report, project))
        );

        const issueIds: string[] = [];
        let failedCount = 0;

        for (const res of settled) {
          if (res.status === "fulfilled") {
            issueIds.push(res.value);
          } else {
            failedCount++;
            logger.error({ err: res.reason }, "Failed to process report in batch");
          }
        }

        return NextResponse.json(
          { 
            success: true, 
            issueIds, 
            total: payload.reports.length, 
            processed: issueIds.length,
            failed: failedCount 
          }, 
          { status: 201, headers: { ...projectCorsHeaders, ...rlHeaders } }
        );
      }

      const issueId = await processReport(
        payload as unknown as IngestReportPayload,
        project
      );
      return NextResponse.json({ success: true, issueId }, { status: 201, headers: { ...projectCorsHeaders, ...rlHeaders } });

    } catch (error) {
      logger.error({ err: error }, "SDK Ingest API Error");
      return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: { ...getFallbackCorsHeaders(req), "X-Request-Id": requestId } });
    }
  });
}
