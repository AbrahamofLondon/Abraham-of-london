/* scripts/build-pdfs.mjs */
import fs from "fs";
import path from "path";
import React from "react";
import { renderToFile } from "@react-pdf/renderer";

// IMPORTANT: adjust the import path to match your actual filename.
// You said it exists as: lib/pdf/ultimate-purpose-of-man-pad.tsx
import UltimatePurposeOfManDocument from "../lib/pdf/ultimate-purpose-of-man-pad";

function mustExist(p) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${p}`);
  }
  return p;
}

async function buildUltimatePurposePdf() {
  const outDir = path.join(process.cwd(), "public", "assets", "downloads");
  fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, "ultimate-purpose-of-man-editorial.pdf");

  // Use an existing cover image from /public (local file path works best in CI)
  const coverPath = mustExist(
    path.join(process.cwd(), "public", "assets", "images", "purpose-cover.jpg")
  );

  await renderToFile(
    React.createElement(UltimatePurposeOfManDocument, { coverImagePath: coverPath }),
    outFile
  );

  console.log("✅ Built PDF:", outFile);
}

async function main() {
  await buildUltimatePurposePdf();
}

main().catch((err) => {
  console.error("❌ build-pdfs failed:", err);
  process.exit(1);
});
