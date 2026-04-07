import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { IssueSource, IssueSeverity, Prisma } from "@prisma/client";
import { calculateSLADeadlines } from "@/services/issue-service";
import { analyzeIncident } from "@/lib/ai-service";

// ── CORS ─────────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// ── Rate limiter (in-memory, per API key) ────────────────────────────────────
const RATE_WINDOW_MS = 60_000;   // 1 minute
const RATE_MAX_REQS  = 30;       // max requests per window

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_MAX_REQS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count += 1;
  return { allowed: true };
}

// ── Constants ─────────────────────────────────────────────────────────────────
const MAX_PAYLOAD_BYTES = 256 * 1024;  // 256 KB
const MAX_STACK_CHARS   = 10_000;

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    // ── Payload size guard ─────────────────────────────────────────────────
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_PAYLOAD_BYTES) {
      return NextResponse.json(
        { error: "Payload Too Large: Maximum 256 KB allowed." },
        { status: 413, headers: corsHeaders }
      );
    }

    // ── Auth ───────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing SDK API Key in Authorization header." },
        { status: 401, headers: corsHeaders }
      );
    }
    const apiKey = authHeader.split(" ")[1];

    // ── Rate limit ─────────────────────────────────────────────────────────
    const rateCheck = checkRateLimit(apiKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `Rate Limit Exceeded: Try again in ${rateCheck.retryAfter}s.` },
        { status: 429, headers: { ...corsHeaders, "Retry-After": String(rateCheck.retryAfter) } }
      );
    }

    // ── Project lookup ─────────────────────────────────────────────────────
    const project = await prisma.project.findUnique({ where: { sdkApiKey: apiKey } });
    if (!project) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid SDK API Key." },
        { status: 401, headers: corsHeaders }
      );
    }

    // ── Parse body ─────────────────────────────────────────────────────────
    let payload: Record<string, unknown>;
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Bad Request: Body must be valid JSON." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { message, stack, browserInfo, osInfo, severity: severityOverride, tags, source: customSource, metadata } = payload;

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Bad Request: 'message' is required and must be a string." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Truncate stack to prevent DB/AI bloat
    const truncatedStack = stack ? String(stack).substring(0, MAX_STACK_CHARS) : undefined;

    // ── AI Analysis ────────────────────────────────────────────────────────
    const techStack = project.techStack || [];
    const aiAnalysis = await analyzeIncident(
      { message, stack: truncatedStack, browserInfo, osInfo, tags, metadata },
      (customSource as IssueSource) || IssueSource.SDK,
      techStack
    );
    const aiAnalysisFailed = !!aiAnalysis._failed;

    // ── Severity ───────────────────────────────────────────────────────────
    let severity: IssueSeverity = aiAnalysis.severity;
    if (severityOverride && Object.values(IssueSeverity).includes(severityOverride as IssueSeverity)) {
      severity = severityOverride as IssueSeverity;
    }

    const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(
      project.id, severity, project.plan
    );

    // ── Create Issue ───────────────────────────────────────────────────────
    const issue = await prisma.issue.create({
      data: {
        title: aiAnalysis.title,
        description: aiAnalysis.description,
        rootCause: aiAnalysis.rootCause,
        suggestedFixes: aiAnalysis.suggestedFixes,
        priority: aiAnalysis.priority,
        environment: aiAnalysis.environment,
        projectId: project.id,
        source: (customSource as IssueSource) || IssueSource.SDK,
        severity,
        responseSlaDeadline,
        resolutionSlaDeadline,
        logs: {
          browser: (browserInfo ?? null) as Prisma.InputJsonValue,
          os: (osInfo ?? null) as Prisma.InputJsonValue,
          rawMessage: message,
          stackTrace: truncatedStack,
          tags: (tags ?? {}) as Prisma.InputJsonValue,
          metadata: (metadata ?? {}) as Prisma.InputJsonValue,
          aiAnalysisFailed,
          aiFullAnalysis: aiAnalysis as unknown as Prisma.InputJsonValue,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        issueId: issue.id,
        message: "Issue reported successfully.",
        ...(aiAnalysisFailed && {
          warning: "AI analysis failed; issue created with fallback data. Review manually.",
        }),
      },
      { status: 201, headers: corsHeaders }
    );
  } catch (error) {
    console.error("SDK Ingest API Error:", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Internal Server Error", detail },
      { status: 500, headers: corsHeaders }
    );
  }
}
