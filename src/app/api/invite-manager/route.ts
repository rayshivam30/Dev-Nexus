import jwt from "jsonwebtoken";
import { prisma } from "@/lib/db";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { email, projectId } = await req.json();

  if (!email || !projectId) {
    return NextResponse.json({ error: "Missing data" });
  }

  const token = jwt.sign(
  {
    email,
    role: "MANAGER",
    projectId,
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

  const inviteLink = `http://localhost:3000/invite/${token}`;

  console.log("🔥 Invite link:", inviteLink);

  //  EMAIL SEND
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

  return NextResponse.json({
    message: "Invite created",
    inviteLink,
  });
}