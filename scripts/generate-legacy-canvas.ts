/* scripts/generate-legacy-canvas.ts
   Abraham of London — Legacy Architecture Canvas
   Print-grade aesthetic (quiet luxury)
   - Fillable form fields (pdf-lib AcroForm)
   - Clean console output (no hype language)
   - Tier-aware watermark/signature (discreet)
*/

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Format = "A4" | "Letter" | "A3";
type Quality = "premium" | "enterprise";
type Tier = "public" | "basic" | "premium" | "enterprise" | "restricted";

const DIM: Record<Format, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  A3: { w: 841.89, h: 1190.55 },
};

// Display + filename mapping (stable, quiet)
const TIER_MAP: Record<Tier, { display: string; filename: string; level: number }> = {
  public: { display: "Public", filename: "free", level: 1 },
  basic: { display: "Inner Circle", filename: "member", level: 2 },
  premium: { display: "Inner Circle Plus", filename: "architect", level: 3 },
  enterprise: { display: "Inner Circle Elite", filename: "enterprise", level: 4 },
  restricted: { display: "Private", filename: "restricted", level: 5 },
};

// Quiet luxury palette: warm ink + paper + restrained accents
const PALETTE = {
  paper: rgb(0.996, 0.995, 0.992),
  ink: rgb(0.08, 0.08, 0.10),
  muted: rgb(0.40, 0.40, 0.44),
  faint: rgb(0.78, 0.78, 0.80),
  hairline: rgb(0.86, 0.86, 0.88),

  // “Foil-like” accents (simulated)
  gold: rgb(0.74, 0.63, 0.38),
  slate: rgb(0.18, 0.20, 0.24),

  // Section accents (kept tasteful)
  sectionA: rgb(0.20, 0.22, 0.28),
  sectionB: rgb(0.12, 0.33, 0.30),
  sectionC: rgb(0.14, 0.26, 0.45),
  sectionD: rgb(0.40, 0.14, 0.16),
};

function safeFormat(x: string): Format {
  const v = (x || "").toLowerCase();
  if (v === "a4") return "A4";
  if (v === "letter") return "Letter";
  if (v === "a3") return "A3";
  return "A4";
}

function safeQuality(x: string): Quality {
  const v = (x || "").toLowerCase();
  return v === "enterprise" ? "enterprise" : "premium";
}

function safeTier(x: string): Tier {
  const v = (x || "").toLowerCase();
  if (v === "public") return "public";
  if (v === "basic") return "basic";
  if (v === "premium") return "premium";
  if (v === "enterprise") return "enterprise";
  if (v === "restricted") return "restricted";
  return "premium";
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function docId(format: Format, quality: Quality, tier: Tier) {
  const ts = Date.now().toString(36);
  const hash = crypto
    .createHash("sha256")
    .update(`${format}-${quality}-${tier}-${ts}`)
    .digest("hex")
    .slice(0, 8)
    .toUpperCase();
  return `LAC-${format}-${hash}`;
}

// -----------------------------------------------------------------------------
// PRINT-GRADE VISUAL SYSTEM (within pdf-lib constraints)
// -----------------------------------------------------------------------------

function drawPaper(page: any, w: number, h: number, quality: Quality) {
  // Base “paper”
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: PALETTE.paper });

  // Subtle tone steps (simulate depth)
  const steps = quality === "enterprise" ? 14 : 12;
  const stepH = h / steps;

  for (let i = 0; i < steps; i++) {
    const y = i * stepH;
    const t = i / (steps - 1);
    const intensity = clamp01(0.997 - t * 0.018);
    page.drawRectangle({
      x: 0,
      y,
      width: w,
      height: stepH,
      color: rgb(intensity, intensity, intensity - 0.001),
    });
  }

  // Micro texture: tiny points (monotone, very light)
  for (let x = 26; x < w; x += 120) {
    for (let y = 26; y < h; y += 120) {
      page.drawText("·", { x, y, size: 7, color: rgb(0.93, 0.93, 0.928) });
    }
  }
}

