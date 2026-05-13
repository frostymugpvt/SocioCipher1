import { randomBytes } from 'crypto';

/**
 * Generates a unique Badge Number for users.
 * Format: SC-XXXX-XXXX (e.g., SC-4A92-K8L1)
 */
export function generateBadgeNumber(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const segment = (len: number) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      res += chars[Math.floor(Math.random() * chars.length)];
    }
    return res;
  };
  return `SC-${segment(4)}-${segment(4)}`;
}

/**
 * Generates a numeric OTP code.
 * Default set to 261100587 per user request.
 */
export function generateOTP(): string {
  // Generate a random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}
