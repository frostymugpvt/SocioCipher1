import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * SocioCipher Middleware
 * 1. IP Stripping: Ensures downstream API routes never see the client IP.
 */
export function middleware(request: NextRequest) {
  // Clone the request headers
  const requestHeaders = new Headers(request.headers);

  // List of common IP-related headers to strip
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-client-ip',
    'x-forwarded-host',
    'x-forwarded-proto',
    'forwarded-for',
    'forwarded',
    'via',
    'true-client-ip',
    'cf-connecting-ip', // Cloudflare
    'fastly-client-ip', // Fastly
  ];

  // Scrub all IP metadata
  ipHeaders.forEach(header => {
    requestHeaders.delete(header);
  });

  // Bot Mitigation: Block common automated tools (UA-based)
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousUAs = ['python-requests', 'curl', 'wget', 'postman', 'node-fetch', 'axios'];
  if (suspiciousUAs.some(bot => userAgent.toLowerCase().includes(bot))) {
    return new NextResponse('SC_SECURITY_BLOCK: SUSPICIOUS_CLIENT_DETECTED', { status: 403 });
  }

  // Set a dummy/static IP to avoid any internal logic errors that expect it
  requestHeaders.set('x-forwarded-for', '0.0.0.0');

  // Return response with modified headers
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

// Apply only to API routes to avoid unnecessary overhead on static assets
export const config = {
  matcher: '/api/:path*',
};
