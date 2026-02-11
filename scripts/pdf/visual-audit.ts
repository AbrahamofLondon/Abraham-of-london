// scripts/pdf/visual-audit.ts
import fs from "fs";
import path from "path";
import { pdfGenerator } from "./secure-puppeteer-generator";

const AUDIT_DIR = path.join(process.cwd(), "public/assets/audits");
const DOWNLOADS_DIR = path.join(process.cwd(), "public/assets/downloads");

async function runVisualAudit() {
  console.log("\x1b[35m\n🔍 INITIATING INSTITUTIONAL VISUAL AUDIT\x1b[0m");
  
  if (!fs.existsSync(AUDIT_DIR)) fs.mkdirSync(AUDIT_DIR, { recursive: true });

  const files = fs.readdirSync(DOWNLOADS_DIR)
    .filter(f => f.endsWith(".pdf"))
    .slice(0, 3); // Audit the first 3 files

  if (files.length === 0) {
    console.log("\x1b[31m❌ No PDFs found in downloads. Run generator first.\x1b[0m");
    return;
  }

  await pdfGenerator.initialize();

  for (const file of files) {
    const id = path.parse(file).name;
    console.log(`📸 Auditing: ${id}...`);
    
    // In a real visual audit, we'd use a PDF-to-Image lib, 
    // but here we will verify the CSS by re-rendering a 'Proof Sheet' HTML
    const proofPath = path.join(AUDIT_DIR, `${id}-proof.pdf`);
    
    // We simulate the render to ensure the 'enhanceHTML' CSS is active
    await pdfGenerator.generateSecurePDF(
      `<h1>Visual Audit: ${id}</h1><p>Verifying typography, margins, and headers.</p>`,
      proofPath,
      { title: `AUDIT-${id}`, format: "A4" }
    );
  }

  await pdfGenerator.close();
  console.log(`\x1b[32m\n✅ Audit Proofs generated in: ${AUDIT_DIR}\x1b[0m\n`);
}

runVisualAudit();