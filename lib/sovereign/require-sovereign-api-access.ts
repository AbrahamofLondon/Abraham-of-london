/**
 * lib/sovereign/require-sovereign-api-access.ts
 *
 * Access guard for sovereign computation API routes.
 *
 * In production, accepts either:
 *   1. A valid NextAuth session (authenticated user).
 *   2. A bearer token matching SOVEREIGN_INTERNAL_TOKEN (service-to-service).
 *
 * In development, allows open access unless SOVEREIGN_API_STRICT=true.
 *
 * Returns a NextResponse error on access failure, null on success.
 * Callers must return the error response immediately when non-null.
 *
 * Error responses:
 *   401 — no credentials presented
 *   403 — credentials present but not accepted
 *
 * Raw failure reasons are never exposed in the response body.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

type AccessDeniedResponse = NextResponse<{ ok: false; error: string }>;

export async function requireSovereignApiAccess(
  req: NextRequest,
): Promise<AccessDeniedResponse | null> {
  const isDev = process.env.NODE_ENV !== "production";
  const strictInDev = process.env.SOVEREIGN_API_STRICT === "true";

  // Development bypass unless strict mode is explicitly enabled
  if (isDev && !strictInDev) return null;

  // Path 1: internal service token (server-to-server calls)
  const internalToken = process.env.SOVEREIGN_INTERNAL_TOKEN;
  if (internalToken) {
    const authHeader = req.headers.get("authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (bearer === internalToken) return null;
    // Token presented but wrong — 403 not 401 (credentials were provided, just wrong)
    if (bearer !== null) {
      return NextResponse.json(
        { ok: false, error: "Access not permitted" },
        { status: 403 },
      ) as AccessDeniedResponse;
    }
  }

  // Path 2: authenticated user session
  const session = await getServerSession(authOptions);
  if (session?.user) return null;

  // No valid credential path — 401
  return NextResponse.json(
    { ok: false, error: "Authentication required" },
    { status: 401 },
  ) as AccessDeniedResponse;
}
