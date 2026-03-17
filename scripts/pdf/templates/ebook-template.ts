function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function buildEbookHtml(args: {
  title: string;
  subtitle?: string;
  description?: string;
  tier: string;
  bodyHtml: string;
  watermarkId: string;
  fingerprintId: string;
  footerText: string;
}): string {
  const title = escapeHtml(args.title);
  const subtitle = escapeHtml(args.subtitle || "");
  const description = escapeHtml(args.description || "");
  const tier = escapeHtml(args.tier.toUpperCase());
  const watermarkId = escapeHtml(args.watermarkId);
  const fingerprintId = escapeHtml(args.fingerprintId);
  const footerText = escapeHtml(args.footerText);

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #111318;
      background: #fbfaf7;
      font-size: 11.5pt;
      line-height: 1.7;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .shell { max-width: 760px; margin: 0 auto; background: #fffdf8; }
    .title { font-size: 30px; margin: 0 0 8px; }
    .subtitle { font: 700 11px Arial, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #666; }
    .description { color: #444; margin-bottom: 18px; }
    .meta { font: 700 9px Arial, sans-serif; letter-spacing: .18em; text-transform: uppercase; color: #b8923f; margin-bottom: 18px; }
    .forensics {
      border: 1px solid #e8dfcf;
      padding: 10px 12px;
      font: 8px "Courier New", monospace;
      color: #6a624f;
      margin-bottom: 24px;
    }
    .content h1, .content h2, .content h3 { page-break-after: avoid; }
    .content h1 { font-size: 23px; border-top: 1px solid #e8dfcf; padding-top: 8px; }
    .content h2 { font-size: 18px; }
    .content h3 { font-size: 14px; font-family: Arial, sans-serif; text-transform: uppercase; color: #4c5160; }
    .content blockquote {
      border-left: 3px solid #b8923f;
      background: #f6f2ea;
      padding: 12px 16px;
      font-style: italic;
    }
    .ghost {
      position: fixed;
      top: 44%;
      left: 12%;
      transform: rotate(-27deg);
      font: 700 38px Arial, sans-serif;
      letter-spacing: .24em;
      text-transform: uppercase;
      color: rgba(184,146,63,.05);
      pointer-events: none;
    }
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #e8dfcf;
      font: 8px "Courier New", monospace;
      color: #7a7466;
    }
  </style>
</head>
<body>
  <div class="ghost">ABRAHAM OF LONDON</div>
  <div class="shell">
    <div class="meta">Abraham of London • ${tier}</div>
    <h1 class="title">${title}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ""}
    ${description ? `<p class="description">${description}</p>` : ""}
    <div class="forensics">
      WM ${watermarkId} • FP ${fingerprintId}<br />
      ${footerText}
    </div>
    <main class="content">${args.bodyHtml}</main>
    <footer class="footer">${footerText}</footer>
  </div>
</body>
</html>
`;
}