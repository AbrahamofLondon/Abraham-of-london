import * as React from "react";

type Props = { name?: string; siteUrl: string };

export default function TeaserEmail({ name, siteUrl }: Props) {
  const base = siteUrl.replace(/\/$/, "");
  const A4 = `${base}/downloads/Fathering_Without_Fear.pdf`;
  const Mobile = `${base}/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf`;

  const link = (href: string, label: string) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{ color: "#0f5132", textDecoration: "underline" }}
    >
      {label}
    </a>
  );

  return (
    <div
      style={{
        fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, Arial",
        color: "#1b1f1a",
        lineHeight: 1.6,
      }}
    >
      <p>Friends—{name ? ` ${name},` : ""}</p>

      <p>
        I’m releasing <strong>Fathering Without Fear</strong>, a memoir forged
        in the middle of loss, legal storms, and a father’s stubborn hope. It’s
        for the men who keep showing up, the sons looking for language, and
        anyone who’s wrestled with God and grief at the same time.
      </p>

      <p>Here’s a free, brand-styled teaser you can read and share:</p>

      <ul>
        <li>Teaser PDF (A4/Letter): {link(A4, "Download A4/Letter")}</li>
        <li>Teaser PDF (Mobile): {link(Mobile, "Download Mobile")}</li>
      </ul>

      <p>
        Want chapter drops and launch dates? Reply <em>“keep me posted”</em> or
        join the list here: {link(`${base}/contact`, `${base}/contact`)}.
      </p>

      <p>
        Grace and courage,
        <br />
        Abraham of London
      </p>

      <hr
        style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }}
      />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        You’re receiving this because you requested the teaser or asked to be
        notified. Unsubscribe: reply with <em>“stop”</em>.
      </p>
    </div>
  );
}
