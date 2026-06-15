import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/jwt";
import { logger } from "@/lib/logger";
import {
  getActiveSessionUser,
  sessionUserToPayload,
} from "@/lib/authorization";

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
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const user = await getActiveSessionUser(decoded);
  return user ? sessionUserToPayload(user) : null;
}
