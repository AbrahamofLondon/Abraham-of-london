// netlify/functions/_utils.ts
import type {
  Handler,
  HandlerResponse,
  HandlerEvent,
  HandlerContext,
} from "@netlify/functions";
import { verifyRecaptcha } from "../../lib/verifyRecaptcha";

/* ============================================================================
   SECURITY CONSTANTS & TYPES
   ============================================================================ */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type GuardOptions = {
  requireRecaptcha?: boolean;
  expectedAction?: string;
  requireHoneypot?: boolean;
  honeypotFieldNames?: string[];
};

interface ApiRequestBody {
  recaptchaToken?: string;
  token?: string;
  [key: string]: unknown;
}

// Memoized allowed origins parsing
let cachedAllowedOrigins: string[] | null = null;
export function getAllowedOrigins(): string[] {
  if (!cachedAllowedOrigins) {
    cachedAllowedOrigins = (process.env.ALLOWED_ORIGINS || "*")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return cachedAllowedOrigins;
}

// Max JSON body with better validation
const MAX_BODY_BYTES = Math.max(
  0,
  Number(process.env.MAX_BODY_BYTES || 64 * 1024)
);

/* ============================================================================
   SECURITY: IP & CLIENT UTILITIES
   ============================================================================ */

export function getClientIp(event: {
  headers: Record<string, string | string[] | undefined>;
}): string | undefined {
  const headers = event.headers;

  const netlifyIp = headers["x-nf-client-connection-ip"];
  if (typeof netlifyIp === "string") return netlifyIp;

  const forwardedFor = headers["x-forwarded-for"];
  if (Array.isArray(forwardedFor)) return forwardedFor[0];
  if (typeof forwardedFor === "string")
    return forwardedFor.split(",")[0]?.trim();

  const realIp = headers["x-real-ip"];
  if (typeof realIp === "string") return realIp;

  return undefined;
}

/* ============================================================================
   SECURITY: API GUARD WRAPPER
   ============================================================================ */

export function withSecurity(
  handler: Handler,
  options: GuardOptions = {}
): Handler {
  const {
    requireRecaptcha = true,
    expectedAction,
    requireHoneypot = true,
    honeypotFieldNames = ["website", "middleName", "botField"],
  } = options;

  return async (
    event: HandlerEvent,
    context: HandlerContext
  ): Promise<HandlerResponse> => {
    const origin = event.headers.origin || event.headers.Origin || "*";
    const allowedOrigins = getAllowedOrigins();

    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 204, headers: corsHeaders(origin), body: "" };
    }

    if (
      origin &&
      allowedOrigins[0] !== "*" &&
      !allowedOrigins.includes(origin)
    ) {
      return json({ ok: false, message: "Forbidden" }, 403, "null");
    }

    // Honeypot (silent pass if bot filled it)
    if (
      requireHoneypot &&
      event.body &&
      (event.headers["content-type"] || event.headers["Content-Type"] || "")
        .toString()
        .includes("application/json")
    ) {
      try {
        const body = JSON.parse(event.body) as Record<string, unknown>;
        for (const field of honeypotFieldNames) {
          const val = body[field];
          if (typeof val === "string" && val.trim().length > 0) {
            return ok("Success", {}, origin);
          }
        }
      } catch {
        // soft-fail
      }
    }

    // reCAPTCHA guard
    if (requireRecaptcha) {
      let token: string | undefined;

      const ct = (
        event.headers["content-type"] ||
        event.headers["Content-Type"] ||
        ""
      )
        .toString()
        .toLowerCase();

      if (event.body && ct.includes("application/json")) {
        try {
          const body = JSON.parse(event.body) as ApiRequestBody;
          token = body.recaptchaToken || body.token;
        } catch {
          // continue to header check
        }
      }

      if (!token) {
        token = event.headers["x-recaptcha-token"] as string | undefined;
      }

      if (!token || typeof token !== "string") {
        return bad("Security verification required", 400, origin);
      }

      const clientIp = getClientIp(event);

      try {
        // SINGLE verification call
        const detailed = await verifyRecaptcha(token, expectedAction, clientIp);

        if (!detailed.success) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("[reCAPTCHA] failed", {
              expectedAction,
              clientIp,
              score: detailed.score,
              action: detailed.action,
              hostname: detailed.hostname,
              reasons: detailed.reasons,
              errorCodes: detailed.errorCodes,
            });
          }
          return bad("Security verification failed", 403, origin);
        }

        if (process.env.NODE_ENV === "production") {
          console.info("[reCAPTCHA] passed", {
            score: detailed.score,
            action: detailed.action,
            hostname: detailed.hostname,
          });
        }
      } catch (error) {
        console.error("[reCAPTCHA] verification error:", error);
        return bad("Security verification error", 500, origin);
      }
    }

    const result = await handler(event, context);
    return result as HandlerResponse;
  };
}

