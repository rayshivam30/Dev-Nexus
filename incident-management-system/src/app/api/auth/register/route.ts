import { NextResponse } from 'next/server';
import { registerAdmin } from '@/services/auth-service';

export async function POST(request: Request) {
  try {
    const { email, password, orgName } = await request.json();

    if (!email || !password || !orgName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await registerAdmin(email, password, orgName);

    return NextResponse.json({
      message: 'Registration successful. Organization created.',
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

