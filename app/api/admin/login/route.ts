// app/api/admin/login/route.ts - FINAL VERSION
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auditLogger } from "@/lib/audit/audit-logger";
import { check, createRateLimitedResponse, createRateLimitHeaders, type RateLimitResult } from "@/lib/server/rate-limit-unified-redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ==================== TYPES ====================

type AdminRole = "admin" | "superadmin" | "editor";

interface AdminUser {
  id: string;
  username: string;
  role: AdminRole;
  permissions: string[];
  mfaEnabled: boolean;
  status?: string;
}

interface AuthResult {
  success: boolean;
  user?: AdminUser;
  error?: string;
  requiresMFA?: boolean;
}

interface SessionResult {
  token: string;
  csrfToken?: string;
  userId: string;
  expiresAt?: Date;
}

// ==================== HELPERS ====================

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

function normalizeUsername(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

function normalizePassword(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function normalizeRememberMe(v: unknown): boolean {
  return v === true || v === "true" || v === "1";
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==================== AUDIT LOGGING ====================

async function logFailedAttempt(params: {
  username: string;
  reason: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
}): Promise<void> {
  const { username, reason, userId, ipAddress, userAgent } = params;
  try {
    await auditLogger.log({
      action: "LOGIN_FAILED",
      actorId: userId || "unknown",
      actorType: "user",
      actorEmail: username,
      category: "auth",
      severity: "warning",
      details: {
        reason,
        threatType: "failed_auth",
        sourceIp: ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
      status: "failure",
    });
  } catch (err) {
    console.error("[AuthLog] Failed to log failed attempt:", err);
  }
}

async function logSuccessfulLogin(params: {
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  mfaUsed: boolean;
}): Promise<void> {
  const { userId, username, ipAddress, userAgent, mfaUsed } = params;
  try {
    await auditLogger.log({
      action: "LOGIN_SUCCESS",
      actorId: userId,
      actorType: "user",
      actorEmail: username,
      category: "auth",
      severity: "info",
      details: {
        method: "password",
        mfaUsed,
        sourceIp: ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
      status: "success",
    });
  } catch (err) {
    console.error("[AuthLog] Failed to log successful login:", err);
  }
}

async function logMfaChallengeCreated(params: {
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
}): Promise<void> {
  const { userId, username, ipAddress, userAgent } = params;
  try {
    await auditLogger.log({
      action: "MFA_CHALLENGE_CREATED",
      actorId: userId,
      actorType: "user",
      actorEmail: username,
      category: "auth",
      severity: "info",
      details: {
        method: "password",
        mfaRequired: true,
        sourceIp: ipAddress,
        userAgent,
      },
      ipAddress,
      userAgent,
      status: "success",
    });
  } catch (err) {
    console.error("[AuthLog] Failed to log MFA challenge:", err);
  }
}

// ==================== RATE LIMITING ====================

async function applyRateLimiting(clientIp: string): Promise<{ limited: boolean; result?: RateLimitResult }> {
  const key = `auth:${clientIp}`;
  
  const result = await check(key, {
    windowMs: 60_000,      // 1 minute window
    limit: 5,              // 5 attempts max
    keyPrefix: "auth_login",
    blockDuration: 300_000, // 5 minute block if exceeded
  });
  
  return {
    limited: !result.allowed,
    result: result
  };
}

// ==================== PASSWORD VERIFICATION ====================

async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // Primary: bcryptjs
  try {
    const bcrypt = await import("bcryptjs");
    return await bcrypt.compare(inputPassword, storedHash);
  } catch (err) {
    console.warn("[Auth] bcrypt not available:", err);

    // Dev-only fallback
    if (process.env.NODE_ENV === "development") {
      const expected = process.env.ADMIN_DEV_PASSWORD || "";
      return inputPassword === expected && expected.length > 0;
    }

    throw new Error("Password verification unavailable");
  }
}

// ==================== AUTHENTICATION ====================

async function authenticateAdmin(params: {
  username: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}): Promise<AuthResult> {
  const { username, password, ipAddress, userAgent } = params;

  // Try central auth utility first
  try {
    const central = await import("@/lib/server/auth/admin-utils");
    if (typeof (central as any)?.verifyAdminCredentials === "function") {
      return await (central as any).verifyAdminCredentials(username, password);
    }
  } catch (err) {
    console.warn("[AdminAuth] Central auth unavailable, falling back to DB:", err);
  }

  // Database fallback
  try {
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
      await logFailedAttempt({ username, reason: "user_not_found", ipAddress, userAgent });
      return { success: false, error: "Invalid credentials" };
    }

    // Check if account is locked
    if (user.status === "locked" || (user.failedLoginAttempts ?? 0) >= 5) {
      return { success: false, error: "Account is temporarily locked. Please contact support." };
    }

    if (!user.passwordHash) {
      await logFailedAttempt({ username, reason: "missing_password_hash", userId: user.id, ipAddress, userAgent });
      return { success: false, error: "Invalid credentials" };
    }

    // Verify password
    const ok = await verifyPassword(password, user.passwordHash);
    if (!ok) {
      // Increment failed attempts
      await prisma.adminUser.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: { increment: 1 },
          lastFailedLoginAt: new Date(),
        },
      });

      await logFailedAttempt({ username, reason: "invalid_password", userId: user.id, ipAddress, userAgent });
      return { success: false, error: "Invalid credentials" };
    }

    // Reset failed attempts on successful login
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lastLoginAt: new Date() },
    });

    // Parse permissions
    const permissions: string[] =
      typeof user.permissions === "string"
        ? (JSON.parse(user.permissions || "[]") as string[])
        : (user.permissions ?? []);

    const adminUser: AdminUser = {
      id: user.id,
      username: user.username,
      role: user.role as AdminRole,
      permissions,
      mfaEnabled: !!user.mfaEnabled,
      status: user.status ?? undefined,
    };

    return { success: true, user: adminUser, requiresMFA: adminUser.mfaEnabled };
  } catch (err) {
    console.error("[AdminAuth] DB auth failed:", err);
    return { success: false, error: "Authentication failed" };
  }
}

