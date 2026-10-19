import { NextRequest, NextResponse } from "next/server";
import { verifyToken, signToken, signRefreshToken, JwtPayload } from "@/lib/jwt";
import { isTokenBlacklisted, consumeTokenOnce } from "@/lib/session-blacklist";
import { getActiveSessionUser, sessionUserToPayload } from "@/lib/authorization";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/refresh
 *
 * Rotates the access token using the refresh token.
 * - Validates the refresh token from cookie
 * - Issues a new access token + rotated refresh token
 * - Blacklists the old refresh token (rotation)
 */
export async function POST(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("incident_refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json(
        { error: "No refresh token provided" },
        { status: 401 }
      );
    }

    // Check if the refresh token has been blacklisted (revoked)
    const isBlacklisted = await isTokenBlacklisted(refreshToken);
    if (isBlacklisted) {
      return NextResponse.json(
        { error: "Refresh token has been revoked" },
        { status: 401 }
      );
    }

    // Verify the refresh token
    const decoded = verifyToken(refreshToken);
    if (!decoded || decoded.type !== "refresh") {
      return NextResponse.json(
        { error: "Invalid or expired refresh token" },
        { status: 401 }
      );
    }

    // Refresh tokens are cookies, so require the same origin + double-submit
    // CSRF proof as other cookie-authenticated state changes.
    const { verifyCsrf } = await import("@/lib/api-utils");
    if (!verifyCsrf(req)) {
      return NextResponse.json({ error: "CSRF check failed" }, { status: 403 });
    }

    // Verify the user still exists and is active
    const user = await getActiveSessionUser(decoded);
    if (!user) {
      return NextResponse.json(
        { error: "User session is inactive or no longer exists" },
        { status: 401 }
      );
    }

    const payload: JwtPayload = sessionUserToPayload(user);

    // Consume once atomically so concurrent requests cannot rotate the same token.
    if (!(await consumeTokenOnce(refreshToken))) {
      return NextResponse.json({ error: "Refresh token has already been used" }, { status: 401 });
    }

    const newAccessToken = signToken(payload, "1h");
    const newRefreshToken = signRefreshToken(payload);

    const response = NextResponse.json({
      message: "Token refreshed successfully",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
    });

    // Set new access token cookie
    response.cookies.set("incident_token", newAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60, // 1 hour
      path: "/",
    });

    // Set new refresh token cookie
    response.cookies.set("incident_refresh_token", newRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    logger.error({ err: error }, "Token refresh error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
