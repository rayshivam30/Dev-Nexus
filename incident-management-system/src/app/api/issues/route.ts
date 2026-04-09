import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { createIssue } from "@/services/issue-service";
import { createIssueSchema } from "@/lib/validations";

export const POST = withAuth(async (req, { decoded, body }) => {
  const result = createIssueSchema.safeParse(body);

  if (!result.success) {
    return apiError(`Missing or invalid fields: ${JSON.stringify(result.error.flatten().fieldErrors)}`, 400);
  }

  const { title, description, severity, priority, environment, projectId, teamId, assignedToId } = result.data;

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
