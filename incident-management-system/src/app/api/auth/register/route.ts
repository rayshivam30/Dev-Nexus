import { NextResponse } from 'next/server';
import { registerAdmin } from '@/services/auth-service';
import { registerSchema } from '@/lib/validations';
import { sendMail } from '@/lib/mailer';
import { getBaseUrl } from '@/lib/utils';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Missing or invalid fields', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, orgName } = result.data;

    const { user, verificationToken } = await registerAdmin(email, password, orgName);

    // ── Send Verification Email ───────────────────────────────────────────
    try {
      const baseUrl = getBaseUrl();
      const verifyUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

      await sendMail({
        to: email,
        subject: "Verify your DevNexus Account",
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 10px solid black; padding: 40px;">
            <h1 style="text-transform: uppercase; font-style: italic; font-weight: 900; font-size: 40px; margin-bottom: 20px;">Verify Your Account</h1>
            <p style="font-weight: bold; font-size: 16px; margin-bottom: 30px;">Welcome to the nexus. Please confirm your email to activate your command console.</p>
            <a href="${verifyUrl}" style="display: inline-block; background: #FFD700; color: black; border: 4px solid black; padding: 20px 40px; text-decoration: none; font-weight: 900; text-transform: uppercase; box-shadow: 8px 8px 0 0 black;">
              Activate Account
            </a>
            <p style="margin-top: 40px; font-size: 12px; font-weight: bold; color: #666;">If you didn't create this account, please ignore this email.</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    return NextResponse.json({
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id
    }, { status: 201 });

  } catch (error) {
    if (error instanceof Error && error.message === 'Email already in use') {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

