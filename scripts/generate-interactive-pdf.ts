// scripts/generate-interactive-pdf.ts - UPDATED
import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { fileURLToPath } from "url";
import { PDF_CONFIG, type BuildTier, type Quality, type Format } from "./pdf/constants";

const __filename = fileURLToPath(import.meta.url);

function pageSize(format: Format): [number, number] {
  // PDF points
  if (format === "A4") return [595.28, 841.89];
  return [612, 792]; // Letter
}

function normalizeFormat(s: string): Format | null {
  const v = String(s || "").trim().toLowerCase();
  if (v === "a4") return "A4";
  if (v === "letter") return "Letter";
  return null;
}

async function generateInteractivePDF(
  format: Format, 
  quality: Quality, 
  tier: BuildTier, 
  outputDir: string
) {
  console.log(`Generating interactive ${format} PDF (${quality} quality, ${tier} tier)...`);

  const pdfDoc = await PDFDocument.create();

  // Metadata
  const displayTier = PDF_CONFIG.tiers[tier].display;
  pdfDoc.setTitle(`Legacy Architecture Canvas - ${format} (${displayTier})`);
  pdfDoc.setAuthor("Abraham of London");
  pdfDoc.setSubject("Interactive Legacy Canvas");
  pdfDoc.setKeywords(["legacy", "architecture", "canvas", "interactive", quality, tier]);
  pdfDoc.setProducer("Abraham of London PDF Engine");
  pdfDoc.setCreator("Premium PDF Generator");

  const [w, h] = pageSize(format);
  const page = pdfDoc.addPage([w, h]);

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Header
  page.drawText("LEGACY ARCHITECTURE CANVAS", {
    x: 50,
    y: h - 90,
    size: 22,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.3),
  });

  page.drawText("Interactive Premium Edition", {
    x: 50,
    y: h - 120,
    size: 12,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.5),
  });

  page.drawText(`${format} Format • ${displayTier} Tier • ${quality.toUpperCase()} Quality`, {
    x: 50,
    y: h - 140,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // REAL interactive fields (pdf-lib form)
  const form = pdfDoc.getForm();

  const sections = [
    { title: "SOVEREIGN THESIS", yTop: h - 190 },
    { title: "CAPITAL MATRIX", yTop: h - 340 },
    { title: "INSTITUTIONS", yTop: h - 490 },
    { title: "GUARDRAILS", yTop: h - 640 },
  ];

  const fieldWidth = w - 100;
  const fieldHeight = 26;

  sections.forEach((section, sectionIndex) => {
    page.drawText(section.title, {
      x: 50,
      y: section.yTop,
      size: 14,
      font: helveticaBold,
      color: rgb(0.2, 0.2, 0.4),
    });

    for (let i = 0; i < 3; i++) {
      const y = section.yTop - 32 - i * 40;

      // Draw a light rectangle behind field (visual polish)
      page.drawRectangle({
        x: 50,
        y,
        width: fieldWidth,
        height: fieldHeight,
        borderColor: rgb(0.82, 0.82, 0.82),
        borderWidth: 1,
      });

      const name = `s${sectionIndex + 1}_field_${i + 1}`;
      const tf = form.createTextField(name);

      tf.setText(""); // empty
      tf.addToPage(page, {
        x: 52,
        y: y + 2,
        width: fieldWidth - 4,
        height: fieldHeight - 4,
      });

      tf.setFontSize(10);
    }
  });

  // Footer instructions
  page.drawText("This is an interactive PDF. Click any field and type to fill it out.", {
    x: 50,
    y: 52,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  page.drawText("Save your filled PDF to keep your legacy canvas updated.", {
    x: 50,
    y: 34,
    size: 10,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Ensure appearances are generated (important for many PDF viewers)
  form.updateFieldAppearances(helvetica);

  const pdfBytes = await pdfDoc.save();

  const fileName = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}-${tier}-interactive.pdf`;
  const filePath = path.join(outputDir, fileName);

  await fs.writeFile(filePath, pdfBytes);

  const stats = await fs.stat(filePath);
  console.log(`✅ Generated: ${fileName} (${(stats.size / 1024).toFixed(1)} KB)`);

  return filePath;
}

async function main() {
  const args = process.argv.slice(2);

  const getArg = (key: string) => {
    const i = args.indexOf(key);
    return i >= 0 ? args[i + 1] : undefined;
  };

  const formatsRaw = getArg("--formats");
  const quality = (getArg("--quality") || "premium") as Quality;
  const tier = (getArg("--tier") || "architect") as BuildTier;
  const outputDir = getArg("--output-dir") || "./public/assets/downloads";

  const formats: Format[] = formatsRaw
    ? formatsRaw
        .split(",")
        .map((s) => normalizeFormat(s))
        .filter((v): v is Format => Boolean(v))
    : ["A4", "Letter"];

  await fs.mkdir(outputDir, { recursive: true });

  console.log("🚀 Generating Interactive PDFs...");

  for (const format of formats) {
    await generateInteractivePDF(format, quality, tier, outputDir);
  }

  console.log("\n✅ Interactive PDFs generated successfully!");
}

// ESM-safe entry detection
const invokedAsScript = (() => {
  const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
  return argv1 === path.resolve(__filename);
})();

if (invokedAsScript) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}