// ==================== MFA ====================

async function setMFAChallenge(userId: string, challenge: string): Promise<void> {
  // Try dedicated MFA module first
  try {
    const mfaMod: any = await import("@/lib/auth/mfa");
    if (typeof mfaMod?.setMFAChallenge === "function") {
      await mfaMod.setMFAChallenge(userId, challenge);
      return;
    }
  } catch (err) {
    console.warn("[MFA] module unavailable, using CacheEntry fallback:", err);
  }

  // CacheEntry fallback
  const { prisma } = await import("@/lib/prisma");

  const ttlMs = 10 * 60 * 1000; // 10 minutes
  const expiresAt = new Date(Date.now() + ttlMs);
  const key = `mfa_challenge:${userId}`;

  await prisma.cacheEntry.upsert({
    where: { key },
    update: {
      value: JSON.stringify({
        challenge,
        expiresAt: expiresAt.toISOString(),
      }),
      expiresAt,
      tags: "mfa,challenge",
    },
    create: {
      key,
      value: JSON.stringify({
        challenge,
        expiresAt: expiresAt.toISOString(),
      }),
      expiresAt,
      tags: "mfa,challenge",
    },
  });
}

// ==================== SESSION CREATION ====================

async function createAdminSession(params: {
  user: AdminUser;
  userAgent: string;
  ipAddress: string;
  rememberMe: boolean;
}): Promise<SessionResult> {
  const { user, userAgent, ipAddress } = params;

  // Try central sessions module first
  try {
    const sessions: any = await import("@/lib/auth/sessions");
    if (typeof sessions?.createSession === "function") {
      const session = await sessions.createSession({
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions,
        mfaEnabled: user.mfaEnabled,
        userAgent,
        ipAddress,
        expiresIn: 30 * 24 * 60 * 60,
      });

      if (session?.token && session?.userId) {
        return {
          token: session.token,
          csrfToken: session.csrfToken,
          userId: session.userId,
          expiresAt: session.expiresAt,
        };
      }
    }
  } catch (err) {
    console.warn("[Session] Central sessions unavailable, using DB fallback:", err);
  }

  // Database fallback
  const sessionId = randomBytes(32).toString("hex");
  const csrfToken = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const { prisma } = await import("@/lib/prisma");
  await prisma.adminSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      token: sessionId,
      csrfToken,
      expiresAt,
      userAgent,
      ipAddress,
    },
  });

  return { token: sessionId, csrfToken, userId: user.id, expiresAt };
}

