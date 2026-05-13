import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { moderateContent } from '@/lib/moderation';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = getDb();
    const comments = db.prepare(`
      SELECT * FROM comments 
      WHERE post_id = ? AND status = 'active' 
      ORDER BY created_at ASC
    `).all(id);

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('Fetch comments error:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // DDoS Mitigation: Global Request Limiting
    const { checkGlobalLimit, checkRateLimit, logSecurityEvent } = await import('@/lib/security');
    const globalLimit = checkGlobalLimit();
    if (!globalLimit.allowed) {
      return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
    }

    // Rate Limit: 30 comments per hour
    const rl = checkRateLimit(`comment-create:${session.userId}`, 30, 60 * 60 * 1000);
    if (!rl.allowed) {
      logSecurityEvent(session.userId, 'SPAM_PREVENTION_TRIGGERED', { action: 'comment_create' });
      return NextResponse.json({ 
        error: `Comment limit exceeded. Please wait ${rl.retryAfter} seconds before replying again.` 
      }, { status: 429 });
    }

    const { content, parentId } = await req.json();
    if (!content) return NextResponse.json({ error: 'Comment content is required' }, { status: 400 });

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
    const commentId = randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    // Calculate depth if replying to another comment
    let depth = 0;
    if (parentId) {
      const parent = db.prepare('SELECT depth FROM comments WHERE id = ?').get(parentId) as any;
      if (parent) depth = parent.depth + 1;
    }

    db.prepare(`
      INSERT INTO comments (id, post_id, parent_id, alias, content, depth, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(commentId, id, parentId || null, session.alias, content, depth, expiresAt);

    return NextResponse.json({ success: true, commentId });
  } catch (error) {
    console.error('Create comment error:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
