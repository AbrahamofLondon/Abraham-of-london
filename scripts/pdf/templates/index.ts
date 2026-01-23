// scripts/pdf/templates/index.ts
// ENTERPRISE TEMPLATE LAYER (server-only, pdf-lib)
// - Pure rendering primitives + document renderers
// - NO child_process, NO dynamic require
// - Designed to be called by scripts/pdf/generate-from-registry.ts
//
// Author: Abraham of London (system layer)
// Notes:
// - pdf-lib supports AcroForm; we add fillable fields when requested.
// - This file should NEVER be imported by Next pages/components.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

export type PaperFormat = "A4" | "Letter" | "A3";
export type Quality = "premium" | "enterprise";
export type Tier = "free" | "member" | "architect" | "inner-circle";

export type DocKind =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "assessment"
  | "journal"
  | "tracker"
  | "bundle"
  | "other";

export interface RegistryLikeAsset {
  id: string;
  title: string;
  description?: string;
  excerpt?: string;
  type: DocKind;
  tier: Tier;
  category?: string;
  tags?: string[];
  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;
  version?: string;
}

export interface RenderOptions {
  format: PaperFormat;
  quality: Quality;
  tier: Tier;

  // Document metadata
  brand?: {
    author: string;
    publisher?: string;
    website?: string;
    tagline?: string;
  };

  // Layout
  margins?: { top: number; right: number; bottom: number; left: number };

  // Rendering flags
  interactive?: boolean;
  fillable?: boolean;

  // Optional: allow “forms” (AcroForm) creation even if not fillable
  enableAcroForm?: boolean;
}

export interface RenderResult {
  pdfBytes: Uint8Array;
  pageCount: number;
  warnings: string[];
}

// -----------------------------------------------------------------------------
// Brand + style tokens (PDF-safe)
// -----------------------------------------------------------------------------

const BRAND_DEFAULT = {
  author: "Abraham of London",
  publisher: "Abraham of London",
  website: "abrahamoflondon.org",
  tagline: "Strategic Editorials · Frameworks · Operating Systems",
};

const COLORS = {
  ink: rgb(0.12, 0.12, 0.12),
  inkSoft: rgb(0.28, 0.28, 0.28),
  muted: rgb(0.45, 0.45, 0.45),
  faint: rgb(0.65, 0.65, 0.65),
  border: rgb(0.86, 0.86, 0.86),
  bg: rgb(0.985, 0.985, 0.975),

  // Tier watermark tint (subtle)
  tierFree: rgb(0.85, 0.85, 0.85),
  tierMember: rgb(0.80, 0.80, 0.86),
  tierArchitect: rgb(0.86, 0.82, 0.72),
  tierInner: rgb(0.78, 0.84, 0.80),
};

const SIZES: Record<PaperFormat, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  A3: { w: 841.89, h: 1190.55 },
};

function tierLabel(tier: Tier): string {
  if (tier === "free") return "FREE";
  if (tier === "member") return "MEMBER";
  if (tier === "architect") return "ARCHITECT";
  return "INNER CIRCLE";
}

function tierColor(tier: Tier) {
  if (tier === "free") return COLORS.tierFree;
  if (tier === "member") return COLORS.tierMember;
  if (tier === "architect") return COLORS.tierArchitect;
  return COLORS.tierInner;
}

function defaultMargins(format: PaperFormat) {
  // Slightly roomier on A3
  if (format === "A3") return { top: 64, right: 64, bottom: 64, left: 64 };
  return { top: 54, right: 54, bottom: 54, left: 54 };
}

// -----------------------------------------------------------------------------
// Low-level helpers
// -----------------------------------------------------------------------------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function safeText(s?: string) {
  return String(s || "").replace(/\s+/g, " ").trim();
}

function nowISO() {
  return new Date().toISOString();
}

function bytesToKB(bytes: number) {
  return Math.round(bytes / 1024);
}

// Simple text wrapper for pdf-lib
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";

  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    const width = font.widthOfTextAtSize(test, size);
    if (width <= maxWidth) {
      line = test;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawBackground(page: PDFPage, w: number, h: number) {
  page.drawRectangle({
    x: 0,
    y: 0,
    width: w,
    height: h,
    color: COLORS.bg,
  });
}

function drawFrame(page: PDFPage, x: number, y: number, w: number, h: number) {
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    borderColor: COLORS.border,
    borderWidth: 1,
  });
}

