// scripts/pdf/templates/toc-template.ts

export type TocTemplateItem = {
  label: string;
  page?: number;
  section?: string;
  isSubsection?: boolean;
  level?: number;
};

function escapeHtml(input: string): string {
  return String(input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeText(value: unknown): string {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function normalizeItems(items: TocTemplateItem[] | null | undefined): TocTemplateItem[] {
  if (!Array.isArray(items) || items.length === 0) {
    return [
      { label: "Prologue", section: "Frontmatter", level: 1 },
      { label: "Introduction", section: "Main Text", level: 1 },
      { label: "Institutional Record", section: "Closing", level: 1 },
    ];
  }

  return items
    .map((item) => ({
      label: safeText(item.label),
      page: typeof item.page === "number" ? item.page : undefined,
      section: safeText(item.section) || undefined,
      isSubsection: Boolean(item.isSubsection),
      level: typeof item.level === "number" ? item.level : undefined,
    }))
    .filter((item) => Boolean(item.label));
}

function hasPageNumbers(items: TocTemplateItem[]): boolean {
  return items.some((item) => typeof item.page === "number");
}

function inferIndent(item: TocTemplateItem): number {
  if (typeof item.level === "number") {
    if (item.level <= 1) return 0;
    if (item.level === 2) return 20;
    return 32;
  }

  return item.isSubsection ? 20 : 0;
}

function inferFontSize(item: TocTemplateItem): string {
  if (typeof item.level === "number" && item.level >= 2) return "12px";
  if (item.isSubsection) return "12px";
  return "14px";
}

function inferColor(item: TocTemplateItem): string {
  if (typeof item.level === "number" && item.level >= 2) return "#5f6470";
  if (item.isSubsection) return "#5f6470";
  return "#20242d";
}

function renderSectionHeading(section: string): string {
  return `
    <div style="
      margin: 28px 0 14px;
      padding-bottom: 7px;
      border-bottom: 1px solid #e8dfcf;
      font: 700 9px Arial, Helvetica, sans-serif;
      letter-spacing: 0.20em;
      text-transform: uppercase;
      color: #7a7466;
    ">
      ${escapeHtml(section)}
    </div>
  `;
}

function renderLeaderDots(): string {
  return `
    <span style="
      flex: 1 1 auto;
      height: 1px;
      margin: 0 10px 3px;
      background-image: radial-gradient(circle, rgba(122,116,102,0.34) 0.75px, transparent 0.9px);
      background-size: 6px 1px;
      background-repeat: repeat-x;
      background-position: left center;
      opacity: 0.7;
    "></span>
  `;
}

function renderTocRow(item: TocTemplateItem, showPages: boolean): string {
  const indent = inferIndent(item);
  const fontSize = inferFontSize(item);
  const color = inferColor(item);

  const bullet =
    indent > 0
      ? `
        <span style="
          width: 5px;
          height: 5px;
          margin-top: 8px;
          border-radius: 999px;
          background: #b8923f;
          opacity: 0.40;
          flex: 0 0 auto;
        "></span>
      `
      : "";

  const pageMarkup = showPages
    ? `
      ${renderLeaderDots()}
      <span style="
        min-width: 24px;
        text-align: right;
        font-family: 'Courier New', Courier, monospace;
        font-size: 11px;
        color: #7a7466;
        letter-spacing: 0.02em;
      ">
        ${typeof item.page === "number" ? item.page : "—"}
      </span>
    `
    : "";

  return `
    <div style="
      display: flex;
      align-items: baseline;
      margin: 0 0 ${indent > 0 ? "8px" : "13px"} 0;
      margin-left: ${indent}px;
      page-break-inside: avoid;
    ">
      <div style="
        display: flex;
        align-items: flex-start;
        gap: 10px;
        width: 100%;
        font-family: Georgia, 'Times New Roman', serif;
        font-size: ${fontSize};
        line-height: 1.55;
        color: ${color};
      ">
        ${bullet}
        <span style="display: inline-block; max-width: ${showPages ? "78%" : "100%"};">
          ${escapeHtml(item.label)}
        </span>
        ${pageMarkup}
      </div>
    </div>
  `;
}

export function renderTocPage(inputItems: TocTemplateItem[]): string {
  const items = normalizeItems(inputItems);
  const showPages = hasPageNumbers(items);

  let lastSection = "";

  const rows = items
    .map((item) => {
      const normalizedSection = safeText(item.section);
      const shouldRenderSection =
        normalizedSection && normalizedSection !== lastSection;

      if (shouldRenderSection) {
        lastSection = normalizedSection;
      }

      return `
        ${shouldRenderSection ? renderSectionHeading(normalizedSection) : ""}
        ${renderTocRow(item, showPages)}
      `;
    })
    .join("\n");

  return `
    <section style="
      page-break-after: always;
      min-height: 100vh;
      padding: 0;
      background: #fffdf8;
      color: #111318;
      display: flex;
      flex-direction: column;
      font-family: Georgia, 'Times New Roman', serif;
      position: relative;
    ">
      <div style="
        height: 4px;
        width: 100%;
        background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 50%, #b8923f 100%);
      "></div>

      <div style="
        flex: 1;
        padding: 72px 60px 64px;
        display: flex;
        flex-direction: column;
      ">
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 38px;
        ">
          <div style="
            display: inline-block;
            padding: 6px 14px;
            border-radius: 999px;
            background: rgba(184, 146, 63, 0.08);
            color: #b8923f;
            font: 700 9px Arial, Helvetica, sans-serif;
            letter-spacing: 0.28em;
            text-transform: uppercase;
          ">
            Reading Guide
          </div>

          <div style="
            color: #8a8f99;
            font: 400 8px 'Courier New', Courier, monospace;
            letter-spacing: 0.04em;
          ">
            STRUCTURAL OVERVIEW
          </div>
        </div>

        <div style="margin-bottom: 40px;">
          <div style="
            font-size: 36px;
            line-height: 1.08;
            letter-spacing: -0.01em;
            color: #0c1730;
          ">
            Table of Contents
          </div>

          <div style="
            width: 82px;
            height: 2px;
            margin-top: 12px;
            background: linear-gradient(90deg, #b8923f 0%, #e8dfcf 100%);
          "></div>
        </div>

        <div style="
          flex: 1;
          padding-top: 4px;
        ">
          ${rows}
        </div>

        <div style="
          margin-top: 44px;
          padding-top: 18px;
          border-top: 1px solid #e8dfcf;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          color: #8a8f99;
          font-size: 10px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 14px;
          ">
            <span style="
              display: inline-block;
              width: 28px;
              height: 1px;
              background: #c0c5cf;
            "></span>
            <span>Institutional Orientation Edition</span>
          </div>

          <div style="
            padding: 4px 12px;
            border-radius: 999px;
            background: #f2efe8;
            color: #5f6470;
            font-family: 'Courier New', Courier, monospace;
            font-size: 8px;
            letter-spacing: 0.08em;
          ">
            NAVIGATION • REFERENCE
          </div>
        </div>
      </div>
    </section>
  `;
}