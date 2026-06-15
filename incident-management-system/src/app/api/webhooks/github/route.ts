import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

import { IssueSource, Prisma, IssueSeverity } from "@devnexus/prisma-client";

import { analyzeIncident } from "@/lib/ai-service";
import { enqueueAITask } from "@/lib/ai-queue";
import { calculateSLADeadlines } from "@/services/issue-service";
import { EVENTS, emitEvent } from "@/lib/events";
import { notifyOrgStaff } from "@/services/notification-service";

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
        console.error("GITHUB_WEBHOOK_SECRET is not configured");
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

    const payload = JSON.parse(rawBody);
    const event = req.headers.get("x-github-event");
    const installationId = payload.installation?.id?.toString();
    const repoUrl = payload.repository?.html_url;
    let project = null;

    if (installationId && repoUrl) {
      // 1. Try to find project matching BOTH installation ID and specific repository URL
      project = await prisma.project.findFirst({
        where: { 
          githubInstallationId: installationId,
          githubRepoUrl: repoUrl
        }
      });
    }

    if (!project && installationId) {
      // 2. Fallback: Find a project that has the installation ID but no specific repository URL linked yet
      project = await prisma.project.findFirst({
        where: { 
          githubInstallationId: installationId,
          OR: [
            { githubRepoUrl: null },
            { githubRepoUrl: "" }
          ]
        }
      });
    }

    if (!project && repoUrl) {
      // 3. Fallback: Find project matching the repository URL (Manual Flow)
      project = await prisma.project.findFirst({
        where: { githubRepoUrl: repoUrl }
      });
    }

    if (!project) {
      return NextResponse.json({ message: "Project not linked or installation unknown" }, { status: 200 });
    }

    const techStack = project.techStack || [];

    // Helper function to create initial issue and trigger AI analysis
    const handleGitHubIncident = async (data: Record<string, unknown>, title: string, description: string) => {
        const issue = await prisma.issue.create({
            data: {
              title,
              description: "AI Analysis Pending...",
              projectId: project.id,
              source: IssueSource.GITHUB,
              severity: IssueSeverity.MEDIUM,
              logs: {
                github_raw: data as unknown as Prisma.InputJsonValue,
              } as Prisma.InputJsonValue,
            }
          });

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

          // Background AI Analysis — routed through the concurrency-limited queue
          after(async () => {
            try {
                const aiAnalysis = await enqueueAITask(() =>
                  analyzeIncident(data, IssueSource.GITHUB, techStack)
                );
                const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(project.id, aiAnalysis.severity, project.plan);

                const updated = await prisma.issue.update({
                    where: { id: issue.id },
                    data: {
                        title: aiAnalysis.title,
                        description: `${aiAnalysis.description}\n\n[GitHub Ref](${description})`,
                        rootCause: aiAnalysis.rootCause,
                        suggestedFixes: aiAnalysis.suggestedFixes,
                        priority: aiAnalysis.priority,
                        environment: aiAnalysis.environment,
                        severity: aiAnalysis.severity,
                        responseSlaDeadline,
                        resolutionSlaDeadline,
                        logs: {
                            github_raw: data as unknown as Prisma.InputJsonValue,
                            aiFullAnalysis: aiAnalysis as unknown as Prisma.InputJsonValue,
                        } as Prisma.InputJsonValue
                    }
                });

                await emitEvent(EVENTS.INCIDENT_UPDATED, { 
                    issueId: updated.id, 
                    orgId: project.orgId,
                    projectId: project.id,
                    title: updated.title,
                    severity: updated.severity,
                    status: updated.status
                });
            } catch (e) {
                console.error("GitHub AI analysis background error:", e);
            }
          });

          return issue;
    };

    // 1. CI/CD Failures
    if (event === "workflow_run" && payload.action === "completed" && payload.workflow_run?.conclusion === "failure") {
      await handleGitHubIncident(
          payload.workflow_run, 
          `CI Failure: ${payload.workflow_run.name}`, 
          payload.workflow_run.html_url
      );
      return NextResponse.json({ created: true, type: "workflow_run_failure" });
    }

    // 2. PR Conflicts & Auto-detection
    if (event === "pull_request") {
      const pr = payload.pull_request;
      const isConflict = pr.mergeable_state === "dirty";
      
      if (isConflict) {
          await handleGitHubIncident(
              pr, 
              `MERGE CONFLICT: PR #${pr.number}`, 
              pr.html_url
          );
          return NextResponse.json({ created: true, type: "pr_conflict" });
      }

      if (payload.action === "opened") {
          await handleGitHubIncident(
              pr, 
              `New PR: ${pr.title}`, 
              pr.html_url
          );
          return NextResponse.json({ created: true, type: "pr_opened" });
      }
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error) {
    console.error("GitHub Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
