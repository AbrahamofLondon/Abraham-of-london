// app/api/inner-circle/verify/route.ts
import "server-only";

// Force the Node.js runtime to prevent Webpack from trying to bundle 
// Node-specific dependencies for the Edge runtime.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse, type NextRequest } from "next/server";
import { verifyInnerCircleKey } from "@/lib/inner-circle/exports.server";
import { consumePersistentRateLimit } from "@/lib/server/security/persistent-rate-limit";

function getIp(req: NextRequest) {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

async function rateLimit(req: NextRequest, limit = 30, windowMs = 60_000) {
  const ip = getIp(req);
  return consumePersistentRateLimit({
    key: `inner-circle-verify:${ip}`,
    limit,
    windowMs,
    failClosed: true,
  });
}

export async function POST(req: NextRequest) {
  const rl = await rateLimit(req);
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
