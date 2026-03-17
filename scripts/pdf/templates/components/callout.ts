// scripts/pdf/templates/components/callout.ts

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function renderCallout(args: {
  label: string;
  body: string;
}): string {
  const label = escapeHtml(safeText(args.label, "Key Insight"));
  const body = safeText(args.body);

  return `
    <section style="
      margin: 28px 0 32px;
      page-break-inside: avoid;
      position: relative;
    ">
      <div style="
        border: 1px solid rgba(184,146,63,0.18);
        background:
          linear-gradient(180deg, rgba(184,146,63,0.08) 0%, rgba(184,146,63,0.02) 100%);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.35),
          0 2px 10px rgba(0,0,0,0.02);
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px 10px;
          border-bottom: 1px solid rgba(184,146,63,0.14);
          background: rgba(255,255,255,0.28);
        ">
          <div style="
            width: 34px;
            height: 2px;
            background: linear-gradient(90deg, #b8923f 0%, rgba(184,146,63,0.2) 100%);
          "></div>

          <div style="
            font: 700 8px Arial, Helvetica, sans-serif;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: #b8923f;
          ">
            ${label}
          </div>
        </div>

        <div style="
          padding: 16px 18px 18px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 11.3pt;
          line-height: 1.72;
          color: #20242d;
        ">
          ${body}
        </div>
      </div>
    </section>
  `;
}