import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mailer";
import { getBaseUrl } from "@/lib/utils";

import { withAuth, apiResponse, apiError } from "@/lib/api-utils";

export const POST = withAuth(async (req, { decoded }) => {
  const { email, projectId } = await req.json();

  if (!email || !projectId) {
    return apiError("Missing data");
  }

  const token = jwt.sign(
  {
    email,
    role: "MANAGER",
    projectId,
    invitedBy: decoded.userId,
    orgId: decoded.orgId,
  },
  process.env.JWT_SECRET!,
  { expiresIn: "1d" }
);

  await prisma.invite.create({
    data: {
      email,
      token,
      role: "MANAGER",
      projectId,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
    },
  });

  const baseUrl = getBaseUrl();
  const inviteLink = `${baseUrl}/invite/${token}`;

  console.log("🔥 Invite link:", inviteLink);

  //  EMAIL SEND
  try {
    await sendMail({
      to: email,
      subject: "You're invited to DevNexus 🚀",
      html: `
        <h2>You are invited as a Manager</h2>
        <p>Click below to join:</p>
        <a href="${inviteLink}">${inviteLink}</a>
      `,
    });
  } catch (emailError) {
    console.error("Failed to send invite email:", emailError);
  }

  return apiResponse("Invite created", {
    inviteLink,
  });
}, ["ADMIN"]);

