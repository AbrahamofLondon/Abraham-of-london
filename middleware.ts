// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { edgeRateLimit } from "@/lib/server/rate-limit-edge";

export const config = {
  matcher: ["/api/:path*", "/admin/:path*", "/inner-circle/:path*"],
};

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

function isEdgeRateLimitEnabled(): boolean {
  // Explicit off-switch wins
  if (process.env.DISABLE_EDGE_RATE_LIMIT === "true") return false;

  // Only enable if explicitly turned on (recommended)
  if (process.env.EDGE_RATE_LIMIT_ENABLED === "true") return true;

  // Sensible default: ON in production, OFF otherwise
  return process.env.NODE_ENV === "production";
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  const shouldLimit =
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/inner-circle");

  if (!shouldLimit) return NextResponse.next();

  // Don’t even call Redis unless enabled
  if (!isEdgeRateLimitEnabled()) return NextResponse.next();

  const ip = getClientIp(req);

  const rl = await edgeRateLimit({
    key: `edge:${ip}:${path}`,
    windowSeconds: 60,
    limit: 60,
  });

  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests", retryAfterSeconds: rl.retryAfterSeconds ?? 60 },
      {
        status: 429,
        headers: { "Cache-Control": "no-store", ...rl.headers },
      }
    );
  }

  const res = NextResponse.next();
  for (const [k, v] of Object.entries(rl.headers)) res.headers.set(k, v);
  return res;
}