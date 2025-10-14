// netlify/functions/subscribe-launch.tsx
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { Resend } from "resend";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/** JSON helper */
const json = (statusCode: number, data: unknown): HandlerResponse => ({
  statusCode,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

/** Inline React email — WelcomeLaunchEmail */
type WelcomeProps = { name?: string; siteUrl: string };

const WelcomeLaunchEmail: React.FC<WelcomeProps> = ({ name, siteUrl }) => {
  const base = siteUrl.replace(/\/$/, "");
  return (
    <div style={{ fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, Arial", color: "#1b1f1a", lineHeight: 1.6 }}>
      <p>{name ? `Hi ${name},` : "Hi,"}</p>

      <p>
        Thank you for joining the <strong>Fathering Without Fear</strong> launch list. You’ll get early
        chapter drops, release dates, and practical resources for fathers under pressure.
      </p>

      <p>While you wait, grab the free teaser PDFs:</p>
      <ul>
        <li>
          <a href={`${base}/downloads/Fathering_Without_Fear.pdf`} target="_blank" rel="noopener noreferrer">
            Teaser PDF (A4/Letter)
          </a>
        </li>
        <li>
          <a href={`${base}/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf`} target="_blank" rel="noopener noreferrer">
            Teaser PDF (Mobile)
          </a>
        </li>
      </ul>

      <p>
        If you ever want to reach me directly, reply to this email or use the contact page:{" "}
        <a href={`${base}/contact`} target="_blank" rel="noopener noreferrer">
          {base}/contact
        </a>
        .
      </p>

      <p>
        Grace and courage,
        <br />
        Abraham of London
      </p>

      <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        You’re receiving this because you asked to be notified about the launch.
        Unsubscribe: reply with <em>“stop”</em>.
      </p>
    </div>
  );
};

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json", Allow: "POST" },
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const body = typeof event.body === "string" ? safeParse(event.body) : (event.body as any) || {};
    const email = String(body.email || "").trim().toLowerCase();
    const name = (body.name ? String(body.name).trim() : "") || undefined;

    if (!email || !EMAIL_RE.test(email)) {
      return json(400, { ok: false, message: "Invalid or missing email" });
    }

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      "https://www.abrahamoflondon.org";

    const html = renderToStaticMarkup(<WelcomeLaunchEmail name={name} siteUrl={SITE_URL.replace(/\/$/, "")} />);

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const MAIL_FROM = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

    if (!RESEND_API_KEY) {
      if (process.env.NODE_ENV !== "production") {
        return json(200, { ok: true, preview: html });
      }
      return json(500, { ok: false, message: "Email provider not configured" });
    }

    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: MAIL_FROM,
      to: email,
      subject: "Welcome — Fathering Without Fear",
      html,
      replyTo: "info@abrahamoflondon.org",
    });

    return json(200, { ok: true, message: "Welcome email sent" });
  } catch (err: any) {
    console.error("[subscribe-launch] error", err);
    return json(500, { ok: false, message: "Internal Server Error" });
  }
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
