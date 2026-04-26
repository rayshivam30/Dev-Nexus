import { NextResponse } from 'next/server';
import { verifyEmail } from '@/services/auth-service';
import { getBaseUrl } from '@/lib/utils';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
    }

    await verifyEmail(token);

    // Redirect to login page with a success message
    const baseUrl = getBaseUrl();
    return NextResponse.redirect(`${baseUrl}/auth/login?verified=true`);

  } catch (error) {
    console.error('Verification error:', error);
    const baseUrl = getBaseUrl();
    return NextResponse.redirect(`${baseUrl}/auth/login?error=verification_failed`);
  }
}
