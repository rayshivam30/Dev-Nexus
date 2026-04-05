import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

import { IssueSource, Prisma } from "@prisma/client";

import { analyzeIncident } from "@/lib/ai-service";
import { calculateSLADeadlines } from "@/services/issue-service";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const event = req.headers.get("x-github-event");

    // Identify project by the githubRepoUrl
    const repoUrl = payload.repository?.html_url;
    if (!repoUrl) return NextResponse.json({ message: "No repository in payload or unsupported event" }, { status: 200 });

    const project = await prisma.project.findFirst({
      where: { githubRepoUrl: repoUrl }
    });

    if (!project) {
      return NextResponse.json({ message: "Project not linked to this repo" }, { status: 404 });
    }

    const techStack = project.techStack || [];

    // 1. CI/CD Failures (workflow_run)
    if (event === "workflow_run" && payload.action === "completed" && payload.workflow_run?.conclusion === "failure") {
      const aiAnalysis = await analyzeIncident(payload.workflow_run, IssueSource.GITHUB, techStack);
      
      const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(project.id, aiAnalysis.severity, project.plan);

      await prisma.issue.create({
        data: {
          title: aiAnalysis.title,
          description: `${aiAnalysis.description}\n\n[View GitHub Workflow](${payload.workflow_run.html_url})`,
          rootCause: aiAnalysis.rootCause,
          suggestedFixes: aiAnalysis.suggestedFixes,
          priority: aiAnalysis.priority,
          environment: aiAnalysis.environment,
          projectId: project.id,
          source: IssueSource.GITHUB,


          severity: aiAnalysis.severity,
          responseSlaDeadline,
          resolutionSlaDeadline,
          logs: {
            workflow_run: payload.workflow_run,
            aiFullAnalysis: aiAnalysis as unknown as Prisma.InputJsonValue,
          },
        }
      });
      return NextResponse.json({ created: true, type: "workflow_run_failure", aiAnalyzed: true });
    }

    // 2. Merge Conflicts (pull_request)
    if (event === "pull_request" && payload.pull_request) {
      if (payload.pull_request.mergeable_state === "dirty" || payload.action === "opened") {
        // Only create issue if it's dirty or we want to analyze a new PR
        if (payload.pull_request.mergeable_state !== "dirty" && payload.action !== "opened") {
           return NextResponse.json({ success: true, message: "PR event ignored" });
        }

        const aiAnalysis = await analyzeIncident(payload.pull_request, IssueSource.GITHUB, techStack);
        
        const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(project.id, aiAnalysis.severity, project.plan);

        await prisma.issue.create({
          data: {
            title: aiAnalysis.title,
            description: `${aiAnalysis.description}\n\n[View PR](${payload.pull_request.html_url})`,
            rootCause: aiAnalysis.rootCause,
            suggestedFixes: aiAnalysis.suggestedFixes,
            priority: aiAnalysis.priority,
            environment: aiAnalysis.environment,
            projectId: project.id,
            source: IssueSource.GITHUB,
            severity: aiAnalysis.severity,
            responseSlaDeadline,
            resolutionSlaDeadline,
            logs: {
              pull_request: payload.pull_request,
              aiFullAnalysis: aiAnalysis as unknown as Prisma.InputJsonValue,
            },
          }
        });
        return NextResponse.json({ created: true, type: "pull_request_event", aiAnalyzed: true });
      }
    }


    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error) {
    console.error("GitHub Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
