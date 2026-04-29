/**
 * Dev admin login — development only.
 * Returns 404 outside development environment.
 * Rate-limited even in development.
 * Does NOT create independent admin authority — sets a dev-only cookie
 * that is verified against NextAuth in production flows.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto, { timingSafeEqual } from "crypto";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";
import { applyShieldFromRequest } from "@/lib/server/security/shield-middleware";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Hard gate: development only
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Anti-reconnaissance shield
  const shield = await applyShieldFromRequest(req, "/api/admin/dev-login");
  if (shield.blocked) return NextResponse.json({ error: "REQUEST_THROTTLED" }, { status: 429 });

  // Rate limit: strict — 5 requests per 60s per IP
  const clientIp = String(
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
  const rl = await consumePersistentRateLimit({
    key: `dev-login:${clientIp}`,
    limit: 5,
    windowMs: 60_000,
    failClosed: true,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED" },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
    );
  }

  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const password = typeof body?.password === "string" ? body.password : "";

    const devPassword = process.env.DEV_ADMIN_PASSWORD || "";
    if (!devPassword) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Timing-safe compare with hashed comparison
    const a = Buffer.from(password, "utf8");
    const b = Buffer.from(devPassword, "utf8");
    const isValid = a.length === b.length ? timingSafeEqual(a, b) : false;

    if (!isValid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = crypto.randomUUID();
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const res = NextResponse.json({
      success: true,
      token,
      expires: expires.toISOString(),
    });

    res.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: false, // development only
      sameSite: "strict",
      path: "/",
      expires,
    });

    res.headers.set("Cache-Control", "no-store");
    return res;
  } catch (error) {
    console.error("Dev admin login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
