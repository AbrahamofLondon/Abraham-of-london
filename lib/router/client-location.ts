// lib/router/client-location.ts — INSTITUTIONAL GRADE

/**
 * Safely gets the current pathname on the client.
 * During SSR, returns "/" to prevent hydration mismatches.
 */
export function getClientPathname(): string {
  if (typeof window === "undefined") return "/";
  
  try {
    const pathname = (window.location.pathname || "/").split("#")[0] || "/";
    return decodeURIComponent(pathname);
  } catch {
    // Fallback if decoding fails
    return "/";
  }
}

/**
 * Safely gets the full URL on the client.
 * During SSR, returns base URL.
 */
export function getClientUrl(): string {
  if (typeof window === "undefined") return process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  
  try {
    return window.location.href;
  } catch {
    return "/";
  }
}

/**
 * Safely gets query parameters as a record.
 * During SSR, returns empty object.
 */
export function getClientQuery(): Record<string, string> {
  if (typeof window === "undefined") return {};
  
  const out: Record<string, string> = {};
  
  try {
    const qs = window.location.search || "";
    const sp = new URLSearchParams(qs);
    
    for (const [k, v] of sp.entries()) {
      out[k] = v;
    }
  } catch {
    // Return empty object on error
  }
  
  return out;
}

/**
 * Safely gets a specific query parameter.
 * During SSR, returns null.
 */
export function getClientQueryParam(key: string): string | null {
  if (typeof window === "undefined") return null;
  
  try {
    const qs = window.location.search || "";
    const sp = new URLSearchParams(qs);
    return sp.get(key);
  } catch {
    return null;
  }
}

/**
 * Checks if code is running on the client.
 */
export function isClient(): boolean {
  return typeof window !== "undefined";
}

/**
 * Checks if code is running on the server.
 */
export function isServer(): boolean {
  return typeof window === "undefined";
}