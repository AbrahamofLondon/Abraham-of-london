import type { Handler } from "@netlify/functions";
import * as React from "react";
import { render } from "@react-email/render";

// IMPORTANT: no JSX in .ts files. We import the component but create it via React.createElement.
import TeaserEmail from "../../components/emails/TeaserEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://www.abrahamoflondon.org";

function safeJsonParse<T = any>(s: string | null | undefined): T | Record<string, never> {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  const body = typeof event.body === "string" ? safeJsonParse(event.body) : {};
  const name = String((body as any).name ?? "").trim() || undefined;
  const to = String((body as any).email ?? (body as any).to ?? "").trim().toLowerCase();

  if (!to || !EMAIL_RE.test(to)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Valid recipient email required." }),
    };
  }

  // Render the email HTML without JSX
  const element = React.createElement(TeaserEmail as any, {
    name,
    siteUrl: SITE_URL,
  });
  const html = render(element);

  // Optional: send via Resend if configured
  const RESEND_KEY = process.env.RESEND_API_KEY || "";
  const MAIL_FROM = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

  if (RESEND_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to,
        subject: "Fathering Without Fear — the story they thought they knew",
        html,
        reply_to: name ? [{ email: to, name }] : [{ email: to }],
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("[send-teaser] Resend error:", r.status, text);
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ok: false, message: "Email provider error." }),
      };
    }
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ok: true, message: "Teaser sent (or rendered) successfully." }),
  };
};
