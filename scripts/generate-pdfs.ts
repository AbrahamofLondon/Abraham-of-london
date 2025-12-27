// scripts/generate-pdfs.ts
/* eslint-disable no-console */

import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import { pdf, type DocumentProps } from "@react-pdf/renderer";

// IMPORTANT: value import (NOT `import type`)
import UltimatePurposeOfManDocument from "@/lib/pdf/ultimate-purpose-of-man-pdf";

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function resolveCoverDiskPath(): string {
  // Your previous code accidentally included "/assets/images/..." as a segment,
  // which makes the path wrong. Build the path with real segments only.
  return path.join(
    process.cwd(),
    "public",
    "assets",
    "images",
    "purpose-cover.jpg" // <-- ensure this file exists on disk
  );
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "downloads");
  await ensureDir(outDir);

  const coverDiskPath = resolveCoverDiskPath();

  // Build a React element WITHOUT JSX to avoid TS/JSX config edge cases.
  // Also explicitly type as a React-PDF <Document> element.
  const element = React.createElement(
    UltimatePurposeOfManDocument as unknown as React.ComponentType<{
      coverImagePath: string;
    }>,
    { coverImagePath: coverDiskPath }
  ) as unknown as React.ReactElement<DocumentProps>;

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