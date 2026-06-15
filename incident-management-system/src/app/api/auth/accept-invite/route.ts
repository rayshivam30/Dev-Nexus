import crypto from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/hash";
import { signToken } from "@/lib/jwt";
import { acceptInviteSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = acceptInviteSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: "Missing or invalid fields",
          details: result.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { token, password } = result.data;
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
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

    const sessionToken = signToken(
      {
        userId: user.id,
        role: user.role,
        orgId: user.orgId || undefined,
      },
      "7d"
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
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
