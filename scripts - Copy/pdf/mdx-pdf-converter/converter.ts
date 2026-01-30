// scripts/pdf/mdx-pdf-converter/converter.ts
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PDFDocument, rgb, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import {
  type DocumentRegistryEntry,
  type TierConfig,
  type PaperFormat,
  type Quality,
  outputPublicPathForMdx,
  repoAbsFromPublic,
} from "./config";

// -----------------------------------------------------------------------------
// BRAND TOKENS (AoL)
// -----------------------------------------------------------------------------

const BRAND = {
  author: "Abraham of London",
  site: "abrahamoflondon.org",
  colors: {
    charcoal: rgb(0.10, 0.10, 0.12),
    slate: rgb(0.30, 0.32, 0.36),
    faint: rgb(0.55, 0.55, 0.58),
    gold: rgb(0.78, 0.64, 0.30),
    paper: rgb(0.98, 0.98, 0.975),
    rule: rgb(0.88, 0.88, 0.88),
    watermark: rgb(0.88, 0.88, 0.90),
  },
};

// -----------------------------------------------------------------------------
// Page formats (points)
// -----------------------------------------------------------------------------

function pageSize(format: PaperFormat): { w: number; h: number } {
  if (format === "A3") return { w: 841.89, h: 1190.55 };
  if (format === "Letter") return { w: 612, h: 792 };
  return { w: 595.28, h: 841.89 }; // A4
}

// -----------------------------------------------------------------------------
// Fonts
// - Put these files here:
//   scripts/pdf/fonts/PlayfairDisplay-Regular.ttf
//   scripts/pdf/fonts/PlayfairDisplay-Bold.ttf
//   scripts/pdf/fonts/NotoSans-Regular.ttf
//   scripts/pdf/fonts/NotoSans-Bold.ttf
// -----------------------------------------------------------------------------

type EmbeddedFonts = {
  heading: any;
  headingBold: any;
  body: any;
  bodyBold: any;
};

function fontBytes(rel: string) {
  const abs = path.join(process.cwd(), "scripts", "pdf", "fonts", rel);
  if (!fs.existsSync(abs)) {
    throw new Error(
      `Missing font: ${abs}\n` +
        `Add fonts under scripts/pdf/fonts/:\n` +
        `- PlayfairDisplay-Regular.ttf\n- PlayfairDisplay-Bold.ttf\n- NotoSans-Regular.ttf\n- NotoSans-Bold.ttf`,
    );
  }
  return fs.readFileSync(abs);
}

async function embedFonts(pdfDoc: PDFDocument): Promise<EmbeddedFonts> {
  pdfDoc.registerFontkit(fontkit);

  const playfairR = fontBytes("PlayfairDisplay-Regular.ttf");
  const playfairB = fontBytes("PlayfairDisplay-Bold.ttf");
  const notoR = fontBytes("NotoSans-Regular.ttf");
  const notoB = fontBytes("NotoSans-Bold.ttf");

  const heading = await pdfDoc.embedFont(playfairR, { subset: true });
  const headingBold = await pdfDoc.embedFont(playfairB, { subset: true });
  const body = await pdfDoc.embedFont(notoR, { subset: true });
  const bodyBold = await pdfDoc.embedFont(notoB, { subset: true });

  return { heading, headingBold, body, bodyBold };
}

// -----------------------------------------------------------------------------
// Minimal MDX -> “printable” text normalization
// (We’re not rendering React; we’re generating a premium print doc.)
// -----------------------------------------------------------------------------

function stripFrontmatter(raw: string) {
  const { data, content } = matter(raw);
  return { data: (data || {}) as Record<string, any>, content: String(content || "") };
}

function normalizeMdxToPrintable(md: string): string {
  let s = String(md || "");

  // Remove import/export lines
  s = s.replace(/^\s*(import|export)\s+.+$/gm, "");

  // Remove JSX blocks (best-effort)
  s = s.replace(/<[^>\n]+\/>/g, ""); // self-closing
  s = s.replace(/<([A-Z][A-Za-z0-9]*)[^>]*>[\s\S]*?<\/\1>/g, ""); // Components
  s = s.replace(/<([a-z][a-z0-9-]*)[^>]*>[\s\S]*?<\/\1>/g, ""); // HTML blocks

  // Remove MDX expressions { ... } (best-effort)
  s = s.replace(/\{[\s\S]*?\}/g, "");

  // Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, "\n\n");

  return s.trim();
}

