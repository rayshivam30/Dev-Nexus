import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/hash';
import { signToken } from '@/lib/jwt';
import { loginSchema } from '@/lib/validations';
import { checkLoginAttempts, recordLoginSuccess } from '@/lib/brute-force';
import { logAuditEvent } from '@/lib/audit-logger';

export async function POST(request: Request) {
  const userAgent = request.headers.get("user-agent") || undefined;
  const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined;

  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      logAuditEvent({
        action: "login_validation_failed",
        resource: "user",
        success: false,
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Missing or invalid credentials', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = result.data;

    // Check login attempts
    const lockoutCheck = await checkLoginAttempts(email);
    if (!lockoutCheck.allowed) {
      logAuditEvent({
        action: "login_lockout",
        resource: "user",
        success: false,
        changes: { email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json(
        { 
          error: 'Account temporarily locked. Try again later.',
          lockedUntil: lockoutCheck.lockedUntil?.toISOString()
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Timing-safe password verification
    const dummyHash = "$2a$10$12345678901234567890123456789012345678901234567890123";
    const passwordHash = user?.passwordHash || dummyHash;
    const isValid = await verifyPassword(password, passwordHash);
    
    if (!user || !isValid) {
      logAuditEvent({
        action: "login_failed",
        resource: "user",
        success: false,
        changes: { email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status === 'UNVERIFIED') {
      logAuditEvent({
        action: "login_unverified",
        userId: user.id,
        resource: "user",
        success: false,
        changes: { email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Please verify your email before logging in.' }, { status: 403 });
    }

    if (user.status === 'PENDING_APPROVAL') {
      logAuditEvent({
        action: "login_pending_approval",
        userId: user.id,
        resource: "user",
        success: false,
        changes: { email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Account pending approval by Admin' }, { status: 403 });
    }

    if (user.status === 'INACTIVE') {
      logAuditEvent({
        action: "login_inactive",
        userId: user.id,
        resource: "user",
        success: false,
        changes: { email },
        ipAddress,
        userAgent,
      });
      return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
    }

    // Success: clear lockout attempts
    await recordLoginSuccess(email);

    logAuditEvent({
      action: "login_success",
      userId: user.id,
      resource: "user",
      success: true,
      changes: { email },
      ipAddress,
      userAgent,
    });

    const token = signToken({
      userId: user.id,
      role: user.role,
      orgId: user.orgId || undefined,
    }, '1h');

    // Do NOT return the token in the JSON response body
    const response = NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    }, { status: 200 });

    response.cookies.set('incident_token', token, {
      httpOnly: true,
      secure: true, // Always secure
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hour
      path: '/',
    });

    return response;

  } catch (error) {
    logAuditEvent({
      action: "login_error",
      resource: "user",
      success: false,
      changes: { error: error instanceof Error ? error.message : String(error) },
      ipAddress,
      userAgent,
    });
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
