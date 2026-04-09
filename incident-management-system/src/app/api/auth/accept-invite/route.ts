import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import { verifyToken, signToken, JwtPayload } from '@/lib/jwt';
import { acceptInviteSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = acceptInviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Missing or invalid fields', details: result.error.flatten() }, { status: 400 });
    }

    const { token, password } = result.data;

    // Verify the invite token
    const decoded = verifyToken(token) as JwtPayload;
    if (!decoded || !decoded.email || !decoded.role || !decoded.orgId) {
      return NextResponse.json({ error: 'Invalid or expired invite link' }, { status: 400 });
    }

    const { email, role, orgId, projectId, teamId } = decoded;

    // Managers and Developers can only register via invite.
    // Check if this email is already taken.
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: 'This email is already registered. Please log in instead.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);

    // Create the user as ACTIVE immediately — no approval needed for invited users
    // For MANAGER role, save the projectId from the invite token
    // For DEVELOPER role, save the teamId from the invite token
    const user = await prisma.user.create({
      data: {
        email: email as string,
        passwordHash,
        role,
        status: 'ACTIVE',
        orgId,
        ...(role === 'MANAGER' && projectId ? { projectId } : {}),
        ...(role === 'DEVELOPER' && teamId ? { teamId } : {}),
      },
    });

    // Sign a session token so the user is immediately logged in
    const sessionToken = signToken(
      { userId: user.id, role: user.role, orgId: user.orgId || undefined },
      '7d'
    );

    return NextResponse.json({
      message: 'Account created successfully',
      token: sessionToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
