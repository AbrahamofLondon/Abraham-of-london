// netlify/functions/send-teaser.tsx
import type { Handler, HandlerEvent, HandlerResponse } from "@netlify/functions";
import { Resend } from "resend";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import TeaserEmail from "../emails/TeaserEmail";

const JSON_HEADERS: Record<string, string | number | boolean> = {
  "Content-Type": "application/json",
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://www.abrahamoflondon.org";

const json = (statusCode: number, body: any): HandlerResponse => ({
  statusCode,
  headers: JSON_HEADERS as Record<string, string>,
  body: JSON.stringify(body),
});

export const handler: Handler = async (event: HandlerEvent) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { ...JSON_HEADERS, Allow: "POST" } as Record<string, string>,
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const email = String(body.email || "").trim().toLowerCase();
    const name = body.name ? String(body.name).trim() : undefined;

    if (!email) return json(400, { ok: false, message: "Email is required" });

    // Render HTML from React email
    const html = renderToStaticMarkup(
      <TeaserEmail name={name} siteUrl={SITE_URL.replace(/\/$/, "")} />
    );

    // Send via Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    if (!RESEND_API_KEY) return json(500, { ok: false, message: "RESEND_API_KEY missing" });

    const resend = new Resend(RESEND_API_KEY);
    const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";
    const to = email;

    await resend.emails.send({
      from,
      to,
      subject: "Fathering Without Fear — Teaser PDFs",
      html,
      replyTo: "info@abrahamoflondon.org",
    });

    return json(200, { ok: true, message: "Teaser sent" });
  } catch (err: any) {
    console.error("[send-teaser] error:", err);
    return json(500, { ok: false, message: "Internal Server Error" });
  }
};
