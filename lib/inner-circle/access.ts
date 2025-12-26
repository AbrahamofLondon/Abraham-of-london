// lib/inner-circle/access.ts
const COOKIE_NAME = "innerCircleAccess";

function getCookieValueFromDocument(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
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
 * Client call: hasInnerCircleAccess()
 * Server call: hasInnerCircleAccess(req.headers.cookie)
 */
export function hasInnerCircleAccess(cookieHeader?: string): boolean {
  const val =
    typeof cookieHeader === "string"
      ? getCookieValueFromHeader(cookieHeader, COOKIE_NAME)
      : getCookieValueFromDocument(COOKIE_NAME);

  // Treat any non-empty value as access; your system can later validate signatures.
  return Boolean(val && val.length > 10);
}

// Alias for backward compatibility with existing imports
export const getInnerCircleAccess = hasInnerCircleAccess;