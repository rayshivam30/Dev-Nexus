import { expect, test, describe, mock, beforeEach } from "bun:test";
import { createIssue, updateIssue, calculateSLADeadlines } from "../src/services/issue-service";
import { prisma } from "../src/lib/db";

interface BunMock {
  mockClear(): void;
  mock: {
    calls: unknown[][];
  };
}

// Mock Prisma
mock.module("../src/lib/db", () => ({
  prisma: {
    project: {
      findUnique: mock(() => Promise.resolve({ id: "project-1", plan: "ADVANCED" })),
    },
    $transaction: mock(async (cb: (tx: unknown) => Promise<unknown>) => {
      return cb(prisma); // Pass the mocked prisma instance as tx
    }),
    issue: {
      create: mock((args) => Promise.resolve({ id: "issue-1", ...args.data })),
      update: mock((args) => Promise.resolve({ id: args.where.id, ...args.data })),
      findUnique: mock((args) => Promise.resolve({ id: args.where.id, status: "OPEN" })),
    },
    issueActivity: {
      create: mock((args) => Promise.resolve({ id: "activity-1", ...args.data })),
    },
  },
}));

describe("Issue Service", () => {
  beforeEach(() => {
    // Clear mock counts
    (prisma.issue.create as unknown as BunMock).mockClear();
    (prisma.issue.update as unknown as BunMock).mockClear();
    (prisma.issueActivity.create as unknown as BunMock).mockClear();
  });

  describe("calculateSLADeadlines", () => {
    test("returns null for BASIC plan", async () => {
      const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines("project-1", "CRITICAL", "BASIC");
      expect(responseSlaDeadline).toBeNull();
      expect(resolutionSlaDeadline).toBeNull();
    });

    test("calculates correct deadlines for CRITICAL and ADVANCED plan", async () => {
      const start = new Date();
      const { responseSlaDeadline, resolutionSlaDeadline } = await calculateSLADeadlines("project-1", "CRITICAL", "ADVANCED");
      
      expect(responseSlaDeadline).not.toBeNull();
      expect(resolutionSlaDeadline).not.toBeNull();
      
      if (responseSlaDeadline && resolutionSlaDeadline) {
        const responseDiffHours = (responseSlaDeadline.getTime() - start.getTime()) / (1000 * 60 * 60);
        const resolutionDiffHours = (resolutionSlaDeadline.getTime() - start.getTime()) / (1000 * 60 * 60);
        
        expect(Math.round(responseDiffHours)).toBe(1);
        expect(Math.round(resolutionDiffHours)).toBe(4);
      }
    });
  });

  describe("createIssue", () => {
    test("creates an issue and an activity record", async () => {
      const data = {
        title: "Test Issue",
        description: "This is a test",
        severity: "HIGH" as const,
        projectId: "project-1",
        role: "DEVELOPER",
        userId: "user-1",
      };

      const issue = await createIssue(data);

      expect(issue).toBeDefined();
      expect(issue.id).toBe("issue-1");
      expect(issue.title).toBe("Test Issue");
      expect(issue.status).toBe("OPEN");

      const createCalls = (prisma.issue.create as unknown as BunMock).mock.calls;
      expect(createCalls.length).toBe(1);
      
      const activityCalls = (prisma.issueActivity.create as unknown as BunMock).mock.calls;
      expect(activityCalls.length).toBe(1);
      
      const firstActivityCall = activityCalls[0][0] as { data: { action: string } };
      expect(firstActivityCall.data.action).toContain("Issue created by developer");
    });
  });

  describe("updateIssue", () => {
    test("updates status and creates activity log", async () => {
      const result = await updateIssue("issue-1", {
        status: "RESOLVED",
        userId: "user-1"
      });

      expect(result.status).toBe("RESOLVED");
      
      const updateCalls = (prisma.issue.update as unknown as BunMock).mock.calls;
      expect(updateCalls.length).toBe(1);
      
      const firstUpdateCall = updateCalls[0][0] as { data: { status: string, resolvedAt: unknown } };
      expect(firstUpdateCall.data.status).toBe("RESOLVED");
      expect(firstUpdateCall.data.resolvedAt).toBeDefined();

      const activityCalls = (prisma.issueActivity.create as unknown as BunMock).mock.calls;
      expect(activityCalls.length).toBe(1);
      
      const firstActivityCall = activityCalls[0][0] as { data: { action: string } };
      expect(firstActivityCall.data.action).toContain("Status changed from OPEN to RESOLVED");
    });
  });
});
