import { prisma } from "@/lib/db";
import { EnvironmentType, IssueStatus, IssueSeverity, PlanType, Prisma, IssuePriority } from "@devnexus/prisma-client";

export async function createIssue(data: {
  title: string;
  description: string;
  severity: IssueSeverity;
  priority?: IssuePriority;
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

  // Calculate SLA deadlines
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { plan: true }
  });

  const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines(
    projectId,
    severity,
    project?.plan || undefined
  );

  return await prisma.$transaction(async (tx) => {
    const issueData: Prisma.IssueCreateInput = {
      title,
      description,
      severity,
      priority: priority || "MEDIUM",
      environment: environment || "PRODUCTION",
      project: { connect: { id: projectId } },
      source: "MANUAL",
      status: "OPEN",
      responseSlaDeadline,
      resolutionSlaDeadline
    };

    if (teamId) issueData.team = { connect: { id: teamId } };

    if (assignedToId && (role === "MANAGER" || role === "ADMIN")) {
      issueData.assignedTo = { connect: { id: assignedToId } };
      issueData.status = "ASSIGNED";
      issueData.acceptedAt = new Date();
    }

    const issue = await tx.issue.create({ data: issueData });

    // Log creation activity within same transaction
    await tx.issueActivity.create({
      data: {
        issueId: issue.id,
        userId,
        action: `Issue created by ${role.toLowerCase()}${issue.status === "ASSIGNED" ? " and auto-assigned" : ""}`
      }
    });
    return issue;
  }, { maxWait: 15000, timeout: 15000 }); // Increased timeout for high concurrency
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

  return await prisma.$transaction(async (tx) => {
    const updateData: Prisma.IssueUpdateInput = {};
    if (status) updateData.status = status;
    if (teamId) updateData.team = { connect: { id: teamId } };
    if (assignedToId) updateData.assignedTo = { connect: { id: assignedToId } };
    if (rootCause) updateData.rootCause = rootCause;

    if (status === "RESOLVED") updateData.resolvedAt = new Date();
    if ((status === "ASSIGNED" || status === "IN_PROGRESS" || assignedToId) && !oldIssue.acceptedAt) {
      updateData.acceptedAt = new Date();
    }

    const updatedIssue = await tx.issue.update({
      where: { id },
      data: updateData,
      include: {
        team: { select: { name: true } },
        assignedTo: { select: { email: true } }
      }
    });

    // Log status change
    if (status && status !== oldIssue.status) {
      await tx.issueActivity.create({
        data: { issueId: id, userId, action: `Status changed from ${oldIssue.status} to ${status}` }
      });
    }

    // Log assignment
    if (assignedToId && assignedToId !== oldIssue.assignedToId) {
      await tx.issueActivity.create({
        data: { issueId: id, userId, action: `Assigned to developer` }
      });
    }

    return updatedIssue;
  }, { maxWait: 15000, timeout: 15000 }); // Increased timeout for high concurrency
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
  return await prisma.$transaction(async (tx) => {
    const comment = await tx.issueComment.create({
      data: { issueId, userId, text },
      include: { user: { select: { name: true, email: true } } }
    });
    await tx.issueActivity.create({
      data: { issueId, userId, action: "Comment added" }
    });
    return comment;
  });
}

export async function getIssueDetails(id: string) {
  return await prisma.issue.findUnique({
    where: { id },
    include: {
      project: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, email: true, name: true } },
      team: { select: { id: true, name: true } },
      activities: {
        take: 50,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "desc" }
      },
      comments: {
        take: 50,
        include: { user: { select: { name: true, email: true } } },
        orderBy: { createdAt: "asc" }
      }
    }
  });
}

export async function getIssuesByProject(projectId: string, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  
  const [issues, totalCount] = await Promise.all([
    prisma.issue.findMany({
      where: { projectId },
      include: {
        assignedTo: { select: { id: true, email: true } },
        team: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    }),
    prisma.issue.count({ where: { projectId } })
  ]);

  return {
    issues,
    pagination: {
      page,
      limit,
      totalCount,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
}

export async function calculateSLADeadlines(_projectId: string, severity: IssueSeverity, plan?: PlanType) {
  if (!plan || plan === "BASIC") {
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
