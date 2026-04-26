import { expect, test, describe, mock } from "bun:test";
import { notifyOrgStaff } from "../src/services/notification-service";
import { prisma } from "../src/lib/db";

interface BunMock {
  mock: {
    calls: unknown[][];
  };
}

// Mock Prisma
mock.module("../src/lib/db", () => ({
  prisma: {
    user: {
      findMany: mock(() => Promise.resolve([{ id: "staff-1" }, { id: "staff-2" }])),
    },
    notification: {
      createMany: mock((args) => Promise.resolve({ count: args.data.length })),
      findMany: mock(() => Promise.resolve([])),
    },
  },
}));

describe("Notification Service", () => {
  test("notifyOrgStaff creates notifications for all staff", async () => {
    const result = await notifyOrgStaff("org-1", {
      type: "INCIDENT_CREATED",
      title: "Alert",
      message: "Something happened"
    });

    expect(result.count).toBe(2);
    
    const createManyCall = (prisma.notification.createMany as unknown as BunMock).mock.calls[0][0] as { data: { userId: string }[] };
    expect(createManyCall.data).toHaveLength(2);
    expect(createManyCall.data[0].userId).toBe("staff-1");
  });
});
