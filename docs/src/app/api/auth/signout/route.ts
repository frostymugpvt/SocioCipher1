import { NextResponse } from 'next/server';
import { getSession, destroySession, clearSessionCookie } from '@/lib/session';

export async function POST() {
  try {
    const session = await getSession();
    
    if (session) {
      await destroySession(session.sessionId);
    }
    
    await clearSessionCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Signout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
