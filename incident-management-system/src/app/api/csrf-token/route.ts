import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    // Generate a secure 32-character random hex token
    const token = crypto.randomBytes(16).toString("hex");
    
    // Create response returning the token
    const response = NextResponse.json({ token });
    
    // Store token in a secure, HttpOnly cookie
    response.cookies.set({
      name: "csrf_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
    
    return response;
  } catch (error) {
    console.error("CSRF token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
