import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { blacklistToken } from "@/lib/session-blacklist";
import { verifyCsrf } from "@/lib/api-utils";

export async function POST(req?: NextRequest) {
  // CSRF protection — prevents cross-site force-logout
  // (skipped automatically in test environment by verifyCsrf)
  if (req && !verifyCsrf(req)) {
    return NextResponse.json(
      { error: "CSRF check failed" },
      { status: 403 }
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;

  if (token) {
    await blacklistToken(token);
  }

  // Clear the incident_token cookie — use the same `secure` flag as login
  // so the browser actually clears the cookie in all environments
  cookieStore.set("incident_token", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  return NextResponse.json({ success: true, message: "Logged out successfully" });
}
