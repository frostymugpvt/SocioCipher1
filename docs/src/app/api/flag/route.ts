import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DDoS Mitigation: Global Request Limiting
    const { checkGlobalLimit, checkRateLimit, logSecurityEvent } = await import('@/lib/security');
    const globalLimit = checkGlobalLimit();
    if (!globalLimit.allowed) {
      return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
    }

    // Rate Limit: 20 flags per hour
    const rl = checkRateLimit(`flag-report:${session.userId}`, 20, 60 * 60 * 1000);
    if (!rl.allowed) {
      logSecurityEvent(session.userId, 'SPAM_PREVENTION_TRIGGERED', { action: 'flag_report' });
      return NextResponse.json({ 
        error: `Flag limit exceeded. Please wait ${rl.retryAfter} seconds.` 
      }, { status: 429 });
    }

    const { type, id } = await request.json();
    if (!type || !id) {
      return NextResponse.json({ error: 'Missing type or id' }, { status: 400 });
    }

    const db = getDb();
    let table = '';
    
    switch (type) {
      case 'post': table = 'posts'; break;
      case 'room': table = 'chat_rooms'; break;
      case 'community': table = 'communities'; break;
      case 'thread': table = 'threads'; break;
      case 'comment': table = 'comments'; break;
      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    // Check if user already flagged (optional, but let's keep it simple and just increment)
    // In a real app, we'd have a 'reports' table to track who reported what.
    
    db.prepare(`
      UPDATE ${table} 
      SET report_count = report_count + 1 
      WHERE id = ?
    `).run(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Flagging error:', error);
    return NextResponse.json({ error: 'Failed to flag' }, { status: 500 });
  }
}
