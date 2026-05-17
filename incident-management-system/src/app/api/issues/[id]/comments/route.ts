import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { addComment } from "@/services/issue-service";
import { EVENTS, emitEvent } from "@/lib/events";

export const POST = withAuth(async (_req, { decoded, body, params }) => {
  const { id } = await (params as { id: string });
  const { text } = body as { text: string };

  if (!text || !text.trim()) {
    return apiError("Comment text is required", 400);
  }

  try {
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { project: { select: { orgId: true } } }
    });

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
    console.error("Comment creation error:", error);
    return apiError("Failed to add comment", 500);
  }
});
