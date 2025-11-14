// middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Global middleware – currently a pass-through.
 * Netlify / Next.js just need this to exist and export correctly.
 */
export function middleware(_req: NextRequest) {
  // You can add auth, logging, geo-based logic here later if needed.
  return NextResponse.next();
}

/**
 * Optional: limit which paths run through middleware.
 * This avoids touching static assets and image optimisations.
 */
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};