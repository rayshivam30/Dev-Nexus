import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/hash";
import jwt from "jsonwebtoken";
import { acceptInviteSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = acceptInviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Missing or invalid fields", details: result.error.flatten() },
        { status: 400 },
      );
    }

    const { token, password } = result.data;

    // 🔥 Verify JWT token
    let decoded: any;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
      return NextResponse.json(
        { error: "Invalid or expired invite link" },
        { status: 400 },
      );
    }

    // 🔥 normalize email
    const email = decoded.email.toLowerCase().trim();
    const role = decoded.role;
    const projectId = decoded.projectId;

    // 🔍 Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "This email is already registered. Please log in instead." },
        { status: 409 },
      );
    }

    // 🔐 Hash password
    const passwordHash = await hashPassword(password);

    // 👤 Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role,
        status: "ACTIVE",
        ...(projectId ? { projectId } : {}),
      },
    });

    // 🔥 DELETE invite after use (IMPORTANT)
    await prisma.invite.deleteMany({
      where: { email },
    });

    // 🔥 AUTO LOGIN TOKEN
    const sessionToken = jwt.sign(
      {
        userId: user.id,
        role: user.role,
        orgId: user.orgId, // 🔥 IMPORTANT
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    return NextResponse.json(
      {
        message: "Account created successfully",
        token: sessionToken,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Accept invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
