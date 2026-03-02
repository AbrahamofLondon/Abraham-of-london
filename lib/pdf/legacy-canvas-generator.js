/* eslint-disable no-console */
/**
 * LegacyCanvasPDFGenerator — Production Grade (pdf-lib)
 * - Proper text centering (measured)
 * - Fillable fields preserved (NO flatten)
 * - A3/A4/Letter supported
 * - No `any` hazards
 */

import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";

export type PageFormat = "A4" | "A3" | "Letter";

type RGB = ReturnType<typeof rgb>;

type FontKey = "regular" | "bold" | "italic" | "boldItalic";

type TextAlign = "left" | "center" | "right";

type TextStyle = {
  size?: number;
  font?: FontKey;
  color?: RGB;
  maxWidth?: number;
  lineHeight?: number; // multiplier
  align?: TextAlign;
  letterSpacing?: number; // pt
};

type RectStyle = {
  fill?: boolean;
  fillColor?: RGB;
  borderColor?: RGB;
  borderWidth?: number;
};

type LineStyle = {
  color?: RGB;
  width?: number;
};

type TextFieldOptions = {
  defaultValue?: string;
  fontSize?: number;
  multiline?: boolean;
  required?: boolean;
};

type CheckboxOptions = {
  defaultValue?: boolean;
};

type DropdownOptions = {
  choices: string[];
  defaultValue?: string;
};

type Dimensions = { width: number; height: number };

const DIMENSIONS: Record<PageFormat, Dimensions> = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  Letter: { width: 612, height: 792 },
};

const COLORS = {
  ink: rgb(17 / 255, 24 / 255, 39 / 255),
  muted: rgb(107 / 255, 114 / 255, 128 / 255),
  border: rgb(229 / 255, 231 / 255, 235 / 255),

  gold: rgb(212 / 255, 175 / 255, 55 / 255),
  violet: rgb(124 / 255, 58 / 255, 237 / 255),
  emerald: rgb(16 / 255, 185 / 255, 129 / 255),
  sky: rgb(59 / 255, 130 / 255, 246 / 255),
  rose: rgb(239 / 255, 68 / 255, 68 / 255),

  paper: rgb(253 / 255, 250 / 255, 243 / 255),
  panel: rgb(245 / 255, 243 / 255, 255 / 255),
  panelGreen: rgb(240 / 255, 253 / 255, 244 / 255),
} as const;

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Wrap text into lines based on maxWidth.
 */
function wrapText(params: {
  text: string;
  font: PDFFont;
  size: number;
  maxWidth: number;
}): string[] {
  const { text, font, size, maxWidth } = params;
  const words = String(text ?? "").replace(/\s+/g, " ").trim().split(" ");
  if (!words.length) return [""];

  const lines: string[] = [];
  let current = "";

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    const width = font.widthOfTextAtSize(test, size);

    if (width <= maxWidth) {
      current = test;
      continue;
    }

    if (current) lines.push(current);
    current = w;
  }

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

/**
 * Compute x position based on alignment using measured width.
 */
function alignedX(params: {
  x: number;
  text: string;
  font: PDFFont;
  size: number;
  maxWidth?: number;
  align: TextAlign;
}): number {
  const { x, text, font, size, maxWidth, align } = params;
  if (align === "left") return x;

  const textWidth = font.widthOfTextAtSize(text, size);
  const boxWidth = typeof maxWidth === "number" ? maxWidth : textWidth;

  if (align === "center") return x + (boxWidth - textWidth) / 2;
  return x + (boxWidth - textWidth); // right
}

export class LegacyCanvasPDFGenerator {
  private doc!: PDFDocument;
  private pageIndex = 0;

  private fonts!: Record<FontKey, PDFFont>;
  private format: PageFormat = "A4";
  private dims!: Dimensions;

  // Layout constants (print-safe)
  private marginX = 50;
  private marginTop = 50;
  private marginBottom = 55;

  async init(format: PageFormat = "A4"): Promise<this> {
    this.format = format;
    this.dims = DIMENSIONS[format] ?? DIMENSIONS.A4;

    this.doc = await PDFDocument.create();
    this.doc.registerFontkit(fontkit);

    this.fonts = {
      regular: await this.doc.embedFont(StandardFonts.Helvetica),
      bold: await this.doc.embedFont(StandardFonts.HelveticaBold),
      italic: await this.doc.embedFont(StandardFonts.HelveticaOblique),
      boldItalic: await this.doc.embedFont(StandardFonts.HelveticaBoldOblique),
    };

    this.addPage();
    this.paintBackground();

    return this;
  }

  private addPage() {
    this.doc.addPage([this.dims.width, this.dims.height]);
    this.pageIndex = this.doc.getPageCount() - 1;
  }