// -----------------------------------------------------------------------------
// Layout metrics
// -----------------------------------------------------------------------------

type Layout = {
  marginX: number;
  marginTop: number;
  marginBottom: number;
  gutter: number;
  heading1: number;
  heading2: number;
  heading3: number;
  body: number;
  small: number;
  lineHeight: number;
  paragraphGap: number;
};

function layoutFor(format: PaperFormat, quality: Quality): Layout {
  const base =
    quality === "enterprise"
      ? {
          marginX: 62,
          marginTop: 68,
          marginBottom: 54,
          gutter: 10,
          heading1: 26,
          heading2: 18,
          heading3: 14,
          body: 11.25,
          small: 9,
          lineHeight: 1.45,
          paragraphGap: 10,
        }
      : quality === "premium"
        ? {
            marginX: 56,
            marginTop: 64,
            marginBottom: 52,
            gutter: 10,
            heading1: 24,
            heading2: 17,
            heading3: 13.5,
            body: 11,
            small: 9,
            lineHeight: 1.42,
            paragraphGap: 10,
          }
        : {
            marginX: 52,
            marginTop: 58,
            marginBottom: 48,
            gutter: 10,
            heading1: 22,
            heading2: 16,
            heading3: 13,
            body: 10.75,
            small: 8.5,
            lineHeight: 1.40,
            paragraphGap: 9,
          };

  // Slightly widen margins for A3 so it stays elegant
  if (format === "A3") return { ...base, marginX: base.marginX + 10, marginTop: base.marginTop + 10 };
  return base;
}

// -----------------------------------------------------------------------------
// Text wrapping
// -----------------------------------------------------------------------------

