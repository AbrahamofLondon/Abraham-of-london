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
      <p>FriendsÃƒ¢Ã¢â€š¬Ã¢â‚¬{name ? ` ${name},` : ""}</p>

      <p>
        IÃƒ¢Ã¢â€š¬Ã¢â€ž¢m releasing <strong>Fathering Without Fear</strong>, a memoir forged in the middle of
        loss, legal storms, and a fatherÃƒ¢Ã¢â€š¬Ã¢â€ž¢s stubborn hope. ItÃƒ¢Ã¢â€š¬Ã¢â€ž¢s for the men who keep showing up,
        the sons looking for language, and anyone whoÃƒ¢Ã¢â€š¬Ã¢â€ž¢s wrestled with God and grief at the same time.
      </p>

      <p>HereÃƒ¢Ã¢â€š¬Ã¢â€ž¢s a free, brand-styled teaser you can read and share:</p>

      <ul>
        <li>Teaser PDF (A4/Letter): {link(A4, "Download A4/Letter")}</li>
        <li>Teaser PDF (Mobile): {link(Mobile, "Download Mobile")}</li>
      </ul>

      <p>
        Want chapter drops and launch dates? Reply <em>Ãƒ¢Ã¢â€š¬Ã…"keep me postedÃƒ¢Ã¢â€š¬Ã‚</em> or join the list here:{" "}
        {link(`${base}/contact`, `${base}/contact`)}.
      </p>

      <p>
        Grace and courage,
        <br />
        Abraham of London
      </p>

      <hr style={{ border: 0, borderTop: "1px solid #e5e7eb", margin: "20px 0" }} />
      <p style={{ fontSize: 12, color: "#6b7280" }}>
        YouÃƒ¢Ã¢â€š¬Ã¢â€ž¢re receiving this because you requested the teaser or asked to be notified.
        Unsubscribe: reply with <em>Ãƒ¢Ã¢â€š¬Ã…"stopÃƒ¢Ã¢â€š¬Ã‚</em>.
      </p>
    </div>
  );
}
