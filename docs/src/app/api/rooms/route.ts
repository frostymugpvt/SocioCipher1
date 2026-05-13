import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const db = getDb();
    // Try to get session for is_joined flag (optional — public rooms visible to all)
    let alias: string | null = null;
    try {
      const session = await getSession();
      alias = session?.alias ?? null;
    } catch (_) {}

    const rooms = alias
      ? db.prepare(`
          SELECT r.*,
            (SELECT COUNT(*) FROM room_memberships WHERE room_id = r.id) as member_count,
            EXISTS(SELECT 1 FROM room_memberships WHERE room_id = r.id AND alias = ?) as is_joined
          FROM chat_rooms r
          WHERE r.status = 'active'
          ORDER BY r.created_at DESC
        `).all(alias)
      : db.prepare(`
          SELECT r.*,
            (SELECT COUNT(*) FROM room_memberships WHERE room_id = r.id) as member_count,
            0 as is_joined
          FROM chat_rooms r
          WHERE r.status = 'active'
          ORDER BY r.created_at DESC
        `).all();

    return NextResponse.json({ success: true, rooms });
  } catch (error) {
    console.error('List rooms error:', error);
    return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, logo, community_id, is_restricted } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Room name is required' }, { status: 400 });
    }

    // DDoS Mitigation: Global Request Limiting
    const { checkGlobalLimit } = await import('@/lib/security');
    const globalLimit = checkGlobalLimit('ROOM_CREATION');
    if (!globalLimit.allowed) {
      return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
    }

    const db = getDb();
    const roomId = randomUUID();

    db.prepare(`
      INSERT INTO chat_rooms (id, name, description, creator_alias, logo_id, community_id, is_restricted)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(roomId, name, description || '', session.alias, logo || 'default', community_id || null, is_restricted || 0);

    // Auto-join creator as admin
    db.prepare(`
      INSERT INTO room_memberships (id, room_id, alias, role)
      VALUES (?, ?, ?, ?)
    `).run(randomUUID(), roomId, session.alias, 'admin');

    // Audit Log
    const { logSecurityEvent } = await import('@/lib/security');
    logSecurityEvent(session.userId, 'ROOM_CREATED', { roomId, name, community_id });

    return NextResponse.json({ success: true, roomId });
  } catch (error) {
    console.error('Create room error:', error);
    return NextResponse.json({ error: 'Failed to create room' }, { status: 500 });
  }
}