  private get page() {
    return this.doc.getPage(this.pageIndex);
  }

  private pageHeight() {
    return this.page.getHeight();
  }

  private yFromTop(y: number) {
    // pdf-lib uses bottom-left origin; our API uses top-left
    return this.pageHeight() - y;
  }

  private paintBackground() {
    // Full-bleed “paper”
    this.page.drawRectangle({
      x: 0,
      y: 0,
      width: this.dims.width,
      height: this.dims.height,
      color: COLORS.paper,
    });
  }

  drawText(text: string, x: number, y: number, style: TextStyle = {}) {
    const size = style.size ?? 11;
    const font = this.fonts[style.font ?? "regular"];
    const color = style.color ?? COLORS.ink;
    const lineHeight = style.lineHeight ?? 1.25;
    const align = style.align ?? "left";
    const maxWidth = style.maxWidth;

    const clean = String(text ?? "");
    const lines =
      typeof maxWidth === "number"
        ? wrapText({ text: clean, font, size, maxWidth })
        : [clean];

    let cursorY = y;
    for (const line of lines) {
      const drawX = alignedX({
        x,
        text: line,
        font,
        size,
        maxWidth,
        align,
      });

      this.page.drawText(line, {
        x: drawX,
        y: this.yFromTop(cursorY),
        size,
        font,
        color,
      });

      cursorY += size * lineHeight;
    }
  }

  drawRect(x: number, y: number, w: number, h: number, style: RectStyle = {}) {
    const fill = style.fill ?? true;
    const fillColor = style.fillColor ?? COLORS.panel;
    const borderColor = style.borderColor ?? COLORS.border;
    const borderWidth = style.borderWidth ?? 1;

    if (fill) {
      this.page.drawRectangle({
        x,
        y: this.yFromTop(y) - h,
        width: w,
        height: h,
        color: fillColor,
      });
    }

    if (borderWidth > 0) {
      this.page.drawRectangle({
        x,
        y: this.yFromTop(y) - h,
        width: w,
        height: h,
        borderColor,
        borderWidth,
      });
    }
  }

  drawLine(x1: number, y1: number, x2: number, y2: number, style: LineStyle = {}) {
    const color = style.color ?? COLORS.border;
    const width = style.width ?? 1;

    this.page.drawLine({
      start: { x: x1, y: this.yFromTop(y1) },
      end: { x: x2, y: this.yFromTop(y2) },
      thickness: width,
      color,
    });
  }

  private form() {
    return this.doc.getForm();
  }

  createTextField(x: number, y: number, w: number, h: number, name: string, opts: TextFieldOptions = {}) {
    const form = this.form();
    const field = form.createTextField(name);

    field.addToPage(this.page, {
      x,
      y: this.yFromTop(y) - h,
      width: w,
      height: h,
    });

    if (typeof opts.defaultValue === "string") field.setText(opts.defaultValue);
    field.setFontSize(clamp(opts.fontSize ?? 10, 7, 14));

    if (opts.multiline) field.enableMultiline();
    field.enableScrolling();

    if (opts.required) field.markAsRequired();

    return field;
  }

  createCheckbox(x: number, y: number, size: number, name: string, opts: CheckboxOptions = {}) {
    const form = this.form();
    const field = form.createCheckBox(name);

    field.addToPage(this.page, {
      x,
      y: this.yFromTop(y) - size,
      width: size,
      height: size,
    });

    if (opts.defaultValue) field.check();
    return field;
  }

  createDropdown(x: number, y: number, w: number, h: number, name: string, opts: DropdownOptions) {
    const form = this.form();
    const field = form.createDropdown(name);

    field.addToPage(this.page, {
      x,
      y: this.yFromTop(y) - h,
      width: w,
      height: h,
    });

    for (const c of opts.choices) field.addOption(String(c));

    if (opts.defaultValue && opts.choices.includes(opts.defaultValue)) {
      field.select(opts.defaultValue);
    }

    return field;
  }

  /* ---------------------------------------------------------------------- */
  /* Sections                                                                */
  /* ---------------------------------------------------------------------- */

