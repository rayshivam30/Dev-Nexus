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
    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
