// app/api/inner-circle/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyInnerCircleKeyWithRateLimit } from "@/lib/inner-circle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, unknown>;

type RateLimitShape = {
  allowed?: boolean;
  remaining?: number;
  resetAt?: string | number | null;
  resetTime?: string | number | null;
};

type VerificationShape = {
  valid?: boolean;
  member?: unknown;
  expiresAt?: unknown;
};

function pickVerificationPayload(out: AnyObj): VerificationShape {
  const maybe = out?.verification;
  if (maybe && typeof maybe === "object") return maybe as VerificationShape;
  return out as VerificationShape;
}

function recordHeaders(h: unknown): Record<string, string> | null {
  if (!h || typeof h !== "object") return null;
  const rec: Record<string, string> = {};
  for (const [k, v] of Object.entries(h as Record<string, unknown>)) {
    if (typeof v === "string") rec[k] = v;
    else if (typeof v === "number") rec[k] = String(v);
    else if (typeof v === "boolean") rec[k] = v ? "true" : "false";
  }
  return Object.keys(rec).length ? rec : null;
}

function normalizeResetAt(rateLimit?: RateLimitShape): string | null {
  const v = rateLimit?.resetAt ?? rateLimit?.resetTime ?? null;
  if (v == null) return null;
  if (typeof v === "number") return new Date(v).toISOString();
  if (typeof v === "string") return v;
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const key = typeof body?.key === "string" ? body.key.trim() : "";

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const out = (await verifyInnerCircleKeyWithRateLimit(key, req as any)) as AnyObj;

    const verification = pickVerificationPayload(out);
    const headers = recordHeaders((out as any)?.headers);
    const rateLimit = ((out as any)?.rateLimit ?? null) as RateLimitShape | null;

    const res = NextResponse.json(
      {
        valid: !!verification?.valid,
        member: (verification as any)?.member ?? null,
        expiresAt: (verification as any)?.expiresAt ?? null,
        rateLimit: rateLimit
          ? {
              allowed: !!rateLimit.allowed,
              remaining: rateLimit.remaining ?? null,
              resetAt: normalizeResetAt(rateLimit),
            }
          : undefined,
      },
      { status: 200 }
    );

    // Pass-through provided headers (safe only)
    if (headers) for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);

    res.headers.set("X-Inner-Circle-Valid", String(!!verification?.valid));
    res.headers.set("Cache-Control", "no-store");

    return res;
  } catch (err: any) {
    console.error("[InnerCircle] verify error:", err);
    return NextResponse.json(
      { error: "Internal server error", message: err?.message ?? String(err) },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}