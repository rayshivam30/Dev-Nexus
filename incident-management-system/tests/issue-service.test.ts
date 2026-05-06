import { createPrismaMock } from "./mock-db";
import { mock } from "bun:test";
const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

import { expect, test, describe, beforeEach } from "bun:test";
import { createIssue, updateIssue, calculateSLADeadlines, logActivity, addComment, getIssueDetails, getIssuesByProject } from "../src/services/issue-service";


describe("Issue Service", () => {
  beforeEach(() => {
    // Clear mock counts
    prismaMock.issue.create.mockClear();
    prismaMock.issue.update.mockClear();
    prismaMock.issueActivity.create.mockClear();
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

      const createCalls = (prismaMock.issue.create as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      expect(createCalls.length).toBe(1);
      
      const activityCalls = (prismaMock.issueActivity.create as unknown as { mock: { calls: unknown[][] } }).mock.calls;
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
      
      const updateCalls = (prismaMock.issue.update as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      expect(updateCalls.length).toBe(1);
      
      const firstUpdateCall = updateCalls[0][0] as { data: { status: string, resolvedAt: unknown } };
      expect(firstUpdateCall.data.status).toBe("RESOLVED");
      expect(firstUpdateCall.data.resolvedAt).toBeDefined();

      const activityCalls = (prismaMock.issueActivity.create as unknown as { mock: { calls: unknown[][] } }).mock.calls;
      expect(activityCalls.length).toBe(1);
      
      const firstActivityCall = activityCalls[0][0] as { data: { action: string } };
      expect(firstActivityCall.data.action).toContain("Status changed from OPEN to RESOLVED");
    });
  });

  describe("logActivity", () => {
    test("creates an activity record", async () => {
      const activity = await logActivity("issue-1", "user-1", "Updated title");
      expect(activity.issueId).toBe("issue-1");
      expect(activity.action).toBe("Updated title");
    });
  });

  describe("addComment", () => {
    test("creates a comment and logs activity", async () => {
      const comment = await addComment("issue-1", "user-1", "This is a comment");
      expect(comment.text).toBe("This is a comment");
      expect(comment.issueId).toBe("issue-1");
      
      const activityCalls = (prismaMock.issueActivity.create as unknown as { mock: { calls: { data: { action: string } }[][] } }).mock.calls;
      expect(activityCalls.some((call) => call[0].data.action === "Comment added")).toBe(true);
    });
  });

  describe("getIssueDetails", () => {
    test("calls findUnique with correct includes", async () => {
      const details = await getIssueDetails("issue-1");
      expect(details).toBeDefined();
      const calls = (prismaMock.issue.findUnique as unknown as { mock: { calls: Record<string, unknown>[][] } }).mock.calls;
      expect(calls[calls.length - 1][0]).toHaveProperty("include");
    });
  });

  describe("getIssuesByProject", () => {
    test("returns issues and pagination info", async () => {
      const result = await getIssuesByProject("project-1", 1, 10);
      expect(result.issues).toHaveLength(2);
      expect(result.pagination.totalCount).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
    });
  });
});
