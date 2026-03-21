import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/jwt";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, teamId, assignedToId } = body;

    const existingIssue = await prisma.issue.findUnique({
      where: { id },
      include: { team: true },
    });

    if (!existingIssue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    const updateData: any = {};

    // Only allow updating these fields based on role
    if (decoded.role === "MANAGER") {
      // Manager can update assignment
      if (teamId !== undefined) updateData.teamId = teamId;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
      if (status) updateData.status = status;
      
      // If they are officially assigning it, clear the suggestion log
      if (assignedToId && existingIssue.logs && typeof existingIssue.logs === 'object' && 'suggestedAssigneeId' in existingIssue.logs) {
        const newLogs = { ...existingIssue.logs as object };
        delete (newLogs as any).suggestedAssigneeId;
        updateData.logs = newLogs;
      }
    } else if (decoded.role === "DEVELOPER") {
      // Developer can only update status of their assigned issues
      if (existingIssue.assignedToId !== decoded.userId) {
        return NextResponse.json({ error: "Not authorized to update this issue" }, { status: 403 });
      }
      if (status && ["IN_PROGRESS", "RESOLVED"].includes(status)) {
        updateData.status = status;
        if (status === "RESOLVED") {
          updateData.resolvedAt = new Date();
        }
      }
    } else if (decoded.role === "ADMIN") {
      // Admin can do anything
      if (teamId !== undefined) updateData.teamId = teamId;
      if (assignedToId !== undefined) updateData.assignedToId = assignedToId;
      if (status) updateData.status = status;
      if (status === "RESOLVED") updateData.resolvedAt = new Date();
    }

    if (teamId !== undefined && teamId) {
      const team = await prisma.team.findUnique({ where: { id: teamId } });
      if (!team) {
        return NextResponse.json({ error: "Invalid team" }, { status: 400 });
      }
      if ((existingIssue as any).projectId && team.projectId !== (existingIssue as any).projectId) {
        return NextResponse.json({ error: "Team does not belong to this issue's project" }, { status: 400 });
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const issue = await prisma.issue.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ message: "Issue updated successfully", issue });
  } catch (error: any) {
    console.error("Issue update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
