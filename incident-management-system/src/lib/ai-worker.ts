import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { analyzeIncident } from "@/lib/ai-service";
import { calculateSLADeadlines } from "@/services/issue-service";
import { EVENTS, emitEvent } from "@/lib/events";
import { IssueSource, IssueSeverity, Prisma } from "@devnexus/prisma-client";
import { redis } from "@/lib/redis";

const POLL_INTERVAL_MS = process.env.NODE_ENV === "test" ? 250 : 5_000;
const CLAIM_TIMEOUT_MS = 5 * 60_000;
const MAX_ATTEMPTS = 5;
const MIN_AI_INTERVAL_MS = 4_500;
const MAX_AI_REQUESTS_PER_MINUTE = 15;
const GLOBAL_AI_SPACING_MS = 4_500;

let timer: ReturnType<typeof setInterval> | undefined;
let processing = false;
let lastAiCallAt = 0;

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as JsonRecord
    : {};
}

function asJson(value: JsonRecord): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

async function acquireGlobalAiSlot() {
  if (!redis) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Redis is required for production AI rate limiting");
    }
    return;
  }

  while (true) {
    const result = await redis.set(
      "ai:global-call-slot",
      String(Date.now()),
      { nx: true, px: GLOBAL_AI_SPACING_MS },
    );
    if (result === "OK") return;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
}

