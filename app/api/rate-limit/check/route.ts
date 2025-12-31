// app/api/rate-limit/check/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/server/rateLimit-edge';

// Can run on Edge runtime since we're using Edge-compatible rate limiting
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { ip, keyPrefix = 'api' } = await req.json();
    
    if (!ip) {
      return NextResponse.json(
        { error: 'IP address is required' },
        { status: 400 }
      );
    }
    
    const limitResult = rateLimit(`${keyPrefix}:${ip}`, {
      limit: 100,
      windowMs: 15 * 60 * 1000,
      keyPrefix
    });
    
    const response = NextResponse.json({
      allowed: limitResult.allowed,
      ip,
      keyPrefix,
      limit: limitResult.limit,
      remaining: limitResult.remaining,
      retryAfterMs: limitResult.retryAfterMs,
      resetTime: limitResult.resetTime,
      windowMs: limitResult.windowMs,
    });
    
    // Add rate limit headers
    response.headers.set('X-RateLimit-Limit', limitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', limitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(limitResult.resetTime / 1000).toString());
    
    if (limitResult.retryAfterMs > 0) {
      response.headers.set('Retry-After', Math.ceil(limitResult.retryAfterMs / 1000).toString());
    }
    
    return response;
  } catch (error) {
    console.error('Rate limit check error:', error);
    return NextResponse.json(
      { 
        allowed: true, // Fail open
        error: 'Rate limit check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}