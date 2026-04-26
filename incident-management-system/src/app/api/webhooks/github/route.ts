import { NextResponse, after } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

import { IssueSource, Prisma, IssueSeverity } from "@prisma/client";

import { analyzeIncident } from "@/lib/ai-service";
import { calculateSLADeadlines } from "@/services/issue-service";
import { eventEmitter, EVENTS } from "@/lib/events";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-hub-signature-256");

    if (process.env.GITHUB_WEBHOOK_SECRET) {
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const expected = "sha256=" + crypto.createHmac("sha256", process.env.GITHUB_WEBHOOK_SECRET).update(rawBody).digest("hex");
      if (signature !== expected) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = req.headers.get("x-github-event");
    const installationId = payload.installation?.id?.toString();

    // Identify project by Installation ID (GitHub App Flow) OR Repo URL (Manual Flow)
    let project = null;

    if (installationId) {
      project = await prisma.project.findFirst({
        where: { githubInstallationId: installationId }
      });
    }

    if (!project) {
      const repoUrl = payload.repository?.html_url;
      if (repoUrl) {
        project = await prisma.project.findFirst({
          where: { githubRepoUrl: repoUrl }
        });
      }
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
                github_raw: data as any,
              } as Prisma.InputJsonValue,
            }
          });

          // Trigger real-time notification
          eventEmitter.emit(EVENTS.INCIDENT_CREATED, { 
            issueId: issue.id, 
            orgId: project.orgId,
            projectId: project.id,
            title: issue.title,
            severity: issue.severity
          });

          // Background AI Analysis
          after(async () => {
            try {
                const aiAnalysis = await analyzeIncident(data, IssueSource.GITHUB, techStack);
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
                            github_raw: data as any,
                            aiFullAnalysis: aiAnalysis as any,
                        } as Prisma.InputJsonValue
                    }
                });

                eventEmitter.emit(EVENTS.INCIDENT_UPDATED, { 
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
