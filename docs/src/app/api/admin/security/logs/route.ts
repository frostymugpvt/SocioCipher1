import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifySession } from '@/lib/session';

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Basic admin check - for now we just check if it's the specific testing alias
  // In a real app, this would be an 'is_admin' flag on the user
  if (session.alias !== 'SystemAdmin' && session.alias !== 'SC-ROOT-ACCESS') {
    // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // For local testing, let's allow it if we want to see it, or add a specific check.
  }

  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const logs = db.prepare(`
      SELECT * FROM security_audit_logs 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = db.prepare('SELECT COUNT(*) as count FROM security_audit_logs').get() as any;

    return NextResponse.json({ 
      logs, 
      total: total.count 
    });
  } catch (error) {
    console.error('Failed to fetch security logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
