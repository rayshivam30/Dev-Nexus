import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Edge-compatible JWT verification using `jose` (no Node.js crypto needed).
 * Returns the decoded payload or null if the token is invalid/expired.
 */
async function verifyTokenEdge(token: string): Promise<Record<string, unknown> | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      { algorithms: ['HS256'] }
    );
    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default async function middleware(request: NextRequest) {
  const token = request.cookies.get('incident_token')?.value;

  // Protect /dashboard routes — verify the JWT, not just its existence
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const decoded = await verifyTokenEdge(token);
    if (!decoded) {
      // Token is invalid or expired — clear the stale cookie and redirect
      const response = NextResponse.redirect(new URL('/auth/login', request.url));
      response.cookies.set('incident_token', '', {
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
      return response;
    }

    // Attach request ID header for tracing
    const requestId = crypto.randomUUID();
    const response = NextResponse.next({
      headers: { 'X-Request-Id': requestId },
    });
    response.headers.set('X-Request-Id', requestId);
    return response;
  }

  // Prevent logged-in users from seeing auth pages
  if (
    request.nextUrl.pathname.startsWith('/auth/login') ||
    request.nextUrl.pathname.startsWith('/auth/register')
  ) {
    if (token) {
      const decoded = await verifyTokenEdge(token);
      if (decoded) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Token exists but is invalid — clear it and let them see the auth page
      const response = NextResponse.next();
      response.cookies.set('incident_token', '', {
        path: '/',
        expires: new Date(0),
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });
      return response;
    }
  }

  // Add request ID to all requests
  const requestId = crypto.randomUUID();
  const response = NextResponse.next({
    headers: { 'X-Request-Id': requestId },
  });
  response.headers.set('X-Request-Id', requestId);
  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/api/:path*'],
};
