import { createPrismaMock } from "./mock-db";
import { mock, describe, it, expect, beforeEach } from "bun:test";

const prismaMock = createPrismaMock();
mock.module("@/lib/db", () => ({ prisma: prismaMock }));
mock.module("../src/lib/db", () => ({ prisma: prismaMock }));

import {
  softDeleteIssue,
  getIssuesByProject,
} from "../src/services/issue-service";

describe("Soft Delete Functionality (Issue Service)", () => {
  const issueId = "issue-123";
  const userId = "user-123";
  const projectId = "proj-123";

  beforeEach(() => {
    prismaMock.issue.update.mockClear();
    prismaMock.issue.findMany.mockClear();
    prismaMock.issue.count.mockClear();
    prismaMock.issueActivity.create.mockClear();
  });

  it("softDeleteIssue sets deletedAt timestamp and logs activity", async () => {
    prismaMock.issue.update.mockResolvedValue({
      id: issueId,
      deletedAt: new Date(),
    });

    const result = await softDeleteIssue(issueId, userId);

    expect(prismaMock.issue.update).toHaveBeenCalledWith({
      where: { id: issueId },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaMock.issueActivity.create).toHaveBeenCalledWith({
      data: {
        issueId,
        userId,
        action: "Issue soft deleted",
      },
    });
    expect(result.id).toBe(issueId);
  });

  it("getIssuesByProject filters queries with deletedAt: null", async () => {
    prismaMock.issue.findMany.mockResolvedValue([
      { id: "active-issue", title: "Active", deletedAt: null },
    ]);
    prismaMock.issue.count.mockResolvedValue(1);

    const res = await getIssuesByProject(projectId, 1, 20);

    expect(prismaMock.issue.findMany).toHaveBeenCalledWith({
      where: { projectId, deletedAt: null },
      include: expect.any(Object),
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 20,
    });
    expect(prismaMock.issue.count).toHaveBeenCalledWith({
      where: { projectId, deletedAt: null },
    });
    expect(res.issues.length).toBe(1);
    expect(res.pagination.totalCount).toBe(1);
  });
});
