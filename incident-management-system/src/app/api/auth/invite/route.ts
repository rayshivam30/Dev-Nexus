import { NextResponse } from 'next/server';
import { signToken, verifyToken } from '@/lib/jwt';
import { Role } from '@prisma/client';

export async function POST(request: Request) {
  try {
    // Basic auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded || (decoded.role !== 'ADMIN' && decoded.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email, role, projectId, teamId } = await request.json() as {
      email?: string;
      role?: Role;
      projectId?: string;
      teamId?: string;
    };

    if (!email || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate an invite token that expires in 24 hours
    const inviteToken = signToken({
      email,
      role,
      orgId: decoded.orgId,
      projectId,
      teamId,
      invitedBy: decoded.userId
    }, '24h');


    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/accept-invite?token=${inviteToken}`;

    // Here we would use Nodemailer to send the email.
    // For MVP, we return the link directly in the response.

    return NextResponse.json({
      message: 'Invite link generated successfully',
      inviteLink
    }, { status: 200 });

  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
