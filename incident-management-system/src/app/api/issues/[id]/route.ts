import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { updateIssue, getIssueDetails } from "@/services/issue-service";

export const GET = withAuth(async (req, { params }) => {
  const { id } = await (params as any);
  try {
    const issue = await getIssueDetails(id);
    if (!issue) return apiError("Issue not found", 404);
    return apiResponse("Success", { issue });
  } catch (error) {
    return apiError("Failed to fetch issue details", 500);
  }
});

export const PATCH = withAuth(async (req, { decoded, body, params }) => {
  const { id } = await (params as any);
  const { status, teamId, assignedToId, rootCause } = body;

  try {
    const existingIssue = await prisma.issue.findUnique({
      where: { id },
    });

    if (!existingIssue) return apiError("Issue not found", 404);

    // Permission Logic
    const updateData: any = { userId: decoded.userId };
    
    if (decoded.role === "DEVELOPER") {
      if (existingIssue.assignedToId !== decoded.userId) {
        return apiError("Not authorized to update this issue", 403);
      }
      if (status) {
        if (!["IN_PROGRESS", "RESOLVED"].includes(status)) {
          return apiError("Invalid status transition for developer", 400);
        }
        updateData.status = status;
      }
      if (rootCause) updateData.rootCause = rootCause;
    } else {
      // MANAGER or ADMIN
      if (status) updateData.status = status;
      if (teamId !== undefined) updateData.teamId = teamId;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
      if (rootCause) updateData.rootCause = rootCause;
    }

    const issue = await updateIssue(id, updateData);
    return apiResponse("Issue updated successfully", { issue });
  } catch (error: any) {
    console.error("Issue update error:", error);
    return apiError(error.message || "Failed to update issue", 500);
  }
});
