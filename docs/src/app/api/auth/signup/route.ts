import { NextResponse } from 'next/server';
import { createAccount } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { passphrase } = await request.json();

    if (!passphrase) {
      return NextResponse.json({ error: 'Passphrase is required' }, { status: 400 });
    }

    const result = await createAccount(passphrase);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, alias: result.alias });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
