/* scripts/generate-ultimate-purpose-of-man-pdf.ts */
import fs from "fs/promises";
import path from "path";
import React from "react";
import { renderToFile } from "@react-pdf/renderer";

import UltimatePurposeOfManDocument from "../lib/pdf/ultimate-purpose-of-man-pad";

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "assets", "downloads");
  const outFile = path.join(outDir, "ultimate-purpose-of-man-editorial.pdf");

  // pick an existing cover image; must exist in /public
  const coverImagePublic = "/assets/images/purpose-cover.jpg";
  const coverImageFs = path.join(process.cwd(), "public", coverImagePublic.replace(/^\//, ""));

  await ensureDir(outDir);

  // sanity check cover exists; if not, fall back to something you know exists
  let coverToUse = coverImagePublic;
  try {
    await fs.access(coverImageFs);
  } catch {
    coverToUse = "/assets/images/writing-desk.webp";
  }

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