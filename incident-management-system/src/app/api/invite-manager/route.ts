import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { Resend } from "resend";

import { withAuth, apiResponse, apiError } from "@/lib/api-utils";

// Resend instantiation moved inside handler to prevent build-time crashes

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

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/invite/${token}`;

  console.log("🔥 Invite link:", inviteLink);

  //  EMAIL SEND
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: email,
      subject: "You're invited 🚀",
      html: `
        <h2>You are invited as a Manager</h2>
        <p>Click below to join:</p>
        <a href="${inviteLink}">${inviteLink}</a>
      `,
    });
  } else {
    console.warn("No RESEND_API_KEY provided. Skipping email send.");
  }

  return apiResponse("Invite created", {
    inviteLink,
  });
}, ["ADMIN"]);
