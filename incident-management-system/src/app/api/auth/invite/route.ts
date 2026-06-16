import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { inviteSchema } from "@/lib/validations";
import { escapeHtml, getBaseUrl } from "@/lib/utils";
import { withAuth } from "@/lib/api-utils";
import { sendMail } from "@/lib/mailer";

function hashInviteToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export const POST = withAuth(async (_request, { decoded, body }) => {
  try {
    const result = inviteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Missing or invalid fields",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    if (!decoded.orgId) {
      return NextResponse.json(
        { error: "Organization is required" },
        { status: 403 }
      );
    }

    const { email, role, projectId, teamId } = result.data;
    let targetProjectId = projectId;

    if (role === "MANAGER") {
      const project = await prisma.project.findFirst({
        where: { id: projectId, orgId: decoded.orgId },
        select: { id: true },
      });
      if (!project) {
        return NextResponse.json(
          { error: "Project not found or access denied" },
          { status: 404 }
        );
      }
      if (decoded.role === "MANAGER" && decoded.projectId !== project.id) {
        return NextResponse.json(
          { error: "Managers can only invite to their project" },
          { status: 403 }
        );
      }
    } else {
      const team = await prisma.team.findFirst({
        where: {
          id: teamId,
          project: { orgId: decoded.orgId },
          ...(decoded.role === "MANAGER"
            ? { projectId: decoded.projectId }
            : {}),
        },
        select: { id: true, projectId: true },
      });
      if (!team) {
        return NextResponse.json(
          { error: "Team not found or access denied" },
          { status: 404 }
        );
      }
      targetProjectId = team.projectId;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    const rawToken = crypto.randomBytes(32).toString("base64url");
    await prisma.invite.create({
      data: {
        email,
        token: hashInviteToken(rawToken),
        role,
        orgId: decoded.orgId,
        projectId: targetProjectId as string,
        teamId: role === "DEVELOPER" ? teamId : null,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
      },
    });

    const inviteLink = `${getBaseUrl()}/auth/accept-invite?token=${rawToken}`;
    const safeRole = escapeHtml(role.toLowerCase());
    const safeInviteLink = escapeHtml(inviteLink);

    let emailSent = false;
    try {
      const mailResult = await sendMail({
        to: email,
        subject: `You're invited to join DevNexus as a ${safeRole}`,
        html: `
          <h2>You are invited to join DevNexus</h2>
          <p>You have been invited as a <strong>${safeRole}</strong>.</p>
          <p>Click the link below to accept your invitation and set up your account:</p>
          <a href="${safeInviteLink}">${safeInviteLink}</a>
        `,
      });
      if (mailResult) {
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Failed to send invite email:", emailError);
    }

    if (!emailSent) {
      return NextResponse.json(
        {
          message: "Invite created but failed to send email. Please share the link manually.",
          inviteLink,
          warning: "email_delivery_failed",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: "Invite link generated and sent successfully",
        inviteLink,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}, ["ADMIN", "MANAGER"]);
