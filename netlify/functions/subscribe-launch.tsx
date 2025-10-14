// netlify/functions/subscribe-launch.tsx
import * as React from "react";
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { Resend } from "resend";
import { renderToStaticMarkup } from "react-dom/server";
import WelcomeLaunchEmail from "../../components/emails/WelcomeLaunchEmail";

const JSON_HEADERS: Record<string, string> = { "Content-Type": "application/json" };

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://www.abrahamoflondon.org"
  ).replace(/\/$/, "");

function json(statusCode: number, body: unknown, headers?: Record<string, string>): HandlerResponse {
  return { statusCode, headers: { ...JSON_HEADERS, ...(headers || {}) }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return json(405, { ok: false, message: "Method Not Allowed" }, { Allow: "POST" });
  }

  try {
    const payload = typeof event.body === "string" ? safeParse(event.body) : {};
    const email = String(payload.email || "").trim().toLowerCase();
    const name = String(payload.name || "").trim() || undefined;

    if (!email) return json(400, { ok: false, message: "Email is required" });

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const MAIL_FROM = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
    if (!RESEND_API_KEY) return json(500, { ok: false, message: "Missing RESEND_API_KEY" });

    // (Optional) add to your list provider here if you have one (Buttondown, ConvertKit, etc.)

    // Send welcome email
    const resend = new Resend(RESEND_API_KEY);
    const html = renderToStaticMarkup(<WelcomeLaunchEmail name={name} siteUrl={SITE_URL} />);

    await resend.emails.send({
      from: MAIL_FROM,
      to: email,
      subject: "Welcome — Fathering Without Fear launch",
      html,
      reply_to: [{ email: "info@abrahamoflondon.org", name: "Abraham of London" }],
    });

    return json(200, { ok: true, message: "Subscribed and welcomed" });
  } catch (err: unknown) {
    console.error("[subscribe-launch]", err);
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
