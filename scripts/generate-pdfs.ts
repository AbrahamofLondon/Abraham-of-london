// scripts/generate-pdfs.ts
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

  // ✅ Use a REAL disk path. Do NOT include "/assets/images" inside path.join like a URL.
  const coverDiskPath = path.join(
    process.cwd(),
    "public",
    "assets",
    "images",
    "purpose-cover.jpg"
  );

  // ✅ JSX element; cast to satisfy @react-pdf/renderer typing expectations
  const element = (
    <UltimatePurposeOfManDocument coverImagePath={coverDiskPath} />
  ) as unknown as React.ReactElement;

  const instance = pdf(element);
  const buffer = await instance.toBuffer();

  const outPath = path.join(outDir, "ultimate-purpose-of-man-special.pdf");
  await fs.writeFile(outPath, buffer);

  // eslint-disable-next-line no-console
  console.log(`✅ PDF generated: ${outPath}`);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});