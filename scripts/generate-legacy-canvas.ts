import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb, PDFFont } from "pdf-lib";

// --- ENVIRONMENT SETUP ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Constants derived from your intelligence brief standards
type Format = "A4" | "Letter" | "A3";
type Quality = "draft" | "standard" | "premium" | "enterprise";

const DIM: Record<Format, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  A3: { w: 841.89, h: 1190.55 },
};

const PALETTE = {
  paper: rgb(0.996, 0.995, 0.992),
  ink: rgb(0.08, 0.08, 0.10),
  muted: rgb(0.40, 0.40, 0.44),
  hairline: rgb(0.86, 0.86, 0.88),
  gold: rgb(0.74, 0.63, 0.38),
  sectionA: rgb(0.20, 0.22, 0.28),
  sectionB: rgb(0.12, 0.33, 0.30),
};

// --- DRAWING HELPERS ---

function drawPaper(page: any, w: number, h: number) {
  page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: PALETTE.paper });
}

function drawHeader(page: any, w: number, h: number, fontBold: PDFFont) {
  const left = 50;
  const top = h - 60;
  page.drawText("LEGACY ARCHITECTURE CANVAS", { 
    x: left, 
    y: top, 
    size: 20, 
    font: fontBold, 
    color: PALETTE.ink 
  });
  
  // Signature Hairline
  page.drawLine({ 
    start: { x: left, y: top - 20 }, 
    end: { x: w - left, y: top - 20 }, 
    thickness: 0.5, 
    color: PALETTE.hairline 
  });
}

async function createFillableField(
  doc: PDFDocument, 
  page: any, 
  name: string, 
  x: number, 
  y: number, 
  width: number, 
  height: number,
  font: PDFFont
) {
  const form = doc.getForm();
  const textField = form.createTextField(name);
  textField.enableMultiline();
  textField.addToPage(page, { 
    x, y, width, height, 
    borderWidth: 0,
    backgroundColor: rgb(1, 1, 1) // Pure white for field contrast
  });
  // Appearance must be updated to embed font in the form layer
  form.updateFieldAppearances(font);
}

// --- CORE GENERATION ---

async function generateCanvas(format: Format, quality: Quality, outDir: string) {
  const { w, h } = DIM[format];
  const doc = await PDFDocument.create();
  
  // Set Metadata for the 75 Intelligence Briefs Portfolio
  doc.setTitle(`Legacy Architecture Canvas - ${format}`);
  doc.setAuthor("Sovereign Intelligence Engine");
  doc.setCreator("Gemini-3-Flash-Production");

  const page = doc.addPage([w, h]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // 1. Base Layer
  drawPaper(page, w, h);
  drawHeader(page, w, h, fontBold);

  // 2. Define Section Layouts
  const sections = [
    { id: "thesis", title: "SOVEREIGN THESIS", y: h - 250, height: 150 },
    { id: "matrix", title: "CAPITAL MATRIX", y: h - 450, height: 150 }
  ];

  for (const section of sections) {
    const margin = 50;
    const innerW = w - (margin * 2);
    
    // Draw Label
    page.drawText(section.title, { 
      x: margin, 
      y: section.y + section.height + 5, 
      size: 10, 
      font: fontBold, 
      color: PALETTE.muted 
    });

    // Create Fillable Area
    await createFillableField(
      doc, 
      page, 
      `field_${section.id}`, 
      margin, 
      section.y, 
      innerW, 
      section.height, 
      font
    );
  }

  // 3. Finalization
  // Ensure filename follows the pattern expected by the verifyGeneratedPDFs function
  const filename = `legacy-architecture-canvas-${format.toLowerCase()}-${quality}.pdf`;
  const filePath = path.join(outDir, filename);

  const pdfBytes = await doc.save();
  
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  fs.writeFileSync(filePath, pdfBytes);
  console.log(`[GENERATOR] Successfully exported: ${filename}`);
}

// --- ENTRY POINT ---

async function main() {
  // Extract arguments from CommandRunner (lib/pdf/generate.ts)
  const args = process.argv.slice(2);
  const formatArg = (args[0] as Format) || "A4";
  const qualityArg = (process.env.PDF_QUALITY as Quality) || "premium";
  
  const outputDir = path.join(process.cwd(), "public/assets/downloads");

  console.log(`[GENERATOR] Initializing ${formatArg} at ${qualityArg} quality...`);
  
  try {
    await generateCanvas(formatArg, qualityArg, outputDir);
    process.exit(0);
  } catch (error) {
    console.error("[GENERATOR] Critical Error:", error);
    process.exit(1);
  }
}

main();