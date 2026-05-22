/**
 * lib/api/admin-mutation-guard.ts
 *
 * Origin / CSRF protection for admin mutation routes.
 *
 * Checks that POST/PUT/PATCH/DELETE requests to admin mutation endpoints
 * originate from the same site. Relies on the Origin and Referer headers
 * to reject cross-origin requests.
 *
 * Usage:
 *   const originCheck = verifyAdminMutationOrigin(req);
 *   if (!originCheck.ok) {
 *     return res.status(403).json({ ok: false, error: originCheck.reason });
 *   }
 *
 * Safe GET requests are not checked (no state mutation possible).
 *
 * The X-Institutional-Action header is required for high-risk actions
 * (forceRepublish, scheduler live-run, global lock toggle).
 */

import type { NextApiRequest } from "next";

// ─── Allowed origins ──────────────────────────────────────────────────────────

function getAllowedOrigins(): string[] {
  const origins: string[] = [
    "https://abrahamoflondon.com",
    "https://www.abrahamoflondon.com",
  ];

  const envUrl = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL;
  if (envUrl) {
    try {
      const u = new URL(envUrl);
      origins.push(u.origin);
    } catch {
      // ignore malformed URL
    }
  }

  if (process.env.NODE_ENV !== "production") {
    origins.push(
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    );
  }

  return origins;
}

// ─── Origin check ─────────────────────────────────────────────────────────────

export type OriginCheckResult = { ok: true } | { ok: false; reason: string };

/**
 * Check that the request's Origin (or Referer) is an allowed first-party origin.
 * Returns ok:true if the origin matches; ok:false with reason if not.
 *
 * Call on all state-mutating admin routes (POST/PUT/PATCH/DELETE).
 */
export function verifyAdminMutationOrigin(req: NextApiRequest): OriginCheckResult {
  // Only check mutation methods
  const method = req.method?.toUpperCase() ?? "GET";
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { ok: true };
  }

  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const source = origin ?? referer;

  if (!source) {
    // In development, allow missing origin (e.g. Postman, curl)
    if (process.env.NODE_ENV !== "production") return { ok: true };
    return {
      ok: false,
      reason:
        "Missing origin header on mutation request. Cross-origin protection requires an Origin header.",
    };
  }

  const allowed = getAllowedOrigins();
  const originAllowed = allowed.some((o) => source.startsWith(o));

  if (!originAllowed) {
    return {
      ok: false,
      reason: `Cross-origin mutation blocked. Source: ${source.slice(0, 80)}`,
    };
  }

  return { ok: true };
}

// ─── High-risk header check ───────────────────────────────────────────────────

/**
 * High-risk actions (forceRepublish, scheduler live-run, global lock toggle)
 * must include X-Institutional-Action: <action-name>.
 * This prevents CSRF even if origin check is somehow bypassed.
 */
export function requireInstitutionalActionHeader(
  req: NextApiRequest,
  expectedAction: string,
): OriginCheckResult {
  const header = req.headers["x-institutional-action"];
  if (header !== expectedAction) {
    return {
      ok: false,
      reason: `Missing or incorrect X-Institutional-Action header. Expected: "${expectedAction}".`,
    };
  }
  return { ok: true };
}
