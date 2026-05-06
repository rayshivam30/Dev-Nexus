import { NextResponse } from 'next/server';
import { signToken } from '@/lib/jwt';
import { inviteSchema } from '@/lib/validations';
import { getBaseUrl } from '@/lib/utils';
import { withAuth } from '@/lib/api-utils';
import { sendMail } from '@/lib/mailer';

export const POST = withAuth(async (request, { decoded, body }) => {
  try {
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

    // Send email with the invite link
    try {
      await sendMail({
        to: email,
        subject: `You're invited to join DevNexus as a ${role.toLowerCase()}! 🚀`,
        html: `
          <h2>You are invited to join DevNexus</h2>
          <p>You have been invited as a <strong>${role}</strong>.</p>
          <p>Click the link below to accept your invitation and set up your account:</p>
          <a href="${inviteLink}">${inviteLink}</a>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send invite email:', emailError);
    }

    return NextResponse.json({
      message: 'Invite link generated and sent successfully',
      inviteLink
    }, { status: 200 });

  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, ['ADMIN', 'MANAGER']);


