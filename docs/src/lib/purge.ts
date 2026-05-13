import cron from 'node-cron';
import { getDb } from './db';

/**
 * Purge Engine (lib/purge.ts)
 * 
 * Automatically deletes expired posts, messages, and sessions.
 * This is crucial for SocioCipher's ephemerality and zero-knowledge model.
 */

export function startPurgeJob() {
  // Run every hour
  cron.schedule('0 * * * *', () => {
    console.log('[PURGE] Starting automated cleanup cycle...');
    const db = getDb();
    const now = new Date().toISOString();

    try {
      // 1. Purge Expired Posts
      const postResult = db.prepare("DELETE FROM posts WHERE expires_at < ? AND status != 'held'").run(now);
      if (postResult.changes > 0) console.log(`[PURGE] Deleted ${postResult.changes} expired posts.`);

      // 2. Purge Expired Comments
      const commentResult = db.prepare("DELETE FROM comments WHERE expires_at < ?").run(now);
      if (commentResult.changes > 0) console.log(`[PURGE] Deleted ${commentResult.changes} expired comments.`);

      // 3. Purge Expired Room Messages
      const msgResult = db.prepare("DELETE FROM room_messages WHERE expires_at < ?").run(now);
      if (msgResult.changes > 0) console.log(`[PURGE] Deleted ${msgResult.changes} expired messages.`);

      // 4. Purge Expired Sessions
      const sessionResult = db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
      if (sessionResult.changes > 0) console.log(`[PURGE] Cleared ${sessionResult.changes} stale sessions.`);

      // 5. Purge Stale OTPs
      db.prepare("DELETE FROM otp_codes WHERE expires_at < ?").run(now);

    } catch (error) {
      console.error('[PURGE] Error during cleanup:', error);
    }
  });
}
