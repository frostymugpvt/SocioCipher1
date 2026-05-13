import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { action } = await request.json();
    const db = getDb();
    
    const report = db.prepare('SELECT * FROM reports WHERE id = ?').get(id) as any;
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (action === 'dismiss') {
      db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('dismissed', id);
    } else if (action === 'delete_content') {
      db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('resolved', id);
      
      let table = '';
      if (report.content_type === 'post') table = 'posts';
      if (report.content_type === 'comment') table = 'comments';
      if (report.content_type === 'room_message') table = 'room_messages';
      if (report.content_type === 'room') table = 'chat_rooms';

      if (table) {
        db.prepare(`UPDATE ${table} SET status = 'deleted' WHERE id = ?`).run(report.content_id);
      }
    } else if (action === 'ban_user') {
        db.prepare('UPDATE reports SET status = ? WHERE id = ?').run('resolved', id);
        
        let table = '';
        if (report.content_type === 'post') table = 'posts';
        if (report.content_type === 'comment') table = 'comments';
        if (report.content_type === 'room_message') table = 'room_messages';
        if (report.content_type === 'room') table = 'chat_rooms';
  
        if (table) {
          const content = db.prepare(`SELECT alias FROM ${table} WHERE id = ?`).get(report.content_id) as any;
          if (content && content.alias) {
             db.prepare(`UPDATE users SET account_status = 'suspended' WHERE alias = ?`).run(content.alias);
             db.prepare(`UPDATE ${table} SET status = 'deleted' WHERE id = ?`).run(report.content_id);
          }
        }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update report error', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
