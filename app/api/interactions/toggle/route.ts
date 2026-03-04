// app/api/interactions/toggle/route.ts — HARDENED (App Router, Typed, Resilient)
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";
import { toggleInteraction, type InteractionAction } from "@/lib/db/interactions";

// ---------------------------------------------------------------------------
// Minimal server-side throttle (UX + abuse-dampener). Not a security boundary.
// Real security is auth + DB constraints + infra rate limits.
// ---------------------------------------------------------------------------
type Bucket = { count: number; resetAt: number };
const mem = new Map<string, Bucket>();

function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const cur = mem.get(key);
  if (!cur || now >= cur.resetAt) {
    mem.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs, limit };
  }
  if (cur.count >= limit) {
    return { ok: false, remaining: 0, resetAt: cur.resetAt, limit };
  }
  cur.count += 1;
  return { ok: true, remaining: Math.max(0, limit - cur.count), resetAt: cur.resetAt, limit };
}

function jsonError(message: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

function normalizeSlug(v: unknown) {
  return String(v ?? "").trim().slice(0, 256);
}

function normalizeAction(v: unknown): InteractionAction | null {
  const a = String(v ?? "").trim().toLowerCase();
  if (a === "like" || a === "save") return a;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // App Router usage (correct)
    const session = await getServerSession(authOptions);

    const email = session?.user?.email ? String(session.user.email).trim().toLowerCase() : "";
    if (!email) return jsonError("Authentication required.", 401);

    // Body (defensive)
    const body = await req.json().catch(() => ({} as any));
    const slug = normalizeSlug(body?.slug);
    const action = normalizeAction(body?.action);

    if (!slug) return jsonError("Invalid asset identifier.", 400);
    if (!action) return jsonError("Invalid action.", 400);

    // Soft throttle: per user + action + slug (prevents hammering)
    const rl = rateLimit(`ic:${email}:${action}:${slug}`, 20, 60_000);
    if (!rl.ok) {
      const retryAfter = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000));
      return NextResponse.json(
        { ok: false, error: "Too many requests.", retryAfter },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(rl.limit),
            "X-RateLimit-Remaining": String(rl.remaining),
            "X-RateLimit-Reset": String(rl.resetAt),
          },
        }
      );
    }

    // Execute mutation (server-side truth)
    const stats = await toggleInteraction(slug, action, email);

    return NextResponse.json(
      {
        ok: true,
        slug,
        action,
        status: stats.deletedAt ? "removed" : "added",
        likes: stats.likes ?? 0,
        saves: stats.saves ?? 0,
        userLiked: !!stats.userLiked,
        userSaved: !!stats.userSaved,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store",
          "X-RateLimit-Limit": String(rl.limit),
          "X-RateLimit-Remaining": String(rl.remaining),
        },
      }
    );
  } catch (error) {
    console.error("[Interactions] Critical failure:", error);
    return jsonError("Internal Server Error.", 500);
  }
}