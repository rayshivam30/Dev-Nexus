import { NextRequest, NextResponse } from "next/server";
import { verifyToken, JwtPayload } from "@/lib/jwt";

export type ApiHandler = (
  req: NextRequest,
  params: { decoded: JwtPayload; body?: any }
) => Promise<NextResponse>;

export function withAuth(handler: ApiHandler, allowedRoles?: string[]) {
  return async (req: NextRequest) => {
    try {
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

      return await handler(req, { decoded, body });
    } catch (error) {
      console.error("API Error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export function apiResponse(message: string, data?: any, status = 200) {
  return NextResponse.json({ message, ...data }, { status });
}

export function apiError(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}
