import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { getNotifications, getUnreadNotificationCount, markAllAsRead } from "@/services/notification-service";

export const GET = withAuth(async (req, { decoded }) => {
  try {
    const url = new URL(req.url);
    const skip = parseInt(url.searchParams.get("skip") || "0", 10) || 0;
    const take = parseInt(url.searchParams.get("take") || "50", 10) || 50;

    const userId = decoded.userId as string;
    const [notifications, unreadCount] = await Promise.all([
      getNotifications(userId, skip, take),
      getUnreadNotificationCount(userId),
    ]);
    return apiResponse("Success", { notifications, unreadCount });
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
