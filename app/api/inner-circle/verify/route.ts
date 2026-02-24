// app/api/inner-circle/verify/route.ts
import "server-only";

// Force the Node.js runtime to prevent Webpack from trying to bundle 
// Node-specific dependencies for the Edge runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from "next/server";
import { verifyInnerCircleKey } from "@/lib/inner-circle/exports.server";

type Bucket = { count: number; resetAt: number };
const BUCKETS = new Map<string, Bucket>();

function getIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function rateLimit(req: NextRequest, limit = 30, windowMs = 60_000) {
  const ip = getIp(req);
  const now = Date.now();
  const key = `verify:${ip}`;
  const b = BUCKETS.get(key);

  if (!b || b.resetAt <= now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit, resetAt: now + windowMs };
  }

  if (b.count >= limit) {
    return { allowed: false, remaining: 0, limit, resetAt: b.resetAt };
  }

  b.count += 1;
  BUCKETS.set(key, b);
  return { allowed: true, remaining: Math.max(0, limit - b.count), limit, resetAt: b.resetAt };
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        ok: false,
        error: "Rate limit exceeded. Try again shortly.",
        rateLimit: rl,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const key = String(body?.key || body?.accessKey || "").trim();

    if (!key) {
      return NextResponse.json({ ok: false, error: "Missing access key.", rateLimit: rl }, { status: 400 });
    }

    const result = await verifyInnerCircleKey(key);

    return NextResponse.json(
      {
        ok: true,
        result,
        rateLimit: rl,
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Verification failed.",
        rateLimit: rl,
      },
      { status: 500 }
    );
  }
}