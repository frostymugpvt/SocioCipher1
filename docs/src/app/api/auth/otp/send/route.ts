import { NextResponse } from 'next/server';
import { sendOTP } from '@/lib/auth';
import { checkRateLimit, checkGlobalLimit, logSecurityEvent } from '@/lib/security';

export async function POST(request: Request) {
  try {
    const { phoneNumber } = await request.json();

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }
    
    // Global Limit: Max 100 OTPs per minute across the whole platform (DDoS protection)
    const globalOk = checkGlobalLimit('otp_send_global', 100, 60 * 1000);
    if (!globalOk.allowed) {
      return NextResponse.json({ error: 'System busy. Please try later.' }, { status: 429 });
    }

    // Rate Limit: 3 attempts per 10 minutes
    const rl = checkRateLimit(`otp-send:${phoneNumber}`, 3, 10 * 60 * 1000);
    if (!rl.allowed) {
      logSecurityEvent(null, 'RATE_LIMIT_EXCEEDED', { phoneNumber, action: 'otp_send' });
      return NextResponse.json({ 
        error: `Too many requests. Please try again in ${rl.retryAfter} seconds.` 
      }, { status: 429 });
    }

    const result = await sendOTP(phoneNumber);

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('OTP Send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