function drawWatermark(page: PDFPage, w: number, h: number, label: string, color: any) {
  // Large, subtle diagonal watermark
  page.drawText(label, {
    x: w * 0.10,
    y: h * 0.45,
    size: clamp(Math.min(w, h) * 0.07, 36, 72),
    font: (page as any).__wmFont, // set by render pipeline
    color,
    rotate: { type: "degrees", angle: 20 },
    opacity: 0.08,
  });
}

function drawHeader(
  page: PDFPage,
  w: number,
  h: number,
  margins: { top: number; right: number; bottom: number; left: number },
  title: string,
  metaLine: string,
  fonts: { serif: PDFFont; sans: PDFFont; sansBold: PDFFont },
) {
  const x = margins.left;
  const yTop = h - margins.top;

  // Title
  page.drawText(title, {
    x,
    y: yTop - 18,
    size: 18,
    font: fonts.sansBold,
    color: COLORS.ink,
  });

  // Meta line
  page.drawText(metaLine, {
    x,
    y: yTop - 36,
    size: 9.5,
    font: fonts.sans,
    color: COLORS.muted,
  });

  // Divider
  page.drawLine({
    start: { x, y: yTop - 46 },
    end: { x: w - margins.right, y: yTop - 46 },
    thickness: 1,
    color: COLORS.border,
  });
}

function drawFooter(
  page: PDFPage,
  w: number,
  margins: { top: number; right: number; bottom: number; left: number },
  leftText: string,
  rightText: string,
  fonts: { sans: PDFFont },
) {
  const y = margins.bottom - 28;
  const xL = margins.left;
  const xR = w - margins.right;

  page.drawLine({
    start: { x: xL, y: y + 18 },
    end: { x: xR, y: y + 18 },
    thickness: 1,
    color: COLORS.border,
  });

  page.drawText(leftText, {
    x: xL,
    y,
    size: 8.5,
    font: fonts.sans,
    color: COLORS.faint,
  });

  const rtW = fonts.sans.widthOfTextAtSize(rightText, 8.5);
  page.drawText(rightText, {
    x: xR - rtW,
    y,
    size: 8.5,
    font: fonts.sans,
    color: COLORS.faint,
  });
}

// -----------------------------------------------------------------------------
// Form field primitives (AcroForm)
// -----------------------------------------------------------------------------

type FieldStyle = "text" | "multiline" | "checkbox";

export interface FieldSpec {
  id: string; // unique within doc
  label?: string;
  style: FieldStyle;
  x: number;
  y: number;
  w: number;
  h: number;

  // For text fields
  value?: string;
  placeholder?: string;
  maxLength?: number;

  // For layout
  labelSize?: number;
}

function ensureAcroForm(doc: PDFDocument) {
  // Accessing the form will create it if not present
  return doc.getForm();
}

function drawLabeledBox(
  page: PDFPage,
  label: string | undefined,
  fonts: { sans: PDFFont; sansBold: PDFFont },
  spec: FieldSpec,
) {
  const labelSize = spec.labelSize ?? 9;

  if (label) {
    page.drawText(label, {
      x: spec.x,
      y: spec.y + spec.h + 6,
      size: labelSize,
      font: fonts.sansBold,
      color: COLORS.inkSoft,
    });
  }

  page.drawRectangle({
    x: spec.x,
    y: spec.y,
    width: spec.w,
    height: spec.h,
    borderColor: COLORS.border,
    borderWidth: 1,
  });
}

