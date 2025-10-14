// netlify/functions/subscribe-launch.ts
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import WelcomeLaunchEmail from "../../components/emails/WelcomeLaunchEmail";

const JSON_HEADERS: Record<string, string> = { "Content-Type": "application/json" };

function json(statusCode: number, body: unknown): HandlerResponse {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

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
    const body = typeof event.body === "string" ? safeParse(event.body) : {};
    const email = String(body.email || "").trim().toLowerCase();
    const name = (String(body.name || "").trim() || undefined) as string | undefined;

    if (!EMAIL_RE.test(email)) return json(400, { ok: false, message: "Invalid email" });

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      "https://www.abrahamoflondon.org";

    // OPTIONAL: add to Buttondown list if configured
    if (process.env.BUTTONDOWN_API_KEY) {
      try {
        await fetch("https://api.buttondown.email/v1/subscribers", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${process.env.BUTTONDOWN_API_KEY}`,
          },
          body: JSON.stringify({ email, metadata: { name: name || "" } }),
        });
      } catch (e) {
        console.warn("[subscribe-launch] Buttondown add failed (non-fatal):", (e as Error)?.message);
      }
    }

    // Render welcome email
    const html = renderToStaticMarkup(
      <WelcomeLaunchEmail name={name} siteUrl={SITE_URL.replace(/\/$/, "")} />
    );

    // Send with Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const MAIL_FROM = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

    if (!RESEND_API_KEY) return json(500, { ok: false, message: "Missing RESEND_API_KEY" });

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: MAIL_FROM,
        to: email,
        subject: "Welcome — Fathering Without Fear launch list",
        html,
        reply_to: name ? [{ email, name }] : [{ email }],
      }),
    });

    if (!r.ok) {
      const errText = await r.text().catch(() => "");
      console.error("[subscribe-launch] Resend error:", r.status, errText);
      return json(502, { ok: false, message: "Email provider error" });
    }

    return json(200, { ok: true, message: "Subscribed and welcome sent" });
  } catch (err) {
    console.error("[subscribe-launch] failed:", err);
    return json(500, { ok: false, message: "Internal Server Error" });
  }
};

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
