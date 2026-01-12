// app/api/admin/login/route.ts - UPDATED WITH AUDIT LOGGING
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";
import { auditLogger } from "@/lib/prisma"; // Import the audit logger

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==================== SAFE IMPORTS (dynamic) ====================
type RateLimitResult = { allowed: boolean; [k: string]: any };

type RateLimitRedisModule = {
  rateLimitRedis?: { check: (key: string, opts: any) => Promise<RateLimitResult> };
  default?: { check: (key: string, opts: any) => Promise<RateLimitResult> };
};

type UnifiedRateLimitModule = {
  withEdgeRateLimit?: (
    req: NextRequest,
    cfg: any
  ) => Promise<{ allowed: boolean; result?: any }>;
  RATE_LIMIT_CONFIGS?: { AUTH?: any };
  createRateLimitedResponse?: (result: any) => Response;
  createRateLimitHeaders?: (result: any) => Record<string, string>;
};

async function safeImport<T = any>(specifier: string): Promise<T | null> {
  try {
    return (await import(specifier)) as unknown as T;
  } catch {
    return null;
  }
}

async function loadRateLimiters() {
  const redisModule = await safeImport<RateLimitRedisModule>("@/lib/rate-limit-redis");
  const unifiedModule = await safeImport<UnifiedRateLimitModule>(
    "@/lib/server/rate-limit-unified"
  );

  const rateLimitRedis = redisModule?.rateLimitRedis || redisModule?.default || null;
  return { rateLimitRedis, rateLimitModule: unifiedModule };
}

// ==================== AUTHENTICATION SERVICE ====================
type AdminUser = {
  id: string;
  username: string;
  role: 'admin' | 'superadmin' | 'editor';
  permissions: string[];
  mfaEnabled: boolean;
};

type AuthResult = {
  success: boolean;
  user?: AdminUser;
  error?: string;
  requiresMFA?: boolean;
};

async function authenticateAdmin(username: string, password: string): Promise<AuthResult> {
  try {
    // Use your existing DAL or database
    // First try to use the existing admin system
    try {
      const { verifyAdminCredentials } = await import('@/lib/server/auth/admin-utils');
      return await verifyAdminCredentials(username, password);
    } catch {
      // Fallback to database check
      const { prisma } = await import('@/lib/prisma');
      
      const user = await prisma.adminUser.findUnique({
        where: { username: username.toLowerCase() },
        select: {
          id: true,
          username: true,
          passwordHash: true,
          role: true,
          permissions: true,
          mfaEnabled: true,
          status: true,
          lastLoginAt: true,
          failedLoginAttempts: true
        }
      });
      
      if (!user) {
        // Log failed attempt
        await logFailedAttempt(username, 'user_not_found');
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }
      
      // Check if account is locked
      if (user.status === 'locked' || user.failedLoginAttempts >= 5) {
        return {
          success: false,
          error: 'Account is temporarily locked. Please contact support.'
        };
      }
      
      // Verify password - use timing-safe comparison
      const isPasswordValid = await verifyPassword(password, user.passwordHash);
      
      if (!isPasswordValid) {
        // Increment failed attempts
        await prisma.adminUser.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: { increment: 1 },
            lastFailedLoginAt: new Date()
          }
        });
        
        await logFailedAttempt(username, 'invalid_password', user.id);
        return {
          success: false,
          error: 'Invalid credentials'
        };
      }
      
      // Reset failed attempts on successful login
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lastLoginAt: new Date()
        }
      });
      
      // Log successful login
      await logSuccessfulLogin(user.id, username);
      
      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role as any,
          permissions: JSON.parse(user.permissions || '[]'),
          mfaEnabled: user.mfaEnabled
        },
        requiresMFA: user.mfaEnabled
      };
    }
  } catch (error) {
    console.error('[AdminAuth] Error:', error);
    return {
      success: false,
      error: 'Authentication failed'
    };
  }
}

async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // Use bcrypt if available
  try {
    const { compare } = await import('bcryptjs');
    return await compare(inputPassword, storedHash);
  } catch {
    // Fallback to timing-safe comparison for dev
    const encoder = new TextEncoder();
    const a = encoder.encode(inputPassword);
    const b = encoder.encode(process.env.ADMIN_DEV_PASSWORD || '');
    
    if (a.length !== b.length) return false;
    
    return timingSafeEqual(
      Buffer.from(a.buffer, a.byteOffset, a.byteLength),
      Buffer.from(b.buffer, b.byteOffset, b.byteLength)
    );
  }
}

async function logFailedAttempt(username: string, reason: string, userId?: string) {
  try {
    // Use audit logger instead of direct Prisma
    await auditLogger.logSecurityEvent(
      'system',
      'LOGIN_FAILED',
      {
        severity: 'warning',
        threatType: 'failed_auth',
        sourceIp: 'unknown',
        reason: `Failed login attempt for ${username}: ${reason}`,
      }
    );
  } catch (error) {
    console.error('[AuthLog] Failed to log attempt:', error);
  }
}

