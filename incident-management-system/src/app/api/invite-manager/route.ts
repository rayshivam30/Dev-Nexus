import crypto from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { escapeHtml, getBaseUrl } from "@/lib/utils";
import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { logger } from "@/lib/logger";

const inviteManagerSchema = z.object({
  email: z.string().email("Invalid email address"),
  projectId: z.string().min(1, "Project ID is required"),
});

export const POST = withAuth(async (_req, { decoded, body }) => {
  const parsed = inviteManagerSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.flatten().fieldErrors
      ? (Object.values(parsed.error.flatten().fieldErrors).flat()[0] ?? "Invalid input")
      : "Invalid input");
  }
  const { email, projectId } = parsed.data;
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
    logger.error({ err: emailError }, "Failed to send invite email");
  }

  return apiResponse("Invite created", { inviteLink });
}, ["ADMIN"]);
