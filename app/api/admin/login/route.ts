// app/api/admin/login/route.ts - FIXED VERSION
import { NextRequest, NextResponse } from "next/server";
import { randomBytes, timingSafeEqual } from "crypto";

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

// ==================== CONFIGURATION ====================
// IMPORTANT: In production, do not store users in code.
// Use a DB + bcrypt hash + proper session storage.
const ADMIN_USERS = [
  {
    id: "1",
    username: "admin",
    role: "superadmin",
    mfaEnabled: false,
  },
];

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

function getDevPassword(): string | null {
  const p = process.env.ADMIN_DEV_PASSWORD;
  return typeof p === "string" && p.trim().length > 0 ? p.trim() : null;
}

// ✅ FIXED: Use Uint8Array instead of Buffer for timingSafeEqual
async function validatePassword(inputPassword: string): Promise<boolean> {
  const devPassword = getDevPassword();
  if (devPassword) {
    // Use Uint8Array instead of Buffer for TypeScript compatibility
    const encoder = new TextEncoder();
    const a = encoder.encode(inputPassword);
    const b = encoder.encode(devPassword);
    
    if (a.length !== b.length) return false;
    
    // Convert Uint8Array to Buffer for timingSafeEqual
    return timingSafeEqual(
      Buffer.from(a.buffer, a.byteOffset, a.byteLength),
      Buffer.from(b.buffer, b.byteOffset, b.byteLength)
    );
  }

  if (process.env.NODE_ENV !== "production") {
    return inputPassword === "admin123"; // CHANGE THIS if you ever use it.
  }

  return false;
}

// ✅ ALTERNATIVE SIMPLER FIX (if above still has issues):
// async function validatePassword(inputPassword: string): Promise<boolean> {
//   const devPassword = getDevPassword();
//   if (devPassword) {
//     // Simple timing-safe comparison for strings
//     if (inputPassword.length !== devPassword.length) return false;
//     
//     let result = 0;
//     for (let i = 0; i < inputPassword.length; i++) {
//       result |= inputPassword.charCodeAt(i) ^ devPassword.charCodeAt(i);
//     }
//     return result === 0;
//   }
// 
//   if (process.env.NODE_ENV !== "production") {
//     return inputPassword === "admin123";
//   }
// 
//   return false;
// }

function createSessionCookieValue(userId: string): string {
  const nonce = randomBytes(24).toString("hex");
  return `${userId}.${nonce}`;
}

function setAdminSessionCookie(res: NextResponse, userId: string, rememberMe: boolean) {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;

  res.cookies.set("admin_session", createSessionCookieValue(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge,
    path: "/",
  });
}

// ==================== MAIN HANDLERS ====================
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { rateLimitRedis, rateLimitModule } = await loadRateLimiters();

    // ==================== RATE LIMITING ====================
    let rateLimitResult: any = null;

    // 1) Redis limiter (preferred)
    if (rateLimitRedis?.check) {
      try {
        rateLimitResult = await rateLimitRedis.check(`auth:${ip}`, {
          windowMs: 60_000,
          max: 5,
          keyPrefix: "auth_login",
          blockDuration: 300_000,
        });

        if (rateLimitResult && rateLimitResult.allowed === false) {
          return NextResponse.json({ error: "Too many login attempts" }, { status: 429 });
        }
      } catch (e) {
        console.warn("[AdminLogin] Redis rate limit error:", e);
      }
    }

    // 2) Unified limiter fallback (only if present)
    if (!rateLimitResult && rateLimitModule?.withEdgeRateLimit) {
      try {
        const cfg =
          rateLimitModule.RATE_LIMIT_CONFIGS?.AUTH ?? { limit: 10, windowMs: 300_000 };

        const { allowed, result } = await rateLimitModule.withEdgeRateLimit(request, cfg);

        if (!allowed) {
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
      return jsonError("Invalid JSON", 400);
    }

    const username = normalizeUsername(body?.username);
    const password = normalizePassword(body?.password);
    const rememberMe = normalizeRememberMe(body?.rememberMe);

    if (!username || !password) {
      return jsonError("Username and password required", 400);
    }

    // ==================== CREDENTIAL CHECK ====================
    const user = ADMIN_USERS.find((u) => u.username.toLowerCase() === username);

    if (!user) {
      await new Promise((r) => setTimeout(r, 350));
      return jsonError("Invalid credentials", 401);
    }

    const ok = await validatePassword(password);
    if (!ok) return jsonError("Invalid credentials", 401);

    // ==================== RESPONSE ====================
    const res = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          mfaEnabled: user.mfaEnabled,
        },
      },
      { status: 200 }
    );

    setAdminSessionCookie(res, user.id, rememberMe);

    // Rate-limit headers (if module provides them)
    if (rateLimitResult && rateLimitModule?.createRateLimitHeaders) {
      try {
        const headers = rateLimitModule.createRateLimitHeaders(rateLimitResult);
        for (const [k, v] of Object.entries(headers)) res.headers.set(k, String(v));
      } catch (e) {
        console.warn("[AdminLogin] Could not set rate limit headers:", e);
      }
    }

    // Security headers (minimal but sensible)
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Cache-Control", "no-store");
    res.headers.set("X-Login-Success", "true");
    res.headers.set("X-User-Role", user.role);

    return res;
  } catch (error) {
    console.error("[AdminLogin] Error:", error);
    return jsonError("Internal server error", 500);
  }
}

export async function GET() {
  return NextResponse.json(
    {
      recaptchaEnabled: !!process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY,
      mfaEnabled: false,
      allowRememberMe: true,
    },
    { status: 200, headers: { "Cache-Control": "no-store" } }
  );
}