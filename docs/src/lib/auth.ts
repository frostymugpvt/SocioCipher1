import { getDb } from './db';
import { generateAlias } from './alias';
import { createSession, setSessionCookie, getSession } from './session';
import { generateBadgeNumber, generateOTP } from './id';

export { getSession };

export interface AuthResult {
  ok: boolean;
  error?: string;
  alias?: string;
  token?: string;
  badgeNumber?: string;
}

/**
 * Generates and stores an OTP for the given phone number.
 * In a real app, this would send an SMS.
 */
export async function sendOTP(phoneNumber: string): Promise<AuthResult> {
  if (!phoneNumber || phoneNumber.length < 10) {
    return { ok: false, error: 'Invalid phone number format.' };
  }

  const db = getDb();
  const code = generateOTP();

  // Expires in 5 minutes
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

  db.prepare(`
    INSERT OR REPLACE INTO otp_codes (phone_number, code, expires_at)
    VALUES (?, ?, ?)
  `).run(phoneNumber, code, expiresAt);

  // DEBUG: Log the OTP to console so the user can "receive" it
  console.log(`[AUTH] OTP for ${phoneNumber}: ${code}`);

  return { ok: true };
}

/**
 * Verifies OTP and performs signup or login.
 */
export async function verifyOTP(phoneNumber: string, code: string): Promise<AuthResult> {
  const db = getDb();
  
  const otp = db.prepare(`
    SELECT code, expires_at FROM otp_codes WHERE phone_number = ?
  `).get(phoneNumber) as { code: string; expires_at: string } | undefined;

  if (!otp) {
    return { ok: false, error: 'No OTP found for this number.' };
  }

  if (otp.code !== code) {
    return { ok: false, error: 'Invalid OTP code.' };
  }

  if (new Date(otp.expires_at) < new Date()) {
    return { ok: false, error: 'OTP has expired.' };
  }

  // Clear the OTP
  db.prepare('DELETE FROM otp_codes WHERE phone_number = ?').run(phoneNumber);


  // Check if user exists
  let user = db.prepare(`
    SELECT id, alias, account_status, suspension_until FROM users WHERE phone_number = ?
  `).get(phoneNumber) as { id: string; alias: string; account_status: string; suspension_until: string | null } | undefined;

  if (!user) {
    // SIGNUP
    const badgeNumber = generateBadgeNumber();
    
    // Generate a unique alias
    let alias = '';
    for (let i = 0; i < 10; i++) {
      const candidate = generateAlias();
      const existing = db.prepare('SELECT id FROM users WHERE alias = ?').get(candidate);
      if (!existing) { alias = candidate; break; }
    }
    if (!alias) return { ok: false, error: 'Could not generate a unique alias. Try again.' };

    db.prepare(`
      INSERT INTO users (id, phone_number, alias)
      VALUES (?, ?, ?)
    `).run(badgeNumber, phoneNumber, alias);

    user = { id: badgeNumber, alias, account_status: 'active', suspension_until: null };
  }

  if (user.account_status === 'suspended') {
    const until = user.suspension_until ? new Date(user.suspension_until).toLocaleDateString() : 'a future date';
    return { ok: false, error: `Account suspended until ${until}.` };
  }

  const token = await createSession(user.id, user.alias);
  await setSessionCookie(token);

  return { ok: true, alias: user.alias, badgeNumber: user.id, token };
}

/**
 * Creates a truly anonymous account without a phone number.
 */
export async function createAccount(passphrase?: string): Promise<AuthResult> {
  const db = getDb();
  const badgeNumber = generateBadgeNumber();
  
  // Generate a unique alias
  let alias = '';
  for (let i = 0; i < 10; i++) {
    const candidate = generateAlias();
    const existing = db.prepare('SELECT id FROM users WHERE alias = ?').get(candidate);
    if (!existing) { alias = candidate; break; }
  }
  if (!alias) return { ok: false, error: 'Could not generate a unique alias. Try again.' };

  db.prepare(`
    INSERT INTO users (id, alias)
    VALUES (?, ?)
  `).run(badgeNumber, alias);

  const token = await createSession(badgeNumber, alias);
  await setSessionCookie(token);

  return { ok: true, alias, badgeNumber, token };
}

/**
 * Permanently delete an account and all its content.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const db = getDb();
  db.prepare("UPDATE posts SET alias = '[deleted]', status = 'author_deleted' WHERE alias = (SELECT alias FROM users WHERE id = ?)").run(userId);
  db.prepare("UPDATE comments SET alias = '[deleted]', status = 'author_deleted' WHERE alias = (SELECT alias FROM users WHERE id = ?)").run(userId);
  db.prepare("UPDATE room_messages SET alias = '[deleted]', status = 'author_deleted' WHERE alias = (SELECT alias FROM users WHERE id = ?)").run(userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(userId);
}
