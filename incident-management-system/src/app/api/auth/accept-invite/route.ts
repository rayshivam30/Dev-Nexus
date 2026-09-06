import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { acceptInviteSchema } from "@/lib/validations";
import { checkInviteAcceptAttempts, recordInviteAcceptSuccess } from "@/lib/brute-force";
import { logAuditEvent } from "@/lib/audit-logger";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;

  try {
    const body = await request.json();
    const result = acceptInviteSchema.safeParse(body);
    if (!result.success) {
      logAuditEvent({
        action: "invite_accept_validation_failed",
        resource: "invite",
        success: false,
        ipAddress,
        userAgent,
      });
      const fieldErrors = result.error.flatten().fieldErrors;
      const firstError = Object.values(fieldErrors).flat()[0] || "Missing or invalid fields";
      return NextResponse.json(
        {
          error: firstError,
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token, password } = result.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    // Rate-limit invitation acceptance attempts
    const rateLimitCheck = await checkInviteAcceptAttempts(tokenHash);
    if (!rateLimitCheck.allowed) {
      logAuditEvent({
        action: "invite_accept_rate_limited",
        resource: "invite",
        success: false,
        changes: { tokenHash },
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { 
          error: "Too many attempts. Please try again later.",
          lockedUntil: rateLimitCheck.lockedUntil?.toISOString()
        },
        { status: 429 }
      );
    }

    const invite = await prisma.invite.findUnique({
      where: { token: tokenHash },
    });

    if (
      !invite ||
      invite.acceptedAt ||
      invite.expiresAt < new Date() ||
      !invite.orgId ||
      !["MANAGER", "DEVELOPER"].includes(invite.role)
    ) {
      logAuditEvent({
        action: "invite_accept_invalid_token",
        resource: "invite",
        success: false,
        changes: { tokenHash },
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 400 }
      );
    }

    const role = invite.role as "MANAGER" | "DEVELOPER";
    const project = await prisma.project.findFirst({
      where: { id: invite.projectId, orgId: invite.orgId },
      select: { id: true },
    });
    if (!project) {
      logAuditEvent({
        action: "invite_accept_target_missing",
        resource: "invite",
        success: false,
        changes: { projectId: invite.projectId, orgId: invite.orgId },
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { error: "Invite target no longer exists" },
        { status: 400 }
      );
    }

    if (role === "DEVELOPER") {
      const team = await prisma.team.findFirst({
        where: { id: invite.teamId || undefined, projectId: invite.projectId },
        select: { id: true },
      });
      if (!team) {
        logAuditEvent({
          action: "invite_accept_team_missing",
          resource: "invite",
          success: false,
          changes: { teamId: invite.teamId, projectId: invite.projectId },
          ipAddress,
          userAgent,
        });
        return NextResponse.json(
          { error: "Invite team no longer exists" },
          { status: 400 }
        );
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
    });
    if (existingUser) {
      logAuditEvent({
        action: "invite_accept_email_registered",
        resource: "invite",
        success: false,
        changes: { email: invite.email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { error: "This email is already registered. Please log in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: invite.email,
          passwordHash,
          role,
          status: "ACTIVE",
          orgId: invite.orgId,
          ...(role === "MANAGER" ? { projectId: invite.projectId } : {}),
          ...(role === "DEVELOPER" && invite.teamId
            ? { teamId: invite.teamId }
            : {}),
        },
      });
      await tx.invite.update({
        where: { id: invite.id },
        data: { acceptedAt: new Date() },
      });
      return createdUser;
    });

    // Clear lockout on success
    await recordInviteAcceptSuccess(tokenHash);

    logAuditEvent({
      action: "invite_accepted",
      userId: user.id,
      resource: "invite",
      resourceId: invite.id,
      success: true,
      changes: { email: invite.email, role: invite.role, orgId: invite.orgId },
      ipAddress,
      userAgent,
    });

    const sessionToken = signToken(
      {
        userId: user.id,
        role: user.role,
        orgId: user.orgId || undefined,
      },
      "1h"
    );

    const response = NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          orgId: user.orgId,
        },
      },
      { status: 201 }
    );

    response.cookies.set("incident_token", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    logAuditEvent({
      action: "invite_accept_error",
      resource: "invite",
      success: false,
      changes: { error: error instanceof Error ? error.message : String(error) },
      ipAddress,
      userAgent,
    });
    logger.error({ err: error }, "Accept invite error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
