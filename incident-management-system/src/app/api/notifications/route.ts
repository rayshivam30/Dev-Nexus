import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { getNotifications, markAllAsRead } from "@/services/notification-service";

export const GET = withAuth(async (_req, { decoded }) => {
  try {
    const notifications = await getNotifications(decoded.userId as string);
    return apiResponse("Success", { notifications });
  } catch {
    return apiError("Failed to fetch notifications", 500);
  }
});

export const PATCH = withAuth(async (_req, { decoded }) => {
  try {
    await markAllAsRead(decoded.userId as string);
    return apiResponse("All marked as read");
  } catch {
    return apiError("Failed to update notifications", 500);
  }
});
