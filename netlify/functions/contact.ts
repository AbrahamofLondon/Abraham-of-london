// netlify/functions/contact.ts
import type { Handler } from "@netlify/functions";

/* =========================
   CONFIG
   ========================= */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET?.trim(); // optional (Google reCAPTCHA v2/v3)
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET?.trim(); // optional (Cloudflare Turnstile)
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 64 * 1024); // 64KB default

/* =========================
   CORS / HEADERS
   ========================= */
function getCorsOrigin(requestOrigin?: string): string {
  if (!requestOrigin || ALLOWED_ORIGINS.includes("*")) return "*";
  return ALLOWED_ORIGINS.includes(requestOrigin) ? requestOrigin : "null";
}

function jsonHeaders(origin: string) {
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
  } as const;
}

/* =========================
   UTILITIES
   ========================= */
function isJsonContentType(ct?: string | null) {
  return !!ct && /application\/json/i.test(ct);
}

function safeParseJson<T = unknown>(raw: string): { ok: true; data: T } | { ok: false; error: string } {
  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return { ok: false, error: "Invalid JSON payload" };
  }
}

function fail(statusCode: number, headers: Record<string, string>, error: string, code?: string) {
  return {
    statusCode,
    headers,
    body: JSON.stringify({ ok: false, error, code }),
  };
}

type ContactPayload = {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
  // optional anti-spam
  honeypot?: string;
  // optional captcha tokens
  recaptchaToken?: string;
  turnstileToken?: string;
  // any extras
  [k: string]: unknown;
};

function validatePayload(p: ContactPayload) {
  const errors: string[] = [];

  const name = (p.name ?? "").toString().trim();
  const email = (p.email ?? "").toString().trim();
  const subject = (p.subject ?? "").toString().trim();
  const message = (p.message ?? "").toString().trim();

  if (!name) errors.push("name is required");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("valid email is required");
  if (!subject) errors.push("subject is required");
  if (!message || message.length < 10) errors.push("message must be at least 10 characters");

  // simple spam guard
  if (p.honeypot && String(p.honeypot).trim() !== "") {
    errors.push("honeypot must be empty");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { name, email, subject, message },
  };
}

async function verifyRecaptcha(token: string, remoteIp?: string) {
  if (!RECAPTCHA_SECRET) return { ok: true, provider: "recaptcha", skipped: true };
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: RECAPTCHA_SECRET,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    const json = (await res.json()) as { success?: boolean; score?: number; "error-codes"?: string[] };
    if (!json.success) {
      return { ok: false, provider: "recaptcha", reason: (json["error-codes"] || ["verification_failed"]).join(",") };
    }
    // Optional score gating for reCAPTCHA v3
    if (typeof json.score === "number" && json.score < 0.4) {
      return { ok: false, provider: "recaptcha", reason: `low_score:${json.score}` };
    }
    return { ok: true, provider: "recaptcha" };
  } catch (e) {
    return { ok: false, provider: "recaptcha", reason: "network_error" };
  }
}

async function verifyTurnstile(token: string, remoteIp?: string) {
  if (!TURNSTILE_SECRET) return { ok: true, provider: "turnstile", skipped: true };
  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: new URLSearchParams({
        secret: TURNSTILE_SECRET,
        response: token,
        ...(remoteIp ? { remoteip: remoteIp } : {}),
      }),
    });
    const json = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!json.success) {
      return { ok: false, provider: "turnstile", reason: (json["error-codes"] || ["verification_failed"]).join(",") };
    }
    return { ok: true, provider: "turnstile" };
  } catch {
    return { ok: false, provider: "turnstile", reason: "network_error" };
  }
}

/* =========================
   HANDLER
   ========================= */
export const handler: Handler = async (event) => {
  const origin = getCorsOrigin(event.headers.origin || event.headers.Origin);
  const headers = jsonHeaders(origin);

  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  // Method guard
  if (event.httpMethod !== "POST") {
    return fail(405, headers, "Method Not Allowed", "ERR_METHOD");
  }

  // Content-Type guard
  const contentType = event.headers["content-type"] || event.headers["Content-Type"];
  if (!isJsonContentType(contentType)) {
    return fail(415, headers, "Unsupported Media Type (expect application/json)", "ERR_CONTENT_TYPE");
  }

  // Body guards
  const raw = event.body || "";
  if (!raw) {
    return fail(400, headers, "Missing request body", "ERR_NO_BODY");
  }
  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return fail(413, headers, "Payload too large", "ERR_TOO_LARGE");
  }

  // Safe parse
  const parsed = safeParseJson<ContactPayload>(raw);
  if (!parsed.ok) {
    return fail(400, headers, parsed.error, "ERR_BAD_JSON");
  }
  const payload = parsed.data;

  // Basic validation
  const { valid, errors, data } = validatePayload(payload);
  if (!valid) {
    return fail(422, headers, `Validation error: ${errors.join(", ")}`, "ERR_VALIDATION");
  }

  // Optional anti-bot verification
  const remoteIp =
    (event.headers["x-forwarded-for"] || event.headers["X-Forwarded-For"] || "").split(",")[0]?.trim() || undefined;

  // Prefer Turnstile if present; fallback to reCAPTCHA if provided
  if (payload.turnstileToken) {
    const v = await verifyTurnstile(String(payload.turnstileToken), remoteIp);
    if (!v.ok && !v.skipped) {
      return fail(403, headers, `Turnstile verification failed: ${v.reason}`, "ERR_TURNSTILE");
    }
  } else if (payload.recaptchaToken) {
    const v = await verifyRecaptcha(String(payload.recaptchaToken), remoteIp);
    if (!v.ok && !v.skipped) {
      return fail(403, headers, `reCAPTCHA verification failed: ${v.reason}`, "ERR_RECAPTCHA");
    }
  }

  // === Your business logic goes here ===
  // Example (pseudo):
  // await sendEmail({
  //   to: process.env.CONTACT_TO!,
  //   from: process.env.CONTACT_FROM!,
  //   subject: `[Contact] ${data.subject}`,
  //   text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
  // });

  // Success response (echo minimal safe fields)
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Received",
      receivedAt: new Date().toISOString(),
      data,
      meta: {
        ip: remoteIp || null,
        origin,
      },
    }),
  };
};