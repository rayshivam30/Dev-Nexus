import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { IssueSource, IssueSeverity } from "@prisma/client";

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

    // 1. CI/CD Failures (workflow_run)
    if (event === "workflow_run" && payload.action === "completed" && payload.workflow_run?.conclusion === "failure") {
      await prisma.issue.create({
        data: {
          title: `CI/CD Failure: ${payload.workflow_run.name}`,
          description: `Workflow run failed for branch ${payload.workflow_run.head_branch}. View details: ${payload.workflow_run.html_url}`,
          projectId: project.id,
          source: IssueSource.GITHUB,
          severity: IssueSeverity.HIGH,
          logs: payload.workflow_run,
        }
      });
      return NextResponse.json({ created: true, type: "workflow_run_failure" });
    }

    // 2. Merge Conflicts (pull_request)
    if (event === "pull_request" && payload.pull_request) {
      // Note: GitHub Webhooks might not instantly report 'dirty' mergeable_state upon open.
      // But if it is dirty, we can flag it.
      if (payload.pull_request.mergeable_state === "dirty") {
        await prisma.issue.create({
          data: {
            title: `Merge Conflict in PR #${payload.pull_request.number}`,
            description: `PR "${payload.pull_request.title}" has merge conflicts. Please resolve them. View PR: ${payload.pull_request.html_url}`,
            projectId: project.id,
            source: IssueSource.GITHUB,
            severity: IssueSeverity.MEDIUM,
            logs: payload.pull_request,
          }
        });
        return NextResponse.json({ created: true, type: "pull_request_conflict" });
      }
    }

    return NextResponse.json({ success: true, message: "Event ignored" });
  } catch (error) {
    console.error("GitHub Webhook Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
