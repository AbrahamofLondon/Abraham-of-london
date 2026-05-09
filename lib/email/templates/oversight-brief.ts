type OversightBriefEmailTemplateInput = {
  recipientName?: string | null;
  cycleLabel: string;
  whatRepeated: string;
  whatWorsened: string;
  whatBecameMoreExpensive: string;
  decisionRequired: string;
  briefUrl: string;
  approveUrl: string;
  challengeUrl: string;
};

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildOversightBriefEmailTemplate(input: OversightBriefEmailTemplateInput) {
  const subject = `Oversight Brief: ${input.cycleLabel}`;
  const greeting = input.recipientName ? `Hello ${escapeHtml(input.recipientName)},` : "Hello,";

  const html = `<!DOCTYPE html>
  <html>
    <body style="margin:0;padding:0;background:#090909;color:#f5f5f5;font-family:Georgia,serif;">
      <div style="max-width:580px;margin:0 auto;padding:40px 24px;">
        <p style="font-family:monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a96e;">Retained Oversight</p>
        <p style="font-size:15px;line-height:1.75;color:rgba(245,245,245,0.72);">${greeting}</p>
        <p style="font-size:15px;line-height:1.75;color:rgba(245,245,245,0.72);margin-top:18px;">Your oversight brief for ${escapeHtml(input.cycleLabel)} is ready.</p>
        <div style="margin-top:20px;border:1px solid rgba(255,255,255,0.10);padding:16px;background:rgba(255,255,255,0.03);">
          <p style="margin:0;font-family:monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(201,169,110,0.82);">What repeated</p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:rgba(245,245,245,0.66);">${escapeHtml(input.whatRepeated)}</p>
          <p style="margin:14px 0 0;font-family:monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(201,169,110,0.82);">What worsened</p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:rgba(245,245,245,0.66);">${escapeHtml(input.whatWorsened)}</p>
          <p style="margin:14px 0 0;font-family:monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(201,169,110,0.82);">What became more expensive</p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:rgba(245,245,245,0.66);">${escapeHtml(input.whatBecameMoreExpensive)}</p>
        </div>
        <p style="font-size:14px;line-height:1.7;color:rgba(252,165,165,0.86);margin-top:18px;">Decision required: ${escapeHtml(input.decisionRequired)}</p>
        <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
          <a href="${escapeHtml(input.briefUrl)}" style="display:inline-block;padding:14px 18px;background:#f5f5f5;color:#0b0b0b;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">View brief</a>
          <a href="${escapeHtml(input.approveUrl)}" style="display:inline-block;padding:14px 18px;border:1px solid rgba(201,169,110,0.38);color:#c9a96e;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Approve</a>
          <a href="${escapeHtml(input.challengeUrl)}" style="display:inline-block;padding:14px 18px;border:1px solid rgba(255,255,255,0.16);color:rgba(245,245,245,0.82);text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Challenge</a>
        </div>
      </div>
    </body>
  </html>`;

  const text = [
    `Oversight Brief: ${input.cycleLabel}`,
    "",
    greeting.replace(/<[^>]+>/g, ""),
    "",
    `What repeated: ${input.whatRepeated}`,
    `What worsened: ${input.whatWorsened}`,
    `What became more expensive: ${input.whatBecameMoreExpensive}`,
    `Decision required: ${input.decisionRequired}`,
    "",
    `View brief: ${input.briefUrl}`,
    `Approve: ${input.approveUrl}`,
    `Challenge: ${input.challengeUrl}`,
  ].join("\n");

  return { subject, html, text };
}
