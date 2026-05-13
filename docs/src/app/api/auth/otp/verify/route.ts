import { NextResponse } from 'next/server';
import { verifyOTP } from '@/lib/auth';
import { checkRateLimit, logSecurityEvent } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { phoneNumber, code } = await request.json();

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: 'Phone number and code are required' }, { status: 400 });
    }

    // Global Limit: DDoS protection for OTP verification
    const { checkGlobalLimit } = await import('@/lib/security');
    const globalOk = checkGlobalLimit('otp_verify_global', 100, 60 * 1000);
    if (!globalOk.allowed) {
      return NextResponse.json({ error: 'System busy. Please try later.' }, { status: 429 });
    }

    // Rate Limit: 5 attempts per 5 minutes
    const rl = checkRateLimit(`otp-verify:${phoneNumber}`, 5, 5 * 60 * 1000);
    if (!rl.allowed) {
      logSecurityEvent(null, 'BRUTE_FORCE_ATTEMPT', { phoneNumber, action: 'otp_verify' });
      return NextResponse.json({ 
        error: `Too many attempts. Please try again in ${rl.retryAfter} seconds.` 
      }, { status: 429 });
    }

    const result = await verifyOTP(phoneNumber, code);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      alias: result.alias,
      badgeNumber: result.badgeNumber
    });
  } catch (error) {
    console.error('[AUTH_VERIFY_CRITICAL] Detailed Error:', {
      error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'N/A'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