function addField(doc: PDFDocument, page: PDFPage, fonts: { sans: PDFFont; sansBold: PDFFont }, spec: FieldSpec) {
  const form = ensureAcroForm(doc);

  drawLabeledBox(page, spec.label, fonts, spec);

  if (spec.style === "checkbox") {
    const cb = form.createCheckBox(spec.id);
    cb.addToPage(page, {
      x: spec.x + 6,
      y: spec.y + 6,
      width: Math.max(12, Math.min(spec.w - 12, spec.h - 12)),
      height: Math.max(12, Math.min(spec.w - 12, spec.h - 12)),
      borderColor: COLORS.border,
      borderWidth: 1,
      textColor: COLORS.ink,
    });
    return;
  }

  const tf = form.createTextField(spec.id);
  tf.setText(spec.value ?? "");
  if (spec.maxLength) tf.setMaxLength(spec.maxLength);
  tf.enableScrolling();

  if (spec.style === "multiline") tf.enableMultiline();

  tf.addToPage(page, {
    x: spec.x + 6,
    y: spec.y + 6,
    width: spec.w - 12,
    height: spec.h - 12,
    borderColor: rgb(0, 0, 0), // border already drawn; keep invisible-ish by setting 0 width below
    borderWidth: 0,
    textColor: COLORS.ink,
    font: fonts.sans,
    fontSize: 10,
  });
}

// -----------------------------------------------------------------------------
// Document renderers (type-based)
// -----------------------------------------------------------------------------

function renderEditorialBody(
  page: PDFPage,
  w: number,
  h: number,
  margins: { top: number; right: number; bottom: number; left: number },
  fonts: { serif: PDFFont; sans: PDFFont; sansBold: PDFFont },
  asset: RegistryLikeAsset,
) {
  const contentX = margins.left;
  const contentYTop = h - margins.top - 70;
  const contentW = w - margins.left - margins.right;

  const lead = safeText(asset.excerpt || asset.description || "");
  const lines = wrapText(lead, fonts.serif, 12, contentW);

  let y = contentYTop;

  page.drawText("Executive Summary", {
    x: contentX,
    y,
    size: 12,
    font: fonts.sansBold,
    color: COLORS.ink,
  });

  y -= 18;

  for (const line of lines.slice(0, 10)) {
    page.drawText(line, {
      x: contentX,
      y,
      size: 12,
      font: fonts.serif,
      color: COLORS.inkSoft,
    });
    y -= 16;
  }

  y -= 10;

  page.drawText("Notes", {
    x: contentX,
    y,
    size: 11,
    font: fonts.sansBold,
    color: COLORS.ink,
  });

  y -= 14;

  const noteText =
    "This PDF is generated from the Abraham of London registry. If you are seeing this, the pipeline is working and the output is stable. Content pages can be expanded by authoring source material and re-running generation.";
  const noteLines = wrapText(noteText, fonts.sans, 10, contentW);

  for (const line of noteLines) {
    page.drawText(line, {
      x: contentX,
      y,
      size: 10,
      font: fonts.sans,
      color: COLORS.muted,
    });
    y -= 13;
  }
}

