// netlify/functions/subscribe-launch.ts
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import * as React from "react";
import { render } from "@react-email/render";
// If you have a welcome/confirmation email component, import it here.
// You can replace this with your actual component path & props.
import WelcomeLaunchEmail from "../../components/emails/WelcomeLaunchEmail";

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

  // (Optional) Add them to your list provider here (Buttondown, MailerLite, etc.)
  // Example: Buttondown (requires BUTTONDOWN_API_KEY)
  const bdKey = process.env.BUTTONDOWN_API_KEY;
  if (bdKey) {
    try {
      const r = await fetch("https://api.buttondown.email/v1/subscribers", {
        method: "POST",
        headers: {
          Authorization: `Token ${bdKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, notes: name ? `Name: ${name}` : undefined }),
      });
      if (!r.ok) {
        const text = await r.text().catch(() => "");
        console.warn("[subscribe-launch] Buttondown error:", r.status, text);
        // Don’t fail the whole function; continue to send the welcome email.
      }
    } catch (e) {
      console.warn("[subscribe-launch] Buttondown request failed:", e);
    }
  }

  // Send a confirmation/welcome email via Resend
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
  const subject = "Welcome — Fathering Without Fear launch updates";

  const html = render(
    // Avoid JSX: createElement to keep this .ts file happy
    React.createElement(WelcomeLaunchEmail, { siteUrl: SITE_URL, name })
  );

  if (!apiKey) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[subscribe-launch] Missing RESEND_API_KEY; would have sent to:", email);
      return ok({ ok: true, dev: true, message: "Simulated welcome (no RESEND_API_KEY set)" });
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
        reply_to: name ? [{ email, name }] : [{ email }],
      }),
    });

    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.error("[subscribe-launch] Resend failed:", r.status, text);
      return serverError();
    }

    return ok({ ok: true, message: "Subscribed and welcome email sent" });
  } catch (err) {
    console.error("[subscribe-launch] Error:", err);
    return serverError("Failed to send welcome email");
  }
};
