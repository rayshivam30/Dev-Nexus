import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { blacklistToken } from "@/lib/session-blacklist";

export async function POST() {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;

  if (token) {
    await blacklistToken(token);
  }
  
  // Clear the incident_token cookie
  cookieStore.set("incident_token", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
