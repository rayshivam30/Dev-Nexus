import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createIssue } from "@/services/issue-service";
import { createIssueSchema } from "@/lib/validations";
import { createNotification } from "@/services/notification-service";
import { logger } from "@/lib/logger";
import { hasProjectMembership, hasTeamMembership } from "@/services/membership-service";

export const POST = withAuth(async (req, { decoded, body }) => {
  const result = createIssueSchema.safeParse(body);

  if (!result.success) {
    return apiError(`Missing or invalid fields: ${JSON.stringify(result.error.flatten().fieldErrors)}`, 400);
  }

  const { title, description, severity, priority, environment, projectId, teamId, assignedToId } = result.data;

  // Validation of Project existence and Role-Based Access Controls (RBAC)
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) {
    return apiError("Project not found", 404);
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    return apiError("User session not found", 401);
  }

  // Cross-tenant validation (Admins, Managers, and Developers are isolated to their own organization's projects)
  if (project.orgId !== user.orgId) {
    return apiError("Access Denied: Project does not belong to your organization", 403);
  }

  if (user.role === "MANAGER") {
    if (!(await hasProjectMembership(user.id, projectId, ["MANAGER"]))) {
      return apiError("Access Denied: Managers can only create issues for their assigned project", 403);
    }
  } else if (user.role === "DEVELOPER") {
    const memberOnProject = await prisma.teamMembership.findFirst({
      where: { userId: user.id, role: "DEVELOPER", team: { projectId } },
      select: { id: true },
    });
    if (!memberOnProject) {
      return apiError("Access Denied: Developers can only create issues for their assigned team's project", 403);
    }
  }

  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return apiError("Invalid team", 400);
    if (team.projectId !== projectId) {
      return apiError("Team does not belong to the selected project", 400);
    }
    if (user.role === "MANAGER" && !(await hasProjectMembership(user.id, projectId, ["MANAGER"]))) return apiError("Access denied", 403);
    if (user.role === "DEVELOPER" && !(await hasTeamMembership(user.id, teamId, ["DEVELOPER"]))) return apiError("Access denied: you are not a member of that team", 403);
  }

  if (assignedToId) {
    if (user.role === "DEVELOPER") {
      return apiError("Developers cannot assign issues", 403);
    }
    const assignee = await prisma.user.findFirst({
      where: {
        id: assignedToId,
        role: "DEVELOPER",
        status: "ACTIVE",
        orgId: user.orgId,
        teamMemberships: {
          some: {
            role: "DEVELOPER",
            ...(teamId ? { teamId } : {}),
            team: { projectId },
          },
        },
      },
      select: { id: true },
    });
    if (!assignee) {
      return apiError("Assignee does not belong to the selected project", 400);
    }
  }

  try {
    const issue = await createIssue({
      title,
      description,
      severity,
      priority,
      environment,
      projectId,
      teamId,
      assignedToId,
      role: decoded.role as string,
      userId: decoded.userId as string
    });

    if (issue.assignedToId) {
      await createNotification({
        userId: issue.assignedToId,
        type: "ASSIGNMENT",
        title: `Assigned: ${issue.title}`,
        message: "A newly created incident has been assigned to you.",
        link: `/dashboard/developer/issues/${issue.id}`,
      });
    }

    return apiResponse("Issue created successfully", { issue }, 201);
  } catch (error) {
    logger.error({ err: error }, "Issue creation error");
    return apiError("Failed to create issue", 500);
  }
});
