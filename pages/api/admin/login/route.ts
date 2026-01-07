// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from 'next/server';

// ==================== SAFE IMPORTS ====================
let rateLimitRedis: any = null;
let rateLimitModule: any = null;

try {
  const redisModule = require('@/lib/rate-limit-redis');
  rateLimitRedis = redisModule.rateLimitRedis || redisModule.default;
} catch (error) {
  console.warn('[AdminLogin] rate-limit-redis not available');
}

try {
  const unifiedModule = require('@/lib/server/rate-limit-unified');
  rateLimitModule = unifiedModule;
} catch (error) {
  console.warn('[AdminLogin] rate-limit-unified not available');
}

// ==================== CONFIGURATION ====================
const ADMIN_USERS = [
  {
    id: '1',
    username: 'admin',
    passwordHash: '$2b$10$demo', // In production, use real bcrypt hash
    role: 'superadmin',
    mfaEnabled: false
  }
];

// ==================== UTILITY FUNCTIONS ====================
function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
}

async function validatePassword(inputPassword: string): Promise<boolean> {
  // In production, use proper bcrypt comparison
  const devPassword = process.env.ADMIN_DEV_PASSWORD;
  if (devPassword && inputPassword === devPassword) {
    return true;
  }
  
  // Fallback for development
  if (process.env.NODE_ENV !== 'production') {
    return inputPassword === 'admin123'; // CHANGE THIS IN PRODUCTION!
  }
  
  return false;
}

function createSessionResponse(userId: string, rememberMe?: boolean): NextResponse {
  const response = NextResponse.json({ success: true });
  
  // Set session cookie
  response.cookies.set('admin_session', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
    path: '/'
  });
  
  return response;
}

// ==================== MAIN HANDLER ====================
export async function POST(request: NextRequest) {
  try {
    // Get client IP
    const ip = getClientIp(request);
    
    // ==================== RATE LIMITING ====================
    let rateLimitResult = null;
    
    // Try Redis rate limiting
    if (rateLimitRedis) {
      try {
        rateLimitResult = await rateLimitRedis.check(`auth:${ip}`, {
          windowMs: 60000,
          max: 5,
          keyPrefix: 'auth_login',
          blockDuration: 300000,
        });
        
        if (rateLimitResult && !rateLimitResult.allowed) {
          return new Response(
            JSON.stringify({ error: 'Too many login attempts' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
      } catch (redisError) {
        console.warn('[AdminLogin] Redis rate limit error:', redisError);
      }
    }
    
    // Fallback to unified rate limiting
    if (!rateLimitResult && rateLimitModule?.withEdgeRateLimit) {
      try {
        const { allowed, result } = await rateLimitModule.withEdgeRateLimit(
          request,
          rateLimitModule.RATE_LIMIT_CONFIGS?.AUTH || { limit: 10, windowMs: 300000 }
        );
        
        if (!allowed) {
          if (rateLimitModule?.createRateLimitedResponse) {
            return rateLimitModule.createRateLimitedResponse(result);
          }
          return new Response(
            JSON.stringify({ error: 'Too many requests' }),
            { status: 429, headers: { 'Content-Type': 'application/json' } }
          );
        }
        rateLimitResult = result;
      } catch (rateLimitError) {
        console.warn('[AdminLogin] Rate limit error:', rateLimitError);
      }
    }
    
    // ==================== REQUEST VALIDATION ====================
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON' },
        { status: 400 }
      );
    }
    
    const { username, password, rememberMe } = body;
    
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password required' },
        { status: 400 }
      );
    }
    
    // ==================== CREDENTIAL VALIDATION ====================
    const user = ADMIN_USERS.find(u => 
      u.username.toLowerCase() === username.toLowerCase()
    );
    
    if (!user) {
      // Simulate delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const isValidPassword = await validatePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // ==================== CREATE RESPONSE ====================
    const response = createSessionResponse(user.id, rememberMe);
    
    // Add rate limit headers if available
    if (rateLimitResult && rateLimitModule?.createRateLimitHeaders) {
      const headers = rateLimitModule.createRateLimitHeaders(rateLimitResult);
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
    }
    
    // Add security headers
    response.headers.set('X-Login-Success', 'true');
    response.headers.set('X-User-Role', user.role);
    response.headers.set('X-Content-Type-Options', 'nosniff');
    
    // Add user info to response body
    const responseBody = {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        mfaEnabled: user.mfaEnabled
      }
    };
    
    return NextResponse.json(responseBody, {
      status: 200,
      headers: response.headers
    });
    
  } catch (error) {
    console.error('[AdminLogin] Error:', error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for login page info
export async function GET() {
  return NextResponse.json({
    recaptchaEnabled: !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
    mfaEnabled: false,
    allowRememberMe: true
  });
}

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
// Add default export if missing
export default async function handler(request: NextRequest) {
  return POST(request);
}
