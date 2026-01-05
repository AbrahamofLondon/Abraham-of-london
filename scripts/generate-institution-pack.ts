import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Format = "A4" | "Letter" | "A3";
const DIM: Record<Format, { w: number; h: number }> = {
  A4: { w: 595.28, h: 841.89 },
  Letter: { w: 612, h: 792 },
  A3: { w: 841.89, h: 1190.55 },
};

function safeFormat(x: string): Format {
  const v = (x || "").toLowerCase();
  if (v === "a4") return "A4";
  if (v === "letter") return "Letter";
  if (v === "a3") return "A3";
  return "A4";
}

function ensureDir(p: string) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function drawHeader(page: any, w: number, h: number, fontBold: any, font: any, title: string) {
  page.drawText(title, { x: 50, y: h - 80, size: 18, font: fontBold, color: rgb(0.12, 0.12, 0.18) });
  page.drawLine({
    start: { x: 50, y: h - 95 },
    end: { x: w - 50, y: h - 95 },
    thickness: 1,
    color: rgb(0.88, 0.88, 0.9),
  });
}

async function generatePack(format: Format, quality: string) {
  const { w, h } = DIM[format];
  const doc = await PDFDocument.create();

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  // Metadata
  doc.setTitle(`Institution Builder Pack - ${format} (${quality})`);
  doc.setAuthor("Abraham of London");
  doc.setSubject("Institution Builder Pack");
  doc.setKeywords(["institution", "governance", "legacy", "pack", quality]);
  doc.setProducer("Abraham of London PDF Engine");
  doc.setCreator("Legacy Architecture Suite");
  doc.setCreationDate(new Date());
  doc.setModificationDate(new Date());

  // 1) Cover
  {
    const page = doc.addPage([w, h]);
    page.drawRectangle({ x: 0, y: 0, width: w, height: h, color: rgb(1, 1, 1) });

    page.drawText("INSTITUTION BUILDER PACK", { x: 50, y: h - 140, size: 30, font: fontBold, color: rgb(0.12, 0.12, 0.18) });
    page.drawText(`Format: ${format} • Quality: ${quality.toUpperCase()}`, { x: 50, y: h - 170, size: 12, font, color: rgb(0.45, 0.45, 0.45) });
    page.drawText("Abraham of London", { x: 50, y: 70, size: 11, font, color: rgb(0.5, 0.5, 0.5) });
  }

  // 2) TOC
  const tocItems = [
    "1. Family Governance Charter",
    "2. Board / Council Structure",
    "3. Risk Register",
    "4. Succession & Continuity Plan",
    "5. Philanthropy Mandate",
    "6. IP & Brand Stewardship",
  ];

  {
    const page = doc.addPage([w, h]);
    drawHeader(page, w, h, fontBold, font, "TABLE OF CONTENTS");

    let y = h - 140;
    tocItems.forEach((t) => {
      page.drawText(t, { x: 60, y, size: 11, font, color: rgb(0.2, 0.2, 0.25) });
      y -= 22;
    });
  }

  // 3+) Worksheets (interactive)
  const form = doc.getForm();

  const sheets = [
    { title: "FAMILY GOVERNANCE CHARTER", fields: ["Purpose", "Values", "Decision Rules", "Conflict Resolution", "Meeting Cadence"] },
    { title: "BOARD / COUNCIL STRUCTURE", fields: ["Roles", "Voting Rights", "Committees", "Appointment Criteria", "Removal Criteria"] },
    { title: "RISK REGISTER", fields: ["Top Risks", "Likelihood", "Impact", "Mitigations", "Owners"] },
    { title: "SUCCESSION & CONTINUITY PLAN", fields: ["Successor Criteria", "Transition Timeline", "Training Plan", "Emergency Protocol", "Sign-off"] },
    { title: "PHILANTHROPY MANDATE", fields: ["Focus Areas", "Funding Rules", "Eligibility", "Governance", "Measurement"] },
    { title: "IP & BRAND STEWARDSHIP", fields: ["Brand Rules", "Approvals", "Licensing", "Protection", "Enforcement"] },
  ];

  sheets.forEach((sheet, idx) => {
    const page = doc.addPage([w, h]);
    drawHeader(page, w, h, fontBold, font, sheet.title);

    let y = h - 140;
    sheet.fields.forEach((label, i) => {
      page.drawText(label, { x: 50, y, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.25) });

      const name = `sheet_${idx + 1}_${i + 1}`; // stable names
      const tf = form.createTextField(name);
      tf.enableMultiline();
      tf.addToPage(page, { x: 50, y: y - 140, width: w - 100, height: 120 });

      y -= 170;
    });
  });

  // Fix appearance generation (prevents your /DA error forever)
  form.updateFieldAppearances(font);

  const bytes = await doc.save();

  const outDir = path.join(process.cwd(), "private_downloads", "packs");
  ensureDir(outDir);

  const filename = `institution-builder-pack-${format.toLowerCase()}-${quality}.pdf`;
  const fp = path.join(outDir, filename);

  fs.writeFileSync(fp, bytes);
  const sizeKB = (fs.statSync(fp).size / 1024).toFixed(1);
  console.log(`✅ ${filename} (${sizeKB} KB)`);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = (args[0] || "all").toLowerCase();
  const quality = (args[1] || process.env.PDF_QUALITY || "premium").toLowerCase();

  const formats: Format[] = cmd === "all" ? ["A4", "Letter", "A3"] : [safeFormat(cmd)];
  console.log(`✨ Institution Pack: ${formats.join(", ")} | quality=${quality}`);

  for (const f of formats) await generatePack(f, quality);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}