// app/api/admin/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";
import { auditLogger } from "@/lib/audit/audit-logger";

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

// ==================== CONSTANT-TIME COMPARE (TS-SAFE) ====================
// Avoid Buffer typing issues under lib.esnext.disposable by using Uint8Array.
function toBytes(input: string | Uint8Array): Uint8Array {
  if (input instanceof Uint8Array) return input;
  return new TextEncoder().encode(input);
}

function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;

  // timingSafeEqual expects ArrayBufferView; Uint8Array satisfies that under all sane TS libs.
  const aView = new Uint8Array(a);
  const bView = new Uint8Array(b);

  return timingSafeEqual(aView, bView);
}

// ==================== AUTHENTICATION SERVICE ====================
type AdminUser = {
  id: string;
  username: string;
  role: "admin" | "superadmin" | "editor";
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
    // Preferred: central auth utility if present
    try {
      const { verifyAdminCredentials } = await import("@/lib/server/auth/admin-utils");
      return await verifyAdminCredentials(username, password);
    } catch {
      // Fallback: direct DB check
      const { prisma } = await import("@/lib/prisma");

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
          failedLoginAttempts: true,
        },
      });

      if (!user) {
        await logFailedAttempt(username, "user_not_found");
        return { success: false, error: "Invalid credentials" };
      }

      if (user.status === "locked" || user.failedLoginAttempts >= 5) {
        return {
          success: false,
          error: "Account is temporarily locked. Please contact support.",
        };
      }

      const isPasswordValid = await verifyPassword(password, user.passwordHash);

      if (!isPasswordValid) {
        await prisma.adminUser.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: { increment: 1 },
            lastFailedLoginAt: new Date(),
          },
        });

        await logFailedAttempt(username, "invalid_password", user.id);
        return { success: false, error: "Invalid credentials" };
      }

      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lastLoginAt: new Date(),
        },
      });

      await logSuccessfulLogin(user.id, username);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role as any,
          permissions: JSON.parse(user.permissions || "[]"),
          mfaEnabled: user.mfaEnabled,
        },
        requiresMFA: user.mfaEnabled,
      };
    }
  } catch (error) {
    console.error("[AdminAuth] Error:", error);
    return { success: false, error: "Authentication failed" };
  }
}

async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // Preferred: bcrypt
  try {
    const { compare } = await import("bcryptjs");
    return await compare(inputPassword, storedHash);
  } catch {
    // Dev-only fallback
    console.warn("[Auth] Using timing-safe fallback for password verification");

    if (process.env.NODE_ENV === "development") {
      const input = toBytes(inputPassword);
      const expected = toBytes(process.env.ADMIN_DEV_PASSWORD || "");

      return timingSafeEqualBytes(input, expected);
    }

    throw new Error("Password verification failed: bcrypt not available");
  }
}

async function logFailedAttempt(username: string, reason: string, userId?: string) {
  try {
    await auditLogger.log({
      action: "LOGIN_FAILED",
      actorId: userId || "unknown",
      actorType: "user",
      actorEmail: username,
      category: "auth",
      severity: "warning",
      details: { reason, threatType: "failed_auth" },
      status: "failure",
    });
  } catch (error) {
    console.error("[AuthLog] Failed to log attempt:", error);
  }
}

async function logSuccessfulLogin(userId: string, username: string) {
  try {
    await auditLogger.logAuthEvent(userId, "LOGIN_SUCCESS", {
      success: true,
      method: "password",
      ipAddress: "unknown",
      userAgent: "admin-login",
    });
  } catch (error) {
    console.error("[AuthLog] Failed to log success:", error);
  }
}

