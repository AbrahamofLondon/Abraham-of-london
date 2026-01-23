// scripts/pdf/generators/alignment-assessment.ts
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";

type Format = "A4" | "Letter" | "A3";

type GenCtx = {
  quality: "premium" | "enterprise";
  tier: "free" | "member" | "architect" | "inner-circle";
};

type Args = {
  format: Format;
  outPath: string; // absolute file path into /public/...
  ctx?: GenCtx;
};

const PAGE_SIZES: Record<Format, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  A3: { w: 841.89, h: 1190.55 },
};

function readPublicBytes(relPathFromPublic: string): Uint8Array {
  const abs = path.join(process.cwd(), "public", relPathFromPublic.replace(/^\/+/, ""));
  return fs.readFileSync(abs);
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function wrapLines(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let line = "";

  for (const w of words) {
    const next = line ? `${line} ${w}` : w;
    if (next.length <= maxChars) line = next;
    else {
      if (line) out.push(line);
      line = w;
    }
  }

  if (line) out.push(line);
  return out;
}

function isLowTier(tier: GenCtx["tier"]) {
  return tier === "free" || tier === "member";
}

export async function generateAlignmentAssessmentPDF({ format, outPath, ctx }: Args): Promise<void> {
  const tier = ctx?.tier ?? "free";
  const quality = ctx?.quality ?? "premium";

  const { w, h } = PAGE_SIZES[format] ?? PAGE_SIZES.A4;
  const scale = format === "A3" ? 1.12 : 1;

  const margin = 48;
  const contentW = w - margin * 2;

  const doc = await PDFDocument.create();

  // Unicode fonts (Inter)
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  doc.registerFontkit(fontkit);

  const fontRegularBytes = readPublicBytes("/fonts/Inter-Regular.ttf");
  const fontBoldBytes = readPublicBytes("/fonts/Inter-SemiBold.ttf");

  const fontRegular = await doc.embedFont(fontRegularBytes, { subset: true });
  const fontBold = await doc.embedFont(fontBoldBytes, { subset: true });

  doc.setTitle("Personal Alignment Assessment");
  doc.setAuthor("Abraham of London");
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  const form = doc.getForm();

  // Theme colors (dark, premium)
  const COLORS = {
    bg: rgb(0.05, 0.06, 0.08),
    card: rgb(0.08, 0.09, 0.12),
    border: rgb(0.18, 0.2, 0.25),
    text: rgb(0.95, 0.95, 0.95),
    subtext: rgb(0.75, 0.78, 0.85),
    muted: rgb(0.55, 0.58, 0.65),
    question: rgb(0.85, 0.86, 0.9),
    fieldBg: rgb(0.12, 0.13, 0.16),
    watermark: rgb(0.09, 0.10, 0.12),
  };

  // Likert keys (values stored in the radio group)
  const likert = [
    { key: "SD", label: "Strongly Disagree" },
    { key: "D", label: "Disagree" },
    { key: "N", label: "Neutral" },
    { key: "A", label: "Agree" },
    { key: "SA", label: "Strongly Agree" },
  ] as const;

  // --- Pagination / page builder ------------------------------------------------

  let page = doc.addPage([w, h]);
  let y = h - margin;

  const drawBase = (isFirst: boolean) => {
    // Background
    page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: COLORS.bg });

    // Card
    page.drawRectangle({
      x: margin,
      y: margin,
      width: contentW,
      height: h - margin * 2,
      color: COLORS.card,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    // Watermark (only low tiers; keep subtle)
    if (isFirst && isLowTier(tier)) {
      page.drawText("ABRAHAM OF LONDON", {
        x: margin + 18,
        y: margin + 36,
        size: 34 * scale,
        font: fontBold,
        color: COLORS.watermark,
        rotate: { type: "degrees", angle: 0 },
      });
    }

    // Header (first page only)
    if (isFirst) {
      page.drawText("PERSONAL ALIGNMENT ASSESSMENT", {
        x: margin + 24,
        y: y - 44,
        size: 20 * scale,
        font: fontBold,
        color: COLORS.text,
      });

      page.drawText("Agency • Purpose • Integrity", {
        x: margin + 24,
        y: y - 70,
        size: 11 * scale,
        font: fontRegular,
        color: COLORS.subtext,
      });

      // Quiet motto line (don’t overcook it)
      page.drawText("Answer honestly. This is for clarity, not performance.", {
        x: margin + 24,
        y: y - 92,
        size: 10 * scale,
        font: fontRegular,
        color: rgb(0.65, 0.68, 0.75),
      });

      y -= 120;
    } else {
      // small top rule on subsequent pages
      page.drawLine({
        start: { x: margin + 24, y: h - margin - 28 },
        end: { x: w - margin - 24, y: h - margin - 28 },
        thickness: 1,
        color: COLORS.border,
      });
      y = h - margin - 44;
    }
  };

  const newPage = (isFirst: boolean) => {
    page = doc.addPage([w, h]);
    y = h - margin;
    drawBase(isFirst);
  };

  // start page 1
  drawBase(true);

  const minY = margin + 64; // safe bottom buffer

  const ensureSpace = (needed: number, isFirst: boolean) => {
    if (y - needed < minY) newPage(false);
  };

  // --- Text blocks --------------------------------------------------------------

  const drawIntro = () => {
    const intro =
      "This assessment helps you evaluate whether your life is aligned with principles or driven by pressure. Answer plainly. Your goal is truth, not optics.";

    const introLines = wrapLines(intro, format === "A3" ? 120 : 92);

    ensureSpace(introLines.length * 14 * scale + 18 * scale, true);

    for (const line of introLines) {
      page.drawText(line, {
        x: margin + 24,
        y,
        size: 10 * scale,
        font: fontRegular,
        color: rgb(0.80, 0.82, 0.88),
      });
      y -= 14 * scale;
    }
    y -= 10 * scale;
  };

  function drawSectionTitle(t: string) {
    ensureSpace(42 * scale, true);

    page.drawText(t, {
      x: margin + 24,
      y,
      size: 11 * scale,
      font: fontBold,
      color: rgb(0.90, 0.90, 0.92),
    });
    y -= 18 * scale;

    page.drawLine({
      start: { x: margin + 24, y: y + 6 * scale },
      end: { x: margin + 24 + contentW - 48, y: y + 6 * scale },
      thickness: 1,
      color: COLORS.border,
    });

    y -= 10 * scale;
  }

  /**
   * RADIO GROUP per question:
   * - Name: q1, q2, ...
   * - Options: SD, D, N, A, SA
   */
  function addLikertRadioGroup(qNum: number) {
    const rowX = margin + 24;
    const rowW = contentW - 48;

    const box = 12 * scale;
    const gap = 14 * scale;

    const groupName = `q${qNum}`;
    const rg = form.createRadioGroup(groupName);

    // Right-aligned 5 buttons
    let x = rowX + rowW - likert.length * (box + gap);
    const yTop = y - box + 2 * scale;

    for (const opt of likert) {
      // pdf-lib typing for radio widgets is strict; we pass style props as any for runtime support.
      (rg as any).addOptionToPage(opt.key, page, {
        x,
        y: yTop,
        width: box,
        height: box,
        borderWidth: 1,
        borderColor: COLORS.muted,
        textColor: COLORS.text,
        backgroundColor: COLORS.fieldBg,
      } as any);
      x += box + gap;
    }

    y -= 18 * scale;
  }

  type Q = { n: number; text: string };
  const sections: Array<{ title: string; qs: Q[] }> = [
    {
      title: "SECTION I — AGENCY & CHOICE",
      qs: [
        { n: 1, text: "When making major decisions, I act from conviction rather than pressure." },
        { n: 2, text: "I can explain why I do what I do beyond money, approval, or fear." },
        { n: 3, text: "I regularly say “no” to what conflicts with my values, even when costly." },
      ],
    },
    {
      title: "SECTION II — SURRENDER VS SUBMISSION",
      qs: [
        { n: 4, text: "I choose alignment with truth even when it requires sacrifice." },
        { n: 5, text: "My obedience (to God, principle, or conscience) is voluntary, not resentful." },
        { n: 6, text: "After obedience, I experience peace rather than bitterness." },
      ],
    },
    {
      title: "SECTION III — PURPOSE & DIRECTION",
      qs: [
        { n: 7, text: "I know what brings me alive beyond comfort or pleasure." },
        { n: 8, text: "My strengths are aligned with the problems I feel compelled to solve." },
        { n: 9, text: "My suffering has meaning, not just pain." },
      ],
    },
    {
      title: "SECTION IV — LOVE ORIENTATION",
      qs: [
        { n: 10, text: "I order my loves intentionally (God → Others → Self)." },
        { n: 11, text: "I am not addicted to praise, pleasure, or power." },
        { n: 12, text: "My joy is durable, not circumstantial." },
      ],
    },
  ];

  // --- Build content ------------------------------------------------------------

  drawIntro();

  for (const section of sections) {
    drawSectionTitle(section.title);

    for (const q of section.qs) {
      const qText = `${q.n}. ${q.text}`;
      const lines = wrapLines(qText, format === "A3" ? 115 : 88);

      // rough space estimate: question lines + radio row + small gap
      ensureSpace(lines.length * 14 * scale + 32 * scale, true);

      for (const line of lines) {
        page.drawText(line, {
          x: margin + 24,
          y,
          size: 10 * scale,
          font: fontRegular,
          color: COLORS.question,
        });
        y -= 14 * scale;
      }

      addLikertRadioGroup(q.n);
      y -= 6 * scale;
    }

    y -= 4 * scale;
  }

  // --- Reflection block ---------------------------------------------------------

  ensureSpace(170 * scale, true);

  page.drawText("REFLECTION", {
    x: margin + 24,
    y,
    size: 11 * scale,
    font: fontBold,
    color: rgb(0.90, 0.90, 0.92),
  });
  y -= 18 * scale;

  page.drawText("What area of your life requires surrender rather than submission?", {
    x: margin + 24,
    y,
    size: 10 * scale,
    font: fontRegular,
    color: COLORS.question,
  });
  y -= 16 * scale;

  const fieldH = 96 * scale;
  const fieldW = contentW - 48;

  const reflection = form.createTextField("reflection");
  reflection.enableMultiline(); // ✅ correct pdf-lib API
  reflection.setText("");

  (reflection as any).addToPage(page, {
    x: margin + 24,
    y: y - fieldH,
    width: fieldW,
    height: fieldH,
    borderWidth: 1,
    borderColor: COLORS.muted,
    textColor: COLORS.text,
    backgroundColor: COLORS.fieldBg,
  } as any);

  // Make the text readable by default
  const anyReflection = reflection as any;
  if (typeof anyReflection.setFontSize === "function") anyReflection.setFontSize(10);

  y -= fieldH + 18 * scale;

  // --- Footer ------------------------------------------------------------------

  const footer = `Abraham of London • ${tier.toUpperCase()} • ${quality.toUpperCase()} • ${format}`;
  page.drawText(footer, {
    x: margin + 24,
    y: margin + 18,
    size: 8.5 * scale,
    font: fontRegular,
    color: COLORS.muted,
  });

  // IMPORTANT: generate appearance streams so fields render reliably
  form.updateFieldAppearances(fontRegular);

  // Save
  const bytes = await doc.save();
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, bytes);
}