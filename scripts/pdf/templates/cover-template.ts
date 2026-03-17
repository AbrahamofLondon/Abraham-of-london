// scripts/pdf/templates/cover-template.ts

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

export function renderCoverPage(args: {
  title: string;
  subtitle?: string;
  author: string;
  edition?: string;
  year?: string;
  documentId?: string;
  classification?: string;
  coverImage?: string;
}): string {
  const title = escapeHtml(safeText(args.title, "Untitled Work"));
  const subtitle = escapeHtml(safeText(args.subtitle));
  const author = escapeHtml(safeText(args.author, "Abraham of London"));
  const edition = escapeHtml(safeText(args.edition, "Institutional Edition"));
  const year = escapeHtml(
    safeText(args.year, new Date().getFullYear().toString()),
  );
  const documentId = escapeHtml(safeText(args.documentId));
  const classification = escapeHtml(safeText(args.classification, "PUBLIC"));

  const hasCoverImage =
    typeof args.coverImage === "string" && args.coverImage.trim().length > 0;

  const backgroundStyle = hasCoverImage
    ? `url("${args.coverImage}") center/cover no-repeat`
    : `
      radial-gradient(circle at 18% 22%, rgba(208,176,106,0.16) 0%, transparent 28%),
      radial-gradient(circle at 82% 72%, rgba(208,176,106,0.10) 0%, transparent 30%),
      linear-gradient(135deg, #08101b 0%, #0d1728 32%, #162238 62%, #1b2029 100%)
    `;

  return `
    <section style="
      page-break-after: always;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      color: #ffffff;
      background: ${backgroundStyle};
      background-blend-mode: ${hasCoverImage ? "normal" : "screen, screen, normal"};
      font-family: Arial, Helvetica, sans-serif;
      box-sizing: border-box;
    ">
      ${
        hasCoverImage
          ? `
        <div style="
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(5,10,18,0.72) 0%, rgba(8,13,22,0.50) 34%, rgba(9,14,23,0.82) 100%),
            linear-gradient(135deg, rgba(10,16,27,0.84) 0%, rgba(12,20,35,0.64) 48%, rgba(16,21,30,0.86) 100%);
          pointer-events: none;
        "></div>
      `
          : ""
      }

      <div style="
        position: absolute;
        inset: 0;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.02) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.08) 100%);
        pointer-events: none;
      "></div>

      <div style="
        position: absolute;
        inset: 0;
        opacity: 0.035;
        background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJmIj48ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iLjc0IiBudW1PY3RhdmVzPSIzIiAvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNmKSIgb3BhY2l0eT0iMC4yIiAvPjwvc3ZnPg==');
        pointer-events: none;
      "></div>

      <div style="
        position: absolute;
        inset: 22px;
        border: 1px solid rgba(208,176,106,0.18);
        pointer-events: none;
      "></div>

      <div style="
        position: absolute;
        top: 22px;
        left: 22px;
        width: 76px;
        height: 76px;
        border-left: 1px solid rgba(208,176,106,0.34);
        border-top: 1px solid rgba(208,176,106,0.34);
        pointer-events: none;
      "></div>

      <div style="
        position: absolute;
        bottom: 22px;
        right: 22px;
        width: 76px;
        height: 76px;
        border-right: 1px solid rgba(208,176,106,0.34);
        border-bottom: 1px solid rgba(208,176,106,0.34);
        pointer-events: none;
      "></div>

      <div style="
        position: absolute;
        top: 38px;
        left: 52px;
        right: 52px;
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        z-index: 10;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 18px;
        ">
          <div style="
            position: relative;
            width: 54px;
            height: 54px;
            border: 1px solid rgba(208,176,106,0.46);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(circle at 50% 42%, rgba(208,176,106,0.12), rgba(208,176,106,0.03) 56%, transparent 72%);
            box-shadow:
              inset 0 0 0 1px rgba(255,255,255,0.03),
              0 0 28px rgba(208,176,106,0.08);
          ">
            <div style="
              position: absolute;
              inset: 5px;
              border: 1px solid rgba(208,176,106,0.18);
              border-radius: 50%;
            "></div>
            <div style="
              font-family: Georgia, 'Times New Roman', serif;
              font-size: 17px;
              letter-spacing: 0.06em;
              color: #d0b06a;
              line-height: 1;
              transform: translateY(-1px);
            ">
              AOL
            </div>
          </div>

          <div>
            <div style="
              font: 700 9px Arial, Helvetica, sans-serif;
              letter-spacing: 0.34em;
              text-transform: uppercase;
              color: rgba(255,255,255,0.74);
              margin-bottom: 5px;
            ">
              Abraham of London
            </div>
            <div style="
              font: 400 8px 'Courier New', Courier, monospace;
              letter-spacing: 0.08em;
              color: rgba(208,176,106,0.84);
            ">
              Editorial & Institutional Library
            </div>
          </div>
        </div>

        <div style="
          display: flex;
          align-items: center;
          gap: 12px;
        ">
          <div style="
            padding: 5px 12px;
            border: 1px solid rgba(208,176,106,0.28);
            border-radius: 999px;
            background: rgba(208,176,106,0.07);
            color: #d0b06a;
            font: 700 8px 'Courier New', Courier, monospace;
            letter-spacing: 0.08em;
          ">
            ${classification}
          </div>

          ${
            documentId
              ? `
            <div style="
              font: 400 8px 'Courier New', Courier, monospace;
              letter-spacing: 0.05em;
              color: rgba(255,255,255,0.48);
            ">
              ${documentId}
            </div>
          `
              : ""
          }
        </div>
      </div>

      <div style="
        position: absolute;
        top: 120px;
        bottom: 118px;
        left: 52px;
        right: 52px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        z-index: 10;
      ">
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 26px;
        ">
          <span style="
            display: inline-block;
            width: 54px;
            height: 1px;
            background: linear-gradient(90deg, #d0b06a 0%, rgba(208,176,106,0.22) 100%);
          "></span>

          <span style="
            display: inline-block;
            padding: 6px 14px;
            border: 1px solid rgba(208,176,106,0.26);
            border-radius: 999px;
            background: rgba(208,176,106,0.08);
            font: 700 8px Arial, Helvetica, sans-serif;
            letter-spacing: 0.30em;
            text-transform: uppercase;
            color: #d0b06a;
          ">
            Canonical Editorial
          </span>
        </div>

        <div style="
          max-width: 87%;
          font-family: Georgia, 'Times New Roman', serif;
          font-size: 72px;
          line-height: 0.92;
          letter-spacing: -0.035em;
          font-weight: 400;
          color: #ffffff;
          text-rendering: optimizeLegibility;
          text-shadow: 0 4px 22px rgba(0,0,0,0.30);
        ">
          ${title}
        </div>

        ${
          subtitle
            ? `
          <div style="
            margin-top: 26px;
            max-width: 64%;
            padding-left: 20px;
            border-left: 2px solid rgba(208,176,106,0.86);
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 21px;
            line-height: 1.48;
            font-style: italic;
            font-weight: 400;
            color: rgba(255,255,255,0.87);
            text-shadow: 0 2px 10px rgba(0,0,0,0.18);
          ">
            ${subtitle}
          </div>
        `
            : ""
        }

        <div style="
          margin-top: 34px;
          width: 132px;
          height: 2px;
          background: linear-gradient(90deg, #d0b06a 0%, rgba(208,176,106,0.18) 100%);
        "></div>
      </div>

      <div style="
        position: absolute;
        bottom: 38px;
        left: 52px;
        right: 52px;
        display: flex;
        justify-content: space-between;
        align-items: flex-end;
        z-index: 10;
      ">
        <div>
          <div style="
            font: 700 8px Arial, Helvetica, sans-serif;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: rgba(208,176,106,0.90);
            margin-bottom: 7px;
          ">
            Author
          </div>
          <div style="
            font-family: Georgia, 'Times New Roman', serif;
            font-size: 24px;
            line-height: 1.18;
            color: #ffffff;
          ">
            ${author}
          </div>
        </div>

        <div style="text-align: right;">
          <div style="
            font: 700 8px Arial, Helvetica, sans-serif;
            letter-spacing: 0.22em;
            text-transform: uppercase;
            color: rgba(255,255,255,0.44);
            margin-bottom: 7px;
          ">
            Edition
          </div>
          <div style="
            font: 400 14px Arial, Helvetica, sans-serif;
            letter-spacing: 0.07em;
            color: #d0b06a;
          ">
            ${edition} · ${year}
          </div>
        </div>
      </div>

      <div style="
        position: absolute;
        left: 50%;
        bottom: 18px;
        transform: translateX(-50%);
        font: 400 7px 'Courier New', Courier, monospace;
        letter-spacing: 0.10em;
        color: rgba(255,255,255,0.24);
        white-space: nowrap;
        z-index: 10;
      ">
        ABRAHAM OF LONDON · EDITORIAL CANON · INSTITUTIONAL COPY
      </div>
    </section>
  `;
}