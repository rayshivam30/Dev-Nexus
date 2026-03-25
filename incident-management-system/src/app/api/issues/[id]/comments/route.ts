import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { addComment } from "@/services/issue-service";

export const POST = withAuth(async (_req, { decoded, body, params }) => {
  const { id } = await (params as { id: string });
  const { text } = body as { text: string };

  if (!text || !text.trim()) {
    return apiError("Comment text is required", 400);
  }

  try {
    const comment = await addComment(id, decoded.userId as string, text);
    return apiResponse("Comment added successfully", { comment }, 201);
  } catch (error) {
    console.error("Comment creation error:", error);
    return apiError("Failed to add comment", 500);
  }
});
