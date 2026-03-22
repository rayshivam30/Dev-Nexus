import { prisma } from "@/lib/db";
import { EnvironmentType, IssueStatus, IssueSeverity, PlanType } from "@prisma/client";

export async function createIssue(data: {
  title: string;
  description: string;
  severity: any;
  priority?: string;
  environment?: EnvironmentType;
  projectId: string;
  teamId?: string;
  assignedToId?: string;
  role: string;
  userId: string;
}) {
  const { 
    title, description, severity, priority, environment, 
    projectId, teamId, assignedToId, role, userId 
  } = data;

  // Calculate SLA deadlines if project is on ADVANCED plan
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { plan: true }
  });

  const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(projectId, severity, project?.plan);

  const issueData: any = {
    title,
    description,
    severity,
    priority: priority || "MEDIUM",
    environment: environment || "PRODUCTION",
    projectId,
    source: "MANUAL",
    status: "OPEN",
    responseSlaDeadline,
    resolutionSlaDeadline
  };

  if (teamId) issueData.teamId = teamId;

  if (assignedToId) {
    if (role === "MANAGER" || role === "ADMIN") {
      issueData.assignedToId = assignedToId;
      issueData.status = "ASSIGNED";
      issueData.acceptedAt = new Date();
    } else {
      issueData.logs = { suggestedAssigneeId: assignedToId };
    }
  }

  const issue = await prisma.issue.create({
    data: issueData,
  });

  // Log creation activity
  await logActivity(issue.id, userId, `Issue created by ${role.toLowerCase()}`);

  if (issue.status === "ASSIGNED") {
    await logActivity(issue.id, userId, `Issue automatically assigned during creation`);
  }

  return issue;
}

export async function updateIssue(id: string, data: {
  status?: IssueStatus;
  teamId?: string;
  assignedToId?: string;
  rootCause?: string;
  userId: string;
}) {
  const { status, teamId, assignedToId, rootCause, userId } = data;
  
  const oldIssue = await prisma.issue.findUnique({ where: { id } });
  if (!oldIssue) throw new Error("Issue not found");

  const updateData: any = {};
  if (status) updateData.status = status;
  if (teamId) updateData.teamId = teamId;
  if (assignedToId) updateData.assignedToId = assignedToId;
  if (rootCause) updateData.rootCause = rootCause;

  if (status === "RESOLVED") {
    updateData.resolvedAt = new Date();
  }

  if ((status === "ASSIGNED" || status === "IN_PROGRESS" || assignedToId) && !oldIssue.acceptedAt) {
    updateData.acceptedAt = new Date();
  }

  const updatedIssue = await prisma.issue.update({
    where: { id },
    data: updateData,
    include: {
      team: { select: { name: true } },
      assignedTo: { select: { email: true } }
    }
  });

  // Log status change
  if (status && status !== oldIssue.status) {
    await logActivity(id, userId, `Status changed from ${oldIssue.status} to ${status}`);
  }

  // Log assignment
  if (assignedToId && assignedToId !== oldIssue.assignedToId) {
    await logActivity(id, userId, `Assigned to developer`);
  }

  return updatedIssue;
}

export async function logActivity(issueId: string, userId: string | null, action: string) {
  return await prisma.issueActivity.create({
    data: {
      issueId,
      userId,
      action
    }
  });
}

export async function addComment(issueId: string, userId: string, text: string) {
  const comment = await prisma.issueComment.create({
    data: {
      issueId,
      userId,
      text
    },
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  // Also log that a comment was added
  await logActivity(issueId, userId, "Comment added");
  
  return comment;
}

export async function getIssueDetails(id: string) {
  return await prisma.issue.findUnique({
    where: { id },
    include: {
      assignedTo: { select: { id: true, email: true, name: true } },
      team: { select: { id: true, name: true } },
      activities: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      },
      comments: {
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function getIssuesByProject(projectId: string) {
  return await prisma.issue.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: { id: true, email: true }
      },
      team: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Helper to calculate SLA deadlines based on project plan and issue severity.
 * Rules (Applied only for ADVANCED plans):
 * - CRITICAL: 1h Response, 4h Resolution
 * - HIGH: 4h Response, 24h Resolution
 * - MEDIUM: 8h Response, 3 days Resolution
 * - LOW: 24h Response, 7 days Resolution
 */
export async function calculateSLADeadlines(projectId: string, severity: IssueSeverity, plan?: PlanType) {
  if (plan !== "ADVANCED") {
    return { responseSlaDeadline: null, resolutionSlaDeadline: null };
  }

  const now = new Date();
  let responseHours = 24;
  let resolutionHours = 24 * 7;

  switch (severity) {
    case "CRITICAL":
      responseHours = 1;
      resolutionHours = 4;
      break;
    case "HIGH":
      responseHours = 4;
      resolutionHours = 24;
      break;
    case "MEDIUM":
      responseHours = 8;
      resolutionHours = 24 * 3;
      break;
    case "LOW":
      responseHours = 24;
      resolutionHours = 24 * 7;
      break;
  }

  const responseSlaDeadline = new Date(now.getTime() + responseHours * 60 * 60 * 1000);
  const resolutionSlaDeadline = new Date(now.getTime() + resolutionHours * 60 * 60 * 1000);

  return { responseSlaDeadline, resolutionSlaDeadline };
}
