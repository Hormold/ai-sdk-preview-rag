import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { feedback } from '@/lib/db/schema/feedback';

// In-memory rate limiting: max 10 feedback submissions per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const MAX_REQUESTS = 10;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (record.count >= MAX_REQUESTS) {
    return false;
  }

  record.count++;
  return true;
}

export async function POST(req: Request) {
  try {
    const { rating, comment, messages, pageUrl } = await req.json();

    // Get user IP and user agent
    const userIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';

    // Rate limiting
    if (!checkRateLimit(userIp)) {
      return NextResponse.json(
        { error: 'Too many feedback submissions. Please try again later.' },
        { status: 429 }
      );
    }

    await db.insert(feedback).values({
      rating,
      comment: comment || null,
      messages,
      userIp,
      userAgent,
      pageUrl,
    });

    console.log('📊 Feedback saved:', { rating, hasComment: !!comment, messagesCount: messages?.length });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to save feedback:', error);
    return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
  }
}
