import { getDb } from './db';

/**
 * Security Engine
 * Centralizes security policies, rate limiting, and audit logging.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter?: number;
}

const SUSPICIOUS_USER_AGENTS = [
  'python-requests',
  'curl',
  'wget',
  'postmanruntime',
  'node-fetch',
  'axios',
  'go-http-client'
];

/**
 * Basic Rate Limiter (Persistent via SQLite)
 * @param identifier Unique ID (e.g., phone number or session ID)
 * @param limit Max requests allowed in the window
 * @param windowMs Time window in milliseconds
 */
export function checkRateLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
  const db = getDb();
  const now = Date.now();
  const expiresAt = now + windowMs;

  // Cleanup expired entries occasionally (could be a separate worker, but doing it inline for simplicity)
  // delete from rate_limits where expires_at < ?
  
  const record = db.prepare('SELECT count, first_request, expires_at FROM rate_limits WHERE id = ?').get(identifier) as any;

  if (!record || now > record.expires_at) {
    // New window or expired record
    db.prepare(`
      INSERT OR REPLACE INTO rate_limits (id, count, first_request, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(identifier, 1, now, expiresAt);
    
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.expires_at - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  const newCount = record.count + 1;
  db.prepare('UPDATE rate_limits SET count = ? WHERE id = ?').run(newCount, identifier);

  return { allowed: true, remaining: limit - newCount };
}

/**
 * Global Request Limiter (DDoS Mitigation)
 * Checks if the total requests to a specific action exceed a safe threshold.
 */
export function checkGlobalLimit(action: string = 'PLATFORM_WIDE', limit: number = 50, windowMs: number = 1000): RateLimitResult {
  const identifier = `GLOBAL:${action}`;
  const res = checkRateLimit(identifier, limit, windowMs);
  if (!res.allowed) {
    logSecurityEvent(null, 'GLOBAL_RATE_LIMIT_TRIGGERED', { action, limit, windowMs });
  }
  return res;
}

/**
 * Audit Logger
 * Records security-sensitive events to the database.
 */
export function logSecurityEvent(userId: string | null, event: string, metadata: any = {}) {
  try {
    const db = getDb();
    const details = typeof metadata === 'string' ? metadata : JSON.stringify(metadata);
    
    db.prepare(`
      INSERT INTO security_audit_logs (user_id, event_type, details, ip_hash)
      VALUES (?, ?, ?, ?)
    `).run(
      userId,
      event,
      details,
      'SC-ANONYMIZED'
    );
    
    // Also log to console for real-time visibility during development
    console.log(`[SECURITY_AUDIT] ${event} | User: ${userId || 'ANON'} | Details: ${details}`);
  } catch (err) {
    console.error('Failed to log security event:', err);
  }
}

/**
 * Basic Bot Detection
 * Returns true if the request looks like a bot.
 */
export function isSuspiciousRequest(userAgent: string | null): boolean {
  if (!userAgent) return true; // Block requests with no UA
  
  const ua = userAgent.toLowerCase();
  return SUSPICIOUS_USER_AGENTS.some(bot => ua.includes(bot));
}

/**
 * Ephemeral Key Rotation
 * (Placeholder for more complex logic if needed)
 */
export function rotateKeys() {
  // Logic to invalidate old session keys or rotate encryption secrets
  console.log('[SECURITY] Ephemeral key rotation triggered.');
}
