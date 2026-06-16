import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

export async function GET(request: NextRequest) {
  try {
    // Reuse existing CSRF token from cookie if present and valid (32-character hex)
    let token = request.cookies.get("csrf_token")?.value;
    
    if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
      token = crypto.randomBytes(16).toString("hex");
    }
    
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
