import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';
import { randomUUID } from 'crypto';
import { moderateContent } from '@/lib/moderation';

export async function GET() {
  try {
    const db = getDb();
    const posts = db.prepare(`
      SELECT p.id, p.alias, p.content, p.created_at, p.expires_at, p.status, p.report_count, u.id as badgeNumber
      FROM posts p
      JOIN users u ON p.alias = u.alias
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
    `).all();
    
    return NextResponse.json({ success: true, posts });
  } catch (error) {
    console.error('List posts error:', error);
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
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
    const globalLimit = checkGlobalLimit();
    if (!globalLimit.allowed) {
      return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
    }

    const { content } = await request.json();

    // Rate Limit: 10 posts per hour
    const { checkRateLimit, logSecurityEvent } = await import('@/lib/security');
    const rl = checkRateLimit(`post-create:${session.userId}`, 10, 60 * 60 * 1000);
    if (!rl.allowed) {
      logSecurityEvent(session.userId, 'SPAM_PREVENTION_TRIGGERED', { action: 'post_create' });
      return NextResponse.json({ 
        error: `Post limit exceeded. Please wait ${rl.retryAfter} seconds before posting again.` 
      }, { status: 429 });
    }
    if (!content) {
      return NextResponse.json({ error: 'Post content is required' }, { status: 400 });
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
    const postId = randomUUID();
    // Default expiry 7 days
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    db.prepare(`
      INSERT INTO posts (id, alias, content, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(postId, session.alias, content, expiresAt);

    return NextResponse.json({ success: true, postId });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 });
  }
}
