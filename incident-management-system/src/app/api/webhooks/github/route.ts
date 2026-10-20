import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";
import { z } from "zod";
import { logger } from "@/lib/logger";

const githubWebhookPayloadSchema = z.object({
  action: z.string().optional(),
  installation: z.object({
    id: z.number()
  }).optional(),
  repository: z.object({
    html_url: z.string().url()
  }).optional(),
  workflow_run: z.object({
    name: z.string(),
    conclusion: z.string().nullable().optional(),
    html_url: z.string().url(),
  }).optional(),
  check_run: z.object({
    name: z.string(),
    conclusion: z.string().nullable().optional(),
    html_url: z.string().url(),
  }).optional(),
  check_suite: z.object({
    conclusion: z.string().nullable().optional(),
    html_url: z.string().url().optional(),
    check_runs_url: z.string().url().optional(),
  }).optional(),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    html_url: z.string().url(),
    mergeable_state: z.string().nullable().optional(),
  }).optional(),
}).passthrough();

import { IssueSource, Prisma, IssueSeverity } from "@devnexus/prisma-client";
import { EVENTS, emitEvent } from "@/lib/events";
import { notifyOrgStaff } from "@/services/notification-service";
import { sanitizeJsonValue } from "@/lib/sanitize";

const failedCiConclusions = new Set([
  "failure",
  "timed_out",
  "cancelled",
  "action_required",
]);

function isFailedCiConclusion(conclusion?: string | null) {
  return conclusion ? failedCiConclusions.has(conclusion) : false;
}