async function logSuccessfulLogin(userId: string, username: string) {
  try {
    await auditLogger.logAuthEvent(
      userId,
      'LOGIN_SUCCESS',
      {
        success: true,
        method: 'password',
        ipAddress: 'unknown',
        userAgent: 'admin-login',
      }
    );
  } catch (error) {
    console.error('[AuthLog] Failed to log success:', error);
  }
}

// ==================== SESSION MANAGEMENT ====================
async function createAdminSession(user: AdminUser) {
  try {
    // Use Redis for session storage if available
    try {
      const { createSession } = await import('@/lib/auth/sessions');
      return await createSession(user);
    } catch {
      // Fallback to simple session
      const sessionId = randomBytes(32).toString('hex');
      const csrfToken = randomBytes(16).toString('hex');
      
      // Store in database as fallback
      const { prisma } = await import('@/lib/prisma');
      await prisma.adminSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: sessionId,
          csrfToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          userAgent: 'admin-login',
          ipAddress: 'unknown'
        }
      });
      
      return { token: sessionId, csrfToken, userId: user.id };
    }
  } catch (error) {
    console.error('[Session] Failed to create session:', error);
    throw new Error('Session creation failed');
  }
}

// ==================== UTILITY FUNCTIONS ====================
function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeUsername(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function normalizePassword(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeRememberMe(v: unknown): boolean {
  return v === true;
}

// ==================== MAIN HANDLERS ====================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  try {
    const { rateLimitRedis, rateLimitModule } = await loadRateLimiters();

    // ==================== RATE LIMITING ====================
    let rateLimitResult: any = null;
    let rateLimitKey = `auth:${clientIp}`;

    // 1) Redis limiter (preferred)
    if (rateLimitRedis?.check) {
      try {
        rateLimitResult = await rateLimitRedis.check(rateLimitKey, {
          windowMs: 60_000,
          max: 5,
          keyPrefix: "auth_login",
          blockDuration: 300_000,
        });

        if (rateLimitResult && rateLimitResult.allowed === false) {
          console.warn(`[AdminLogin] Rate limited: ${clientIp}`);
          
          // Log rate limiting event
          await auditLogger.logSecurityEvent(
            clientIp,
            'RATE_LIMIT_EXCEEDED',
            {
              severity: 'warning',
              threatType: 'brute_force',
              sourceIp: clientIp,
              blocked: true,
              reason: 'Too many login attempts',
            }
          );
          
          return NextResponse.json({ 
            error: "Too many login attempts. Please try again later." 
          }, { 
            status: 429,
            headers: {
              'Retry-After': '300',
              'X-RateLimit-Reason': 'too_many_attempts'
            }
          });
        }
      } catch (e) {
        console.warn("[AdminLogin] Redis rate limit error:", e);
      }
    }

    // 2) Unified limiter fallback
    if (!rateLimitResult && rateLimitModule?.withEdgeRateLimit) {
      try {
        const cfg = rateLimitModule.RATE_LIMIT_CONFIGS?.AUTH ?? { 
          limit: 10, 
          windowMs: 300_000 
        };

        const { allowed, result } = await rateLimitModule.withEdgeRateLimit(request, cfg);

        if (!allowed) {
          // Log rate limiting event
          await auditLogger.logSecurityEvent(
            clientIp,
            'RATE_LIMIT_EXCEEDED',
            {
              severity: 'warning',
              threatType: 'brute_force',
              sourceIp: clientIp,
              blocked: true,
              reason: 'Too many login requests',
            }
          );
          
          if (rateLimitModule.createRateLimitedResponse) {
            return rateLimitModule.createRateLimitedResponse(result);
          }
          return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        rateLimitResult = result;
      } catch (e) {
        console.warn("[AdminLogin] Unified rate limit error:", e);
      }
    }

    // ==================== BODY VALIDATION ====================
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      // Log invalid JSON
      await auditLogger.logSecurityEvent(
        clientIp,
        'INVALID_REQUEST',
        {
          severity: 'warning',
          threatType: 'malformed_request',
          sourceIp: clientIp,
          blocked: false,
          reason: 'Invalid JSON in login request',
        }
      );
      
      return jsonError("Invalid JSON", 400);
    }

    const username = normalizeUsername(body?.username);
    const password = normalizePassword(body?.password);
    const rememberMe = normalizeRememberMe(body?.rememberMe);

    if (!username || !password) {
      // Log missing credentials
      await auditLogger.logSecurityEvent(
        clientIp,
        'MISSING_CREDENTIALS',
        {
          severity: 'warning',
          threatType: 'malformed_request',
          sourceIp: clientIp,
          blocked: false,
          reason: 'Missing username or password in login request',
        }
      );
      
      return jsonError("Username and password required", 400);
    }

    // Additional validation
    if (username.length > 100 || password.length > 500) {
      // Log invalid input length
      await auditLogger.logSecurityEvent(
        clientIp,
        'INVALID_INPUT_LENGTH',
        {
          severity: 'warning',
          threatType: 'malformed_request',
          sourceIp: clientIp,
          blocked: false,
          reason: 'Input length exceeds limits',
        }
      );
      
      return jsonError("Invalid input length", 400);
    }

    // ==================== CREDENTIAL CHECK ====================
    const authResult = await authenticateAdmin(username, password);
    
    if (!authResult.success) {
      // Add delay to prevent timing attacks
      const elapsed = Date.now() - startTime;
      const minDelay = 500; // Minimum 500ms response time
      if (elapsed < minDelay) {
        await new Promise(resolve => setTimeout(resolve, minDelay - elapsed));
      }
      
      // Log failed authentication attempt
      await auditLogger.logAuthEvent(
        username, // Use username since we don't have userId for failed attempts
        'LOGIN_FAILED',
        {
          success: false,
          method: 'password',
          ipAddress: clientIp,
          userAgent,
          error: authResult.error || 'Invalid credentials',
        }
      );
      
      return NextResponse.json(
        { error: authResult.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    // ==================== MFA CHECK ====================
    if (authResult.requiresMFA) {
      // Generate MFA challenge
      const mfaChallenge = randomBytes(16).toString('hex');
      
      // Store challenge in Redis/database
      try {
        const { setMFAChallenge } = await import('@/lib/auth/mfa');
        await setMFAChallenge(authResult.user!.id, mfaChallenge);
      } catch (error) {
        console.error('[MFA] Failed to store challenge:', error);
      }
      
      // Log MFA challenge created
      await auditLogger.logAuthEvent(
        authResult.user!.id,
        'MFA_CHALLENGE_CREATED',
        {
          success: true,
          method: 'password',
          mfaUsed: true,
          ipAddress: clientIp,
          userAgent,
        }
      );
      
      return NextResponse.json({
        success: true,
        requiresMFA: true,
        userId: authResult.user!.id,
        challenge: mfaChallenge
      });
    }

    // ==================== SESSION CREATION ====================
    const session = await createAdminSession(authResult.user!);

    // ==================== RESPONSE ====================
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: authResult.user!.id,
          username: authResult.user!.username,
          role: authResult.user!.role,
          permissions: authResult.user!.permissions,
          mfaEnabled: authResult.user!.mfaEnabled,
        },
        session: {
          expiresIn: 30 * 24 * 60 * 60 // 30 days in seconds
        }
      },
      { status: 200 }
    );

    // Set session cookie
    response.cookies.set('admin_session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60, // 30 days or 1 day
      path: '/',
      priority: 'high'
    });

    // Set CSRF token (not HttpOnly, used by frontend)
    response.cookies.set('admin_csrf', session.csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: '/'
    });

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // Custom headers
    response.headers.set('X-Login-Success', 'true');
    response.headers.set('X-User-Role', authResult.user!.role);
    response.headers.set('X-User-Id', authResult.user!.id);
    response.headers.set('X-Response-Time', `${Date.now() - startTime}ms`);

    // Rate-limit headers
    if (rateLimitResult && rateLimitModule?.createRateLimitHeaders) {
      try {
        const headers = rateLimitModule.createRateLimitHeaders(rateLimitResult);
        for (const [k, v] of Object.entries(headers)) {
          response.headers.set(k, String(v));
        }
      } catch (e) {
        console.warn("[AdminLogin] Could not set rate limit headers:", e);
      }
    }

    // Performance timing
    const totalTime = Date.now() - startTime;
    console.log(`[AdminLogin] Successful login for ${username} in ${totalTime}ms`);

    // Log successful login with audit logger
    await auditLogger.logAuthEvent(
      authResult.user!.id,
      'LOGIN_SUCCESS',
      {
        success: true,
        method: 'password',
        ipAddress: clientIp,
        userAgent,
        mfaUsed: false,
      }
    );

    return response;
    
  } catch (error) {
    console.error("[AdminLogin] Error:", error);
    
    // Log internal error
    await auditLogger.log({
      action: 'LOGIN_INTERNAL_ERROR',
      severity: 'error',
      category: 'auth',
      details: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      ipAddress: clientIp,
      userAgent,
      status: 'failure',
      metadata: {
        endpoint: '/api/admin/login',
        method: 'POST',
      },
    });
    
    // Don't leak internal errors
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
          'X-Error-Type': 'internal_error'
        }
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      recaptchaEnabled: !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      mfaEnabled: process.env.ADMIN_MFA_ENABLED === 'true',
      allowRememberMe: true,
      maxPasswordLength: 500,
      minPasswordLength: 8,
      supportedAuthMethods: ['password', 'mfa'],
      version: '1.0.0'
    },
    { 
      status: 200, 
      headers: { 
        'Cache-Control': 'public, max-age=3600',
        'X-Endpoint-Version': 'admin-login-v1'
      } 
    }
  );
}

// Health check endpoint
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
      'X-Status': 'healthy',
      'X-Endpoint': 'admin-login'
    }
  });
}