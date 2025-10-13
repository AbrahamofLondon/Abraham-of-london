// components/emails/TeaserEmail.tsx
import * as React from "react";

type Props = {
  name?: string;
  siteUrl: string;
};

export default function TeaserEmail({ name, siteUrl }: Props) {
  const A4 = `${siteUrl}/downloads/Fathering_Without_Fear_Teaser-A4.pdf`;
  const Mobile = `${siteUrl}/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf`;

  return (
    <div style={{ fontFamily: "ui-sans-serif, -apple-system, Segoe UI, Roboto, Arial", color: "#1b1f1a", lineHeight: 1.6 }}>
      <p>Friends—{name ? ` ${name},` : ""}</p>
      <p>
        I’m releasing <strong>Fathering Without Fear</strong>, a memoir forged in the middle of loss,
        legal storms, and a father’s stubborn hope. It’s for the men who keep showing up, the sons
        looking for language, and anyone who’s wrestled with God and grief at the same time.
      </p>

      <p>Here’s a free, brand-styled teaser you can read and share:</p>

      <ul>
        <li>Teaser PDF (A4/Letter): <a href={A4}>{A4}</a></li>
        <li>Teaser PDF (Mobile): <a href={Mobile}>{Mobile}</a></li>
      </ul>

      <p>
        Want chapter drops and launch dates? Reply <em>“keep me posted”</em> or join the list here:{" "}
        <a href={`${siteUrl}/contact`}>{siteUrl}/contact</a>.
      </p>

      <p>Grace and courage,<br/>Abraham of London</p>

      <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        You’re receiving this because you requested the teaser or asked to be notified.  
        Unsubscribe: reply with <em>“stop”</em>.
      </p>
    </div>
  );
}
