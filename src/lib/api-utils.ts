import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/jwt";

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
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const token = authHeader.split(" ")[1];
      const decoded = verifyToken(token);

      if (!decoded) {
        return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
      }

      if (allowedRoles && !allowedRoles.includes(decoded.role)) {
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
        decoded, 
        body, 
        params: params || {} 
      });
    } catch (error) {
      console.error("API Error:", error);
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
  return verifyToken(token);
}