function drawBorderSystem(page: any, w: number, h: number) {
  const m = 36;

  // Outer border
  page.drawRectangle({
    x: m,
    y: m,
    width: w - m * 2,
    height: h - m * 2,
    borderColor: PALETTE.hairline,
    borderWidth: 1,
    color: rgb(0, 0, 0), // ignored because border-only rectangle requires color; keep transparent-like
    opacity: 0, // pdf-lib ignores opacity on rectangle fill in some viewers; harmless
  });

  // Inner keyline
  page.drawRectangle({
    x: m + 10,
    y: m + 10,
    width: w - (m + 10) * 2,
    height: h - (m + 10) * 2,
    borderColor: rgb(0.90, 0.90, 0.902),
    borderWidth: 1,
    color: rgb(0, 0, 0),
    opacity: 0,
  });
}

function drawHeader(
  page: any,
  w: number,
  h: number,
  font: PDFFont,
  fontBold: PDFFont,
  format: Format
) {
  const left = 52;
  const top = h - 78;

  // Small-cap style by letter spacing simulation (manual)
  page.drawText("LEGACY ARCHITECTURE CANVAS", {
    x: left,
    y: top,
    size: 22,
    font: fontBold,
    color: PALETTE.ink,
  });

  page.drawText("Sovereign design framework", {
    x: left,
    y: top - 22,
    size: 10,
    font,
    color: PALETTE.muted,
  });

  // Hairline rule
  page.drawLine({
    start: { x: left, y: top - 34 },
    end: { x: w - left, y: top - 34 },
    thickness: 1,
    color: PALETTE.hairline,
  });

  // Format marker (quiet, top-right)
  page.drawText(format, {
    x: w - left - 30,
    y: top + 2,
    size: 9,
    font: font,
    color: PALETTE.muted,
  });
}

function drawDiscreetMark(page: any, w: number, h: number, font: PDFFont, tier: Tier) {
  // No loud badges. Just a small mark, and only for higher tiers.
  if (!(tier === "premium" || tier === "enterprise" || tier === "restricted")) return;

  const txt = tier === "restricted" ? "Private" : "Signed";
  page.drawText(txt, {
    x: w - 52 - 46,
    y: h - 120,
    size: 9,
    font,
    color: rgb(0.55, 0.55, 0.56),
  });

  // Tiny “foil” line
  page.drawLine({
    start: { x: w - 52 - 60, y: h - 128 },
    end: { x: w - 52, y: h - 128 },
    thickness: 2,
    color: PALETTE.gold,
  });
}

function drawWatermark(page: any, w: number, h: number, tier: Tier) {
  // Only watermark for public/basic; higher tiers keep it cleaner
  if (tier === "premium" || tier === "enterprise" || tier === "restricted") return;

  page.drawText("ABRAHAM OF LONDON", {
    x: w * 0.17,
    y: h * 0.48,
    size: Math.max(46, Math.min(72, w / 8.5)),
    color: rgb(0.94, 0.94, 0.938),
    rotate: { type: "degrees", angle: -22 },
  });
}

// -----------------------------------------------------------------------------
// CONTENT / SECTIONS
// -----------------------------------------------------------------------------

interface SectionField {
  key: string;
  label: string;
  multiline: boolean;
  placeholder?: string;
}

interface Section {
  title: string;
  description: string;
  color: ReturnType<typeof rgb>;
  fields: SectionField[];
}

function getSections(): Section[] {
  return [
    {
      title: "SOVEREIGN THESIS",
      description: "Foundation, purpose, direction",
      color: PALETTE.sectionA,
      fields: [
        { key: "purpose", label: "Core purpose", multiline: true, placeholder: "" },
        { key: "values", label: "Guiding values", multiline: true, placeholder: "" },
        { key: "vision", label: "Long-term vision", multiline: true, placeholder: "" },
      ],
    },
    {
      title: "CAPITAL MATRIX",
      description: "Resources, leverage, stewardship",
      color: PALETTE.sectionB,
      fields: [
        { key: "financial", label: "Financial", multiline: true, placeholder: "" },
        { key: "social", label: "Social", multiline: true, placeholder: "" },
        { key: "cultural", label: "Cultural", multiline: true, placeholder: "" },
        { key: "spiritual", label: "Spiritual", multiline: true, placeholder: "" },
      ],
    },
    {
      title: "INSTITUTIONS",
      description: "Structures that carry legacy",
      color: PALETTE.sectionC,
      fields: [
        { key: "family", label: "Family", multiline: true, placeholder: "" },
        { key: "business", label: "Business", multiline: true, placeholder: "" },
        { key: "philanthropy", label: "Philanthropy", multiline: true, placeholder: "" },
        { key: "intellectual", label: "Intellectual property", multiline: true, placeholder: "" },
      ],
    },
    {
      title: "GUARDRAILS",
      description: "Boundaries, accountability, risk",
      color: PALETTE.sectionD,
      fields: [
        { key: "ethical", label: "Ethical boundaries", multiline: true, placeholder: "" },
        { key: "risk", label: "Risk management", multiline: true, placeholder: "" },
        { key: "succession", label: "Succession planning", multiline: true, placeholder: "" },
        { key: "accountability", label: "Accountability systems", multiline: true, placeholder: "" },
      ],
    },
  ];
}

