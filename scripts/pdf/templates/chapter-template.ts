// scripts/pdf/templates/chapter-template.ts

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

export function renderChapterOpener(args: {
  numeral?: string;
  title: string;
  intro?: string;
}): string {
  const numeral = escapeHtml(safeText(args.numeral));
  const title = escapeHtml(safeText(args.title, "Untitled Chapter"));
  const intro = escapeHtml(safeText(args.intro));

  return `
    <section style="
      page-break-before: always;
      margin: 10px 0 26px;
      padding: 0;
      position: relative;
    ">
      <div style="
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 2px;
        background: linear-gradient(
          180deg,
          rgba(184,146,63,0.95) 0%,
          rgba(216,184,122,0.58) 38%,
          rgba(232,223,207,0.72) 100%
        );
      "></div>

      <div style="
        padding-left: 22px;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 18px;
        ">
          ${
            numeral
              ? `
            <div style="
              min-width: 48px;
              padding: 6px 10px;
              border: 1px solid rgba(184,146,63,0.28);
              border-radius: 999px;
              background: rgba(184,146,63,0.08);
              font: 700 8px Arial, Helvetica, sans-serif;
              letter-spacing: 0.30em;
              text-transform: uppercase;
              color: #b8923f;
              text-align: center;
            ">
              ${numeral}
            </div>
          `
              : ""
          }

          <div style="
            flex: 1;
            height: 2px;
            background: linear-gradient(
              90deg,
              #b8923f 0%,
              rgba(184,146,63,0.24) 36%,
              rgba(232,223,207,0.65) 100%
            );
          "></div>
        </div>

        <div style="
          max-width: 86%;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 34px;
          line-height: 1.05;
          letter-spacing: -0.03em;
          color: #111318;
          margin: 0 0 14px 0;
          text-rendering: optimizeLegibility;
        ">
          ${title}
        </div>

        ${
          intro
            ? `
          <div style="
            max-width: 74%;
            padding-left: 16px;
            border-left: 2px solid rgba(184,146,63,0.46);
            color: #5f6470;
            font-size: 13.5px;
            line-height: 1.72;
            margin: 0 0 8px 0;
            font-family: Georgia, 'Times New Roman', serif;
          ">
            ${intro}
          </div>
        `
            : ""
        }

        <div style="
          margin-top: 18px;
          width: 90px;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(184,146,63,0.95) 0%,
            rgba(232,223,207,0.40) 100%
          );
        "></div>
      </div>
    </section>
  `;
}