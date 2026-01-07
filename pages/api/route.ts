// app/api/route.ts - Updated version using new rate limit system
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit, createRateLimitHeaders, RATE_LIMIT_CONFIGS } from '@/lib/rate-limit'; // Updated import

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  
  // Use the new rate limit function
  const result = await rateLimit(`api:${ip}`, RATE_LIMIT_CONFIGS.API_STRICT);
  
  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({ 
        error: 'Too Many Requests',
        message: 'Rate limit exceeded',
        retryAfter: result.blockUntil ? Math.ceil((result.blockUntil - Date.now()) / 1000) : undefined
      }),
      { 
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          ...createRateLimitHeaders(result)
        }
      }
    );
  }
  
  const data = await req.json();
  const response = NextResponse.json({ success: true, data });
  
  // Add rate limit headers
  Object.entries(createRateLimitHeaders(result)).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}