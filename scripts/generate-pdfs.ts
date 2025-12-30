/* scripts/generate-pdfs.ts */
/* eslint-disable no-console */

import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import React from "react";
import { pdf, type DocumentProps, Font } from "@react-pdf/renderer";

// IMPORTANT: Relative import for script execution
import UltimatePurposeOfManDocument from "../lib/pdf/ultimate-purpose-of-man-pdf";

type UltimatePurposeOfManDocumentProps = {
  coverImagePath: string;
};

// Font URLs
const FONTS = {
  AoLSerif_Regular: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYhig.woff2",
  AoLSerif_Italic: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFkD-vYSZviVYUb_rj3ij__anPXDTzYhCBN.woff2",
  AoLSans_Regular: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boK.woff2",
  AoLMono_Regular: "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2oWUg0MKqScQ7Z7o_vo0qZxP9kFz.woff2",
};

async function downloadFont(url: string, destPath: string) {
  if (fsSync.existsSync(destPath)) return;
  console.log(`⬇️ Downloading font to ${path.basename(destPath)}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch font: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    // Use unknown bridge here as well to satisfy fs.writeFile
    await fs.writeFile(destPath, Buffer.from(arrayBuffer) as unknown as Uint8Array);
  } catch (e) {
    console.warn(`⚠️ Warning: Could not download font from ${url}.`);
  }
}

async function prepareFonts() {
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  await fs.mkdir(fontsDir, { recursive: true });

  await downloadFont(FONTS.AoLSerif_Regular, path.join(fontsDir, "AoLSerif-Regular.woff2"));
  await downloadFont(FONTS.AoLSerif_Italic, path.join(fontsDir, "AoLSerif-Italic.woff2"));
  await downloadFont(FONTS.AoLSans_Regular, path.join(fontsDir, "AoLSans-Regular.woff2"));
  await downloadFont(FONTS.AoLMono_Regular, path.join(fontsDir, "AoLMono-Regular.woff2"));

  const serifReg = path.join(fontsDir, "AoLSerif-Regular.woff2");
  const serifItal = path.join(fontsDir, "AoLSerif-Italic.woff2");
  
  if (fsSync.existsSync(serifReg)) {
    Font.register({
      family: "AoLSerif",
      fonts: [
        { src: serifReg, fontWeight: 400 },
        { src: fsSync.existsSync(serifItal) ? serifItal : serifReg, fontWeight: 400, fontStyle: "italic" },
      ],
    });
  } else {
    Font.register({ family: "AoLSerif", src: "Times-Roman" });
  }

  Font.register({ family: "AoLSans", src: "Helvetica" });
  Font.register({ family: "AoLMono", src: "Courier" });
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "downloads");
  await fs.mkdir(outDir, { recursive: true });

  await prepareFonts();

  const coverDiskPath = path.join(process.cwd(), "public", "assets", "images", "purpose-cover.jpg");
  let coverToUse = coverDiskPath;
  try {
    await fs.access(coverDiskPath);
  } catch {
    coverToUse = path.join(process.cwd(), "public", "assets", "images", "writing-desk.webp");
  }

  const element = React.createElement(
    UltimatePurposeOfManDocument as unknown as React.ComponentType<UltimatePurposeOfManDocumentProps>,
    { coverImagePath: coverToUse }
  ) as unknown as React.ReactElement<DocumentProps>;

  console.log("📄 Generating PDF...");
  const instance = pdf(element);
  const stream = await instance.toBuffer();

  const chunks: any[] = [];
  // @ts-ignore
  for await (const chunk of stream) {
    chunks.push(chunk as unknown as Uint8Array);
  }
  const finalBuffer = Buffer.concat(chunks);

  const outPath = path.join(outDir, "ultimate-purpose-of-man-special.pdf");
  
  // FINAL FIX: Use unknown as the bridge to Uint8Array to satisfy the writeFile type check
  await fs.writeFile(outPath, finalBuffer as unknown as Uint8Array);

  console.log(`✅ PDF generated: ${outPath}`);
}

main().catch((err) => {
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});