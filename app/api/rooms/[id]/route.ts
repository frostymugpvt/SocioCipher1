import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const room = db.prepare('SELECT * FROM chat_rooms WHERE id = ?').get(id);
    if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    return NextResponse.json({ success: true, room });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch room' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description, logo, is_restricted } = await request.json();
    
    // DDoS Mitigation
    const { checkGlobalLimit, logSecurityEvent } = await import('@/lib/security');
    if (!checkGlobalLimit('ROOM_MANAGEMENT').allowed) {
      return NextResponse.json({ error: 'System high load. Try later.' }, { status: 503 });
    }

    const db = getDb();

    // Check ownership
    const room = db.prepare('SELECT creator_alias FROM chat_rooms WHERE id = ?').get(id) as any;
    if (!room || room.creator_alias !== session.alias) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare(`
      UPDATE chat_rooms 
      SET name = ?, description = ?, logo_id = ?, is_restricted = ? 
      WHERE id = ?
    `).run(name, description, logo || 'default', is_restricted || 0, id);

    // Audit Log
    logSecurityEvent(session.userId, 'ROOM_MODIFIED', { roomId: id, name });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update room' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // DDoS Mitigation
    const { checkGlobalLimit, logSecurityEvent } = await import('@/lib/security');
    if (!checkGlobalLimit('ROOM_DELETION').allowed) {
      return NextResponse.json({ error: 'System high load. Try later.' }, { status: 503 });
    }

    const db = getDb();
    const room = db.prepare('SELECT creator_alias FROM chat_rooms WHERE id = ?').get(id) as any;
    if (!room || room.creator_alias !== session.alias) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM chat_rooms WHERE id = ?').run(id);

    // Audit Log
    logSecurityEvent(session.userId, 'ROOM_DELETED', { roomId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete room' }, { status: 500 });
  }
}
