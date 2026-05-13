import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function DELETE(
  request: Request, 
  { params }: { params: Promise<{ id: string, msgId: string }> }
) {
  try {
    const { id, msgId } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // DDoS Mitigation
    const { checkGlobalLimit, logSecurityEvent } = await import('@/lib/security');
    if (!checkGlobalLimit('MESSAGE_DELETION').allowed) {
      return NextResponse.json({ error: 'System high load. Try later.' }, { status: 503 });
    }

    const db = getDb();
    
    // Check if user is the author or the room admin
    const msg = db.prepare('SELECT alias, room_id FROM room_messages WHERE id = ?').get(msgId) as any;
    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    const room = db.prepare('SELECT creator_alias FROM chat_rooms WHERE id = ?').get(msg.room_id) as any;
    
    const isAuthor = msg.alias === session.alias;
    const isRoomAdmin = room && room.creator_alias === session.alias;

    if (!isAuthor && !isRoomAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Instead of hard delete, we update the status to 'deleted' for privacy record or just delete
    // The user asked for "chats can also be deleted"
    db.prepare('DELETE FROM room_messages WHERE id = ?').run(msgId);

    // Audit Log
    logSecurityEvent(session.userId, 'MESSAGE_DELETED', { roomId: id, messageId: msgId, alias: msg.alias });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json({ error: 'Failed to delete message' }, { status: 500 });
  }
}
