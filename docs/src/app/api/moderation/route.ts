import { NextRequest, NextResponse } from 'next/server';
import { moderateContent } from '@/lib/moderation';
import { getSession } from '@/lib/session';

/**
 * POST /api/moderation
 * Endpoint to manually trigger moderation check. 
 * Useful for frontend pre-checks.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: 'Text content is required' }, { status: 400 });
    }

    const result = await moderateContent(text);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Moderation API error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
