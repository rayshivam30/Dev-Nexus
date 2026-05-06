import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createIssue } from "@/services/issue-service";
import { createIssueSchema } from "@/lib/validations";
import { createNotification } from "@/services/notification-service";

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
    include: { team: true }
  });

  if (!user) {
    return apiError("User session not found", 401);
  }

  // Cross-tenant validation (Admins, Managers, and Developers are isolated to their own organization's projects)
  if (project.orgId !== user.orgId) {
    return apiError("Access Denied: Project does not belong to your organization", 403);
  }

  if (user.role === "MANAGER") {
    if (user.projectId !== projectId) {
      return apiError("Access Denied: Managers can only create issues for their assigned project", 403);
    }
  } else if (user.role === "DEVELOPER") {
    if (!user.teamId || !user.team) {
      return apiError("Access Denied: Developers must be assigned to a team to create issues", 403);
    }
    if (user.team.projectId !== projectId) {
      return apiError("Access Denied: Developers can only create issues for their assigned team's project", 403);
    }
  }

  if (teamId) {
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) return apiError("Invalid team", 400);
    if (team.projectId !== projectId) {
      return apiError("Team does not belong to the selected project", 400);
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
    console.error("Issue creation error:", error);
    return apiError("Failed to create issue", 500);
  }
});
