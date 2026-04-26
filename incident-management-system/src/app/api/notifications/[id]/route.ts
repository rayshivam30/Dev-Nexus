import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { markAsRead } from "@/services/notification-service";

export const PATCH = withAuth(async (_req, { params }) => {
  const { id } = await (params as { id: string });
  try {
    await markAsRead(id);
    return apiResponse("Marked as read");
  } catch {
    return apiError("Failed to update notification", 500);
  }
});
