import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { addComment } from "@/services/issue-service";
import { EVENTS, emitEvent } from "@/lib/events";
import { getActiveSessionUser, getAuthorizedIssue } from "@/lib/authorization";
import { logger } from "@/lib/logger";

export const POST = withAuth(async (_req, { decoded, body, params }) => {
  const { id } = await (params as { id: string });
  const { text } = body as { text: string };

  if (!text || !text.trim()) {
    return apiError("Comment text is required", 400);
  }

  try {
    const user = await getActiveSessionUser(decoded);
    if (!user) return apiError("Unauthorized", 401);
    const issue = await getAuthorizedIssue(id, user);
    if (!issue) return apiError("Issue not found", 404);

    const comment = await addComment(id, decoded.userId as string, text);

    // ── Emit Notification ───────────────────────────────────────────────
    await emitEvent(EVENTS.COMMENT_ADDED, {
      issueId: id,
      orgId: issue.project.orgId,
      projectId: issue.projectId,
      title: issue.title,
      userId: decoded.userId,
      text: text.substring(0, 50) + (text.length > 50 ? "..." : "")
    });

    return apiResponse("Comment added successfully", { comment }, 201);
  } catch (error) {
    logger.error({ err: error }, "Comment creation error");
    return apiError("Failed to add comment", 500);
  }
});