function renderWorksheetOrAssessment(
  doc: PDFDocument,
  page: PDFPage,
  w: number,
  h: number,
  margins: { top: number; right: number; bottom: number; left: number },
  fonts: { serif: PDFFont; sans: PDFFont; sansBold: PDFFont },
  asset: RegistryLikeAsset,
  opts: RenderOptions,
  warnings: string[],
) {
  const contentX = margins.left;
  const contentW = w - margins.left - margins.right;
  const yTop = h - margins.top - 70;

  const desc = safeText(asset.excerpt || asset.description || "");
  const descLines = wrapText(desc, fonts.sans, 10.5, contentW);

  let y = yTop;

  // Intro box
  page.drawRectangle({
    x: contentX,
    y: y - 8 - (descLines.length * 13) - 14,
    width: contentW,
    height: 12 + (descLines.length * 13) + 18,
    borderColor: COLORS.border,
    borderWidth: 1,
  });

  page.drawText("Instructions", {
    x: contentX + 14,
    y: y,
    size: 11,
    font: fonts.sansBold,
    color: COLORS.ink,
  });

  y -= 16;

  for (const line of descLines.slice(0, 6)) {
    page.drawText(line, {
      x: contentX + 14,
      y,
      size: 10.5,
      font: fonts.sans,
      color: COLORS.inkSoft,
    });
    y -= 13;
  }

  // Form fields block
  y -= 22;

  const wantsFillable = Boolean(opts.fillable ?? asset.isFillable);
  const wantsInteractive = Boolean(opts.interactive ?? asset.isInteractive);

  if (!wantsFillable && !wantsInteractive) {
    warnings.push("Asset is not marked interactive/fillable; rendering static worksheet layout only.");
  }

  // A practical default set of fields (not “content”; this is infrastructure)
  // You can later extend per asset.id in generate-from-registry.ts if needed.
  const boxH = 58;
  const gap = 18;

  const fields: FieldSpec[] = [
    {
      id: `${asset.id}__name`,
      label: "Name",
      style: "text",
      x: contentX,
      y: y - boxH,
      w: contentW * 0.55,
      h: boxH,
    },
    {
      id: `${asset.id}__date`,
      label: "Date",
      style: "text",
      x: contentX + (contentW * 0.60),
      y: y - boxH,
      w: contentW * 0.40,
      h: boxH,
    },
  ];

  y -= boxH + gap;

  const bigBoxH = 120;
  fields.push({
    id: `${asset.id}__prompt_1`,
    label: "Prompt 1 — What’s the real issue?",
    style: "multiline",
    x: contentX,
    y: y - bigBoxH,
    w: contentW,
    h: bigBoxH,
  });

  y -= bigBoxH + gap;

  fields.push({
    id: `${asset.id}__prompt_2`,
    label: "Prompt 2 — What principle governs this?",
    style: "multiline",
    x: contentX,
    y: y - bigBoxH,
    w: contentW,
    h: bigBoxH,
  });

  y -= bigBoxH + gap;

  const smallBoxH = 80;
  fields.push({
    id: `${asset.id}__action`,
    label: "Action — What will you do next?",
    style: "multiline",
    x: contentX,
    y: y - smallBoxH,
    w: contentW,
    h: smallBoxH,
  });

  // Render as fillable if allowed; otherwise draw static boxes
  if (wantsFillable || wantsInteractive || opts.enableAcroForm) {
    for (const f of fields) addField(doc, page, { sans: fonts.sans, sansBold: fonts.sansBold }, f);
  } else {
    for (const f of fields) drawLabeledBox(page, f.label, { sans: fonts.sans, sansBold: fonts.sansBold }, f);
  }
}

function renderCanvas(
  doc: PDFDocument,
  page: PDFPage,
  w: number,
  h: number,
  margins: { top: number; right: number; bottom: number; left: number },
  fonts: { serif: PDFFont; sans: PDFFont; sansBold: PDFFont },
  asset: RegistryLikeAsset,
  opts: RenderOptions,
  warnings: string[],
) {
  const contentX = margins.left;
  const contentW = w - margins.left - margins.right;
  const yTop = h - margins.top - 70;

  const wantsFillable = Boolean(opts.fillable ?? asset.isFillable);
  const wantsInteractive = Boolean(opts.interactive ?? asset.isInteractive);

  // Grid canvas: 2 columns x 3 rows
  const cols = 2;
  const rows = 3;
  const gap = 16;

  const cellW = (contentW - gap) / cols;
  const availableH = (yTop - margins.bottom - 50);
  const cellH = (availableH - (gap * (rows - 1))) / rows;

  const sections = [
    "Purpose & Outcome",
    "Principles & Constraints",
    "Resources & Assets",
    "Risks & Failure Modes",
    "Operating Rhythm",
    "Commitment & Next Steps",
  ];

  const fields: FieldSpec[] = [];

  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = contentX + c * (cellW + gap);
      const y = yTop - ((r + 1) * cellH) - (r * gap);

      const label = sections[idx] || `Section ${idx + 1}`;
      fields.push({
        id: `${asset.id}__canvas_${idx + 1}`,
        label,
        style: "multiline",
        x,
        y,
        w: cellW,
        h: cellH,
        labelSize: 9,
      });
      idx++;
    }
  }

  // Render
  if (wantsFillable || wantsInteractive || opts.enableAcroForm) {
    for (const f of fields) addField(doc, page, { sans: fonts.sans, sansBold: fonts.sansBold }, f);
  } else {
    warnings.push("Canvas rendered as static because asset is not marked fillable/interactive.");
    for (const f of fields) drawLabeledBox(page, f.label, { sans: fonts.sans, sansBold: fonts.sansBold }, f);
  }
}

