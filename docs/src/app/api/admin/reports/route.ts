import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    
    const reports = db.prepare(`
      SELECT r.*, 
        CASE 
          WHEN r.content_type = 'post' THEN (SELECT content FROM posts WHERE id = r.content_id)
          WHEN r.content_type = 'comment' THEN (SELECT content FROM comments WHERE id = r.content_id)
          WHEN r.content_type = 'room_message' THEN (SELECT content FROM room_messages WHERE id = r.content_id)
          WHEN r.content_type = 'room' THEN (SELECT name FROM chat_rooms WHERE id = r.content_id)
        END as content_snippet
      FROM reports r 
      ORDER BY r.created_at DESC
    `).all();

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error('Fetch reports error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
