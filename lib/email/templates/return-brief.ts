type ReturnBriefEmailTemplateInput = {
  recipientName?: string | null;
  dominantFinding: string;
  unresolvedCondition: string;
  costOfInactionHeadline: string;
  returnBriefUrl: string;
  responseUrl: string;
};

function escapeHtml(value: string): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildReturnBriefEmailTemplate(input: ReturnBriefEmailTemplateInput) {
  const subject = "Return Brief: unresolved condition still active";
  const greeting = input.recipientName ? `Hello ${escapeHtml(input.recipientName)},` : "Hello,";

  const html = `<!DOCTYPE html>
  <html>
    <body style="margin:0;padding:0;background:#0b0b0b;color:#f5f5f5;font-family:Georgia,serif;">
      <div style="max-width:560px;margin:0 auto;padding:40px 24px;">
        <p style="font-family:monospace;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#c9a96e;">Return Brief</p>
        <p style="font-size:15px;line-height:1.75;color:rgba(245,245,245,0.72);">${greeting}</p>
        <p style="font-size:15px;line-height:1.75;color:rgba(245,245,245,0.72);margin-top:18px;">${escapeHtml(input.dominantFinding)}</p>
        <div style="margin-top:20px;border:1px solid rgba(255,255,255,0.10);padding:16px;background:rgba(255,255,255,0.03);">
          <p style="margin:0;font-family:monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(201,169,110,0.82);">Unresolved condition</p>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.7;color:rgba(245,245,245,0.66);">${escapeHtml(input.unresolvedCondition)}</p>
        </div>
        <p style="font-size:14px;line-height:1.7;color:rgba(252,165,165,0.86);margin-top:18px;">${escapeHtml(input.costOfInactionHeadline)}</p>
        <div style="margin-top:24px;display:flex;gap:12px;flex-wrap:wrap;">
          <a href="${escapeHtml(input.responseUrl)}" style="display:inline-block;padding:14px 18px;background:#f5f5f5;color:#0b0b0b;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Respond now</a>
          <a href="${escapeHtml(input.returnBriefUrl)}" style="display:inline-block;padding:14px 18px;border:1px solid rgba(201,169,110,0.38);color:#c9a96e;text-decoration:none;font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Open return brief</a>
        </div>
      </div>
    </body>
  </html>`;

  const text = [
    "Return Brief",
    "",
    greeting.replace(/<[^>]+>/g, ""),
    "",
    input.dominantFinding,
    "",
    `Unresolved condition: ${input.unresolvedCondition}`,
    `Cost of inaction: ${input.costOfInactionHeadline}`,
    "",
    `Respond now: ${input.responseUrl}`,
    `Open return brief: ${input.returnBriefUrl}`,
  ].join("\n");

  return { subject, html, text };
}
