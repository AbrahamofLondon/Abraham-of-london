// app/api/inner-circle/verify/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyInnerCircleKeyWithRateLimit } from "@/lib/inner-circle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnyObj = Record<string, any>;

function pickVerificationPayload(out: AnyObj): AnyObj {
  // Supports BOTH shapes:
  // A) { verification: {...}, rateLimit?, headers? }
  // B) { valid, member, expiresAt, rateLimit?, headers? }  (verification at top level)
  return (out && typeof out === "object" && "verification" in out && out.verification)
    ? out.verification
    : out;
}

function recordHeaders(h: unknown): Record<string, string> | null {
  if (!h || typeof h !== "object") return null;
  const rec: Record<string, string> = {};
  for (const [k, v] of Object.entries(h as Record<string, unknown>)) {
    if (typeof v === "string") rec[k] = v;
    else if (typeof v === "number") rec[k] = String(v);
    else if (typeof v === "boolean") rec[k] = v ? "true" : "false";
  }
  return rec;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json().catch(() => ({}));
    const key = typeof body?.key === "string" ? body.key.trim() : "";

    if (!key) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }

    const out = (await verifyInnerCircleKeyWithRateLimit(key, req as any)) as AnyObj;

    const verification = pickVerificationPayload(out);
    const headers = recordHeaders(out?.headers);
    const rateLimit = out?.rateLimit;

    const res = NextResponse.json(
      {
        valid: !!verification?.valid,
        member: verification?.member ?? null,
        expiresAt: verification?.expiresAt ?? null,
        rateLimit: rateLimit
          ? {
              allowed: !!rateLimit.allowed,
              remaining: rateLimit.remaining ?? null,
              resetAt: rateLimit.resetAt ?? rateLimit.resetTime ?? null,
            }
          : undefined,
      },
      { status: 200 }
    );

    // Pass-through rate limit headers if provided
    if (headers) {
      for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
    }

    // Useful explicit headers
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