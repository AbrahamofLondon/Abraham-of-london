// netlify/functions/contact.ts
import type { Handler } from "@netlify/functions";
import { sendAppEmail } from "./_email";
import { verifyRecaptchaDetailed } from "@/lib/recaptchaServer";

/* =========================
   CONFIG
   ========================= */
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "*")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

// Optional legacy env (Netlify-function-only). If absent, we use canonical verifier.
const RECAPTCHA_SECRET = process.env.RECAPTCHA_SECRET?.trim();
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET?.trim();
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 64 * 1024);

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

type JsonParseOk<T> = { ok: true; data: T };
type JsonParseFail = { ok: false; error: string };
type JsonParseResult<T> = JsonParseOk<T> | JsonParseFail;

function safeParseJson<T = unknown>(raw: string): JsonParseResult<T> {
  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return { ok: false, error: "Invalid JSON payload" };
  }
}

// ✅ Dedicated type guard: fixes TS union narrowing in strict builds
function isParseFail<T>(r: JsonParseResult<T>): r is JsonParseFail {
  return r.ok === false;
}

function fail(
  statusCode: number,
  headers: Record<string, string>,
  error: string,
  code?: string
) {
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
  honeypot?: string;
  recaptchaToken?: string;
  turnstileToken?: string;
  [k: string]: unknown;
};

function validatePayload(p: ContactPayload) {
  const errors: string[] = [];

  const name = (p.name ?? "").toString().trim();
  const email = (p.email ?? "").toString().trim();
  const subject = (p.subject ?? "").toString().trim();
  const message = (p.message ?? "").toString().trim();

  if (!name) errors.push("name is required");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push("valid email is required");
  if (!subject) errors.push("subject is required");
  if (!message || message.length < 10)
    errors.push("message must be at least 10 characters");

  if (p.honeypot && String(p.honeypot).trim() !== "") {
    errors.push("honeypot must be empty");
  }

  return {
    valid: errors.length === 0,
    errors,
    data: { name, email, subject, message },
  };
}

/* =========================
   BOT VERIFICATION
   ========================= */
async function verifyRecaptchaLegacy(token: string, remoteIp?: string) {
  // If legacy secret isn't present, do not block.
  if (!RECAPTCHA_SECRET) {
    return { ok: true, provider: "recaptcha", skipped: true as const };
  }

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

    const json = (await res.json()) as {
      success?: boolean;
      score?: number;
      "error-codes"?: string[];
    };

    if (!json.success) {
      return {
        ok: false,
        provider: "recaptcha" as const,
        reason: (json["error-codes"] || ["verification_failed"]).join(","),
      };
    }

    if (typeof json.score === "number" && json.score < 0.4) {
      return {
        ok: false,
        provider: "recaptcha" as const,
        reason: `low_score:${json.score}`,
      };
    }

    return { ok: true, provider: "recaptcha" as const };
  } catch {
    return { ok: false, provider: "recaptcha" as const, reason: "network_error" };
  }
}

async function verifyRecaptchaCanonical(token: string, remoteIp?: string) {
  // Canonical verifier uses RECAPTCHA_SECRET_KEY (shared with API routes).
  const detailed = await verifyRecaptchaDetailed(token, "contact", remoteIp);
  return detailed.success
    ? { ok: true, provider: "recaptcha" as const }
    : {
        ok: false,
        provider: "recaptcha" as const,
        reason: (detailed.errorCodes || ["failed"]).join(","),
      };
}

async function verifyTurnstile(token: string, remoteIp?: string) {
  if (!TURNSTILE_SECRET) {
    return { ok: true, provider: "turnstile", skipped: true as const };
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: new URLSearchParams({
          secret: TURNSTILE_SECRET,
          response: token,
          ...(remoteIp ? { remoteip: remoteIp } : {}),
        }),
      }
    );

    const json = (await res.json()) as {
      success?: boolean;
      "error-codes"?: string[];
    };

    if (!json.success) {
      return {
        ok: false,
        provider: "turnstile" as const,
        reason: (json["error-codes"] || ["verification_failed"]).join(","),
      };
    }

    return { ok: true, provider: "turnstile" as const };
  } catch {
    return { ok: false, provider: "turnstile" as const, reason: "network_error" };
  }
}

/* =========================
   HANDLER
   ========================= */
export const handler: Handler = async (event) => {
  const origin = getCorsOrigin(event.headers.origin || event.headers.Origin);
  const headers = jsonHeaders(origin);

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return fail(405, headers, "Method Not Allowed", "ERR_METHOD");
  }

  const contentType =
    event.headers["content-type"] || event.headers["Content-Type"];
  if (!isJsonContentType(contentType)) {
    return fail(
      415,
      headers,
      "Unsupported Media Type (expect application/json)",
      "ERR_CONTENT_TYPE"
    );
  }

  const raw = event.body || "";
  if (!raw) {
    return fail(400, headers, "Missing request body", "ERR_NO_BODY");
  }

  if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) {
    return fail(413, headers, "Payload too large", "ERR_TOO_LARGE");
  }

  const parsed = safeParseJson<ContactPayload>(raw);

  // ✅ TS-safe narrowing (no property access on union without guard)
  if (isParseFail(parsed)) {
    return fail(400, headers, parsed.error, "ERR_BAD_JSON");
  }

  const payload = parsed.data;

  const { valid, errors, data } = validatePayload(payload);
  if (!valid) {
    return fail(
      422,
      headers,
      `Validation error: ${errors.join(", ")}`,
      "ERR_VALIDATION"
    );
  }

  const remoteIp =
    (event.headers["x-forwarded-for"] ||
      event.headers["X-Forwarded-For"] ||
      "")
      .toString()
      .split(",")[0]
      ?.trim() || undefined;

  // Bot checks: Turnstile preferred if present; else reCAPTCHA
  if (payload.turnstileToken) {
    const v = await verifyTurnstile(String(payload.turnstileToken), remoteIp);
    if (!v.ok && !("skipped" in v && v.skipped)) {
      return fail(
        403,
        headers,
        `Turnstile verification failed: ${v.reason}`,
        "ERR_TURNSTILE"
      );
    }
  } else if (payload.recaptchaToken) {
    const token = String(payload.recaptchaToken);

    // If legacy secret exists, use it; otherwise use canonical verifier.
    const v = RECAPTCHA_SECRET
      ? await verifyRecaptchaLegacy(token, remoteIp)
      : await verifyRecaptchaCanonical(token, remoteIp);

    if (!v.ok && !("skipped" in v && v.skipped)) {
      return fail(
        403,
        headers,
        `reCAPTCHA verification failed: ${v.reason}`,
        "ERR_RECAPTCHA"
      );
    }
  }

  // === Email / CRM wiring (best-effort) ===
  try {
    await sendAppEmail({
      subject: `[Contact] ${data.subject}`,
      html: `
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Message:</strong></p>
        <p>${data.message.replace(/\n/g, "<br>")}</p>
      `,
      text: `From: ${data.name} <${data.email}>\n\n${data.message}`,
    });
  } catch (err) {
    console.error("Contact email send failed:", err);
  }

  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      ok: true,
      message: "Received",
      receivedAt: new Date().toISOString(),
      data,
      meta: { ip: remoteIp || null, origin },
    }),
  };
};
