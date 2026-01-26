// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { edgeRateLimit } from "@/lib/server/rate-limit-edge";

export const config = {
  // Adjust matchers to what you actually need to protect at the edge
  matcher: [
    "/api/:path*",
    "/admin/:path*",
    "/inner-circle/:path*",
  ],
};

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() || "unknown";
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip.trim();
  return "unknown";
}

export async function middleware(req: NextRequest) {
  // IMPORTANT: do not import ANY node-only module here.
  // Only call Edge-safe utilities (fetch/WebCrypto).

  const ip = getClientIp(req);
  const path = req.nextUrl.pathname;

  // Example: only rate-limit sensitive endpoints
  const shouldLimit =
    path.startsWith("/api/") ||
    path.startsWith("/admin") ||
    path.startsWith("/inner-circle");

  if (!shouldLimit) return NextResponse.next();

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
        headers: {
          "Cache-Control": "no-store",
          ...rl.headers,
        },
      }
    );
  }

  const res = NextResponse.next();
  // attach rate limit headers (optional but useful)
  for (const [k, v] of Object.entries(rl.headers)) res.headers.set(k, v);
  return res;
}