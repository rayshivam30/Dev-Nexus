import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";
const prismaMock = createPrismaMock();

// Register all mock modules BEFORE standard imports
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));
// api-ingest.test mocks this module globally; restore the real service here
mock.module("@/services/notification-service", () =>
  import("../src/services/notification-service")
);

import { expect, test, describe } from "bun:test";
import { notifyOrgStaff, createNotification, getNotifications, markAsRead, markAllAsRead } from "../src/services/notification-service";

interface BunMock {
  mock: {
    calls: unknown[][];
  };
}

describe("Notification Service", () => {
  test("notifyOrgStaff creates notifications for all staff", async () => {
    prismaMock.user.findMany.mockResolvedValue([
      { id: "staff-1", role: "ADMIN" },
      { id: "staff-2", role: "MANAGER" }
    ]);
    prismaMock.notification.createMany.mockImplementation(() =>
      Promise.resolve({ count: 2 })
    );
    const result = await notifyOrgStaff("org-1", {
      type: "INCIDENT_CREATED",
      title: "Alert",
      message: "Something happened"
    });

    expect(result).toBeDefined();
    expect((result as { count: number }).count).toBe(2);
    
    const createManyCall = (prismaMock.notification.createMany as unknown as BunMock).mock.calls[0][0] as { data: { userId: string }[] };
    expect(createManyCall.data).toHaveLength(2);
    expect(createManyCall.data[0].userId).toBe("staff-1");
  });

  test("createNotification creates a single notification", async () => {
    const notif = await createNotification({
      userId: "user-1",
      type: "ASSIGNMENT",
      title: "New Task",
      message: "Check it out"
    });
    expect(notif.userId).toBe("user-1");
    expect(notif.title).toBe("New Task");
  });

  test("getNotifications returns latest notifications for user", async () => {
    const list = await getNotifications("user-1");
    expect(list).toHaveLength(2);
  });

  test("markAsRead updates a notification status", async () => {
    const updated = await markAsRead("notif-1", "user-1");
    expect(updated.count).toBe(5);
  });

  test("markAllAsRead updates all unread notifications", async () => {
    const result = await markAllAsRead("user-1");
    expect(result.count).toBe(5);
  });
});
