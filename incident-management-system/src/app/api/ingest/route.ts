import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { IssueSource, IssueSeverity } from "@prisma/client";
import { calculateSLADeadlines } from "@/services/issue-service";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing SDK API Key" }, { status: 401 });
    }

    const apiKey = authHeader.split(" ")[1];
    
    // Find project by SDK API Key
    const project = await prisma.project.findUnique({
      where: { sdkApiKey: apiKey }
    });

    if (!project) {
      return NextResponse.json({ error: "Unauthorized: Invalid SDK API Key" }, { status: 401 });
    }

    const payload = await req.json();
    const { message, stack, browserInfo, osInfo } = payload;

    if (!message) {
      return NextResponse.json({ error: "Bad Request: Error message is required" }, { status: 400 });
    }

    const severity = IssueSeverity.HIGH;
    const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(project.id, severity, project.plan);

    // Create Issue
    const issue = await prisma.issue.create({
      data: {
        title: `SDK Error: ${message.substring(0, 100)}`,
        description: `An unhandled exception was caught by the SDK.\n\nStack Trace:\n${stack || "Not provided"}`,
        projectId: project.id,
        source: IssueSource.SDK,
        severity,
        responseSlaDeadline,
        resolutionSlaDeadline,
        logs: {
          browser: browserInfo,
          os: osInfo,
          rawMessage: message,
          stackTrace: stack
        }
      }
    });

    return NextResponse.json({ success: true, issueId: issue.id }, { status: 201 });
  } catch (error) {
    console.error("SDK Ingest API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
