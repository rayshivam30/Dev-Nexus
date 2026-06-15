import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { IssueSource, IssueSeverity, Prisma, Project } from "@devnexus/prisma-client";
import { calculateSLADeadlines } from "@/services/issue-service";
import { analyzeIncident } from "@/lib/ai-service";
import { enqueueAITask, getQueueStats } from "@/lib/ai-queue";
import { redis } from "@/lib/redis";
import crypto from "crypto";
import { EVENTS, emitEvent } from "@/lib/events";
import { notifyOrgStaff } from "@/services/notification-service";

/**
 * Hashes an API key for comparison.
 */
function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Generates a fingerprint for deduplication and historical analysis.
 */
function generateFingerprint(message: string, stack?: string): string {
  const raw = `${message}::${(stack ?? "").substring(0, 300)}`;
  return crypto.createHash("md5").update(raw).digest("hex");
}

// Redis client imported from @/lib/redis (shared singleton)

// ── CORS ─────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function getProjectCorsHeaders(req: Request, allowedOrigins: string[]) {
  const origin = req.headers.get("origin");
  if (!origin) return corsHeaders;
  if (!allowedOrigins.includes(origin)) return null;
  return {
    ...corsHeaders,
    "Access-Control-Allow-Origin": origin,
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
      logger.error({ err: e }, "Redis rate limit error, falling back to in-memory");
    }
  } else if (process.env.NODE_ENV === 'production') {
    logger.warn("Redis not configured — rate limiting uses in-memory fallback (not shared across instances)");
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

    const truncatedStack = stack ? String(stack).substring(0, MAX_STACK_CHARS) : undefined;
    const fingerprint = generateFingerprint(message, truncatedStack);

    // Historical context
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const similarIncidentsCount = await prisma.issue.count({
      where: {
        projectId: project.id,
        logs: { path: ["fingerprint"], equals: fingerprint },
        createdAt: { gte: oneDayAgo }
      }
    });

    const initialTitle = String(message).substring(0, 100);
    const issue = await prisma.issue.create({
      data: {
        title: initialTitle,
        description: "AI Analysis Pending...",
        projectId: project.id,
        source: (customSource as IssueSource) || IssueSource.SDK,
        severity: (severityOverride as IssueSeverity) || IssueSeverity.MEDIUM,
        logs: {
          fingerprint,
          occurrenceCount24h: similarIncidentsCount + 1,
          browser: (browserInfo ?? null) as Prisma.InputJsonValue,
          os: (osInfo ?? null) as Prisma.InputJsonValue,
          rawMessage: message,
          stackTrace: truncatedStack,
          tags: (tags ?? {}) as Prisma.InputJsonValue,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
          breadcrumbs: (breadcrumbs ?? []) as Prisma.InputJsonValue,
        },
      },
    });

    // ── Persistent Notification ──────────────────────────────────────────
    await notifyOrgStaff(project.orgId, {
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

    await emitEvent(EVENTS.INCIDENT_CREATED, { 
      issueId: issue.id, 
      orgId: project.orgId,
      projectId: project.id,
      title: issue.title,
      severity: issue.severity
    });

    // AI Analysis — routed through the concurrency-limited queue
    after(async () => {
      try {
        const stats = getQueueStats();
        logger.info({ issueId: issue.id, ...stats }, "Enqueuing AI analysis");

        const aiAnalysis = await enqueueAITask(() =>
          analyzeIncident(
            { message, stack: truncatedStack, browserInfo, osInfo, tags, metadata, breadcrumbs, history: { last24hCount: similarIncidentsCount + 1, isFirstOccurrence: similarIncidentsCount === 0 } },
            (customSource as IssueSource) || IssueSource.SDK,
            project.techStack || []
          )
        );

        let finalSeverity = aiAnalysis.severity;
        if (severityOverride && Object.values(IssueSeverity).includes(severityOverride as IssueSeverity)) {
          finalSeverity = severityOverride as IssueSeverity;
        }

        const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(
          project.id, finalSeverity, project.plan
        );

        const updatedIssue = await prisma.issue.update({
          where: { id: issue.id },
          data: {
            title: aiAnalysis.title,
            description: aiAnalysis.description,
            rootCause: aiAnalysis.rootCause,
            suggestedFixes: aiAnalysis.suggestedFixes,
            priority: aiAnalysis.priority,
            environment: aiAnalysis.environment,
            severity: finalSeverity,
            responseSlaDeadline,
            resolutionSlaDeadline,
            logs: {
              ...(issue.logs as Record<string, unknown>),
              aiAnalysisFailed: !!aiAnalysis._failed,
              aiFullAnalysis: aiAnalysis as unknown as Prisma.InputJsonValue,
            }
          }
        });

        await emitEvent(EVENTS.INCIDENT_UPDATED, { 
          issueId: updatedIssue.id, 
          orgId: project.orgId,
          projectId: project.id,
          title: updatedIssue.title,
          severity: updatedIssue.severity,
          status: updatedIssue.status
        });
      } catch (e) {
        logger.error({ err: e }, "Background AI Analysis error");
      }
    });

    return issue.id;
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload Too Large" }, { status: 413, headers: corsHeaders });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }
    const apiKey = authHeader.split(" ")[1];
    if (!apiKey || apiKey.length > 256) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const hashedKey = apiKey.startsWith("devnexus_sk_") ? hashApiKey(apiKey) : apiKey;
    const project = await prisma.project.findUnique({ where: { sdkApiKey: hashedKey } });
    if (!project) {
      return NextResponse.json({ error: "Invalid API Key" }, { status: 401, headers: corsHeaders });
    }
    const projectCorsHeaders = getProjectCorsHeaders(req, project.allowedOrigins);
    if (!projectCorsHeaders) {
      return NextResponse.json(
        { error: "Origin is not allowed for this project" },
        { status: 403 }
      );
    }

    const rateCheck = await checkRateLimit(project.id);
    const rlHeaders = {
      "X-RateLimit-Limit": String(rateCheck.limit),
      "X-RateLimit-Remaining": String(rateCheck.remaining),
      "X-RateLimit-Reset": String(rateCheck.reset),
    };

    if (!rateCheck.allowed) {
      return NextResponse.json({ error: "Rate Limit Exceeded" }, { status: 429, headers: { ...projectCorsHeaders, ...rlHeaders } });
    }

    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload Too Large" }, { status: 413, headers: projectCorsHeaders });
    }

    let payload: Record<string, unknown>;
    try {
      payload = JSON.parse(rawBody) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: projectCorsHeaders });
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
      const issueIds = [];
      for (const report of payload.reports) {
        try {
          const id = await processReport(report, project);
          issueIds.push(id);
        } catch (e) {
          logger.error({ err: e }, "Failed to process report in batch");
        }
      }
      return NextResponse.json({ success: true, issueIds }, { status: 201, headers: { ...projectCorsHeaders, ...rlHeaders } });
    }

    const issueId = await processReport(
      payload as unknown as IngestReportPayload,
      project
    );
    return NextResponse.json({ success: true, issueId }, { status: 201, headers: { ...projectCorsHeaders, ...rlHeaders } });

  } catch (error) {
    logger.error({ err: error }, "SDK Ingest API Error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
