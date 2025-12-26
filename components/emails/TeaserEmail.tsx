// components/emails/TeaserEmail.tsx
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
      <p>Friends-{name ? ` ${name},` : ""}</p>

      <p>
        I&apos;m releasing <strong>Fathering Without Fear</strong>, a memoir forged in the middle of loss,
        legal storms, and a father&apos;s stubborn hope. It&apos;s for the men who keep showing up,
        the sons looking for language, and anyone who&apos;s wrestled with God and grief at the same time.
      </p>

      <p>Here&apos;s a free, brand-styled teaser you can read and share:</p>

      <ul>
        <li>Teaser PDF (A4/Letter): {link(A4, "Download A4/Letter")}</li>
        <li>Teaser PDF (Mobile): {link(Mobile, "Download Mobile")}</li>
      </ul>

      <p>
        Want chapter drops and launch dates? Reply <em>&quot;keep me posted&quot;</em> or join the list here:{" "}
        {link(`${base}/contact`, `${base}/contact`)}.
      </p>

      <p>
        Grace and courage,
        <br />
        Abraham of London
      </p>

      <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />

      <p style={{ fontSize: 12, color: "#6b7280" }}>
        You&apos;re receiving this because you requested the teaser or asked to be notified. Unsubscribe: reply with{" "}
        <em>&quot;stop&quot;</em>.
      </p>
    </div>
  );
}