import { NextResponse } from 'next/server';
import { registerAdmin } from '@/services/auth-service';
import { registerSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: 'Missing or invalid fields', details: result.error.flatten().fieldErrors }, { status: 400 });
    }

    const { email, password, orgName } = result.data;

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