/* ============================================================================
   URL & ORIGIN HELPERS
   ============================================================================ */

let cachedSiteUrl: string | null = null;
export function getSiteUrl(): string {
  if (!cachedSiteUrl) {
    const raw =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      "https://www.abrahamoflondon.org";
    cachedSiteUrl = String(raw).replace(/\/$/, "");
  }
  return cachedSiteUrl;
}

export function getCorsOrigin(requestOrigin?: string): string {
  const allowedOrigins = getAllowedOrigins();
  if (!requestOrigin || allowedOrigins.includes("*")) return "*";
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : "null";
}

export function corsHeaders(origin = "*") {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS,GET",
    "Access-Control-Allow-Headers":
      "Content-Type,Authorization,X-Requested-With,X-recaptcha-Token",
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
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Referrer-Policy": "strict-origin-when-cross-origin",
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
  return json({ ok: false, error: message }, status, origin);
}

export function methodNotAllowed(origin = "*"): HandlerResponse {
  return json({ ok: false, error: "Method Not Allowed" }, 405, origin);
}

export function handleOptions(origin = "*"): HandlerResponse {
  return { statusCode: 204, headers: { ...corsHeaders(origin) }, body: "" };
}

/* ============================================================================
   REQUEST / BODY HELPERS
   ============================================================================ */

export async function readJson<T = Record<string, unknown>>(req: {
  headers: Record<string, string | string[] | undefined>;
  body?: string | null;
}): Promise<T> {
  const getHeader = (name: string) => {
    const h = req.headers;
    const val = h[name] ?? h[name.toLowerCase()];
    return Array.isArray(val) ? val[0] : val || null;
  };

  const ct = getHeader("Content-Type") || "";
  const isJson = !!ct && /^application\/json/i.test(ct);

  let raw = "";
  if (typeof req.body === "string") raw = req.body;
  else if (req.body) raw = String(req.body);

  if (!raw || !isJson) return {} as T;

  if (Buffer.byteLength(raw) > MAX_BODY_BYTES) {
    throw new Error(`Payload too large (max ${MAX_BODY_BYTES} bytes)`);
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error("Invalid JSON payload");
  }
}

/* ============================================================================
   MISC UTILS
   ============================================================================ */

const htmlEscapes: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(str: string): string {
  return String(str).replace(/[&<>"']/g, (char) => htmlEscapes[char] || char);
}

export function normalizeEmail(input: unknown): string | null {
  if (!input) return null;
  const email = String(input).trim().toLowerCase();
  return EMAIL_RE.test(email) ? email : null;
}

export function missingKeys(
  obj: Record<string, unknown>,
  keys: string[]
): string[] {
  return keys.filter((k) => {
    const val = obj[k];
    return val == null || (typeof val === "string" && val.trim() === "");
  });
}

export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): { isValid: boolean; missing: string[] } {
  const missing = missingKeys(data, requiredFields);
  return { isValid: missing.length === 0, missing };
}