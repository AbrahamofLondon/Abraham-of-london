// netlify/functions/subscribe-launch.tsx
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Resend } from "resend";

// Welcome email React component
import WelcomeLaunchEmail from "../../components/emails/WelcomeLaunchEmail";

const JSON_HEADERS: Record<string, string> = { "Content-Type": "application/json" };

function json(statusCode: number, body: unknown): HandlerResponse {
  return { statusCode, headers: JSON_HEADERS, body: JSON.stringify(body) };
}

function requireEnv(name: string): string | null {
  const v = process.env[name];
  return v && v.trim() ? v : null;
}

export const handler: Handler = async (event: HandlerEvent) => {
  // Method gate
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers: { ...JSON_HEADERS, Allow: "POST" }, body: JSON.stringify({ ok: false, message: "Method Not Allowed" }) };
  }

  try {
    const body = event.body ? safeParse(event.body) : {};
    const email = String(body.email || "").trim().toLowerCase();
    const name = String(body.name || "").trim() || undefined;

    if (!email) return json(400, { ok: false, message: "Email required" });

    // Env
    const RESEND_API_KEY = requireEnv("RESEND_API_KEY");
    const MAIL_FROM = requireEnv("MAIL_FROM") || "Abraham of London <no-reply@abrahamoflondon.org>";
    const SITE = (requireEnv("NEXT_PUBLIC_SITE_URL") || "https://www.abrahamoflondon.org").replace(/\/$/, "");

    if (!RESEND_API_KEY) return json(500, { ok: false, message: "Missing RESEND_API_KEY" });

    // (Optional) Add to your ESP or list provider here (e.g., Buttondown/ConvertKit/etc.)
    // await fetch("https://api.buttondown.email/v1/subscribers", { ... })

    // Render welcome email
    const html = renderToStaticMarkup(<WelcomeLaunchEmail name={name} siteUrl={SITE} />);

    // Send with Resend
    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: MAIL_FROM,
      to: email,
      subject: "Welcome — Fathering Without Fear (launch updates)",
      html,
      replyTo: "info@abrahamoflondon.org",
    });

    return json(200, { ok: true, message: "Subscribed and welcome email sent" });
  } catch (err: any) {
    console.error("[subscribe-launch] error:", err?.message || err);
    return json(500, { ok: false, message: "Internal Server Error" });
  }
};

// ------------- utils -------------
function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}