  private headerBlock(): number {
    const { width } = this.dims;
    const title = "THE LEGACY ARCHITECTURE CANVAS";
    const subtitle = "Beyond Bequest. The Framework for Intentional Endurance.";

    // Brand bar
    this.drawText("ABRAHAM OF LONDON", this.marginX, this.marginTop, {
      font: "bold",
      size: 10,
      color: COLORS.muted,
    });

    // Title centered (measured)
    this.drawText(title, this.marginX, 62, {
      font: "bold",
      size: 24,
      color: COLORS.violet,
      maxWidth: width - this.marginX * 2,
      align: "center",
      lineHeight: 1.05,
    });

    this.drawText(subtitle, this.marginX, 94, {
      font: "italic",
      size: 12.5,
      color: COLORS.muted,
      maxWidth: width - this.marginX * 2,
      align: "center",
    });

    // Divider
    this.drawLine(this.marginX, 116, width - this.marginX, 116, {
      color: COLORS.violet,
      width: 2,
    });

    // Insight panel
    const panelY = 132;
    const panelH = 66;
    const panelW = width - this.marginX * 2;

    this.drawRect(this.marginX, panelY, panelW, panelH, {
      fill: true,
      fillColor: COLORS.panel,
      borderColor: COLORS.violet,
      borderWidth: 1,
    });

    this.drawText("⚡ PREMIUM INSIGHT", this.marginX + 14, panelY + 18, {
      font: "bold",
      size: 9,
      color: COLORS.violet,
    });

    this.drawText(
      "This is not a document about death. It is the operating system for a living legacy.",
      this.marginX + 14,
      panelY + 36,
      {
        font: "regular",
        size: 9.5,
        color: COLORS.ink,
        maxWidth: panelW - 28,
        lineHeight: 1.35,
      }
    );

    return panelY + panelH + 26; // next Y
  }

  private architectureProcess(yStart: number): number {
    const { width } = this.dims;

    this.drawText("THE ARCHITECTURE PROCESS", this.marginX, yStart, {
      font: "bold",
      size: 15.5,
      color: COLORS.ink,
      maxWidth: width - this.marginX * 2,
      align: "center",
    });

    this.drawText(
      "This framework transforms abstract values into executable design.",
      this.marginX,
      yStart + 22,
      { font: "regular", size: 10.5, color: COLORS.muted, maxWidth: width - this.marginX * 2, align: "center" }
    );

    const boxGap = 18;
    const boxW = (width - this.marginX * 2 - boxGap) / 2;
    const boxH = 128;

    const blocks = [
      { title: "1. THE SOVEREIGN THESIS", desc: "Define the non-negotiable principle of your legacy.", stroke: COLORS.violet },
      { title: "2. THE CAPITAL MATRIX", desc: "Map human, intellectual, social & financial capitals.", stroke: COLORS.emerald },
      { title: "3. INSTITUTIONS & STEWARDSHIP", desc: "Design the institutions that steward each capital.", stroke: COLORS.sky },
      { title: "4. RISK ARCHITECTURE", desc: "Identify failure modes and engineer governance guardrails.", stroke: COLORS.rose },
    ] as const;

    const topY = yStart + 54;

    blocks.forEach((b, idx) => {
      const row = Math.floor(idx / 2);
      const col = idx % 2;

      const x = this.marginX + col * (boxW + boxGap);
      const y = topY + row * (boxH + boxGap);

      this.drawRect(x, y, boxW, boxH, {
        fill: true,
        fillColor: rgb(1, 1, 1), // white base will be replaced by paper background; keep subtle border
        borderColor: b.stroke,
        borderWidth: 2,
      });

      // inner panel to keep it clean on print
      this.drawRect(x, y, boxW, boxH, {
        fill: true,
        fillColor: rgb(1, 1, 1),
        borderColor: COLORS.border,
        borderWidth: 0,
      });

      // Title
      this.drawText(b.title, x + 14, y + 22, {
        font: "bold",
        size: 11,
        color: b.stroke,
        maxWidth: boxW - 28,
      });

      this.drawText(b.desc, x + 14, y + 42, {
        font: "regular",
        size: 9.5,
        color: COLORS.ink,
        maxWidth: boxW - 28,
        lineHeight: 1.35,
      });

      // Field
      this.createTextField(x + 14, y + 72, boxW - 28, 44, `legacy.process.${idx + 1}`, {
        multiline: true,
        fontSize: 9,
      });

      // Field guide line
      this.drawLine(x + 14, y + 72, x + boxW - 14, y + 72, { color: COLORS.border, width: 1 });
    });

    return topY + 2 * boxH + boxGap + 28;
  }

  private outcomes(yStart: number): number {
    const { width } = this.dims;
    const maxW = width - this.marginX * 2;

    this.drawText("WHAT THIS PRODUCES", this.marginX, yStart, {
      font: "bold",
      size: 13.5,
      color: COLORS.ink,
      maxWidth: maxW,
      align: "center",
    });

    const items = [
      "A living legacy constitution — a dynamic operating system for your values.",
      "Intergenerational governance blueprint — clear roles, decision rights, accountability.",
      "Risk mitigation architecture — proactive design against classic failure modes.",
      "Stewardship rituals — quarterly and annual cadences that institutionalise reflection.",
    ];

    let y = yStart + 28;
    for (let i = 0; i < items.length; i++) {
      // bullet
      this.page.drawCircle({
        x: this.marginX + 8,
        y: this.yFromTop(y + 6),
        size: 2.5,
        color: COLORS.violet,
      });

      this.drawText(items[i] ?? "", this.marginX + 18, y, {
        font: "regular",
        size: 10,
        color: COLORS.ink,
        maxWidth: maxW - 18,
        lineHeight: 1.35,
      });

      y += 30;
    }

    return y + 10;
  }