function normalizeGithubRepoUrl(repoUrl?: string | null) {
  if (!repoUrl) return null;

  try {
    const parsed = new URL(repoUrl);
    if (parsed.hostname.toLowerCase() !== "github.com") return repoUrl.trim();
    const pathParts = parsed.pathname
      .replace(/\.git$/i, "")
      .replace(/\/+$/, "")
      .split("/")
      .filter(Boolean)
      .slice(0, 2);

    if (pathParts.length < 2) return repoUrl.trim().replace(/\/+$/, "");
    return `https://github.com/${pathParts[0].toLowerCase()}/${pathParts[1].toLowerCase()}`;
  } catch {
    return repoUrl.trim().replace(/\/+$/, "");
  }
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    const isMock =
      process.env.NODE_ENV === "test" &&
      req.headers.get("x-mock-simulation") === "true";

    if (!isMock) {
      if (!webhookSecret) {
        logger.error("GITHUB_WEBHOOK_SECRET is not configured");
        return NextResponse.json(
          { error: "Webhook verification is unavailable" },
          { status: 503 }
        );
      }
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const expected =
        "sha256=" +
        crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      const signatureBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expected);
      if (
        signatureBuffer.length !== expectedBuffer.length ||
        !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
      ) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const deliveryId = req.headers.get("x-github-delivery") ||
      (isMock ? crypto.createHash("sha256").update(rawBody).digest("hex") : null);
    if (!deliveryId) {
      return NextResponse.json({ error: "Missing delivery identifier" }, { status: 400 });
    }

    let payload: unknown;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parseResult = githubWebhookPayloadSchema.safeParse(payload);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Invalid webhook payload structure", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const validatedPayload = parseResult.data;
    const event = req.headers.get("x-github-event");
    const installationId = validatedPayload.installation?.id?.toString();
    const repoUrl = validatedPayload.repository?.html_url;
    const normalizedRepoUrl = normalizeGithubRepoUrl(repoUrl);
    let project = null;

    if (installationId) {
      const installationProjects = await prisma.project.findMany({
        where: { githubInstallationId: installationId },
      });

      project =
        installationProjects.find(
          (candidate) =>
            normalizedRepoUrl &&
            normalizeGithubRepoUrl(candidate.githubRepoUrl) === normalizedRepoUrl
        ) ||
        installationProjects.find((candidate) => !candidate.githubRepoUrl) ||
        (installationProjects.length === 1 ? installationProjects[0] : null);
    }

    if (!project && repoUrl) {
      project = await prisma.project.findFirst({
        where: { githubRepoUrl: repoUrl }
      });
    }

    if (!project && normalizedRepoUrl) {
      const repoLinkedProjects = await prisma.project.findMany({
        where: { githubRepoUrl: { not: null } },
      });
      project =
        repoLinkedProjects.find(
          (candidate) => normalizeGithubRepoUrl(candidate.githubRepoUrl) === normalizedRepoUrl
        ) || null;
    }

    if (!project) {
      return NextResponse.json({ message: "Project not linked or installation unknown" }, { status: 200 });
    }

    // The unique delivery id makes GitHub redeliveries idempotent. The issue's
    // persisted AI job fields are picked up by the background worker.
    const handleGitHubIncident = async (data: Record<string, unknown>, title: string, description: string) => {
        let issue;
        try {
          issue = await prisma.$transaction(async (tx) => {
            const createdIssue = await tx.issue.create({
              data: {
              githubDeliveryId: deliveryId,
              title,
              description: "AI Analysis Pending...",
              projectId: project.id,
              source: IssueSource.GITHUB,
              severity: IssueSeverity.MEDIUM,
              logs: {
                github_raw: sanitizeJsonValue(data) as unknown as Prisma.InputJsonValue,
                githubRef: description,
                aiJobStatus: "PENDING",
                aiAttempts: 0,
              } as Prisma.InputJsonValue,
              }
            });
            await tx.job.create({ data: { type: "AI_ANALYZE", payload: { issueId: createdIssue.id } } });
            return createdIssue;
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
            return null;
          }
          throw error;
        }

          // ── Persistent Notification ──────────────────────────────────────────
          await notifyOrgStaff(project.orgId, {
            type: 'INCIDENT_CREATED',
            title: `New GitHub Incident: ${title}`,
            message: `A new incident has been reported from GitHub.`,
            link: `/dashboard/admin/issues/${issue.id}`,
            linkByRole: {
              ADMIN: `/dashboard/admin/issues/${issue.id}`,
              MANAGER: "/dashboard/manager/issues",
            },
            projectId: project.id,
          });

          // Trigger real-time notification (local + Redis)
          await emitEvent(EVENTS.INCIDENT_CREATED, { 
            issueId: issue.id, 
            orgId: project.orgId,
            projectId: project.id,
            title: issue.title,
            severity: issue.severity
          });

          return issue;
    };

    // 1. CI/CD Failures
    const workflowRun = validatedPayload.workflow_run;
    if (
      event === "workflow_run" &&
      validatedPayload.action === "completed" &&
      workflowRun &&
      isFailedCiConclusion(workflowRun.conclusion)
    ) {
      const createdIssue = await handleGitHubIncident(
          workflowRun,
          `CI Failure: ${workflowRun.name}`,
          workflowRun.html_url
      );
      return NextResponse.json({ created: !!createdIssue, duplicate: !createdIssue, type: "workflow_run_failure" });
    }

    const checkRun = validatedPayload.check_run;
    if (
      event === "check_run" &&
      validatedPayload.action === "completed" &&
      checkRun &&
      isFailedCiConclusion(checkRun.conclusion)
    ) {
      const createdIssue = await handleGitHubIncident(
          checkRun,
          `CI Failure: ${checkRun.name}`,
          checkRun.html_url
      );
      return NextResponse.json({ created: !!createdIssue, duplicate: !createdIssue, type: "check_run_failure" });
    }

    const checkSuite = validatedPayload.check_suite;
    if (
      event === "check_suite" &&
      validatedPayload.action === "completed" &&
      checkSuite &&
      isFailedCiConclusion(checkSuite.conclusion)
    ) {
      const checkSuiteUrl =
        checkSuite.html_url ||
        checkSuite.check_runs_url ||
        repoUrl ||
        "https://github.com";
      const createdIssue = await handleGitHubIncident(
          checkSuite,
          "CI Failure: Check suite failed",
          checkSuiteUrl
      );
      return NextResponse.json({ created: !!createdIssue, duplicate: !createdIssue, type: "check_suite_failure" });
    }

    // 2. PR Conflicts only — don't create an incident for every new PR
    if (event === "pull_request") {
      const pr = validatedPayload.pull_request;
      if (pr) {
        const isConflict = pr.mergeable_state === "dirty";

        if (isConflict) {
          const createdIssue = await handleGitHubIncident(
            pr,
            `MERGE CONFLICT: PR #${pr.number}`,
            pr.html_url
          );
          return NextResponse.json({ created: !!createdIssue, duplicate: !createdIssue, type: "pr_conflict" });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error) {
    logger.error({ err: error }, "GitHub Webhook Error");
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

