// lib/inner-circle/access.ts

const COOKIE_NAME = "innerCircleAccess";

function getCookieValueFromDocument(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match || !match[1]) return null;
  return decodeURIComponent(match[1]);
}

function getCookieValueFromHeader(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((p) => p.trim());
  for (const p of parts) {
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    const k = p.slice(0, eq);
    const v = p.slice(eq + 1);
    if (k === name) return decodeURIComponent(v);
  }
  return null;
}

/**
 * Type representing the access state of a user
 */
export type AccessState = {
  /** Whether the user has access to inner circle content */
  hasAccess: boolean;
  /** Compatible with older code expecting 'ok' property */
  ok: boolean;
  /** Reason for access status (for debugging/UI) */
  reason: "granted" | "missing" | "expired" | "invalid";
  /** The access token value if present */
  token?: string | null;
  /** Timestamp when access was last checked */
  checkedAt: Date;
  /** Optional: Expiry timestamp if the token has an expiration */
  expiresAt?: Date;
  /** Optional: User's tier/level within the inner circle */
  tier?: "member" | "patron" | "founder";
};

/**
 * Client call: getInnerCircleAccess()
 * Server call: getInnerCircleAccess(req.headers.cookie)
 * Returns: AccessState object with detailed access information
 */
export function getInnerCircleAccess(cookieHeader?: string): AccessState {
  const val =
    typeof cookieHeader === "string"
      ? getCookieValueFromHeader(cookieHeader, COOKIE_NAME)
      : getCookieValueFromDocument(COOKIE_NAME);

  const hasAccess = Boolean(val && val.length > 10);
  const now = new Date();

  return {
    hasAccess,
    ok: hasAccess, // Alias for backward compatibility
    reason: hasAccess ? "granted" : "missing",
    token: hasAccess ? val : null,
    checkedAt: now,
    // Optional future enhancements:
    // expiresAt: val ? parseExpiration(val) : undefined,
    // tier: val ? decodeTier(val) : undefined,
  };
}

/**
 * Legacy function for backward compatibility
 * Returns: boolean indicating if user has access
 */
export function hasInnerCircleAccess(cookieHeader?: string): boolean {
  return getInnerCircleAccess(cookieHeader).hasAccess;
}