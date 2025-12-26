import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { pdf } from "@react-pdf/renderer";

import UltimatePurposeOfManDocument from "../lib/pdf/ultimate-purpose-of-man-pdf";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "downloads");
  await ensureDir(outDir);

  // IMPORTANT: coverImagePath must be a path React-PDF can read at build-time.
  // Best is an absolute file path on disk (NOT a /public URL).
  const coverDiskPath = path.join(
    process.cwd(),
    "public",
    "assets",
    "images",
    "/assets/images/purpose-cover.jpg"
  );

  const element = React.createElement(UltimatePurposeOfManDocument, {
    coverImagePath: coverDiskPath,
  });

  const instance = pdf(element);
  const buffer = await instance.toBuffer();

  const outPath = path.join(outDir, "ultimate-purpose-of-man-special.pdf");
  await fs.writeFile(outPath, buffer);

  console.log(`✅ PDF generated: ${outPath}`);
}

main().catch((err) => {
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});