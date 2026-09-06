import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { updateIssue, getIssueDetails } from "@/services/issue-service";
import { IssueStatus } from "@devnexus/prisma-client";
import { updateIssueSchema } from "@/lib/validations";
import { EVENTS, emitEvent } from "@/lib/events";
import { createNotification } from "@/services/notification-service";
import { getActiveSessionUser, getAuthorizedIssue } from "@/lib/authorization";
import { logger } from "@/lib/logger";

export const GET = withAuth(async (_req, { decoded, params }) => {
  const { id } = await (params as { id: string });
  try {
    const user = await getActiveSessionUser(decoded);
    if (!user) return apiError("Unauthorized", 401);
    const authorizedIssue = await getAuthorizedIssue(id, user);
    if (!authorizedIssue) return apiError("Issue not found", 404);

    const issue = await getIssueDetails(id);
    if (!issue) return apiError("Issue not found", 404);
    return apiResponse("Success", { issue });
  } catch {
    return apiError("Failed to fetch issue details", 500);
  }
});

export const PATCH = withAuth(async (_req, { decoded, body, params }) => {
  const { id } = await (params as { id: string });
  
  const result = updateIssueSchema.safeParse(body);
  if (!result.success) {
    return apiError(`Invalid fields: ${JSON.stringify(result.error.flatten().fieldErrors)}`, 400);
  }

  const { status, teamId, assignedToId, rootCause } = result.data;
  try {
    const user = await getActiveSessionUser(decoded);
    if (!user) return apiError("Unauthorized", 401);
    const existingIssue = await getAuthorizedIssue(id, user);
    if (!existingIssue) return apiError("Issue not found", 404);

    if (teamId) {
      const team = await prisma.team.findFirst({
        where: { id: teamId, projectId: existingIssue.projectId },
        select: { id: true },
      });
      if (!team) return apiError("Team does not belong to this issue's project", 400);
    }

    if (assignedToId) {
      const developer = await prisma.user.findFirst({
        where: {
          id: assignedToId,
          role: "DEVELOPER",
          status: "ACTIVE",
          orgId: existingIssue.project.orgId,
          team: { projectId: existingIssue.projectId },
        },
        select: { id: true },
      });
      if (!developer) {
        return apiError("Assignee does not belong to this issue's project", 400);
      }
    }

    // Permission Logic
    const updateData: {
      userId: string;
      status?: IssueStatus;
      teamId?: string;
      assignedToId?: string;
      rootCause?: string;
    } = { userId: decoded.userId as string };
    
    if (user.role === "DEVELOPER") {
      if (status) {
        if (!["IN_PROGRESS", "RESOLVED"].includes(status)) {
          return apiError("Invalid status transition for developer", 400);
        }
        updateData.status = status as IssueStatus;
      }
      if (rootCause) updateData.rootCause = rootCause;
    } else {
      // MANAGER or ADMIN
      if (status) updateData.status = status as IssueStatus;
      if (teamId !== undefined) updateData.teamId = teamId;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
      if (rootCause) updateData.rootCause = rootCause;
    }

    const issue = await updateIssue(id, updateData);

    // ── Emit Notifications ───────────────────────────────────────────────
    const orgId = existingIssue.project.orgId;
    
    if (assignedToId && assignedToId !== existingIssue.assignedToId) {
       await createNotification({
         userId: assignedToId,
         type: "ASSIGNMENT",
         title: `Assigned: ${issue.title}`,
         message: "An incident has been assigned to you.",
         link: `/dashboard/developer/issues/${issue.id}`,
       });

       await emitEvent(EVENTS.INCIDENT_ASSIGNED, {
         issueId: issue.id,
         orgId,
         projectId: issue.projectId,
         title: issue.title,
         assignedToId
       });
    } else {
       await emitEvent(EVENTS.INCIDENT_UPDATED, {
         issueId: issue.id,
         orgId,
         projectId: issue.projectId,
         title: issue.title,
         status: issue.status,
         severity: issue.severity
       });
    }

    return apiResponse("Issue updated successfully", { issue });
  } catch (error) {
    logger.error({ err: error }, "Issue update error");
    const message = error instanceof Error ? error.message : "Failed to update issue";
    return apiError(message, 500);
  }
});