function layout(format: Format): { cols: number; marginX: number; gapX: number; gapY: number; topY: number; blockH: number } {
  const { h } = DIM[format];
  if (format === "A3") {
    return { cols: 2, marginX: 58, gapX: 22, gapY: 22, topY: h - 160, blockH: 270 };
  }
  if (format === "Letter") {
    return { cols: 2, marginX: 52, gapX: 18, gapY: 18, topY: h - 150, blockH: 220 };
  }
  return { cols: 2, marginX: 52, gapX: 16, gapY: 18, topY: h - 150, blockH: 218 };
}

function drawSectionCard(
  page: any,
  x: number,
  y: number,
  w: number,
  h: number,
  section: Section,
  font: PDFFont,
  fontBold: PDFFont
) {
  // “Card” shadow (fake emboss)
  page.drawRectangle({
    x: x + 1.5,
    y: y - 1.5,
    width: w,
    height: h,
    color: rgb(0.965, 0.965, 0.966),
    borderWidth: 0,
  });

  // Card body
  page.drawRectangle({
    x,
    y,
    width: w,
    height: h,
    color: rgb(0.992, 0.992, 0.990),
    borderColor: PALETTE.hairline,
    borderWidth: 1,
  });

  // Accent keyline
  page.drawLine({
    start: { x, y: y + h - 36 },
    end: { x: x + w, y: y + h - 36 },
    thickness: 2,
    color: section.color,
  });

  // Title
  page.drawText(section.title, {
    x: x + 12,
    y: y + h - 26,
    size: 11.5,
    font: fontBold,
    color: PALETTE.ink,
  });

  // Description (quiet)
  page.drawText(section.description, {
    x: x + 12,
    y: y + h - 42,
    size: 8.5,
    font,
    color: PALETTE.muted,
  });
}

async function addFields(
  doc: PDFDocument,
  page: any,
  x: number,
  y: number,
  w: number,
  h: number,
  section: Section,
  font: PDFFont,
  fontBold: PDFFont,
  tier: Tier
) {
  const form = doc.getForm();

  const fieldLeft = x + 12;
  const fieldW = w - 24;

  // Field area bounds
  const top = y + h - 62;
  const bottom = y + 16;

  const rows = section.fields.length;
  const rowH = Math.max(26, Math.floor((top - bottom) / rows));

  for (let i = 0; i < rows; i++) {
    const f = section.fields[i];
    const yy = top - i * rowH;

    // Label
    page.drawText(f.label, {
      x: fieldLeft,
      y: yy,
      size: 8.8,
      font: fontBold,
      color: PALETTE.ink,
    });

    // Field box (print clean: no heavy fills)
    const boxY = yy - 18;
    const boxH = 16;

    page.drawRectangle({
      x: fieldLeft,
      y: boxY,
      width: fieldW,
      height: boxH,
      color: rgb(1, 1, 1),
      borderColor: rgb(0.86, 0.86, 0.87),
      borderWidth: 1,
    });

    // Form field
    const name = `${section.title.toLowerCase().replace(/\s+/g, "_")}.${f.key}`;
    const tf = form.createTextField(name);
    tf.enableMultiline();

    // No placeholder text in the actual field (keeps it print-clean)
    tf.setText("");

    tf.addToPage(page, {
      x: fieldLeft + 3,
      y: boxY + 3,
      width: fieldW - 6,
      height: boxH - 6,
    });

    // Optional: discreet helper line for public/basic only (printed as faint microtext)
    if ((tier === "public" || tier === "basic") && f.placeholder) {
      page.drawText(f.placeholder, {
        x: fieldLeft + 6,
        y: boxY + 5,
        size: 7.2,
        font,
        color: rgb(0.78, 0.78, 0.785),
      });
    }
  }

  // Ensure /DA exists, then set sizes safely
  form.updateFieldAppearances(font);
  for (const field of form.getFields()) {
    const anyField = field as any;
    if (typeof anyField.setFontSize === "function") anyField.setFontSize(10);
  }
}

