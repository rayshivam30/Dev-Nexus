import crypto from "crypto";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { escapeHtml, getBaseUrl } from "@/lib/utils";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";

export const POST = withAuth(async (_req, { decoded, body }) => {
  const { email, projectId } =
    (body as { email?: string; projectId?: string }) || {};

  if (!email || !projectId) return apiError("Missing data");
  if (!decoded.orgId) return apiError("Organization is required", 403);

  const project = await prisma.project.findFirst({
    where: { id: projectId, orgId: decoded.orgId },
    select: { id: true },
  });
  if (!project) return apiError("Project not found or access denied", 404);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return apiError(`User already exists with role ${existingUser.role}`);
  }

  const existingInvite = await prisma.invite.findFirst({
    where: {
      email,
      projectId,
      acceptedAt: null,
      expiresAt: { gt: new Date() },
    },
  });
  if (existingInvite) {
    return apiError(
      "An active invite has already been sent to this email for this project"
    );
  }

  const rawToken = crypto.randomBytes(32).toString("base64url");
  const tokenHash = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  await prisma.invite.create({
    data: {
      email,
      token: tokenHash,
      role: "MANAGER",
      projectId,
      orgId: decoded.orgId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  const inviteLink = `${getBaseUrl()}/invite/${rawToken}`;
  const safeInviteLink = escapeHtml(inviteLink);

  try {
    await sendMail({
      to: email,
      subject: "You're invited to DevNexus",
      html: `
        <h2>You are invited as a Manager</h2>
        <p>Click below to join:</p>
        <a href="${safeInviteLink}">${safeInviteLink}</a>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send invite email:", emailError);
  }

  return apiResponse("Invite created", { inviteLink });
}, ["ADMIN"]);
