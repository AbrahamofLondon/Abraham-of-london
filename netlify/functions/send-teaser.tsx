// netlify/functions/send-teaser.tsx
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { Resend } from "resend";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

// ☑️ import your React email component
import TeaserEmail from "../../components/emails/TeaserEmail";

// ---------- helpers ----------
const JSON_HEADERS: Record<string, string | number | boolean> = {
  "Content-Type": "application/json",
};

const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://www.abrahamoflondon.org")!.replace(/\/$/, "");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function json(statusCode: number, data: unknown): HandlerResponse {
  return {
    statusCode,
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  };
}

function parseBody(event: HandlerEvent): Record<string, unknown> {
  if (!event.body) return {};
  try {
    return typeof event.body === "string" ? JSON.parse(event.body) : (event.body as any);
  } catch {
    return {};
  }
}

// ---------- handler ----------
export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, Allow: "POST" },
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  const { email, name } = parseBody(event);
  const to = String(email || "").trim().toLowerCase();

  if (!to || !EMAIL_RE.test(to)) {
    return json(400, { ok: false, message: "Valid email is required" });
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_API_KEY) {
    return json(500, { ok: false, message: "Email provider not configured" });
  }

  // Render the React email to HTML (server-side, no JSX emitted to esbuild)
  const html = renderToStaticMarkup(
    <TeaserEmail name={typeof name === "string" ? name : undefined} siteUrl={SITE_URL} />
  );

  const resend = new Resend(RESEND_API_KEY);
  const MAIL_FROM = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

  try {
    await resend.emails.send({
      from: MAIL_FROM,
      to,
      subject: "Fathering Without Fear — Teaser PDFs",
      html,
      // ✅ Correct key + type for Resend
      replyTo: "info@abrahamoflondon.org",
    });

    return json(200, { ok: true, message: "Teaser sent" });
  } catch (err: any) {
    console.error("[send-teaser] send failed:", err?.message || err);
    return json(502, { ok: false, message: "Email provider error" });
  }
};
