import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { IssueSource, IssueSeverity, Prisma } from "@prisma/client";
import { calculateSLADeadlines } from "@/services/issue-service";
import { analyzeIncident } from "@/lib/ai-service";

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized: Missing SDK API Key" }, { status: 401, headers: corsHeaders });
    }

    const apiKey = authHeader.split(" ")[1];
    
    // Find project by SDK API Key
    const project = await prisma.project.findUnique({
      where: { sdkApiKey: apiKey }
    });

    if (!project) {
      return NextResponse.json({ error: "Unauthorized: Invalid SDK API Key" }, { status: 401, headers: corsHeaders });
    }

    const payload = await req.json();
    const { 
      message, 
      stack, 
      browserInfo, 
      osInfo, 
      severity: severityOverride, 
      tags,
      source: customSource,
      metadata
    } = payload;

    if (!message) {
      return NextResponse.json({ error: "Bad Request: Error message is required" }, { status: 400, headers: corsHeaders });
    }

    // Determine tech stack if available from project
    const techStack = project.techStack || [];

    // Use AI to analyze the incident
    const aiAnalysis = await analyzeIncident(
      { message, stack, browserInfo, osInfo, tags, metadata },
      (customSource as IssueSource) || IssueSource.SDK,
      techStack
    );

    // Determine severity (allow override from SDK, else use AI suggested)
    let severity: IssueSeverity = aiAnalysis.severity;
    if (severityOverride && Object.values(IssueSeverity).includes(severityOverride as IssueSeverity)) {
      severity = severityOverride as IssueSeverity;
    }

    const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(project.id, severity, project.plan);

    // Create Issue
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
          browser: browserInfo,
          os: osInfo,
          rawMessage: message,
          stackTrace: stack,
          tags: tags || {},
          metadata: metadata || {},
          aiFullAnalysis: aiAnalysis as unknown as Prisma.InputJsonValue
        }
      }
    });



    return NextResponse.json({ 
      success: true, 
      issueId: issue.id,
      message: "Issue reported successfully" 
    }, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("SDK Ingest API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: corsHeaders });
  }
}
