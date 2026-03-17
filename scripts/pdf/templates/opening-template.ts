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

function splitParagraphs(text: string): string[] {
  return safeText(text)
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

function renderOpeningParagraphs(text: string): string {
  const paragraphs = splitParagraphs(text);

  return paragraphs
    .map((paragraph, index) => {
      const safeParagraph = escapeHtml(paragraph).replace(/\n/g, "<br />");

      if (index === 0 && paragraph.length > 0) {
        const firstChar = escapeHtml(paragraph.charAt(0));
        const rest = escapeHtml(paragraph.slice(1)).replace(/\n/g, "<br />");

        return `
          <p style="
            margin: 0 0 24px 0;
            font-size: 20px;
            line-height: 1.72;
            color: #1d2430;
            text-rendering: optimizeLegibility;
          ">
            <span style="
              float: left;
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 74px;
              line-height: 0.84;
              font-weight: 400;
              color: #b8923f;
              margin: 2px 10px 0 0;
              letter-spacing: -0.03em;
            ">${firstChar}</span>
            ${rest}
          </p>
        `;
      }

      return `
        <p style="
          margin: 0 0 22px 0;
          font-size: 18px;
          line-height: 1.72;
          color: #2a2f3c;
          text-rendering: optimizeLegibility;
        ">
          ${safeParagraph}
        </p>
      `;
    })
    .join("\n");
}

export function renderOpeningPage(text: string): string {
  const cleanedText = safeText(text);
  const contentHtml = renderOpeningParagraphs(cleanedText);

  return `
    <section style="
      page-break-after: always;
      min-height: 100vh;
      padding: 0;
      box-sizing: border-box;
      position: relative;
      display: flex;
      align-items: stretch;
      background:
        linear-gradient(135deg, #fdfbf6 0%, #f7f3eb 58%, #fbfaf7 100%);
      color: #111318;
      font-family: Georgia, 'Times New Roman', serif;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.035;
        background-image:
          radial-gradient(circle at 20% 22%, rgba(184,146,63,0.35) 1px, transparent 1.2px);
        background-size: 42px 42px;
      "></div>

      <div style="
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 6px;
        background: linear-gradient(
          180deg,
          #b8923f 0%,
          #d9bb79 26%,
          #efe5d1 52%,
          #d6b26a 78%,
          #b8923f 100%
        );
        box-shadow: 2px 0 10px rgba(184,146,63,0.12);
      "></div>

      <div style="
        position: absolute;
        top: 34px;
        right: 46px;
        font: 700 8px Arial, Helvetica, sans-serif;
        letter-spacing: 0.24em;
        text-transform: uppercase;
        color: rgba(184,146,63,0.82);
      ">
        Opening Leaf
      </div>

      <div style="
        position: absolute;
        right: 38px;
        top: 18%;
        bottom: 18%;
        width: 1px;
        background: linear-gradient(
          180deg,
          transparent 0%,
          rgba(232,223,207,0.95) 18%,
          rgba(232,223,207,0.55) 50%,
          rgba(232,223,207,0.95) 82%,
          transparent 100%
        );
        opacity: 0.55;
      "></div>

      <div style="
        position: relative;
        z-index: 2;
        width: 100%;
        padding: 82px 72px 70px 84px;
        display: flex;
        flex-direction: column;
        justify-content: center;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 26px;
        ">
          <div style="
            width: 52px;
            height: 2px;
            background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 100%);
          "></div>

          <div style="
            font: 700 10px Arial, Helvetica, sans-serif;
            letter-spacing: 0.30em;
            text-transform: uppercase;
            color: #b8923f;
          ">
            Prologue
          </div>
        </div>

        <div style="
          max-width: 76%;
          margin-bottom: 26px;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 42px;
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: #111318;
        ">
          Before argument comes alignment.
        </div>

        <div style="
          width: 96px;
          height: 2px;
          margin-bottom: 30px;
          background: linear-gradient(90deg, #b8923f 0%, rgba(184,146,63,0.16) 100%);
        "></div>

        <div style="
          max-width: 74%;
          color: #1f2633;
        ">
          ${contentHtml}
        </div>

        <div style="
          margin-top: 40px;
          display: flex;
          align-items: center;
          gap: 14px;
        ">
          <div style="
            width: 68px;
            height: 2px;
            background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 100%);
          "></div>

          <div style="
            font: 400 9px Arial, Helvetica, sans-serif;
            letter-spacing: 0.16em;
            text-transform: uppercase;
            color: #8a8f99;
          ">
            Orientation before structure
          </div>
        </div>

        <div style="
          margin-top: 24px;
          font: 400 8px 'Courier New', Courier, monospace;
          letter-spacing: 0.08em;
          color: #b8b1a4;
        ">
          ABRAHAM OF LONDON · EDITORIAL CANON · OPENING TEXT
        </div>
      </div>
    </section>
  `;
}