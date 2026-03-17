// scripts/pdf/templates/closing-template.ts

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

export function renderClosingPage(args: {
  statement: string;
  author: string;
  imprint?: string;
  classification?: string;
}): string {
  const statement = safeText(args.statement, "The task of leadership is not self-expression. It is alignment with truth.");
  const author = safeText(args.author, "Abraham of London");
  const imprint = safeText(args.imprint, "Institutional Orientation Edition");
  const classification = safeText(args.classification, "Public Editorial Canon");

  return `
    <section style="
      page-break-before: always;
      min-height: 100vh;
      padding: 0;
      box-sizing: border-box;
      background: linear-gradient(180deg, #fffdf8 0%, #f8f5ee 100%);
      color: #111318;
      display: flex;
      flex-direction: column;
      position: relative;
      font-family: Georgia, 'Times New Roman', serif;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 50%, #b8923f 100%);
      "></div>

      <div style="
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.06;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 42px;
        letter-spacing: 0.28em;
        text-transform: uppercase;
        color: #b8923f;
        transform: rotate(-26deg);
        white-space: nowrap;
      ">
        ABRAHAM OF LONDON
      </div>

      <div style="
        flex: 1;
        padding: 78px 60px 68px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        position: relative;
        z-index: 1;
      ">
        <div style="
          margin-bottom: 34px;
          font: 700 9px Arial, Helvetica, sans-serif;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: #b8923f;
        ">
          Closing Reflection
        </div>

        <div style="
          max-width: 78%;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 30px;
          line-height: 1.52;
          letter-spacing: -0.015em;
          color: #111318;
        ">
          ${escapeHtml(statement)}
        </div>

        <div style="
          margin-top: 34px;
          width: 74px;
          height: 2px;
          background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 100%);
        "></div>

        <div style="
          margin-top: 28px;
          font: 700 10px Arial, Helvetica, sans-serif;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          color: #b8923f;
        ">
          — ${escapeHtml(author)}
        </div>

        <div style="
          margin-top: 46px;
          padding-top: 18px;
          border-top: 1px solid #e8dfcf;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 20px;
        ">
          <div>
            <div style="
              font: 700 8px Arial, Helvetica, sans-serif;
              letter-spacing: 0.18em;
              text-transform: uppercase;
              color: #7a7466;
              margin-bottom: 8px;
            ">
              Institutional Seal
            </div>

            <div style="
              font-size: 11px;
              line-height: 1.7;
              color: #4a4f5b;
              max-width: 360px;
            ">
              This document belongs to the Abraham of London editorial and institutional library. It is intended to orient, discipline, and strengthen serious builders.
            </div>
          </div>

          <div style="
            text-align: right;
            color: #7a7466;
          ">
            <div style="
              font: 700 8px 'Courier New', Courier, monospace;
              letter-spacing: 0.08em;
              margin-bottom: 8px;
            ">
              ${escapeHtml(classification.toUpperCase())}
            </div>

            <div style="
              display: inline-block;
              padding: 4px 12px;
              border-radius: 999px;
              background: #f2efe8;
              color: #5f6470;
              font: 700 8px 'Courier New', Courier, monospace;
              letter-spacing: 0.08em;
            ">
              ${escapeHtml(imprint)}
            </div>
          </div>
        </div>
      </div>
    </section>
  `;
}