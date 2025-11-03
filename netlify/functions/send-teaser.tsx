// netlify/functions/send-teaser.tsx
import type { HandlerEvent, HandlerResponse } from "@netlify/functions";
import { Resend } from "resend";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (statusCode: number, data: unknown): HandlerResponse => ({
  statusCode,
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify(data),
});

type TeaserProps = { name?: string; siteUrl: string };

const TeaserEmail: React.FC<TeaserProps> = ({ name, siteUrl }) => {
  const base = siteUrl.replace(/\/$/, "");
  // Use friendly paths with redirects (defined in netlify.toml)
  const A4 = `${base}/downloads/fathering-without-fear.pdf`;
  const Mobile = `${base}/downloads/fathering-without-fear-mobile.pdf`;

  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline" }}>
      {label}
    </a>
  );

  return (
    <div style={{ fontFamily: "ui-sans-serif,-apple-system,Segoe UI,Roboto,Arial", color: "#111827", lineHeight: 1.6 }}>
      <p>Friends{ name ? ` — ${name}` : ""},</p>
      <p>
        I’m releasing <strong>Fathering Without Fear</strong>, a memoir forged in loss, legal storms,
        and a father’s stubborn hope.
      </p>
      <p>Here’s a free, brand-styled teaser you can read and share:</p>
      <ul>
        <li>Teaser PDF (A4/Letter): {link(A4, "Download A4/Letter")}</li>
        <li>Teaser PDF (Mobile): {link(Mobile, "Download Mobile")}</li>
      </ul>
      <p>
        Want chapter drops and launch dates? Reply <em>“keep me posted”</em> or join the list:{" "}
        {link(`${base}/contact`, `${base}/contact`)}.
      </p>
      <p>
        Grace and courage,<br />Abraham of London
      </p>
      <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        You’re receiving this because you requested the teaser or asked to be notified. Unsubscribe:
        reply with <em>“stop”</em>.
      </p>
    </div>
  );
};

function safeParse(s: string) {
  try { return JSON.parse(s); } catch { return {}; }
}

export const handler = async (event: HandlerEvent): Promise<HandlerResponse> => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json; charset=utf-8", Allow: "POST" },
      body: JSON.stringify({ ok: false, message: "Method Not Allowed" }),
    };
  }

  try {
    const body = typeof event.body === "string" ? safeParse(event.body) : event.body || {};
    const email = String((body as any).email || "").trim().toLowerCase();
    const name = ((body as any).name ? String((body as any).name).trim() : "") || undefined;

    if (!email || !EMAIL_RE.test(email)) return json(400, { ok: false, message: "Invalid or missing email" });

    const SITE_URL =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.URL ||
      process.env.DEPLOY_PRIME_URL ||
      "https://www.abrahamoflondon.org";

    const html = renderToStaticMarkup(<TeaserEmail name={name} siteUrl={SITE_URL.replace(/\/$/, "")} />);

    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const MAIL_FROM = process.env.MAIL_FROM || "Abraham of London <no-reply@abrahamoflondon.org>";

    if (!RESEND_API_KEY) {
      if (process.env.NODE_ENV !== "production") return json(200, { ok: true, preview: html });
      return json(500, { ok: false, message: "Email provider not configured" });
    }

    const resend = new Resend(RESEND_API_KEY);
    await resend.emails.send({
      from: MAIL_FROM,
      to: email,
      subject: "Fathering Without Fear — Teaser PDFs",
      html,
      replyTo: "info@abrahamoflondon.org",
    });

    return json(200, { ok: true, message: "Teaser sent" });
  } catch (err: any) {
    console.error("[send-teaser] error", err);
    return json(500, { ok: false, message: "Internal Server Error" });
  }
