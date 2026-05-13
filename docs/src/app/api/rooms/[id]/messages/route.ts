import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { moderateContent } from '@/lib/moderation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const messages = db.prepare(`
      SELECT * FROM room_messages 
      WHERE room_id = ? AND status = 'active' 
      ORDER BY created_at ASC
    `).all(id);

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Fetch room messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DDoS Mitigation: Global Request Limiting
    const { checkGlobalLimit, checkRateLimit, logSecurityEvent } = await import('@/lib/security');
    const globalLimit = checkGlobalLimit('room_msg_global', 200, 60 * 1000);
    if (!globalLimit.allowed) {
      return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
    }

    // Rate Limit: 30 messages per minute per room
    const rl = checkRateLimit(`room-msg:${session.userId}:${id}`, 30, 60 * 1000);
    if (!rl.allowed) {
      logSecurityEvent(session.userId, 'MESSAGE_FLOOD_DETECTED', { roomId: id });
      return NextResponse.json({ 
        error: `Message limit exceeded. Please wait ${rl.retryAfter} seconds.` 
      }, { status: 429 });
    }

    const db = getDb();
    
    // Permission check
    const room = db.prepare('SELECT creator_alias, is_restricted FROM chat_rooms WHERE id = ?').get(id) as any;
    if (room && room.is_restricted && room.creator_alias !== session.alias) {
      return NextResponse.json({ error: 'This channel is restricted to owner messages only.' }, { status: 403 });
    }

    const { content, ciphertext, iv } = await request.json();
    if (!content && !ciphertext) {
      return NextResponse.json({ error: 'Message content or ciphertext is required' }, { status: 400 });
    }

    // Run AI Moderation on plaintext content
    if (content) {
      const moderation = await moderateContent(content, session.alias);
      if (!moderation.allowed) {
        return NextResponse.json({ 
          error: 'Content policy violation', 
          flag: moderation.flag,
          reason: moderation.reason 
        }, { status: 422 });
      }
    }
    const messageId = randomUUID();
    // Default expiry 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    db.prepare(`
      INSERT INTO room_messages (id, room_id, alias, content, ciphertext, iv, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(messageId, id, session.alias, content || null, ciphertext || null, iv || null, expiresAt);

    // Update last_message_at in chat_rooms
    db.prepare(`
      UPDATE chat_rooms SET last_message_at = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);

    return NextResponse.json({ success: true, messageId });
  } catch (error) {
    console.error('Create room message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
