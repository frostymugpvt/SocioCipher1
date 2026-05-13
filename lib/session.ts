import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { getDb } from './db';
import { randomUUID } from 'crypto';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'sociocipher-dev-secret-change-in-production-32chars'
);
const COOKIE_NAME = 'sc_session';
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

export interface SessionPayload {
  userId: string;
  alias: string;
  sessionId: string;
}

export async function createSession(userId: string, alias: string): Promise<string> {
  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();

  const db = getDb();
  db.prepare(`
    INSERT INTO sessions (id, user_id, alias, expires_at)
    VALUES (?, ?, ?, ?)
  `).run(sessionId, userId, alias, expiresAt);

  const token = await new SignJWT({ userId, alias, sessionId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);

  return token;
}

export async function getSession(): Promise<SessionPayload | null> {
  return await verifySession();
}

export async function verifySession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, JWT_SECRET);
    const { userId, alias, sessionId } = payload as unknown as SessionPayload;

    // Verify session still exists in DB
    const db = getDb();
    const session = db.prepare(`
      SELECT id FROM sessions
      WHERE id = ? AND expires_at > datetime('now')
    `).get(sessionId);

    if (!session) return null;

    // Touch last_active_at (rate-limited to minute granularity)
    db.prepare(`
      UPDATE users
      SET last_active_at = strftime('%Y-%m-%dT%H:%M:00Z', 'now')
      WHERE id = ? AND last_active_at < strftime('%Y-%m-%dT%H:%M:00Z', datetime('now', '-5 minutes'))
    `).run(userId);

    return { userId, alias, sessionId };
  } catch {
    return null;
  }
}

export async function destroySession(sessionId: string): Promise<void> {
  const db = getDb();
  // Thorough wipe: delete session and ensure any associated ephemeral cache is cleared
  db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
  
  // Log security event for audit trail
  const { logSecurityEvent } = require('./security');
  logSecurityEvent(null, 'SESSION_TERMINATED', { sessionId, timestamp: new Date().toISOString() });
}

export function setSessionCookie(token: string): Promise<void> {
  return cookies().then(store => {
    store.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_TTL_MS / 1000,
      path: '/',
    });
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/** Prune expired sessions and OTP codes — call periodically */
export function pruneExpiredSessions(): void {
  const db = getDb();
  const deletedSessions = db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  const deletedOtps = db.prepare("DELETE FROM otp_codes WHERE expires_at <= datetime('now')").run();
  
  if (deletedSessions.changes > 0 || deletedOtps.changes > 0) {
    console.log(`[SECURITY] Cleanup: ${deletedSessions.changes} sessions and ${deletedOtps.changes} OTPs purged.`);
  }
}