function drawFooter(page: any, w: number, h: number, font: PDFFont, id: string) {
  const left = 52;
  const y = 38;

  page.drawLine({
    start: { x: left, y: y + 18 },
    end: { x: w - left, y: y + 18 },
    thickness: 1,
    color: PALETTE.hairline,
  });

  page.drawText(`Abraham of London`, { x: left, y, size: 8, font, color: PALETTE.muted });
  page.drawText(id, { x: w - left - 120, y, size: 8, font, color: PALETTE.muted });
}

function fileName(format: Format, quality: Quality, tier: Tier) {
  // Keep stable, predictable, “catalogue-grade”
  const tierSlug = TIER_MAP[tier].filename;
  return `legacy-architecture-canvas-${format.toLowerCase()}-${quality}-${tierSlug}.pdf`;
}

// -----------------------------------------------------------------------------
// MAIN GENERATION
// -----------------------------------------------------------------------------

async function generateOne(format: Format, quality: Quality, tier: Tier, outDir: string) {
  const { w, h } = DIM[format];
  const doc = await PDFDocument.create();
  const page = doc.addPage([w, h]);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const id = docId(format, quality, tier);

  // Metadata (quiet, accurate)
  doc.setTitle("Legacy Architecture Canvas");
  doc.setAuthor("Abraham of London");
  doc.setSubject("Legacy Architecture Canvas");
  doc.setKeywords(["legacy", "architecture", "canvas", "framework"]);
  doc.setProducer("Abraham of London");
  doc.setCreator("Abraham of London");
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  // Visual build
  drawPaper(page, w, h, quality);
  drawBorderSystem(page, w, h);
  drawWatermark(page, w, h, tier);
  drawHeader(page, w, h, font, fontBold, format);
  drawDiscreetMark(page, w, h, font, tier);

  const sections = getSections();
  const L = layout(format);
  const colW = (w - L.marginX * 2 - L.gapX) / L.cols;

  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    const col = i % L.cols;
    const row = Math.floor(i / L.cols);
    const x = L.marginX + col * (colW + L.gapX);
    const y = L.topY - (row + 1) * L.blockH - row * L.gapY;

    drawSectionCard(page, x, y, colW, L.blockH, s, font, fontBold);
    await addFields(doc, page, x, y, colW, L.blockH, s, font, fontBold, tier);
  }

  drawFooter(page, w, h, font, id);

  ensureDir(outDir);
  const fp = path.join(outDir, fileName(format, quality, tier));
  const bytes = await doc.save();
  fs.writeFileSync(fp, bytes);

  const kb = Math.round(fs.statSync(fp).size / 1024);
  // Clean output: one line, no emojis, no shouting
  console.log(`${path.basename(fp)}  ${kb}KB  ${id}`);
}

async function main() {
  const args = process.argv.slice(2);

  const formatArg = (args[0] || "all").toLowerCase();
  const quality = safeQuality(args[1] || process.env.PDF_QUALITY || "premium");
  const tier = safeTier(args[2] || process.env.PDF_TIER || "premium");

  const outDir = path.join(process.cwd(), "public/assets/downloads");
  const formats: Format[] = formatArg === "all" ? ["A4", "Letter", "A3"] : [safeFormat(formatArg)];

  // Clean, professional header
  console.log(`legacy-canvas  formats=${formats.join(",")}  quality=${quality}  tier=${tier}`);

  for (const f of formats) {
    await generateOne(f, quality, tier, outDir);
  }
}

const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, "/")}`;
if (isMainModule) {
  main().catch((e) => {
    console.error(e?.message || e);
    process.exit(1);
  });
}

export { type Format, type Quality, type Tier };