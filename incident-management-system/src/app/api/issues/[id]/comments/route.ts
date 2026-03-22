import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { addComment } from "@/services/issue-service";

export const POST = withAuth(async (req, { decoded, body, params }) => {
  const { id } = await (params as any);
  const { text } = body;

  if (!text || !text.trim()) {
    return apiError("Comment text is required", 400);
  }

  try {
    const comment = await addComment(id, decoded.userId, text);
    return apiResponse("Comment added successfully", { comment }, 201);
  } catch (error: any) {
    console.error("Comment creation error:", error);
    return apiError("Failed to add comment", 500);
  }
});
