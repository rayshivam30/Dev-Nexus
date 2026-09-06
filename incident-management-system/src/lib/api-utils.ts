import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/jwt";
import { isTokenBlacklisted } from "@/lib/session-blacklist";
import { logger } from "@/lib/logger";
import {
  getActiveSessionUser,
  sessionUserToPayload,
} from "@/lib/authorization";

export function verifyCsrf(req: NextRequest): boolean {
  if (process.env.NODE_ENV === "test") return true;

  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");

  // Resolve host (checking x-forwarded-host for proxies)
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  const isDev = process.env.NODE_ENV === "development";

  const isHostAllowed = (clientHost: string, headerHost: string) => {
    if (clientHost === headerHost) return true;

    if (isDev) {
      const normalize = (h: string) => {
        const name = h.split(":")[0];
        return name === "127.0.0.1" ? "localhost" : name;
      };

      if (normalize(clientHost) === normalize(headerHost)) return true;

      const clientName = clientHost.split(":")[0];
      const headerName = headerHost.split(":")[0];
      if (normalize(clientName) === normalize(headerName)) return true;
    }

    return false;
  };

  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (!isHostAllowed(originUrl.host, host)) {
        logger.warn(
          { originHost: originUrl.host, hostHeader: host },
          "CSRF fail: Origin host mismatch"
        );
        return false;
      }
    } catch (e) {
      logger.warn({ origin, err: e }, "CSRF fail: invalid origin URL");
      return false;
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!isHostAllowed(refererUrl.host, host)) {
        logger.warn(
          { refererHost: refererUrl.host, hostHeader: host },
          "CSRF fail: Referer host mismatch"
        );
        return false;
      }
    } catch (e) {
      logger.warn({ referer, err: e }, "CSRF fail: invalid referer URL");
      return false;
    }
  }

  // Double-submit token validation
  // NOTE: The csrf_token cookie must NOT be HttpOnly so the client JS can read
  // it and echo it back in the X-CSRF-Token header.
  const csrfCookie =
    req.cookies?.get("csrf_token")?.value ||
    req.headers.get("cookie")?.match(/csrf_token=([^;]+)/)?.[1];
  const csrfHeader = req.headers.get("x-csrf-token");

  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    logger.warn(
      { hasCookie: !!csrfCookie, hasHeader: !!csrfHeader, match: csrfCookie === csrfHeader },
      "CSRF fail: Double-submit token check failed"
    );
    return false;
  }

  return true;
}

export interface HandlerContext {
  decoded: JwtPayload;
  body?: unknown;
  params: unknown;
}

export type ApiHandler = (
  req: NextRequest,
  context: HandlerContext
) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler, allowedRoles?: string[]) {
  return async (req: NextRequest, context?: { params: unknown }) => {
    try {
      // CSRF check on state-changing requests
      if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) {
        if (!verifyCsrf(req)) {
          return NextResponse.json(
            { error: "CSRF check failed: Invalid or untrusted Origin" },
            { status: 403 }
          );
        }
      }
      const params = context?.params;
      let token = "";
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const extracted = authHeader.split(" ")[1];
        if (extracted && extracted.trim() !== "" && extracted !== "null") {
          token = extracted;
        }
      }

      if (!token) {
        const cookieToken = req.cookies?.get("incident_token")?.value;
        if (cookieToken) {
          token = cookieToken;
        }
      }

      if (!token) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const isBlacklisted = await isTokenBlacklisted(token);
      if (isBlacklisted) {
        return NextResponse.json(
          { error: "Unauthorized: Session invalidated" },
          { status: 401 }
        );
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json(
          { error: "Invalid or expired token" },
          { status: 401 }
        );
      }

      const user = await getActiveSessionUser(decoded);
      if (!user) {
        return NextResponse.json(
          { error: "User session is inactive or no longer exists" },
          { status: 401 }
        );
      }

      const currentPayload = sessionUserToPayload(user);

      if (allowedRoles && !allowedRoles.includes(currentPayload.role)) {
        return NextResponse.json(
          {
            error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(", ")}`,
          },
          { status: 403 }
        );
      }

      let body;
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        try {
          body = await req.json();
        } catch {
          // Body might be empty or invalid JSON
        }
      }

      return await handler(req, {
        decoded: currentPayload,
        body,
        params: params || {},
      });
    } catch (error) {
      logger.error({ err: error }, "API Error");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function apiResponse(
  message: string,
  data?: Record<string, unknown>,
  status = 200
) {
  return NextResponse.json({ message, ...data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

export async function getCurrentUser(): Promise<JwtPayload | null> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) return null;
  const isBlacklisted = await isTokenBlacklisted(token);
  if (isBlacklisted) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const user = await getActiveSessionUser(decoded);
  return user ? sessionUserToPayload(user) : null;
}
