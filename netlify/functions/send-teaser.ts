// netlify/functions/send-teaser.ts
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { sendEmail } from "@netlify/emails";
import { renderTeaserHtml } from "../emails";

const JSON_HEADERS: Record<string, string> = { "Content-Type": "application/json" };
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://www.abrahamoflondon.org";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const handler: Handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, Allow: "POST" },
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const body = parseBody(event.body);
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim() || undefined;

    if (!EMAIL_RE.test(email)) {
      return {
        statusCode: 400,
        headers: JSON_HEADERS,
        body: JSON.stringify({ ok: false, message: "Invalid email" }),
      };
    }

    if (process.env.CONTACT_PROVIDER?.toLowerCase() === "resend") {
      const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
      const to = email;
      const subject = "Your teaser — Fathering Without Fear";
      const html = renderTeaserHtml({ name, siteUrl: SITE_URL });

      await sendEmail({ from, to, subject, html });
    }

    return {
      statusCode: 200,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: true, message: "Teaser sent (or queued) successfully" }),
    };
  } catch (err: any) {
    console.error("[send-teaser] error:", err?.message || err);
    return {
      statusCode: 500,
      headers: JSON_HEADERS,
      body: JSON.stringify({ ok: false, message: "Internal Server Error" }),
    };
  }
};

function parseBody(b?: string | null): Record<string, unknown> {
  if (!b) return {};
  try {
    return JSON.parse(b);
  } catch {
    return {};
  }
}