function wrapText(args: {
  text: string;
  font: any;
  fontSize: number;
  maxWidth: number;
}): string[] {
  const { text, font, fontSize, maxWidth } = args;
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const trial = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(trial, fontSize);
    if (width <= maxWidth) {
      line = trial;
      continue;
    }
    if (line) lines.push(line);
    line = w;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

// -----------------------------------------------------------------------------
// Markdown-ish block parsing (headings, lists, quotes, code)
// -----------------------------------------------------------------------------

type Block =
  | { kind: "h1"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "h3"; text: string }
  | { kind: "p"; text: string }
  | { kind: "li"; text: string; level: number }
  | { kind: "quote"; text: string }
  | { kind: "code"; text: string };

function parseBlocks(md: string): Block[] {
  const lines = String(md || "").split(/\r?\n/);

  const blocks: Block[] = [];
  let inCode = false;
  let codeBuf: string[] = [];
  let paraBuf: string[] = [];

  const flushPara = () => {
    const t = paraBuf.join(" ").replace(/\s+/g, " ").trim();
    if (t) blocks.push({ kind: "p", text: t });
    paraBuf = [];
  };

  const flushCode = () => {
    const t = codeBuf.join("\n").replace(/\s+$/, "");
    if (t) blocks.push({ kind: "code", text: t });
    codeBuf = [];
  };

  for (let raw of lines) {
    const line = raw ?? "";

    // fenced code
    if (/^\s*```/.test(line)) {
      if (!inCode) {
        flushPara();
        inCode = true;
      } else {
        inCode = false;
        flushCode();
      }
      continue;
    }

    if (inCode) {
      codeBuf.push(line);
      continue;
    }

    // heading
    const h1 = line.match(/^\s*#\s+(.+)\s*$/);
    const h2 = line.match(/^\s*##\s+(.+)\s*$/);
    const h3 = line.match(/^\s*###\s+(.+)\s*$/);
    if (h1) {
      flushPara();
      blocks.push({ kind: "h1", text: h1[1].trim() });
      continue;
    }
    if (h2) {
      flushPara();
      blocks.push({ kind: "h2", text: h2[1].trim() });
      continue;
    }
    if (h3) {
      flushPara();
      blocks.push({ kind: "h3", text: h3[1].trim() });
      continue;
    }

    // quote
    const q = line.match(/^\s*>\s?(.+)\s*$/);
    if (q) {
      flushPara();
      blocks.push({ kind: "quote", text: q[1].trim() });
      continue;
    }

    // list items
    const li = line.match(/^(\s*)([-*]|\d+\.)\s+(.+)\s*$/);
    if (li) {
      flushPara();
      const indent = li[1] || "";
      const level = Math.floor(indent.replace(/\t/g, "  ").length / 2);
      blocks.push({ kind: "li", text: li[3].trim(), level });
      continue;
    }

    // blank line separates paragraphs
    if (!line.trim()) {
      flushPara();
      continue;
    }

    // inline markdown cleanup (light)
    const cleaned = line
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();

    paraBuf.push(cleaned);
  }

  // final flush
  if (inCode) flushCode();
  flushPara();

  return blocks;
}

// -----------------------------------------------------------------------------
// Header / footer
// -----------------------------------------------------------------------------

function drawHeaderFooter(args: {
  page: PDFPage;
  w: number;
  h: number;
  layout: Layout;
  fonts: EmbeddedFonts;
  title: string;
  tier: string;
  quality: Quality;
  pageNum: number;
}) {
  const { page, w, h, layout, fonts, title, tier, quality, pageNum } = args;

  const topY = h - layout.marginTop + 26;
  const leftX = layout.marginX;
  const rightX = w - layout.marginX;

  // Top rule
  page.drawLine({
    start: { x: leftX, y: topY - 8 },
    end: { x: rightX, y: topY - 8 },
    thickness: 1,
    color: BRAND.colors.rule,
  });

  // Brand left
  page.drawText("ABRAHAM OF LONDON", {
    x: leftX,
    y: topY,
    size: layout.small,
    font: fonts.bodyBold,
    color: BRAND.colors.slate,
  });

  // Doc title right (trim)
  const t = String(title || "").trim();
  const maxTitleWidth = (rightX - leftX) * 0.62;
  let shown = t;
  while (shown.length > 6 && fonts.body.widthOfTextAtSize(shown, layout.small) > maxTitleWidth) {
    shown = shown.slice(0, -1);
  }
  if (shown !== t) shown = shown.replace(/\s+$/, "") + "…";

  const titleWidth = fonts.body.widthOfTextAtSize(shown, layout.small);
  page.drawText(shown, {
    x: rightX - titleWidth,
    y: topY,
    size: layout.small,
    font: fonts.body,
    color: BRAND.colors.faint,
  });

  // Footer
  const footerY = layout.marginBottom - 26;

  page.drawLine({
    start: { x: leftX, y: footerY + 10 },
    end: { x: rightX, y: footerY + 10 },
    thickness: 1,
    color: BRAND.colors.rule,
  });

  const leftFooter = `${BRAND.site} • ${tier.toUpperCase()} • ${quality.toUpperCase()}`;
  page.drawText(leftFooter, {
    x: leftX,
    y: footerY,
    size: layout.small,
    font: fonts.body,
    color: BRAND.colors.faint,
  });

  const pageLabel = String(pageNum);
  const pw = fonts.body.widthOfTextAtSize(pageLabel, layout.small);
  page.drawText(pageLabel, {
    x: rightX - pw,
    y: footerY,
    size: layout.small,
    font: fonts.body,
    color: BRAND.colors.faint,
  });
}

// -----------------------------------------------------------------------------
// Cover page (premium AoL look)
// -----------------------------------------------------------------------------

function drawCover(args: {
  pdfDoc: PDFDocument;
  format: PaperFormat;
  layout: Layout;
  fonts: EmbeddedFonts;
  meta: { title: string; subtitle?: string; description?: string; category?: string };
  tier: string;
  quality: Quality;
}) {
  const { pdfDoc, format, layout, fonts, meta, tier, quality } = args;
  const { w, h } = pageSize(format);

  const page = pdfDoc.addPage([w, h]);
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: BRAND.colors.paper });

  // Gold accent bar
  page.drawRectangle({ x: 0, y: h - 18, width: w, height: 18, color: BRAND.colors.gold });

  // Title block
  const x = layout.marginX;
  const titleY = h - layout.marginTop - 90;

  const title = String(meta.title || "Document").trim();
  const subtitle = String(meta.subtitle || "").trim();
  const desc = String(meta.description || "").trim();
  const category = String(meta.category || "").trim();

  // Category
  if (category) {
    page.drawText(category.toUpperCase(), {
      x,
      y: h - layout.marginTop - 40,
      size: layout.small,
      font: fonts.bodyBold,
      color: BRAND.colors.gold,
    });
  }

  // Title
  const titleLines = wrapText({
    text: title,
    font: fonts.headingBold,
    fontSize: layout.heading1 + 8,
    maxWidth: w - layout.marginX * 2,
  });

  let y = titleY;
  for (const line of titleLines.slice(0, 4)) {
    page.drawText(line, {
      x,
      y,
      size: layout.heading1 + 8,
      font: fonts.headingBold,
      color: BRAND.colors.charcoal,
    });
    y -= (layout.heading1 + 10) * 1.15;
  }

  // Subtitle
  if (subtitle) {
    y -= 12;
    const subLines = wrapText({
      text: subtitle,
      font: fonts.body,
      fontSize: layout.body + 1.5,
      maxWidth: w - layout.marginX * 2,
    });
    for (const line of subLines.slice(0, 3)) {
      page.drawText(line, {
        x,
        y,
        size: layout.body + 1.5,
        font: fonts.body,
        color: BRAND.colors.slate,
      });
      y -= (layout.body + 1.5) * layout.lineHeight;
    }
  }

  // Description (short)
  if (desc) {
    y -= 10;
    const dLines = wrapText({
      text: desc,
      font: fonts.body,
      fontSize: layout.body,
      maxWidth: w - layout.marginX * 2,
    });
    for (const line of dLines.slice(0, 6)) {
      page.drawText(line, {
        x,
        y,
        size: layout.body,
        font: fonts.body,
        color: BRAND.colors.faint,
      });
      y -= layout.body * layout.lineHeight;
    }
  }

  // Tier badge
  const badge = `${tier.toUpperCase()} • ${quality.toUpperCase()}`;
  const badgeSize = layout.small + 1;
  const badgeW = fonts.bodyBold.widthOfTextAtSize(badge, badgeSize) + 20;
  const badgeH = 22;

  page.drawRectangle({
    x,
    y: layout.marginBottom + 36,
    width: badgeW,
    height: badgeH,
    color: BRAND.colors.charcoal,
  });

  page.drawText(badge, {
    x: x + 10,
    y: layout.marginBottom + 42,
    size: badgeSize,
    font: fonts.bodyBold,
    color: BRAND.colors.paper,
  });

  // Footer identity
  const foot = `© ${new Date().getFullYear()} ${BRAND.author}`;
  page.drawText(foot, {
    x,
    y: layout.marginBottom,
    size: layout.small,
    font: fonts.body,
    color: BRAND.colors.faint,
  });

  return page;
}

// -----------------------------------------------------------------------------
// Watermark (for non-free tiers)
// -----------------------------------------------------------------------------

function maybeWatermark(args: {
  page: PDFPage;
  w: number;
  h: number;
  fonts: EmbeddedFonts;
  tier: string;
}) {
  const { page, w, h, fonts, tier } = args;
  if (!tier || tier === "free") return;

  const text = `ABRAHAM OF LONDON • ${tier.toUpperCase()}`;
  const size = 32;
  const tw = fonts.heading.widthOfTextAtSize(text, size);

  // Light diagonal watermark
  page.drawText(text, {
    x: (w - tw) / 2,
    y: h / 2,
    size,
    font: fonts.heading,
    color: BRAND.colors.watermark,
    rotate: { type: "degrees", angle: 25 },
    opacity: 0.25,
  });
}

// -----------------------------------------------------------------------------
// Main converter
// -----------------------------------------------------------------------------

type ConvertResult = {
  success: boolean;
  outputPublicPath?: string;
  outputAbsPath?: string;
  bytes?: number;
  error?: string;
};

type Stats = {
  processed: number;
  errors: number;
  warnings: number;
  errorMessages: string[];
  warningMessages: string[];
};

export class MdxToPdfConverter {
  private stats: Stats;

  constructor() {
    this.stats = { processed: 0, errors: 0, warnings: 0, errorMessages: [], warningMessages: [] };
  }

  getStats() {
    return this.stats;
  }

  async convertDocument(
    doc: DocumentRegistryEntry,
    tier: TierConfig,
    format: PaperFormat,
    quality: Quality,
  ): Promise<ConvertResult> {
    try {
      const absMdx = path.isAbsolute(doc.mdxPath) ? doc.mdxPath : path.join(process.cwd(), doc.mdxPath);
      const raw = fs.readFileSync(absMdx, "utf-8");

      const { data: fm, content: mdxBody } = stripFrontmatter(raw);

      const title = String(fm.title || doc.displayName || doc.pdfName || "Document").trim();
      const subtitle = String(fm.subtitle || "").trim();
      const description = String(fm.description || doc.description || "").trim();
      const category = String(fm.category || doc.category || "").trim();

      const printable = normalizeMdxToPrintable(mdxBody);
      const blocks = parseBlocks(printable);

      const outPublic = outputPublicPathForMdx({
        pdfName: doc.pdfName,
        tier: tier.slug,
        format,
        quality,
      });
      const outAbs = repoAbsFromPublic(outPublic);

      // Ensure folder exists
      fs.mkdirSync(path.dirname(outAbs), { recursive: true });

      // Build PDF
      const pdfDoc = await PDFDocument.create();
      const fonts = await embedFonts(pdfDoc);

      // PDF metadata
      pdfDoc.setTitle(title);
      pdfDoc.setAuthor(BRAND.author);
      pdfDoc.setCreator("AoL MDX-to-PDF (Branded)");
      pdfDoc.setProducer("pdf-lib");
      if (description) pdfDoc.setSubject(description);

      const lay = layoutFor(format, quality);
      const { w, h } = pageSize(format);

      // Cover
      drawCover({
        pdfDoc,
        format,
        layout: lay,
        fonts,
        meta: { title, subtitle, description, category },
        tier: tier.slug,
        quality,
      });

      // Content pages
      let pageNum = 1;
      let page = pdfDoc.addPage([w, h]);
      pageNum++;

      let cursorY = h - lay.marginTop;
      const leftX = lay.marginX;
      const rightX = w - lay.marginX;
      const contentW = rightX - leftX;

      const newPage = () => {
        // header/footer + watermark for completed page
        drawHeaderFooter({
          page,
          w,
          h,
          layout: lay,
          fonts,
          title,
          tier: tier.slug,
          quality,
          pageNum: pageNum - 1,
        });
        maybeWatermark({ page, w, h, fonts, tier: tier.slug });

        page = pdfDoc.addPage([w, h]);
        cursorY = h - lay.marginTop;
        pageNum++;
      };

      const ensureSpace = (needed: number) => {
        const bottomLimit = lay.marginBottom + 34; // footer clearance
        if (cursorY - needed < bottomLimit) newPage();
      };

      // Initial opener line
      ensureSpace(40);
      page.drawLine({
        start: { x: leftX, y: cursorY },
        end: { x: rightX, y: cursorY },
        thickness: 2,
        color: BRAND.colors.rule,
      });
      cursorY -= 18;

      for (const b of blocks) {
        if (b.kind === "h1") {
          ensureSpace(44);
          const lines = wrapText({ text: b.text, font: fonts.headingBold, fontSize: lay.heading1, maxWidth: contentW });
          for (const ln of lines) {
            page.drawText(ln, { x: leftX, y: cursorY, size: lay.heading1, font: fonts.headingBold, color: BRAND.colors.charcoal });
            cursorY -= lay.heading1 * 1.15;
          }
          cursorY -= 10;
          continue;
        }

        if (b.kind === "h2") {
          ensureSpace(36);
          const lines = wrapText({ text: b.text, font: fonts.headingBold, fontSize: lay.heading2, maxWidth: contentW });
          for (const ln of lines) {
            page.drawText(ln, { x: leftX, y: cursorY, size: lay.heading2, font: fonts.headingBold, color: BRAND.colors.charcoal });
            cursorY -= lay.heading2 * 1.20;
          }
          cursorY -= 8;
          continue;
        }

        if (b.kind === "h3") {
          ensureSpace(28);
          const lines = wrapText({ text: b.text, font: fonts.bodyBold, fontSize: lay.heading3, maxWidth: contentW });
          for (const ln of lines) {
            page.drawText(ln, { x: leftX, y: cursorY, size: lay.heading3, font: fonts.bodyBold, color: BRAND.colors.slate });
            cursorY -= lay.heading3 * 1.22;
          }
          cursorY -= 6;
          continue;
        }

        if (b.kind === "quote") {
          ensureSpace(44);
          const quoteX = leftX + 14;
          const quoteW = contentW - 14;

          // left rule
          page.drawRectangle({
            x: leftX,
            y: cursorY - 6,
            width: 3,
            height: 34,
            color: BRAND.colors.gold,
          });

          const lines = wrapText({ text: b.text, font: fonts.body, fontSize: lay.body, maxWidth: quoteW });
          for (const ln of lines) {
            ensureSpace(lay.body * lay.lineHeight + 2);
            page.drawText(ln, { x: quoteX, y: cursorY, size: lay.body, font: fonts.body, color: BRAND.colors.slate });
            cursorY -= lay.body * lay.lineHeight;
          }
          cursorY -= lay.paragraphGap;
          continue;
        }

        if (b.kind === "li") {
          const indent = Math.min(3, Math.max(0, b.level)) * 16;
          const bulletX = leftX + indent;
          const textX = bulletX + 14;
          const maxW = contentW - indent - 14;

          const lines = wrapText({ text: b.text, font: fonts.body, fontSize: lay.body, maxWidth: maxW });

          // bullet
          ensureSpace(lay.body * lay.lineHeight + 2);
          page.drawText("•", { x: bulletX, y: cursorY, size: lay.body + 2, font: fonts.bodyBold, color: BRAND.colors.gold });

          let first = true;
          for (const ln of lines) {
            ensureSpace(lay.body * lay.lineHeight + 2);
            page.drawText(ln, {
              x: first ? textX : textX,
              y: cursorY,
              size: lay.body,
              font: fonts.body,
              color: BRAND.colors.charcoal,
            });
            cursorY -= lay.body * lay.lineHeight;
            first = false;
          }
          cursorY -= 4;
          continue;
        }

        if (b.kind === "code") {
          // code block box
          const codeSize = lay.small + 0.5;
          const codeLines = String(b.text || "").split("\n").slice(0, 120); // safety cap
          const boxPad = 12;
          const lineH = codeSize * 1.35;
          const neededH = Math.min(18 + codeLines.length * lineH, 360);

          ensureSpace(neededH + 14);

          const boxTop = cursorY + 8;
          const boxH = neededH;
          const boxY = boxTop - boxH;

          page.drawRectangle({
            x: leftX,
            y: boxY,
            width: contentW,
            height: boxH,
            color: rgb(0.965, 0.965, 0.97),
            borderColor: BRAND.colors.rule,
            borderWidth: 1,
          });

          let cy = boxTop - boxPad - codeSize;
          for (const ln of codeLines) {
            if (cy < boxY + 10) break;
            page.drawText(ln, {
              x: leftX + boxPad,
              y: cy,
              size: codeSize,
              font: fonts.body,
              color: BRAND.colors.slate,
            });
            cy -= lineH;
          }

          cursorY = boxY - lay.paragraphGap;
          continue;
        }

        // paragraph
        if (b.kind === "p") {
          const lines = wrapText({ text: b.text, font: fonts.body, fontSize: lay.body, maxWidth: contentW });
          for (const ln of lines) {
            ensureSpace(lay.body * lay.lineHeight + 2);
            page.drawText(ln, { x: leftX, y: cursorY, size: lay.body, font: fonts.body, color: BRAND.colors.charcoal });
            cursorY -= lay.body * lay.lineHeight;
          }
          cursorY -= lay.paragraphGap;
          continue;
        }
      }

      // finalize last page header/footer
      drawHeaderFooter({
        page,
        w,
        h,
        layout: lay,
        fonts,
        title,
        tier: tier.slug,
        quality,
        pageNum: pageNum - 1,
      });
      maybeWatermark({ page, w, h, fonts, tier: tier.slug });

      // Also finalize cover? (optional, keep clean)
      // Save
      const bytes = await pdfDoc.save();
      fs.writeFileSync(outAbs, bytes);

      this.stats.processed++;
      return { success: true, outputPublicPath: outPublic, outputAbsPath: outAbs, bytes: bytes.length };
    } catch (e: any) {
      this.stats.errors++;
      const msg = e?.message || String(e);
      this.stats.errorMessages.push(`${doc.pdfName}: ${msg}`);
      return { success: false, error: msg };
    }
  }
}