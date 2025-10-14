// netlify/functions/send-teaser.ts
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import * as React from "react";
import { render } from "@react-email/render";
// Adjust the relative import if your folder layout differs:
import TeaserEmail from "../../components/emails/TeaserEmail";

const JSON_HEADERS: Record<string, string> = { "Content-Type": "application/json" };
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://www.abrahamoflondon.org";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ok(body: unknown): HandlerResponse {
  return { statusCode: 200, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function badRequest(message: string): HandlerResponse {
  return { statusCode: 400, headers: JSON_HEADERS, body: JSON.stringify({ ok: false, message }) };
}

function serverError(message = "Email provider error"): HandlerResponse {
  return { statusCode: 502, headers: JSON_HEADERS, body: JSON.stringify({ ok: false, message }) };
}

function methodNotAllowed(): HandlerResponse {
  // Include Allow on this branch; still typed as Record<string,string>
  return {
    statusCode: 405,
    headers: { ...JSON_HEADERS, Allow: "POST" },
    body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
  };
}

function safeParse(body: string | null): any {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    return {};
  }
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return methodNotAllowed();
  }

  const data = safeParse(event.body || null);

  const name: string | undefined = typeof data?.name === "string" && data.name.trim() ? data.name.trim() : undefined;
  const email: string | undefined =
    typeof data?.email === "string" && data.email.trim() ? data.email.trim().toLowerCase() : undefined;

  if (!email || !EMAIL_RE.test(email)) {
    return badRequest("Valid 'email' is required.");
  }

  // Render the email HTML without JSX in this .ts file
  const html = render(React.createElement(TeaserEmail, { name, siteUrl: SITE_URL }));

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
  const subject = "Fathering Without Fear — the teaser you requested";

  if (!apiKey) {
    // In dev, just log and return OK to avoid blocking
    if (process.env.NODE_ENV !== "production") {
      console.log("[send-teaser] Missing RESEND_API_KEY; would have sent to:", email);
      return ok({ ok: true, dev: true, message: "Simulated send (no RESEND_API_KEY set)" });
    }
    return serverError("Email provider not configured");
  }

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject,
        html,
        // Helps direct replies back to the requester if desired:
        reply_to: name ? [{ email, name }] : [{ email }],
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("[send-teaser] Resend failed:", r.status, text);
      return serverError();
    }

    return ok({ ok: true, message: "Teaser sent" });
  } catch (err) {
    console.error("[send-teaser] Error:", err);
    return serverError("Failed to send email");
  }
};
