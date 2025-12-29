/* scripts/generate-ultimate-purpose-of-man-pdf.tsx */
import fs from "fs/promises";
import path from "path";
import React from "react";
import { renderToFile } from "@react-pdf/renderer";

// FIX 1: Corrected filename spelling ('pdp' -> 'pdf') and removed '.tsx' extension
import UltimatePurposeOfManDocument from "../lib/pdf/ultimate-purpose-of-man-pdf";

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  // Define output location
  const outDir = path.join(process.cwd(), "public", "assets", "downloads");
  const outFile = path.join(outDir, "ultimate-purpose-of-man-editorial.pdf");

  await ensureDir(outDir);

  // FIX 2: Resolve absolute file system paths for images
  // React-PDF in a Node environment cannot load relative web paths like "/assets/..."
  const publicDir = path.join(process.cwd(), "public");
  
  const primaryCoverPath = path.join(publicDir, "assets", "images", "purpose-cover.jpg");
  const fallbackCoverPath = path.join(publicDir, "assets", "images", "writing-desk.webp");

  // Determine which cover image to use based on file existence
  let coverToUse = primaryCoverPath;
  try {
    await fs.access(primaryCoverPath);
  } catch {
    console.warn("⚠️ Primary cover not found, using fallback.");
    coverToUse = fallbackCoverPath;
  }

  // Generate PDF
  await renderToFile(
    <UltimatePurposeOfManDocument coverImagePath={coverToUse} />,
    outFile
  );

  // eslint-disable-next-line no-console
  console.log(`✅ Generated PDF: ${outFile}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});