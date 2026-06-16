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
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";

  console.log("CSRF verification attempt:", { origin, referer, host });

  const isDev = process.env.NODE_ENV === "development";

  const isHostAllowed = (clientHost: string, headerHost: string) => {
    if (clientHost === headerHost) return true;
    
    if (isDev) {
      const normalize = (h: string) => {
        const name = h.split(":")[0];
        return name === "127.0.0.1" ? "localhost" : name;
      };
      
      // Allow localhost and 127.0.0.1 interchangeably
      if (normalize(clientHost) === normalize(headerHost)) return true;
      
      // Ignore port differences if proxying or port forwarding is active in dev
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
        console.log("CSRF fail: Origin host mismatch", { originHost: originUrl.host, hostHeader: host });
        return false;
      }
    } catch (e) {
      console.log("CSRF fail: invalid origin URL", origin, e);
      return false;
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (!isHostAllowed(refererUrl.host, host)) {
        console.log("CSRF fail: Referer host mismatch", { refererHost: refererUrl.host, hostHeader: host });
        return false;
      }
    } catch (e) {
      console.log("CSRF fail: invalid referer URL", referer, e);
      return false;
    }
  }

  // Double-submit token validation
  const csrfCookie = req.cookies?.get("csrf_token")?.value || req.headers.get("cookie")?.match(/csrf_token=([^;]+)/)?.[1];
  const csrfHeader = req.headers.get("x-csrf-token");
  
  if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
    console.log("CSRF fail: Double-submit token check failed", { csrfCookie, csrfHeader });
    return false;
  }

  console.log("CSRF verification passed");
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
        return NextResponse.json({ error: "Unauthorized: Session invalidated" }, { status: 401 });
      }

      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
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
          { error: `Forbidden: This action requires one of the following roles: ${allowedRoles.join(", ")}` },
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
        params: params || {} 
      });
    } catch (error) {
      logger.error({ err: error }, "API Error");
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function apiResponse(message: string, data?: Record<string, unknown>, status = 200) {
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
