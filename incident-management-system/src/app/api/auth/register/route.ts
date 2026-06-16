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
    let emailSent = false;
    try {
      const baseUrl = getBaseUrl();
      const verifyUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

      const mailResult = await sendMail({
        to: email,
        subject: "Verify your DevNexus Account",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0a0a0c; border: 1px solid rgba(255, 255, 255, 0.08); padding: 48px; border-radius: 16px; color: #ffffff; text-align: center;">
            <h1 style="font-weight: 800; font-size: 32px; margin-bottom: 16px; letter-spacing: -0.025em; color: #ffffff;">Verify Your Account</h1>
            <p style="font-size: 15px; line-height: 1.6; margin-bottom: 32px; color: #a1a1aa;">Welcome to DevNexus. Please confirm your email to activate your command console and join your organization.</p>
            <a href="${verifyUrl}" style="display: inline-block; background-color: #ffffff; color: #000000; padding: 14px 32px; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 8px; transition: background-color 0.2s ease;">
              Activate Account
            </a>
            <p style="margin-top: 48px; font-size: 12px; color: #52525b;">If you didn't create this account, please ignore this email.</p>
          </div>
        `,
      });
      if (mailResult) {
        emailSent = true;
      }
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
    }

    if (!emailSent) {
      return NextResponse.json({
        message: 'Registration successful, but we could not send the verification email. Please contact support.',
        userId: user.id,
        warning: 'email_delivery_failed'
      }, { status: 201 });
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

