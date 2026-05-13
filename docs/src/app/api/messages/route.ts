import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { moderateContent } from '@/lib/moderation';

// POST /api/messages — send a DM to a badge ID
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // DDoS Mitigation: Global Request Limiting
  const { checkGlobalLimit, checkRateLimit, logSecurityEvent } = await import('@/lib/security');
  const globalLimit = checkGlobalLimit();
  if (!globalLimit.allowed) {
    return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
  }

  // Rate Limit: 100 DMs per hour
  const rl = checkRateLimit(`dm-send:${session.userId}`, 100, 60 * 60 * 1000);
  if (!rl.allowed) {
    logSecurityEvent(session.userId, 'SPAM_PREVENTION_TRIGGERED', { action: 'dm_send' });
    return NextResponse.json({ 
      error: `Messaging limit reached. Please wait ${rl.retryAfter} seconds.` 
    }, { status: 429 });
  }

  const { receiver_badge, content } = await req.json();
  if (!receiver_badge || !content?.trim()) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // Run AI Moderation
  const moderation = await moderateContent(content, session.alias);
  if (!moderation.allowed) {
    return NextResponse.json({ 
      error: 'Content policy violation', 
      flag: moderation.flag,
      reason: moderation.reason 
    }, { status: 422 });
  }


  const db = getDb();

  // Get sender badge ID
  const sender = db.prepare('SELECT id FROM users WHERE alias = ?').get(session.alias) as { id: string } | undefined;
  if (!sender) return NextResponse.json({ error: 'Sender not found' }, { status: 404 });

  // Validate receiver exists
  const receiver = db.prepare('SELECT id FROM users WHERE id = ?').get(receiver_badge) as { id: string } | undefined;
  if (!receiver) return NextResponse.json({ error: 'Target badge not found' }, { status: 404 });

  // Block self-messaging
  if (sender.id === receiver_badge) {
    return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
  }

  try {
    db.prepare(`
      INSERT INTO direct_messages (id, sender_id, receiver_id, content)
      VALUES (?, ?, ?, ?)
    `).run(crypto.randomUUID(), sender.id, receiver_badge, content);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/messages — fetch DM thread between current user and ?with=<badge_id>
// Also supports GET /api/messages (no param) to list all unique conversations
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const myUser = db.prepare('SELECT id FROM users WHERE alias = ?').get(session.alias) as { id: string } | undefined;
  if (!myUser) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const withBadge = req.nextUrl.searchParams.get('with');

  if (withBadge) {
    // Fetch thread between me and another badge
    const messages = db.prepare(`
      SELECT dm.*, 
        CASE WHEN dm.sender_id = ? THEN 'sent' ELSE 'received' END as direction
      FROM direct_messages dm
      WHERE (dm.sender_id = ? AND dm.receiver_id = ?)
         OR (dm.sender_id = ? AND dm.receiver_id = ?)
      ORDER BY dm.created_at ASC
    `).all(myUser.id, myUser.id, withBadge, withBadge, myUser.id);

    // Mark received as read
    db.prepare(`
      UPDATE direct_messages SET is_read = 1
      WHERE receiver_id = ? AND sender_id = ? AND is_read = 0
    `).run(myUser.id, withBadge);

    return NextResponse.json({ messages });
  }

  // Return list of unique conversations (latest message from each thread)
  const conversations = db.prepare(`
    SELECT 
      CASE WHEN dm.sender_id = ? THEN dm.receiver_id ELSE dm.sender_id END as peer_badge,
      dm.content as last_message,
      dm.created_at as last_at,
      SUM(CASE WHEN dm.receiver_id = ? AND dm.is_read = 0 THEN 1 ELSE 0 END) as unread_count
    FROM direct_messages dm
    WHERE dm.sender_id = ? OR dm.receiver_id = ?
    GROUP BY peer_badge
    ORDER BY last_at DESC
  `).all(myUser.id, myUser.id, myUser.id, myUser.id);

  return NextResponse.json({ conversations });
}
