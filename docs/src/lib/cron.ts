import cron from 'node-cron';
import { getDb } from './db';

// Run every hour at minute 0
export function startCronJobs() {
  console.log('Starting background jobs...');
  
  cron.schedule('0 * * * *', () => {
    console.log('Running expiry cleanup job...');
    const db = getDb();
    
    // 1. Delete expired posts (and their comments via CASCADE if we set it up, otherwise manually)
    // First let's get the IDs to log them or just run delete
    const resultPosts = db.prepare(`
      DELETE FROM posts 
      WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:00Z', 'now') 
      AND retention_hold = 0
    `).run();
    console.log(`Deleted ${resultPosts.changes} expired posts.`);

    // 2. Delete expired comments
    const resultComments = db.prepare(`
      DELETE FROM comments 
      WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:00Z', 'now') 
      AND retention_hold = 0
    `).run();
    console.log(`Deleted ${resultComments.changes} expired comments.`);

    // 3. Delete expired room messages
    const resultMessages = db.prepare(`
      DELETE FROM room_messages 
      WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:00Z', 'now') 
      AND retention_hold = 0
    `).run();
    console.log(`Deleted ${resultMessages.changes} expired room messages.`);

    // 4. Delete inactive users (> 20 days)
    // Also deletes their content via cascade if foreign keys are setup correctly
    const resultUsers = db.prepare(`
      DELETE FROM users 
      WHERE last_active_at <= strftime('%Y-%m-%dT%H:%M:00Z', datetime('now', '-20 days'))
    `).run();
    console.log(`Deleted ${resultUsers.changes} inactive accounts.`);

    // 5. Prune expired sessions
    const resultSessions = db.prepare(`
      DELETE FROM sessions 
      WHERE expires_at <= datetime('now')
    `).run();
    console.log(`Pruned ${resultSessions.changes} expired sessions.`);
  });
}