// ==================== SESSION MANAGEMENT ====================
async function createAdminSession(user: AdminUser) {
  try {
    // Preferred: central session layer
    try {
      const { createSession } = await import("@/lib/auth/sessions");
      return await createSession(user);
    } catch {
      // Fallback: DB session
      const sessionId = randomBytes(32).toString("hex");
      const csrfToken = randomBytes(16).toString("hex");

      const { prisma } = await import("@/lib/prisma");
      await prisma.adminSession.create({
        data: {
          id: sessionId,
          userId: user.id,
          token: sessionId,
          csrfToken,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          userAgent: "admin-login",
          ipAddress: "unknown",
        },
      });

      return { token: sessionId, csrfToken, userId: user.id };
    }
  } catch (error) {
    console.error("[Session] Failed to create session:", error);
    throw new Error("Session creation failed");
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== MAIN HANDLERS ====================
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    const { rateLimitRedis, rateLimitModule } = await loadRateLimiters();

    // ==================== RATE LIMITING ====================
    let rateLimitResult: any = null;
    const rateLimitKey = `auth:${clientIp}`;

    // 1) Redis limiter
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

          await auditLogger.logSecurityEvent(clientIp, "RATE_LIMIT_EXCEEDED", {
            severity: "warning",
            threatType: "brute_force",
            sourceIp: clientIp,
            blocked: true,
            reason: "Too many login attempts",
          });

          return NextResponse.json(
            { error: "Too many login attempts. Please try again later." },
            {
              status: 429,
              headers: {
                "Retry-After": "300",
                "X-RateLimit-Reason": "too_many_attempts",
              },
            }
          );
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
          windowMs: 300_000,
        };

        const { allowed, result } = await rateLimitModule.withEdgeRateLimit(
          request,
          cfg
        );

        if (!allowed) {
          await auditLogger.logSecurityEvent(clientIp, "RATE_LIMIT_EXCEEDED", {
            severity: "warning",
            threatType: "brute_force",
            sourceIp: clientIp,
            blocked: true,
            reason: "Too many login requests",
          });

          if (rateLimitModule.createRateLimitedResponse) {
            return rateLimitModule.createRateLimitedResponse(result) as any;
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
      await auditLogger.log({
        action: "INVALID_REQUEST",
        category: "auth",
        severity: "warning",
        details: {
          threatType: "malformed_request",
          sourceIp: clientIp,
          reason: "Invalid JSON in login request",
        },
        ipAddress: clientIp,
        userAgent,
        status: "failure",
      });

      return jsonError("Invalid JSON", 400);
    }

    const username = normalizeUsername(body?.username);
    const password = normalizePassword(body?.password);
    const rememberMe = normalizeRememberMe(body?.rememberMe);

    if (!username || !password) {
      await auditLogger.log({
        action: "MISSING_CREDENTIALS",
        category: "auth",
        severity: "warning",
        details: {
          threatType: "malformed_request",
          sourceIp: clientIp,
          reason: "Missing username or password in login request",
        },
        ipAddress: clientIp,
        userAgent,
        status: "failure",
      });

      return jsonError("Username and password required", 400);
    }

    if (username.length > 100 || password.length > 500) {
      await auditLogger.log({
        action: "INVALID_INPUT_LENGTH",
        category: "auth",
        severity: "warning",
        details: {
          threatType: "malformed_request",
          sourceIp: clientIp,
          reason: "Input length exceeds limits",
        },
        ipAddress: clientIp,
        userAgent,
        status: "failure",
      });

      return jsonError("Invalid input length", 400);
    }

    // ==================== CREDENTIAL CHECK ====================
    const authResult = await authenticateAdmin(username, password);

    if (!authResult.success) {
      // consistent minimum time
      const elapsed = Date.now() - startTime;
      const minDelay = 500;
      if (elapsed < minDelay) await sleep(minDelay - elapsed);

      await auditLogger.logAuthEvent(username, "LOGIN_FAILED", {
        success: false,
        method: "password",
        ipAddress: clientIp,
        userAgent,
        error: authResult.error || "Invalid credentials",
      });

      return NextResponse.json(
        { error: authResult.error || "Invalid credentials" },
        { status: 401 }
      );
    }

    // ==================== MFA CHECK ====================
    if (authResult.requiresMFA) {
      const mfaChallenge = randomBytes(16).toString("hex");

      const { setMFAChallenge } = await import("@/lib/auth/mfa");
      await setMFAChallenge(authResult.user!.id, mfaChallenge);

      await auditLogger.logAuthEvent(authResult.user!.id, "MFA_CHALLENGE_CREATED", {
        success: true,
        method: "password",
        mfaUsed: true,
        ipAddress: clientIp,
        userAgent,
      });

      return NextResponse.json({
        success: true,
        requiresMFA: true,
        userId: authResult.user!.id,
        challenge: mfaChallenge,
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
        session: { expiresIn: 30 * 24 * 60 * 60 },
      },
      { status: 200 }
    );

    response.cookies.set("admin_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
      priority: "high",
    });

    response.cookies.set("admin_csrf", session.csrfToken, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
    });

    // Security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    // Custom headers
    response.headers.set("X-Login-Success", "true");
    response.headers.set("X-User-Role", authResult.user!.role);
    response.headers.set("X-User-Id", authResult.user!.id);
    response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

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

    const totalTime = Date.now() - startTime;
    console.log(`[AdminLogin] Successful login for ${username} in ${totalTime}ms`);

    await auditLogger.logAuthEvent(authResult.user!.id, "LOGIN_SUCCESS", {
      success: true,
      method: "password",
      ipAddress: clientIp,
      userAgent,
      mfaUsed: false,
    });

    return response;
  } catch (error) {
    console.error("[AdminLogin] Error:", error);

    await auditLogger.log({
      action: "LOGIN_INTERNAL_ERROR",
      severity: "error",
      category: "auth",
      details: {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      ipAddress: clientIp,
      userAgent,
      status: "failure",
      metadata: {
        endpoint: "/api/admin/login",
        method: "POST",
      },
    });

    return NextResponse.json(
      { error: "Internal server error" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
          "X-Error-Type": "internal_error",
        },
      }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      recaptchaEnabled: !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      mfaEnabled: process.env.ADMIN_MFA_ENABLED === "true",
      allowRememberMe: true,
      maxPasswordLength: 500,
      minPasswordLength: 8,
      supportedAuthMethods: ["password", "mfa"],
      version: "1.0.0",
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=3600",
        "X-Endpoint-Version": "admin-login-v1",
      },
    }
  );
}

export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Status": "healthy",
      "X-Endpoint": "admin-login",
    },
  });
}