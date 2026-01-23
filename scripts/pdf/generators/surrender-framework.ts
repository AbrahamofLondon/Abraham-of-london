// scripts/pdf/generators/surrender-framework.ts
import fs from "fs";
import path from "path";
import { PDFDocument, rgb } from "pdf-lib";

type GenerateArgs = {
  outPath: string; // absolute filesystem path
  variant: "framework" | "principles";
  ctx?: {
    quality?: "premium" | "enterprise";
    tier?: "free" | "member" | "architect" | "inner-circle";
  };
};

const A4 = { w: 595.28, h: 841.89 };

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function readPublicBytes(relPathFromPublic: string): Uint8Array {
  const abs = path.join(process.cwd(), "public", relPathFromPublic.replace(/^\/+/, ""));
  return fs.readFileSync(abs);
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

export async function generateSurrenderPDF({ outPath, variant, ctx }: GenerateArgs) {
  const quality = ctx?.quality ?? "premium";
  const tier = ctx?.tier ?? "free";

  const doc = await PDFDocument.create();

  // Unicode fonts (Inter) — premium, consistent with your other generators
  const fontkit = (await import("@pdf-lib/fontkit")).default;
  doc.registerFontkit(fontkit);

  const fontRegularBytes = readPublicBytes("/fonts/Inter-Regular.ttf");
  const fontBoldBytes = readPublicBytes("/fonts/Inter-SemiBold.ttf");

  const fontRegular = await doc.embedFont(fontRegularBytes, { subset: true });
  const fontBold = await doc.embedFont(fontBoldBytes, { subset: true });

  // Metadata
  const title =
    variant === "framework"
      ? "The Principles of Surrender Framework"
      : "Principles of Surrender (Worksheet)";

  doc.setTitle(title);
  doc.setAuthor("Abraham of London");
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  // Theme (quiet luxury, dark premium)
  const COLORS = {
    bg: rgb(0.05, 0.06, 0.08),
    card: rgb(0.08, 0.09, 0.12),
    border: rgb(0.18, 0.2, 0.25),
    text: rgb(0.95, 0.95, 0.95),
    sub: rgb(0.75, 0.78, 0.85),
    muted: rgb(0.55, 0.58, 0.65),
    fieldBg: rgb(0.12, 0.13, 0.16),
    hair: rgb(0.22, 0.24, 0.28),
    accent: quality === "enterprise" ? rgb(0.74, 0.63, 0.38) : rgb(0.62, 0.66, 0.80),
    watermark: rgb(0.09, 0.10, 0.12),
  };

  const margin = 48;
  const innerPad = 24;
  const contentW = A4.w - margin * 2;

  const form = doc.getForm();

  const addPage = () => {
    const page = doc.addPage([A4.w, A4.h]);

    // Background
    page.drawRectangle({ x: 0, y: 0, width: A4.w, height: A4.h, color: COLORS.bg });

    // Card
    page.drawRectangle({
      x: margin,
      y: margin,
      width: contentW,
      height: A4.h - margin * 2,
      color: COLORS.card,
      borderColor: COLORS.border,
      borderWidth: 1,
    });

    return page;
  };

  const drawHeader = (page: any, headerTitle: string, subtitle: string) => {
    const topY = A4.h - margin - 44;

    page.drawText(headerTitle.toUpperCase(), {
      x: margin + innerPad,
      y: topY,
      size: 18,
      font: fontBold,
      color: COLORS.text,
    });

    page.drawText(subtitle, {
      x: margin + innerPad,
      y: topY - 22,
      size: 10.5,
      font: fontRegular,
      color: COLORS.sub,
    });

    // Accent rule
    page.drawLine({
      start: { x: margin + innerPad, y: topY - 36 },
      end: { x: margin + innerPad + contentW - innerPad * 2, y: topY - 36 },
      thickness: 2,
      color: COLORS.accent,
    });

    // Watermark: keep it only on free/member
    if (tier === "free" || tier === "member") {
      page.drawText("ABRAHAM OF LONDON", {
        x: margin + innerPad,
        y: margin + 36,
        size: 30,
        font: fontBold,
        color: COLORS.watermark,
      });
    }
  };

  const drawFooter = (page: any, rightLabel: string) => {
    page.drawLine({
      start: { x: margin + innerPad, y: margin + 34 },
      end: { x: margin + innerPad + contentW - innerPad * 2, y: margin + 34 },
      thickness: 1,
      color: COLORS.hair,
    });

    page.drawText("Abraham of London", {
      x: margin + innerPad,
      y: margin + 18,
      size: 8.5,
      font: fontRegular,
      color: COLORS.muted,
    });

    page.drawText(rightLabel, {
      x: margin + innerPad + contentW - innerPad * 2 - 220,
      y: margin + 18,
      size: 8.5,
      font: fontRegular,
      color: COLORS.muted,
    });
  };

  // ------------------------
  // VARIANT: FRAMEWORK (multi-page)
  // ------------------------
  if (variant === "framework") {
    const page1 = addPage();
    drawHeader(page1, "The Principles of Surrender", "Framework • disciplined alignment • clarity over impulse");

    let y = A4.h - margin - 120;

    const writeBlock = (page: any, heading: string, body: string) => {
      page.drawText(heading.toUpperCase(), {
        x: margin + innerPad,
        y,
        size: 11,
        font: fontBold,
        color: COLORS.text,
      });
      y -= 18;

      const lines = wrapLines(body, 92);
      for (const line of lines) {
        page.drawText(line, {
          x: margin + innerPad,
          y,
          size: 10.2,
          font: fontRegular,
          color: rgb(0.85, 0.86, 0.9),
        });
        y -= 14;
      }
      y -= 12;

      page.drawLine({
        start: { x: margin + innerPad, y: y + 6 },
        end: { x: margin + innerPad + contentW - innerPad * 2, y: y + 6 },
        thickness: 1,
        color: COLORS.hair,
      });
      y -= 12;
    };

    writeBlock(
      page1,
      "Purpose",
      "Surrender is not passivity. It is the disciplined refusal to be governed by impulse, fear, or ego. This framework helps you translate conviction into action under pressure."
    );

    writeBlock(
      page1,
      "Definition",
      "Surrender is voluntary alignment with truth, even when that alignment costs you comfort or control. Submission is forced compliance. The framework trains surrender-as-discipline."
    );

    writeBlock(
      page1,
      "Operating Premise",
      "Your life will follow what you obey. The question is not whether you obey — it is what you obey: appetite, approval, anxiety, or truth."
    );

    // Page 2
    const page2 = addPage();
    drawHeader(page2, "The Principles of Surrender", "Principles • tests • operational rules");

    let y2 = A4.h - margin - 120;

    const principles = [
      {
        t: "1) Truth over impulse",
        d: "Name the reality you are avoiding. If you cannot say it plainly, it is governing you.",
      },
      {
        t: "2) Obedience before outcomes",
        d: "Do the right thing because it is right — not because it guarantees comfort, applause, or speed.",
      },
      {
        t: "3) Discipline as freedom",
        d: "Constraints create capacity. Train your appetites; do not negotiate with them.",
      },
      {
        t: "4) Humility in strategy",
        d: "Pride confuses preference for principle. Humility enables correction without collapse.",
      },
      {
        t: "5) Stewardship with clarity",
        d: "Surrender does not cancel responsibility. It clarifies it: steward what you control; release what you do not.",
      },
    ];

    for (const p of principles) {
      page2.drawText(p.t, {
        x: margin + innerPad,
        y: y2,
        size: 11,
        font: fontBold,
        color: COLORS.text,
      });
      y2 -= 16;

      for (const line of wrapLines(p.d, 92)) {
        page2.drawText(line, {
          x: margin + innerPad,
          y: y2,
          size: 10.2,
          font: fontRegular,
          color: rgb(0.85, 0.86, 0.9),
        });
        y2 -= 14;
      }

      y2 -= 10;
      page2.drawLine({
        start: { x: margin + innerPad, y: y2 },
        end: { x: margin + innerPad + contentW - innerPad * 2, y: y2 },
        thickness: 1,
        color: COLORS.hair,
      });
      y2 -= 12;
    }

    // Page 3 (application cadence)
    const page3 = addPage();
    drawHeader(page3, "The Principles of Surrender", "Application • daily cadence • decision filter");

    let y3 = A4.h - margin - 120;

    const cadenceTitle = "Daily Surrender Cadence (5 minutes)";
    page3.drawText(cadenceTitle, {
      x: margin + innerPad,
      y: y3,
      size: 11,
      font: fontBold,
      color: COLORS.text,
    });
    y3 -= 18;

    const cadence = [
      "1) What am I trying to control that is not mine to control?",
      "2) What truth am I avoiding because it threatens my preferred outcome?",
      "3) What is the next obedient action I can take today (practical, small, real)?",
      "4) What discipline will I commit to for 7 days (time, appetite, speech, spending)?",
      "5) What outcome will I release to God without resentment?",
    ];

    for (const line of cadence) {
      for (const wline of wrapLines(line, 92)) {
        page3.drawText(wline, {
          x: margin + innerPad,
          y: y3,
          size: 10.2,
          font: fontRegular,
          color: rgb(0.85, 0.86, 0.9),
        });
        y3 -= 14;
      }
      y3 -= 6;
    }

    y3 -= 10;

    page3.drawText("Decision Filter", {
      x: margin + innerPad,
      y: y3,
      size: 11,
      font: fontBold,
      color: COLORS.text,
    });
    y3 -= 18;

    const filter =
      "If the action increases integrity, strengthens discipline, and aligns with truth — proceed. If it buys comfort by violating conviction — stop. If unsure, delay and clarify.";
    for (const line of wrapLines(filter, 92)) {
      page3.drawText(line, {
        x: margin + innerPad,
        y: y3,
        size: 10.2,
        font: fontRegular,
        color: rgb(0.85, 0.86, 0.9),
      });
      y3 -= 14;
    }

    drawFooter(page1, `${tier.toUpperCase()} • ${quality.toUpperCase()} • FRAMEWORK • A4`);
    drawFooter(page2, `${tier.toUpperCase()} • ${quality.toUpperCase()} • FRAMEWORK • A4`);
    drawFooter(page3, `${tier.toUpperCase()} • ${quality.toUpperCase()} • FRAMEWORK • A4`);
  }

  // ------------------------
  // VARIANT: WORKSHEET (fillable)
  // ------------------------
  if (variant === "principles") {
    const page = addPage();
    drawHeader(page, "Principles of Surrender", "Worksheet • fillable • practical application");

    let y = A4.h - margin - 120;

    const intro =
      "Use this worksheet in real time. Do not perform. Name the truth plainly, choose obedience, and move.";
    for (const line of wrapLines(intro, 92)) {
      page.drawText(line, {
        x: margin + innerPad,
        y,
        size: 10.2,
        font: fontRegular,
        color: rgb(0.85, 0.86, 0.9),
      });
      y -= 14;
    }
    y -= 12;

    const prompts = [
      { name: "control", label: "1) What am I trying to control right now?" },
      { name: "truth", label: "2) What truth am I avoiding?" },
      { name: "obedience", label: "3) What does obedience look like today (practical)?" },
      { name: "discipline", label: "4) What discipline will I commit to for 7 days?" },
      { name: "outcome", label: "5) What outcome am I surrendering to God?" },
    ];

    for (const p of prompts) {
      // Label
      page.drawText(p.label, {
        x: margin + innerPad,
        y,
        size: 10.6,
        font: fontBold,
        color: COLORS.text,
      });
      y -= 14;

      // Field
      const fieldH = 62;
      const fieldW = contentW - innerPad * 2;

      page.drawRectangle({
        x: margin + innerPad,
        y: y - fieldH,
        width: fieldW,
        height: fieldH,
        color: COLORS.fieldBg,
        borderColor: COLORS.muted,
        borderWidth: 1,
      });

      const tf = form.createTextField(`surrender.${p.name}`);
      tf.enableMultiline(); // correct pdf-lib API
      tf.setText("");

      (tf as any).addToPage(page, {
        x: margin + innerPad + 6,
        y: y - fieldH + 6,
        width: fieldW - 12,
        height: fieldH - 12,
        borderWidth: 0,
        textColor: COLORS.text,
        backgroundColor: COLORS.fieldBg,
      } as any);

      const anyTf = tf as any;
      if (typeof anyTf.setFontSize === "function") anyTf.setFontSize(10);

      y -= fieldH + 16;

      // If we’re getting too low, stop (A4 worksheet is intentionally one page)
      if (y < margin + 120) break;
    }

    drawFooter(page, `${tier.toUpperCase()} • ${quality.toUpperCase()} • WORKSHEET • A4`);
  }

  // Ensure appearances so fields render reliably
  form.updateFieldAppearances(fontRegular);

  const bytes = await doc.save();
  ensureDir(path.dirname(outPath));
  fs.writeFileSync(outPath, bytes);
}