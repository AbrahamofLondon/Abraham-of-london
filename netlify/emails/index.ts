// netlify/emails/index.ts
// Pure string builders for emails safe for Netlify function bundling.

type Common = { siteUrl: string; name?: string };

export function renderWelcomeLaunchHtml({ name, siteUrl }: Common): string {
  const A4 = `${siteUrl}/downloads/Fathering_Without_Fear_Teaser-A4.pdf`;
  const Mobile = `${siteUrl}/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf`;

  return `
<div style="font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Arial; color:#1b1f1a; line-height:1.6">
  <p>${name ? `Hi ${escapeHtml(name)},` : "Hi,"}</p>

  <p>
    Thank you for joining the <strong>Fathering Without Fear</strong> launch list.
    Youll get early chapter drops, release dates, and practical resources for fathers under pressure.
  </p>

  <p>While you wait, grab the free teaser PDFs:</p>
  <ul>
    <li><a href="${A4}" target="_blank" rel="noopener noreferrer">Teaser PDF (A4/Letter)</a></li>
    <li><a href="${Mobile}" target="_blank" rel="noopener noreferrer">Teaser PDF (Mobile)</a></li>
  </ul>

  <p>
    Want to reach me directly? Reply to this email or use:
    <a href="${siteUrl}/contact" target="_blank" rel="noopener noreferrer">${siteUrl}/contact</a>.
  </p>

  <p>Grace and courage,<br/>Abraham of London</p>

  <hr style="border:0; border-top:1px solid #e5e7eb; margin:20px 0" />
  <p style="font-size:12px; color:#6b7280">
    Youre receiving this because you asked to be notified about the launch.
    Unsubscribe: reply with <em>stopem>.
  </p>
</div>`.trim();
}

export function renderTeaserHtml({ name, siteUrl }: Common): string {
  const A4 = `${siteUrl}/downloads/Fathering_Without_Fear_Teaser-A4.pdf`;
  const Mobile = `${siteUrl}/downloads/Fathering_Without_Fear_Teaser-Mobile.pdf`;

  return `
<div style="font-family:ui-sans-serif,-apple-system,Segoe UI,Roboto,Arial; color:#1b1f1a; line-height:1.6">
  <p>Friendsname ? " " + escapeHtml(name) + "," : ""}</p>

  <p>
    Im releasing <strong>Fathering Without Fear</strong>, a memoir forged in the middle of loss,
    legal storms, and a fathers stubborn hope. Its for the men who keep showing up, the sons
    looking for language, and anyone whos wrestled with God and grief at the same time.
  </p>

  <p>Heres a free, brand-styled teaser you can read and share:</p>
  <ul>
    <li>Teaser PDF (A4/Letter): <a href="${A4}" target="_blank" rel="noopener noreferrer">Download A4/Letter</a></li>
    <li>Teaser PDF (Mobile): <a href="${Mobile}" target="_blank" rel="noopener noreferrer">Download Mobile</a></li>
  </ul>

  <p>
    Want chapter drops and launch dates? Reply <em>keep me postedem> or join the list here:
    <a href="${siteUrl}/contact" target="_blank" rel="noopener noreferrer">${siteUrl}/contact</a>.
  </p>

  <p>Grace and courage,<br/>Abraham of London</p>

  <hr style="border:0; border-top:1px solid #e5e7eb; margin:20px 0" />
  <p style="font-size:12px; color:#6b7280">
    Youre receiving this because you requested the teaser or asked to be notified.
    Unsubscribe: reply with <em>stopem>.
  </p>
</div>`.trim();
}

function escapeHtml(str: string) {
  return String(str).replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as const)[m] || m
  );
}
