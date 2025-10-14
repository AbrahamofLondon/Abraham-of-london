// netlify/functions/send-teaser.tsx
import React from "react";
import type { Handler } from "@netlify/functions";
import { render } from "@react-email/render";
import { Resend } from "resend";

import TeaserEmail from "../../components/emails/TeaserEmail";
import {
  EMAIL_RE,
  getSiteUrl,
  readJson,
  ok,
  bad,
  methodNotAllowed,
  handleOptions,
} from "./_utils";

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") return methodNotAllowed();

  const body = await readJson<{ name?: string; email?: string }>(new Request("http://x", {
    method: "POST",
    headers: { "content-type": event.headers["content-type"] || "" },
    body: event.body || "{}",
  }));

  const name = String(body.name || "").trim().slice(0, 100);
  const email = String(body.email || "").trim().toLowerCase();

  if (!email || !EMAIL_RE.test(email)) return bad("Valid email required");

  const SITE_URL = getSiteUrl();

  // Build HTML with React Email
  const html = render(<TeaserEmail name={name || undefined} siteUrl={SITE_URL} />, {
    pretty: true,
  });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

  // DRY-RUN if no API key (still returns ok for testing)
  if (!apiKey) {
    return ok("DRY-RUN: email not sent (RESEND_API_KEY missing)", {
      preview: true,
      to: email.replace(/^(.).+(@.*)$/, "$1***$2"),
    });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to: [email],
      subject: "Fathering Without Fear — teaser links",
      html,
    });

    return ok("Teaser sent");
  } catch (e: any) {
    console.error("[send-teaser] error:", e?.message || e);
    return bad("Email provider error", 502);
  }
};
