import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getSession } from '@/lib/session';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // DDoS Mitigation: Global Request Limiting
  const { checkGlobalLimit } = await import('@/lib/security');
  const globalLimit = checkGlobalLimit('trust_global', 50, 60 * 1000);
  if (!globalLimit.allowed) {
    return NextResponse.json({ error: 'System busy. High load detected.' }, { status: 503 });
  }

  const { target_badge, value } = await req.json();
  if (value < -3 || value > 3 || !value) return NextResponse.json({ error: 'Invalid trust value' }, { status: 400 });

  const db = getDb();
  
  // Find receiver alias from badge number
  const receiver = db.prepare('SELECT alias FROM users WHERE id = ?').get(target_badge) as { alias: string } | undefined;
  if (!receiver) return NextResponse.json({ error: 'Target node not found' }, { status: 404 });
  const receiver_alias = receiver.alias;
  
  // Check limits: Max 2 people per day
  const dailyCount = db.prepare(`
    SELECT COUNT(*) as count FROM trust_history 
    WHERE giver_alias = ? AND created_at > datetime('now', '-1 day')
  `).get(session.alias) as { count: number };

  if (dailyCount.count >= 2) {
    return NextResponse.json({ error: 'Daily trust limit reached (2 per day)' }, { status: 429 });
  }

  // Check 2-day limit for unique person
  const recentTrust = db.prepare(`
    SELECT * FROM trust_history 
    WHERE giver_alias = ? AND receiver_alias = ? AND created_at > datetime('now', '-2 days')
  `).get(session.alias, receiver_alias);

  if (recentTrust) {
    return NextResponse.json({ error: 'You can only trust this person once every 2 days' }, { status: 429 });
  }

  try {
    const transaction = db.transaction(() => {
      db.prepare(`
        INSERT INTO trust_history (id, giver_alias, receiver_alias, points)
        VALUES (?, ?, ?, ?)
      `).run(randomUUID(), session.alias, receiver_alias, value);

      db.prepare(`
        UPDATE users SET trust_score = trust_score + ? WHERE alias = ?
      `).run(value, receiver_alias);
    });

    transaction();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDb();
  const user = db.prepare('SELECT trust_score FROM users WHERE alias = ?').get(session.alias) as { trust_score: number };
  
  return NextResponse.json({ trust_score: user?.trust_score || 0 });
}