async function processOneJob() {
  if (processing) return;
  processing = true;
  let claimedIssueId: string | null = null;
  let claimedJobId: string | null = null;
  try {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
    const candidates = await prisma.job.findMany({
      where: {
        type: "AI_ANALYZE",
        runAfter: { lte: now },
        OR: [
          { status: "PENDING" },
          { status: "PROCESSING", lockedAt: { lt: staleBefore } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    let issue: Prisma.IssueGetPayload<{ include: { project: true } }> | null = null;
    let claimedJob: (typeof candidates)[number] | null = null;
    for (const candidate of candidates) {
      const issueId = asRecord(candidate.payload).issueId;
      if (typeof issueId !== "string") {
        await prisma.job.update({ where: { id: candidate.id }, data: { status: "FAILED", lastError: "Missing issueId in AI job payload" } });
        continue;
      }
      const foundIssue = await prisma.issue.findUnique({ where: { id: issueId }, include: { project: true } });
      if (!foundIssue) {
        await prisma.job.update({ where: { id: candidate.id }, data: { status: "FAILED", lastError: "Issue no longer exists" } });
        continue;
      }
      const claim = await prisma.job.updateMany({
        where: { id: candidate.id, status: candidate.status, updatedAt: candidate.updatedAt },
        data: { status: "PROCESSING", lockedAt: now, lockedBy: String(process.pid), attempts: { increment: 1 } },
      });
      if (claim.count === 1) {
        claimedJob = candidate;
        claimedJobId = candidate.id;
        issue = foundIssue;
        break;
      }
    }
    if (!issue || !claimedJob) return;

    const logs = asRecord(issue.logs);
    const attempts = claimedJob.attempts + 1;
    const claimedLogs = { ...logs, aiJobStatus: "PROCESSING", aiAttempts: attempts, aiNextAttemptAt: null };
    claimedIssueId = issue.id;
    await prisma.issue.update({ where: { id: issue.id }, data: { logs: asJson(claimedLogs) } });

    if (attempts > MAX_ATTEMPTS) {
      await prisma.issue.update({
        where: { id: issue.id },
        data: {
          description: "AI analysis failed after repeated attempts. Please review the raw incident data.",
          logs: asJson({ ...claimedLogs, aiJobStatus: "FAILED", aiAnalysisFailed: true }),
        },
      });
      await prisma.job.update({ where: { id: claimedJob.id }, data: { status: "FAILED", lockedAt: null, lockedBy: null, lastError: "Maximum AI attempts exceeded" } });
      return;
    }

    const elapsed = Date.now() - lastAiCallAt;
    if (lastAiCallAt && elapsed < MIN_AI_INTERVAL_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_AI_INTERVAL_MS - elapsed));
    }
    await acquireGlobalAiSlot();
    if (redis) {
      const minuteKey = `ai:requests:${Math.floor(Date.now() / 60_000)}`;
      const requestCount = await redis.incr(minuteKey);
      if (requestCount === 1) await redis.expire(minuteKey, 70);
      if (requestCount > MAX_AI_REQUESTS_PER_MINUTE) {
        throw new Error("Global AI requests-per-minute limit reached");
      }
    }
    lastAiCallAt = Date.now();

    const source = issue.source as IssueSource;
    const aiInput = source === IssueSource.GITHUB
      ? asRecord(logs.github_raw)
      : {
          message: logs.rawMessage,
          stack: logs.stackTrace,
          browserInfo: logs.browser,
          osInfo: logs.os,
          tags: logs.tags,
          metadata: logs.metadata,
          breadcrumbs: logs.breadcrumbs,
          history: {
            last24hCount: Number(logs.occurrenceCount24h || 1),
            isFirstOccurrence: Number(logs.occurrenceCount24h || 1) <= 1,
          },
        };

    const analysis = await analyzeIncident(aiInput, source, issue.project.techStack || []);
    if (analysis._failed) throw new Error("AI provider returned a fallback analysis");

    const severityOverride = logs.severityOverride as IssueSeverity | undefined;
    const finalSeverity = severityOverride || analysis.severity;
    const slaDeadlines = issue.responseSlaDeadline && issue.resolutionSlaDeadline
      ? { responseSlaDeadline: issue.responseSlaDeadline, resolutionSlaDeadline: issue.resolutionSlaDeadline }
      : await calculateSLADeadlines(issue.projectId, finalSeverity, issue.project.plan);
    const latestIssue = await prisma.issue.findUnique({ where: { id: issue.id }, select: { logs: true } });
    const updatedLogs = {
      ...claimedLogs,
      ...asRecord(latestIssue?.logs),
      aiJobStatus: "COMPLETE",
      aiAnalysisFailed: false,
      aiFullAnalysis: analysis as unknown as Prisma.InputJsonValue,
    };
    const updated = await prisma.issue.update({
      where: { id: issue.id },
      data: {
        title: analysis.title,
        description: source === IssueSource.GITHUB && typeof logs.githubRef === "string"
          ? `${analysis.description}\n\n[GitHub Ref](${logs.githubRef})`
          : analysis.description,
        rootCause: analysis.rootCause,
        suggestedFixes: analysis.suggestedFixes,
        priority: analysis.priority,
        environment: analysis.environment,
        severity: finalSeverity,
        ...slaDeadlines,
        logs: asJson(updatedLogs),
      },
    });
    await prisma.job.update({ where: { id: claimedJob.id }, data: { status: "COMPLETE", lockedAt: null, lockedBy: null, lastError: null } });
    await emitEvent(EVENTS.INCIDENT_UPDATED, {
      issueId: updated.id,
      orgId: issue.project.orgId,
      projectId: issue.projectId,
      title: updated.title,
      severity: updated.severity,
      status: updated.status,
    });
  } catch (error) {
    logger.error({ err: error }, "Durable AI job failed");
    // The next poll recovers PROCESSING rows after the claim lease expires.
    // Provider and transient failures are returned to PENDING with backoff.
    try {
      const issue = claimedIssueId
        ? await prisma.issue.findUnique({ where: { id: claimedIssueId } })
        : null;
      if (issue) {
        const logs = asRecord(issue.logs);
        if (logs.aiJobStatus !== "PROCESSING") return;
        const attempts = Number(logs.aiAttempts || 1);
        if (attempts >= MAX_ATTEMPTS) {
          await prisma.issue.update({
            where: { id: issue.id },
            data: {
              description: "AI analysis failed after repeated attempts. Please review the raw incident data.",
              logs: asJson({ ...logs, aiJobStatus: "FAILED", aiAnalysisFailed: true }),
            },
          });
          if (claimedJobId) await prisma.job.update({ where: { id: claimedJobId }, data: { status: "FAILED", lockedAt: null, lockedBy: null, lastError: "AI analysis failed after repeated attempts" } });
        } else {
          const backoffMs = Math.min(60_000 * 2 ** (attempts - 1), 15 * 60_000);
          await prisma.issue.update({
            where: { id: issue.id },
            data: {
              logs: asJson({
                ...logs,
                aiJobStatus: "PENDING",
                aiNextAttemptAt: new Date(Date.now() + backoffMs).toISOString(),
                aiLastError: "AI analysis attempt failed",
              }),
            },
          });
          if (claimedJobId) await prisma.job.update({
            where: { id: claimedJobId },
            data: { status: "PENDING", runAfter: new Date(Date.now() + backoffMs), lockedAt: null, lockedBy: null, lastError: "AI analysis attempt failed" },
          });
        }
      }
    } catch (recoveryError) {
      logger.error({ err: recoveryError }, "Could not persist AI retry state");
    }
  } finally {
    processing = false;
  }
}

export function startAiWorker() {
  if (timer || process.env.NEXT_RUNTIME === "edge") return;
  timer = setInterval(() => void processOneJob(), POLL_INTERVAL_MS);
  timer.unref();
  void processOneJob();
  logger.info("Durable AI analysis worker started");
}
