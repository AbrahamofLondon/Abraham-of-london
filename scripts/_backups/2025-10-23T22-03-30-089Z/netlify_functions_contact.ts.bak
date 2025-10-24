// netlify/functions/contact.ts
import type { Handler } from "@netlify/functions";

type Body = {
  name?: string;
  email?: string;
  message?: string;
};

// Allow CORS from your site (set ALLOWED_ORIGIN in Netlify Ãƒ¢Ã¢â‚¬Ã¢â‚¬â„¢ Env vars if needed)
const ORIGIN =
  process.env.ALLOWED_ORIGIN ??
  "https://www.abrahamoflondon.org";

// Email provider env
const EMAIL_PROVIDER = (process.env.EMAIL_PROVIDER || "resend").toLowerCase();
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const MAIL_FROM = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
const MAIL_TO = process.env.MAIL_TO || "info@abrahamoflondon.org";

/* ------------------------- helpers ------------------------- */
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

const sanitize = (input: string, max = 2000) =>
  input.replace(/<[^>]*>/g, "").trim().slice(0, max);

const escapeHTML = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// parse JSON or x-www-form-urlencoded
function parseBody(eventBody: string | null, contentType = ""): Body {
  if (!eventBody) return {};
  try {
    if (contentType.includes("application/json")) {
      return JSON.parse(eventBody);
    }
    if (contentType.includes("application/x-www-form-urlencoded")) {
      const p = new URLSearchParams(eventBody);
      return {
        name: p.get("name") || undefined,
        email: p.get("email") || undefined,
        message: p.get("message") || undefined,
      };
    }
    // best-effort JSON
    return JSON.parse(eventBody);
  } catch {
    return {};
  }
}

function cors(status = 200, body?: unknown) {
  return {
    statusCode: status,
    headers: {
      "Access-Control-Allow-Origin": ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
    body: body ? JSON.stringify(body) : "",
  };
}

/* ------------------------- provider: Resend ------------------------- */
async function sendViaResend({ name, email, message }: Required<Body>) {
  const { Resend } = await import("resend");
  const client = new Resend(RESEND_API_KEY);

  const subject = `New contact: ${name.slice(0, 120)}`;
  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial">
      <h2>New message from ${escapeHTML(name)}</h2>
      <p><strong>Email:</strong> ${escapeHTML(email)}</p>
      <p style="white-space:pre-wrap">${escapeHTML(message)}</p>
    </div>
  `;

  const { error } = await client.emails.send({
    from: MAIL_FROM,
    to: MAIL_TO,
    subject,
    html,
    replyTo: email, // Ãƒ¢Ã…"Ã¢â‚¬¦ correct key for Resend
  });

  if (error) throw new Error(error.message || "Resend error");
}

/* ------------------------- handler ------------------------- */
export const handler: Handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === "OPTIONS") return cors(204);

  if (event.httpMethod !== "POST") {
    return cors(405, { ok: false, error: "Method Not Allowed" });
  }

  const contentType = (event.headers["content-type"] || event.headers["Content-Type"] || "").toLowerCase();
  const body = parseBody(event.body, contentType);

  const name = sanitize(body.name || "", 200);
  const email = sanitize(body.email || "", 320);
  const message = sanitize(body.message || "", 5000);

  // validation
  if (!name || !email || !message) return cors(400, { ok: false, error: "Missing required field(s)." });
  if (!isEmail(email)) return cors(400, { ok: false, error: "Invalid email." });
  if (message.length < 10) return cors(400, { ok: false, error: "Message too short." });

  try {
    if (EMAIL_PROVIDER !== "resend") {
      return cors(500, { ok: false, error: "Email provider not configured." });
    }
    if (!RESEND_API_KEY) {
      return cors(500, { ok: false, error: "RESEND_API_KEY missing." });
    }

    await sendViaResend({ name, email, message });
    return cors(200, { ok: true });
  } catch (err: any) {
    console.error("send-contact error:", err?.message || err);
    // common Resend issues: unverified domain/sender, invalid API key
    return cors(502, { ok: false, error: "Email send failed." });
  }
};
