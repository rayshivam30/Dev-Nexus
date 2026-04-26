import { NextResponse } from 'next/server';
import { signToken, verifyToken } from '@/lib/jwt';
import { inviteSchema } from '@/lib/validations';
import { getBaseUrl } from '@/lib/utils';

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

    const body = await request.json();
    const result = inviteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Missing or invalid fields', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, role, projectId, teamId } = result.data;

    // Generate an invite token that expires in 24 hours
    const inviteToken = signToken({
      email,
      role,
      orgId: decoded.orgId,
      projectId,
      teamId,
      invitedBy: decoded.userId
    }, '24h');


    const baseUrl = getBaseUrl();
    const inviteLink = `${baseUrl}/auth/accept-invite?token=${inviteToken}`;

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
