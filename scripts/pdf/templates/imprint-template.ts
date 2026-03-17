function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeLabel(value: string | undefined, fallback: string): string {
  const raw = String(value || "").trim();
  return raw || fallback;
}

export function renderImprintPage(args: {
  title: string;
  subtitle?: string;
  author: string;
  version?: string;
  year?: string;
  site?: string;
  documentId?: string;
  classification?: string;
}): string {
  const year = normalizeLabel(args.year, new Date().getFullYear().toString());
  const site = normalizeLabel(args.site, "abrahamoflondon.org");
  const version = normalizeLabel(args.version, "1.0.0");
  const documentId = normalizeLabel(args.documentId, "IMPRINT-001");
  const classification = normalizeLabel(args.classification, "PUBLIC");

  return `
    <section style="
      page-break-after: always;
      padding: 0;
      box-sizing: border-box;
      color: #111318;
      background: #fffdf8;
      display: flex;
      flex-direction: column;
      position: relative;
      font-family: Georgia, 'Times New Roman', serif;
    ">
      <div style="
        height: 3px;
        background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 50%, #b8923f 100%);
        width: 100%;
      "></div>

      <div style="
        padding: 64px 60px 56px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 34px;
        ">
          <div style="
            font: 700 9px Arial, sans-serif;
            letter-spacing: 0.28em;
            text-transform: uppercase;
            color: #b8923f;
          ">
            Institutional Imprint
          </div>

          <div style="
            font: 400 8px 'Courier New', monospace;
            color: #8a8f99;
            letter-spacing: 0.05em;
          ">
            ${escapeHtml(classification)} · ${escapeHtml(documentId)}
          </div>
        </div>

        <div style="margin-bottom: 26px;">
          <div style="
            font-size: 34px;
            line-height: 1.14;
            letter-spacing: -0.015em;
            font-weight: 400;
            color: #0c1730;
            margin-bottom: 10px;
            max-width: 85%;
          ">
            ${escapeHtml(args.title)}
          </div>

          ${
            args.subtitle
              ? `<div style="
                  font-size: 15px;
                  line-height: 1.5;
                  color: #5f6470;
                  font-style: italic;
                  max-width: 72%;
                ">${escapeHtml(args.subtitle)}</div>`
              : ""
          }
        </div>

        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin: 34px 0 24px;
          border-top: 1px solid #e8dfcf;
          padding-top: 30px;
        ">
          <div>
            <div style="
              font: 700 9px Arial, sans-serif;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #b8923f;
              margin-bottom: 18px;
            ">Publication Details</div>

            <div style="font-size: 12px; line-height: 1.95; color: #20242d;">
              <div style="margin-bottom: 12px;">
                <span style="
                  display: inline-block;
                  width: 92px;
                  color: #7a7466;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                ">Author</span>
                <span>${escapeHtml(args.author)}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="
                  display: inline-block;
                  width: 92px;
                  color: #7a7466;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                ">Version</span>
                <span style="font-family: 'Courier New', monospace;">${escapeHtml(version)}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="
                  display: inline-block;
                  width: 92px;
                  color: #7a7466;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                ">Published</span>
                <span>${escapeHtml(year)}</span>
              </div>
            </div>
          </div>

          <div>
            <div style="
              font: 700 9px Arial, sans-serif;
              letter-spacing: 0.2em;
              text-transform: uppercase;
              color: #b8923f;
              margin-bottom: 18px;
            ">Publisher Information</div>

            <div style="font-size: 12px; line-height: 1.95; color: #20242d;">
              <div style="margin-bottom: 12px;">
                <span style="
                  display: inline-block;
                  width: 92px;
                  color: #7a7466;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                ">Publisher</span>
                <span>Abraham of London Network</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="
                  display: inline-block;
                  width: 92px;
                  color: #7a7466;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                ">Website</span>
                <span>${escapeHtml(site)}</span>
              </div>

              <div style="margin-bottom: 12px;">
                <span style="
                  display: inline-block;
                  width: 92px;
                  color: #7a7466;
                  font-family: Arial, sans-serif;
                  font-size: 10px;
                  text-transform: uppercase;
                  letter-spacing: 0.05em;
                ">Edition</span>
                <span>Institutional Orientation</span>
              </div>
            </div>
          </div>
        </div>

        <div style="
          margin: 14px 0 24px;
          padding: 18px 20px;
          background: #f9f7f2;
          border-left: 3px solid #b8923f;
          font-size: 11px;
          line-height: 1.7;
          color: #3f4450;
          font-style: italic;
        ">
          <span style="
            font: 700 8px Arial, sans-serif;
            letter-spacing: 0.2em;
            text-transform: uppercase;
            color: #b8923f;
            display: block;
            margin-bottom: 8px;
            font-style: normal;
          ">Colophon</span>
          This document forms part of the Abraham of London institutional library and is issued for orientation, study, and transmission. No part may be reproduced without proper attribution.
        </div>

        <div style="
          margin-top: auto;
          border-top: 1px solid #e8dfcf;
          padding-top: 18px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 10px;
          color: #7a7466;
        ">
          <div>
            <span style="font-weight: 700;">©</span> ${escapeHtml(year)} Abraham of London. All rights reserved.
          </div>

          <div style="
            font-family: 'Courier New', monospace;
            color: #5f6470;
            font-size: 8px;
            letter-spacing: 0.05em;
          ">
            AoL Pipeline v3
          </div>
        </div>

        <div style="
          margin-top: 12px;
          text-align: right;
          font-size: 7px;
          font-family: 'Courier New', monospace;
          color: #c0c5cf;
          letter-spacing: 0.1em;
        ">
          ${escapeHtml(documentId)} · ${escapeHtml(classification)} · ${escapeHtml(version)}
        </div>
      </div>
    </section>
  `;
}