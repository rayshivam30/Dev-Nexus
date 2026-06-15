import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const invite = await prisma.invite.findUnique({
    where: { token: tokenHash },
    select: {
      email: true,
      role: true,
      acceptedAt: true,
      expiresAt: true,
    },
  });

  if (
    !invite ||
    invite.acceptedAt ||
    invite.expiresAt < new Date() ||
    !["MANAGER", "DEVELOPER"].includes(invite.role)
  ) {
    return NextResponse.json(
      { error: "Invalid or expired invite link" },
      { status: 400 }
    );
  }

  return NextResponse.json({
    email: invite.email,
    role: invite.role,
  });
}
