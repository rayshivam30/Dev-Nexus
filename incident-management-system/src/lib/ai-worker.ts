import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { analyzeIncident } from "@/lib/ai-service";
import { calculateSLADeadlines } from "@/services/issue-service";
import { EVENTS, emitEvent } from "@/lib/events";
import { IssueSource, IssueSeverity, Prisma } from "@devnexus/prisma-client";
import { redis } from "@/lib/redis";

const POLL_INTERVAL_MS = 5_000;
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
  try {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
    const candidates = await prisma.issue.findMany({
      where: {
        deletedAt: null,
        OR: [
          { logs: { path: ["aiJobStatus"], equals: "PENDING" } },
          {
            logs: { path: ["aiJobStatus"], equals: "PROCESSING" },
            updatedAt: { lt: staleBefore },
          },
        ],
      },
      include: { project: true },
      orderBy: { createdAt: "asc" },
      take: 50,
    });

    const issue = candidates.find((candidate) => {
      const logs = asRecord(candidate.logs);
      return !logs.aiNextAttemptAt || new Date(String(logs.aiNextAttemptAt)).getTime() <= now.getTime();
    });
    if (!issue) return;

    const logs = asRecord(issue.logs);
    const status = String(logs.aiJobStatus || "PENDING");
    const attempts = Number(logs.aiAttempts || 0) + 1;
    const claimedLogs = { ...logs, aiJobStatus: "PROCESSING", aiAttempts: attempts, aiNextAttemptAt: null };
    const claim = await prisma.issue.updateMany({
      where: {
        id: issue.id,
        updatedAt: issue.updatedAt,
        logs: { path: ["aiJobStatus"], equals: status },
      },
      data: { logs: asJson(claimedLogs) },
    });
    if (claim.count !== 1) return;
    claimedIssueId = issue.id;

    if (attempts > MAX_ATTEMPTS) {
      await prisma.issue.update({
        where: { id: issue.id },
        data: {
          description: "AI analysis failed after repeated attempts. Please review the raw incident data.",
          logs: asJson({ ...claimedLogs, aiJobStatus: "FAILED", aiAnalysisFailed: true }),
        },
      });
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
    const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(
      issue.projectId,
      finalSeverity,
      issue.project.plan,
    );
    const updatedLogs = {
      ...claimedLogs,
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
        responseSlaDeadline,
        resolutionSlaDeadline,
        logs: asJson(updatedLogs),
      },
    });
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