  private implementationPanel(yStart: number): number {
    const { width } = this.dims;
    const w = width - this.marginX * 2;

    this.drawRect(this.marginX, yStart, w, 96, {
      fill: true,
      fillColor: COLORS.panelGreen,
      borderColor: COLORS.emerald,
      borderWidth: 1,
    });

    this.drawText("🛠️", this.marginX + 14, yStart + 22, {
      font: "regular",
      size: 16,
      color: COLORS.emerald,
    });

    this.drawText("IMPLEMENTATION GUIDANCE", this.marginX + 40, yStart + 22, {
      font: "bold",
      size: 10,
      color: COLORS.emerald,
    });

    this.drawText(
      "Begin with the Sovereign Thesis alone. Sit with it for one week. The clarity — or friction — it generates will illuminate every subsequent component.",
      this.marginX + 40,
      yStart + 42,
      {
        font: "regular",
        size: 9.5,
        color: COLORS.ink,
        maxWidth: w - 52,
        lineHeight: 1.4,
      }
    );

    return yStart + 96 + 18;
  }

  private signature(yStart: number): number {
    const { width, height } = this.dims;

    // Keep signature above bottom margin
    const minFooterY = height - this.marginBottom - 44;
    const y = Math.min(yStart, minFooterY);

    this.drawLine(this.marginX, y, width - this.marginX, y, { color: COLORS.border, width: 1 });

    this.drawText("STEWARD’S COMMITMENT", this.marginX, y + 20, {
      font: "bold",
      size: 10,
      color: COLORS.violet,
    });

    // Signature fields
    this.createTextField(this.marginX, y + 40, 240, 26, "legacy.signature.name", {
      defaultValue: "",
      fontSize: 11,
    });

    this.createTextField(this.marginX + 260, y + 40, 180, 26, "legacy.signature.date", {
      defaultValue: new Date().toLocaleDateString("en-GB"),
      fontSize: 11,
    });

    // Footer
    this.drawText("© Abraham of London • Legacy Architecture Suite • v1.0", this.marginX, y + 78, {
      font: "regular",
      size: 8,
      color: COLORS.muted,
      maxWidth: width - this.marginX * 2,
      align: "center",
    });

    this.drawText("Interactive — do not flatten fields.", this.marginX, y + 92, {
      font: "italic",
      size: 7.5,
      color: COLORS.muted,
      maxWidth: width - this.marginX * 2,
      align: "center",
    });

    return y + 112;
  }

  /* ---------------------------------------------------------------------- */
  /* Public generation                                                       */
  /* ---------------------------------------------------------------------- */

  async generate(format: PageFormat = "A4"): Promise<PDFDocument> {
    await this.init(format);

    let y = this.headerBlock();
    y = this.architectureProcess(y);
    y = this.outcomes(y);
    y = this.implementationPanel(y);
    this.signature(y);

    // NOTE: DO NOT flatten — keeps interactive fields fillable
    // const form = this.doc.getForm();
    // form.flatten();  // ❌ would destroy interactivity

    return this.doc;
  }

  async saveToFile(absPath: string): Promise<string> {
    const bytes = await this.doc.save({
      useObjectStreams: false, // better compatibility for some PDF viewers
      addDefaultPage: false,
    });
    fs.mkdirSync(path.dirname(absPath), { recursive: true });
    fs.writeFileSync(absPath, bytes);
    return absPath;
  }
}

/* -------------------------------------------------------------------------- */
/* CLI helper (optional)                                                      */
/* -------------------------------------------------------------------------- */

if (require.main === module) {
  (async () => {
    const fmt = (process.argv[2] as PageFormat) || "A4";
    const outDir = path.join(process.cwd(), "public", "assets", "downloads");
    const out = path.join(outDir, `legacy-architecture-canvas-${fmt.toLowerCase()}.pdf`);

    const gen = new LegacyCanvasPDFGenerator();
    await gen.generate(fmt);
    await gen.saveToFile(out);

    console.log(`✅ Generated: ${out}`);
  })().catch((e) => {
    console.error("❌ Generation failed:", e);
    process.exitCode = 1;
  });
}