// ==================== MAIN POST HANDLER ====================

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get("user-agent") || "unknown";

  try {
    // 1. Apply rate limiting
const rate = await applyRateLimiting(clientIp);
if (rate.limited && rate.result) {
  await auditLogger.log({
    action: "RATE_LIMIT_EXCEEDED",
    category: "auth",
    severity: "warning",
    details: {
      threatType: "brute_force",
      sourceIp: clientIp,
      reason: "Too many login attempts",
      blocked: true,
    },
    ipAddress: clientIp,
    userAgent,
    status: "failure",
  });
  
  // Use the unified rate limiting response function
  return createRateLimitedResponse(rate.result);
}

    // 2. Parse request body
    let body: any = null;
    try {
      body = await request.json();
    } catch {
      await logFailedAttempt({ username: "unknown", reason: "invalid_json", ipAddress: clientIp, userAgent });
      return jsonError("Invalid JSON", 400);
    }

    const username = normalizeUsername(body?.username);
    const password = normalizePassword(body?.password);
    const rememberMe = normalizeRememberMe(body?.rememberMe);

    // 3. Validate input
    if (!username || !password) {
      await logFailedAttempt({ username: username || "unknown", reason: "missing_credentials", ipAddress: clientIp, userAgent });
      return jsonError("Username and password required", 400);
    }

    if (username.length > 100 || password.length > 500) {
      await logFailedAttempt({ username, reason: "invalid_input_length", ipAddress: clientIp, userAgent });
      return jsonError("Invalid input length", 400);
    }

    // 4. Authenticate user
    const auth = await authenticateAdmin({ username, password, ipAddress: clientIp, userAgent });

    if (!auth.success || !auth.user) {
      // Consistent timing to prevent timing attacks
      const elapsed = Date.now() - startTime;
      if (elapsed < 500) await sleep(500 - elapsed);

      return NextResponse.json({ error: auth.error || "Invalid credentials" }, { status: 401 });
    }

    // 5. Handle MFA if required
    if (auth.requiresMFA) {
      const challenge = randomBytes(16).toString("hex");
      await setMFAChallenge(auth.user.id, challenge);
      await logMfaChallengeCreated({ userId: auth.user.id, username, ipAddress: clientIp, userAgent });

      return NextResponse.json({
        success: true,
        requiresMFA: true,
        userId: auth.user.id,
        challenge,
        username: auth.user.username,
      });
    }

    // 6. Create session
    const session = await createAdminSession({
      user: auth.user,
      userAgent,
      ipAddress: clientIp,
      rememberMe,
    });

    // 7. Log successful login
    await logSuccessfulLogin({
      userId: auth.user.id,
      username,
      ipAddress: clientIp,
      userAgent,
      mfaUsed: false,
    });

    // 8. Build successful response
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: auth.user.id,
          username: auth.user.username,
          role: auth.user.role,
          permissions: auth.user.permissions,
          mfaEnabled: auth.user.mfaEnabled,
        },
        session: {
          expiresIn: 30 * 24 * 60 * 60,
          expiresAt: session.expiresAt?.toISOString(),
        },
      },
      { status: 200 }
    );

    // 9. Set secure cookies
    response.cookies.set("admin_session", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
      path: "/",
      priority: "high",
    });

    if (session.csrfToken) {
      response.cookies.set("admin_csrf", session.csrfToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60,
        path: "/",
      });
    }

    // 10. Add security headers
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    // 11. Add diagnostic headers
    response.headers.set("X-Login-Success", "true");
    response.headers.set("X-User-Role", auth.user.role);
    response.headers.set("X-User-Id", auth.user.id);
    response.headers.set("X-Response-Time", `${Date.now() - startTime}ms`);

    // 12. Add rate limit headers
    if (rate.result) {
      const headers = createRateLimitHeaders(rate.result);
      for (const [k, v] of Object.entries(headers)) response.headers.set(k, v);
    }

    console.log(`[AdminLogin] Successful login for ${username} in ${Date.now() - startTime}ms`);
    return response;

  } catch (err) {
    console.error("[AdminLogin] Internal server error:", err);

    // Log internal error
    try {
      await auditLogger.log({
        action: "LOGIN_INTERNAL_ERROR",
        category: "auth",
        severity: "error",
        details: {
          error: err instanceof Error ? err.message : String(err),
          sourceIp: clientIp,
        },
        ipAddress: clientIp,
        userAgent,
        status: "failure",
      });
    } catch (auditErr) {
      console.error("[AdminLogin] Failed to audit internal error:", auditErr);
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500, 
        headers: { 
          "Cache-Control": "no-store", 
          "X-Error-Type": "internal_error" 
        } 
      }
    );
  }
}

// ==================== SUPPORTING ENDPOINTS ====================

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      recaptchaEnabled: !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      mfaEnabled: process.env.ADMIN_MFA_ENABLED === "true",
      allowRememberMe: true,
      maxPasswordLength: 500,
      minPasswordLength: 8,
      supportedAuthMethods: ["password", "mfa"],
      version: "1.0.0",
      timestamp: new Date().toISOString(),
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

export async function HEAD(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Status": "healthy",
      "X-Endpoint": "admin-login",
      "X-Timestamp": new Date().toISOString(),
    },
  });
}

export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      Allow: "GET, POST, HEAD, OPTIONS",
      "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Max-Age": "86400",
      "Cache-Control": "no-store",
    },
  });
}