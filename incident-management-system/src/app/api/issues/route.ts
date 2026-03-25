import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createIssue } from "@/services/issue-service";
import { IssueSeverity, EnvironmentType } from "@prisma/client";

export const POST = withAuth(async (req, { decoded, body }) => {
  const { title, description, severity, priority, environment, projectId, teamId, assignedToId } = body as {
    title?: string;
    description?: string;
    severity?: IssueSeverity;
    priority?: string;
    environment?: EnvironmentType;
    projectId?: string;
    teamId?: string;
    assignedToId?: string;
  };

  if (!title || !description || !severity || !projectId) {
    return apiError("Title, description, severity, and projectId are required", 400);
  }

  // Validation
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

    return apiResponse("Issue created successfully", { issue }, 201);
  } catch (error) {
    console.error("Issue creation error:", error);
    return apiError("Failed to create issue", 500);
  }
});
