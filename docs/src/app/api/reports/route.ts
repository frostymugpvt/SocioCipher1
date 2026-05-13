import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { logSecurityEvent } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentType, contentId, category, evidence, reason } = await request.json();
    if (!contentType || !contentId) {
      return NextResponse.json({ error: 'Missing content identifier' }, { status: 400 });
    }

    // DDoS Mitigation
    const { checkGlobalLimit } = await import('@/lib/security');
    if (!checkGlobalLimit('REPORT_SUBMISSION').allowed) {
      return NextResponse.json({ error: 'System high load. Try later.' }, { status: 503 });
    }

    const db = getDb();
    const reportId = randomUUID();
    
    // Store the report for moderator review
    // 'evidence' contains the decrypted text provided by the reporter (Option B)
    db.prepare(`
      INSERT INTO reports (id, reporter_alias, content_type, content_id, category, evidence, reason)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(reportId, session.alias, contentType, contentId, category, evidence || null, reason || null);
    // Log security event for audit trail
    logSecurityEvent(session.userId, 'CONTENT_REPORTED', { contentType, contentId, category, reportId });

    // Also increment flag count on the original item
    let table = '';
    switch (contentType) {
      case 'post': table = 'posts'; break;
      case 'room': table = 'chat_rooms'; break;
      case 'room_message': table = 'room_messages'; break;
      case 'comment': table = 'comments'; break;
    }

    if (table) {
      db.prepare(`
        UPDATE ${table} SET report_count = report_count + 1 WHERE id = ?
      `).run(contentId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Safety report error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getSession();
    // Only 'admin' or system can view reports (simplified check)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const reports = db.prepare(`
      SELECT * FROM reports ORDER BY created_at DESC LIMIT 50
    `).all();

    logSecurityEvent(session.userId, 'ADMIN_REPORT_LIST_ACCESS', { count: reports.length });

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Fetch reports error:', error);
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 });
  }
}