// -----------------------------------------------------------------------------
// Main entry: render any asset into a single PDF (1-page “foundation” document)
// -----------------------------------------------------------------------------

export async function renderAssetPDF(
  asset: RegistryLikeAsset,
  opts: RenderOptions,
): Promise<RenderResult> {
  const warnings: string[] = [];

  const format = opts.format;
  const size = SIZES[format];
  if (!size) throw new Error(`Unsupported paper format: ${format}`);

  const margins = opts.margins ?? defaultMargins(format);
  const brand = { ...BRAND_DEFAULT, ...(opts.brand || {}) };

  const doc = await PDFDocument.create();

  // Fonts
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const sans = await doc.embedFont(StandardFonts.Helvetica);
  const sansBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const wmFont = await doc.embedFont(StandardFonts.HelveticaBold);

  // pdf-lib “page” object is not typed for custom props; safe internal use
  const page = doc.addPage([size.w, size.h]);
  (page as any).__wmFont = wmFont;

  // Metadata
  doc.setTitle(asset.title);
  doc.setAuthor(brand.author);
  doc.setSubject(asset.type);
  doc.setKeywords([asset.id, asset.type, asset.tier, ...(asset.tags || [])]);
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  // Background + frame
  drawBackground(page, size.w, size.h);

  // Outer frame within margins
  drawFrame(
    page,
    margins.left - 14,
    margins.bottom - 14,
    (size.w - margins.left - margins.right) + 28,
    (size.h - margins.top - margins.bottom) + 28,
  );

  // Watermark
  drawWatermark(page, size.w, size.h, tierLabel(opts.tier), tierColor(opts.tier));

  // Header/footer
  const metaLine =
    `ID: ${asset.id} · TYPE: ${asset.type.toUpperCase()} · TIER: ${tierLabel(opts.tier)} · VERSION: ${asset.version || "1.0.0"}`;

  drawHeader(page, size.w, size.h, margins, asset.title, metaLine, { serif, sans, sansBold });

  const footerLeft = `${brand.author} · ${brand.tagline}`;
  const footerRight = `${brand.website} · ${nowISO().slice(0, 10)}`;
  drawFooter(page, size.w, margins, footerLeft, footerRight, { sans });

  // Body (type based)
  const kind = asset.type;

  if (kind === "editorial" || kind === "academic" || kind === "strategic") {
    renderEditorialBody(page, size.w, size.h, margins, { serif, sans, sansBold }, asset);
  } else if (kind === "canvas") {
    renderCanvas(doc, page, size.w, size.h, margins, { serif, sans, sansBold }, asset, opts, warnings);
  } else if (kind === "worksheet" || kind === "assessment" || kind === "tool" || kind === "tracker" || kind === "journal") {
    renderWorksheetOrAssessment(doc, page, size.w, size.h, margins, { serif, sans, sansBold }, asset, opts, warnings);
  } else {
    // Default: clean “foundation” layout with a simple notes section
    renderEditorialBody(page, size.w, size.h, margins, { serif, sans, sansBold }, asset);
    warnings.push(`No specialized renderer for type "${kind}". Used default foundation layout.`);
  }

  // If fillable requested, ensure form exists + set default appearance
  if (opts.fillable || opts.interactive || opts.enableAcroForm) {
    const form = doc.getForm();
    // Make sure it has a default appearance so some viewers render text consistently
    try {
      form.updateFieldAppearances(sans);
    } catch {
      // harmless
    }
  }

  const pdfBytes = await doc.save();

  return { pdfBytes, pageCount: 1, warnings };
}

// Convenience: recommended default options builder
export function buildDefaultRenderOptions(input: Partial<RenderOptions> & { format: PaperFormat; tier: Tier; quality: Quality }): RenderOptions {
  return {
    format: input.format,
    tier: input.tier,
    quality: input.quality,
    margins: input.margins ?? defaultMargins(input.format),
    interactive: input.interactive,
    fillable: input.fillable,
    enableAcroForm: input.enableAcroForm ?? false,
    brand: input.brand ?? BRAND_DEFAULT,
  };
}