// netlify/functions/_utils.ts
import type { HandlerResponse } from "@netlify/functions";

/* ============================================================================
   CONSTANTS & ENV
   ============================================================================ */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Comma-separated list or "*" (default)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Max JSON body we’ll attempt to parse (defaults to 64KB)
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 64 * 1024);

/* ============================================================================
   URL & ORIGIN HELPERS
   ============================================================================ */

export function getSiteUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://www.abrahamoflondon.org";
  return String(raw).replace(/\/$/, "");
}

export function getCorsOrigin(requestOrigin?: string): string {
  if (!requestOrigin || ALLOWED_ORIGINS.includes("*")) return "*";
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "null";
}

export function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  } as const;
}

/* ============================================================================
   RESPONSE HELPERS
   ============================================================================ */

export function json(
  body: unknown,
  status = 200,
  origin = "*",
  extraHeaders: Record<string, string> = {}
): HandlerResponse {
  return {
    statusCode: status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      ...corsHeaders(origin),
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

export function ok(
  message = "OK",
  extra: Record<string, unknown> = {},
  origin = "*"
): HandlerResponse {
  return json({ ok: true, message, ...extra }, 200, origin);
}

export function bad(
  message = "Bad Request",
  status = 400,
  origin = "*"
): HandlerResponse {
  return json({ ok: false, message }, status, origin);
}

export function methodNotAllowed(origin = "*"): HandlerResponse {
  return json({ ok: false, message: "Method Not Allowed" }, 405, origin);
}

export function handleOptions(origin = "*"): HandlerResponse {
  return {
    statusCode: 204,
    headers: {
      ...corsHeaders(origin),
    },
    body: "",
  };
}

/* ============================================================================
   REQUEST / BODY HELPERS
   ============================================================================ */

/**
 * Safe JSON parse with size guard.
 * Accepts either a WHATWG Request or a lightweight { headers, body } shape
 * (useful with Netlify’s event objects).
 */
export async function readJson<T = Record<string, unknown>>(
  req:
    | Request
    | {
        headers: Headers | Record<string, string | string[] | undefined>;
        body?: string | null;
      }
): Promise<T> {
  // Extract content-type
  const getHeader = (name: string) => {
    if (req instanceof Request) return req.headers.get(name);
    const h = req.headers as Record<string, string | string[] | undefined>;
    const val = h[name] ?? h[name.toLowerCase()];
    return Array.isArray(val) ? val[0] : val || null;
  };

  const ct = getHeader("Content-Type") || getHeader("content-type") || "";
  const isJson = !!ct && /application\/json/i.test(ct);

  // Read raw body safely
  let raw = "";
  if (req instanceof Request) {
    // We can’t preflight size here, but we keep a hard JSON try/catch below
    raw = await req.text();
  } else if (typeof req.body === "string") {
    raw = req.body;
  } else if (req.body) {
    // Body present but not string; best effort
    raw = String(req.body);
  }

  // Size check (only applicable when we do hold the full body string)
  if (raw && Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    throw new Error("Payload too large");
  }

  if (!raw || !isJson) return {} as T;

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Invalid JSON payload");
  }
}

/* ============================================================================
   MISC UTILS
   ============================================================================ */

export function escapeHtml(str: string) {
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      (
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }) as const
      )[m] || m
  );
}

/** Narrow email string & validate quickly */
export function normalizeEmail(input: unknown): string | null {
  const v = String(input ?? "").trim();
  return EMAIL_RE.test(v) ? v : null;
}

/** Small guard for required fields; returns a list of missing keys */
export function missingKeys(
  obj: Record<string, unknown>,
  keys: string[]
): string[] {
  return keys.filter((k) => {
    const v = obj[k];
    return (
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "")
    );
  });
}
