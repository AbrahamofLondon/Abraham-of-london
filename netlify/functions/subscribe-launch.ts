import type { Handler } from "@netlify/functions";
import * as React from "react";
import { render } from "@react-email/render";

// No JSX in .ts. Import your welcome email component and use React.createElement.
import WelcomeLaunchEmail from "../../components/emails/WelcomeLaunchEmail";

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
  const email = String((body as any).email ?? "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ok: false, message: "Valid email is required." }),
    };
  }

  // Optional: subscribe via Buttondown if configured
  const BUTTONDOWN_API_KEY = process.env.BUTTONDOWN_API_KEY || "";
  if (BUTTONDOWN_API_KEY) {
    const r = await fetch("https://api.buttondown.email/v1/subscribers", {
      method: "POST",
      headers: {
        Authorization: `Token ${BUTTONDOWN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        notes: name ? `Launch list: ${name}` : "Launch list",
      }),
    });

    if (!r.ok && r.status !== 409) {
      const text = await r.text().catch(() => "");
      console.error("[subscribe-launch] Buttondown error:", r.status, text);
      // Continue even if subscription fails; we can still send the welcome email.
    }
  }

  // Render welcome email without JSX
  const element = React.createElement(WelcomeLaunchEmail as any, {
    siteUrl: SITE_URL,
    name,
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
        to: email,
        subject: "Welcome — Fathering Without Fear launch updates",
        html,
        reply_to: name ? [{ email, name }] : [{ email }],
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("[subscribe-launch] Resend error:", r.status, text);
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
    body: JSON.stringify({ ok: true, message: "Subscribed and welcome email sent (or rendered)." }),
  };
};
