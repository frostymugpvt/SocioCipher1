import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';

export async function GET() {
  try {
    const db = getDb();
    const communities = db.prepare(`
      SELECT c.*, 
        (SELECT COUNT(DISTINCT rm.alias) 
         FROM room_memberships rm 
         JOIN chat_rooms r ON rm.room_id = r.id 
         WHERE r.community_id = c.id) as member_count
      FROM communities c
      WHERE c.status = 'active'
      ORDER BY c.created_at ASC
    `).all();

    
    return NextResponse.json({ success: true, communities });
  } catch (error) {
    console.error('List communities error:', error);
    return NextResponse.json({ error: 'Failed to fetch communities' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DDoS Mitigation: Global Request Limiting
    const { checkGlobalLimit } = await import('@/lib/security');
    const globalLimit = checkGlobalLimit('community_create_global', 20, 60 * 1000);
    if (!globalLimit.allowed) {
      return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
    }

    const { name, description } = await request.json();
    if (!name) {
      return NextResponse.json({ error: 'Community name is required' }, { status: 400 });
    }

    const db = getDb();
    const communityId = randomUUID();
    
    db.prepare(`
      INSERT INTO communities (id, name, description, creator_alias)
      VALUES (?, ?, ?, ?)
    `).run(communityId, name, description, session.alias);

    return NextResponse.json({ success: true, communityId });
  } catch (error) {
    console.error('Create community error:', error);
    return NextResponse.json({ error: 'Failed to create community' }, { status: 500 });
  }
}
