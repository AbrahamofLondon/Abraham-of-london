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

// Font URLs (Direct from Google Fonts CDN)
const FONTS = {
  AoLSerif_Regular: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFiD-vYSZviVYUb_rj3ij__anPXDTzYhig.woff2",
  AoLSerif_Italic: "https://fonts.gstatic.com/s/playfairdisplay/v30/nuFkD-vYSZviVYUb_rj3ij__anPXDTzYhCBN.woff2",
  AoLSans_Regular: "https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boK.woff2",
  AoLMono_Regular: "https://fonts.gstatic.com/s/jetbrainsmono/v18/tDbY2oWUg0MKqScQ7Z7o_vo0qZxP9kFz.woff2",
};

async function downloadFont(url: string, destPath: string) {
  if (fsSync.existsSync(destPath)) return; // Skip if exists

  console.log(`⬇️ Downloading font to ${path.basename(destPath)}...`);
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch font: ${res.statusText}`);
    const arrayBuffer = await res.arrayBuffer();
    await fs.writeFile(destPath, Buffer.from(arrayBuffer));
  } catch (e) {
    console.warn(`⚠️ Warning: Could not download font from ${url}. Continuing...`);
  }
}

async function prepareFonts() {
  const fontsDir = path.join(process.cwd(), "public", "fonts");
  await fs.mkdir(fontsDir, { recursive: true });

  // 1. Download missing fonts (Self-healing)
  await downloadFont(FONTS.AoLSerif_Regular, path.join(fontsDir, "AoLSerif-Regular.woff2"));
  await downloadFont(FONTS.AoLSerif_Italic, path.join(fontsDir, "AoLSerif-Italic.woff2"));
  await downloadFont(FONTS.AoLSans_Regular, path.join(fontsDir, "AoLSans-Regular.woff2"));
  await downloadFont(FONTS.AoLMono_Regular, path.join(fontsDir, "AoLMono-Regular.woff2"));

  // 2. Register them explicitly for Node.js rendering
  // We prefer the .woff2 files we just downloaded, or .ttf if you manually added them
  const registerIfExists = (family: string, file: string, fallback: string) => {
    const filePath = path.join(fontsDir, file);
    if (fsSync.existsSync(filePath)) {
      Font.register({ family, src: filePath });
    } else {
      console.warn(`⚠️ Font ${file} missing. Using fallback ${fallback}.`);
      Font.register({ family, src: fallback });
    }
  };

  // Complex registration for Serif (Regular + Italic)
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

  // Simple registration for others
  registerIfExists("AoLSans", "AoLSans-Regular.woff2", "Helvetica");
  registerIfExists("AoLMono", "AoLMono-Regular.woff2", "Courier");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function resolveCoverDiskPath(): string {
  return path.join(process.cwd(), "public", "assets", "images", "purpose-cover.jpg");
}

async function main() {
  const outDir = path.join(process.cwd(), "public", "downloads");
  await ensureDir(outDir);

  // 1. Setup fonts
  await prepareFonts();

  // 2. Resolve assets
  const coverDiskPath = resolveCoverDiskPath();
  
  // Fallback if cover doesn't exist
  let coverToUse = coverDiskPath;
  try {
    await fs.access(coverDiskPath);
  } catch {
    console.warn("⚠️ Primary cover not found, using fallback.");
    coverToUse = path.join(process.cwd(), "public", "assets", "images", "writing-desk.webp");
  }

  // 3. Create element
  const element = React.createElement(
    UltimatePurposeOfManDocument as unknown as React.ComponentType<UltimatePurposeOfManDocumentProps>,
    { coverImagePath: coverToUse }
  ) as unknown as React.ReactElement<DocumentProps>;

  // 4. Render
  console.log("📄 Generating PDF...");
  const instance = pdf(element);
  const buffer = await instance.toBuffer();

  const outPath = path.join(outDir, "ultimate-purpose-of-man-special.pdf");
  
  // 5. Save
  await fs.writeFile(destPath, Buffer.from(arrayBuffer) as unknown as Uint8Array);

  console.log(`✅ PDF generated: ${outPath}`);
}

main().catch((err) => {
  console.error("❌ PDF generation failed:", err);
  process.exit(1);
});