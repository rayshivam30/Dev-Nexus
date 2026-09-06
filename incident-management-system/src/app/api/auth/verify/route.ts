import { NextResponse } from 'next/server';
import { verifyEmail } from '@/services/auth-service';
import { getBaseUrl } from '@/lib/utils';
import { logger } from '@/lib/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      const baseUrl = getBaseUrl();
      return NextResponse.redirect(`${baseUrl}/auth/login?error=verification_failed`);
    }

    await verifyEmail(token);

    // Redirect to login page with a success message
    const baseUrl = getBaseUrl();
    return NextResponse.redirect(`${baseUrl}/auth/login?verified=true`);

  } catch (error) {
    logger.error({ err: error }, "Verification error");
    const baseUrl = getBaseUrl();
    return NextResponse.redirect(`${baseUrl}/auth/login?error=verification_failed`);
  }
}
