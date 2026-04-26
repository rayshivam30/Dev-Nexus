import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/hash';
import { signToken } from '@/lib/jwt';
import { loginSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Missing or invalid credentials', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password } = result.data;

    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    
    if (!isValid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (user.status === 'UNVERIFIED') {
      return NextResponse.json({ error: 'Please verify your email before logging in.' }, { status: 403 });
    }

    if (user.status === 'PENDING_APPROVAL') {
      return NextResponse.json({ error: 'Account pending approval by Admin' }, { status: 403 });
    }

    if (user.status === 'INACTIVE') {
      return NextResponse.json({ error: 'Account deactivated' }, { status: 403 });
    }

    const token = signToken({
      userId: user.id,
      role: user.role,
      orgId: user.orgId || undefined,
    }, '7d');

    // Return the token. In a real app we might set this in an HttpOnly cookie.
    const response = NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    }, { status: 200 });

    response.cookies.set('incident_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
