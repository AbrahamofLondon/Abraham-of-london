// netlify/functions/subscribe-launch.tsx
import React from "react";
import type { Handler } from "@netlify/functions";
import { render } from "@react-email/render";
import { Resend } from "resend";

import WelcomeLaunchEmail from "../../components/emails/WelcomeLaunchEmail";
import {
  EMAIL_RE,
  getSiteUrl,
  readJson,
  ok,
  bad,
  methodNotAllowed,
  handleOptions,
} from "./_utils";

// Optional: save to a list provider here (Buttondown, ConvertKit, etc.)
// For now we only send a welcome email.

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
  const html = render(<WelcomeLaunchEmail siteUrl={SITE_URL} name={name || undefined} />, {
    pretty: true,
  });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

  if (!apiKey) {
    // DRY-RUN
    return ok("DRY-RUN: subscribed (no provider) & welcome not sent (RESEND_API_KEY missing)", {
      preview: true,
      to: email.replace(/^(.).+(@.*)$/, "$1***$2"),
    });
  }

  try {
    const resend = new Resend(apiKey);

    // Send welcome email
    await resend.emails.send({
      from,
      to: [email],
      subject: "Welcome — Fathering Without Fear launch updates",
      html,
    });

    // Optional: notify you (admin)
    const notify = process.env.MAIL_TO;
    if (notify) {
      await resend.emails.send({
        from,
        to: [notify],
        subject: "New launch subscriber",
        html: `<p>New subscriber: <strong>${name || "—"}</strong> &lt;${email}&gt;</p>`,
      });
    }

    return ok("Subscribed & welcome sent");
  } catch (e: any) {
    console.error("[subscribe-launch] error:", e?.message || e);
    return bad("Email provider error", 502);
  }
};
