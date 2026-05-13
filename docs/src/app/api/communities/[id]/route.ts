import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const db = getDb();
    const community = db.prepare('SELECT * FROM communities WHERE id = ?').get(id);
    if (!community) return NextResponse.json({ error: 'Community not found' }, { status: 404 });
    return NextResponse.json({ success: true, community });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch community' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, description } = await request.json();
    const db = getDb();

    // Check ownership
    const comm = db.prepare('SELECT creator_alias FROM communities WHERE id = ?').get(id) as any;
    if (!comm || comm.creator_alias !== session.alias) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare(`
      UPDATE communities 
      SET name = ?, description = ? 
      WHERE id = ?
    `).run(name, description, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update community' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const comm = db.prepare('SELECT creator_alias FROM communities WHERE id = ?').get(id) as any;
    if (!comm || comm.creator_alias !== session.alias) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    db.prepare('DELETE FROM communities WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete community' }, { status: 500 });
  }
}
