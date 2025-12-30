/* scripts/generate-ultimate-purpose-of-man-pdf.tsx */
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import React from "react";
import { renderToFile, Font } from "@react-pdf/renderer";

// Import your component
import UltimatePurposeOfManDocument from "../lib/pdf/ultimate-purpose-of-man-pdf";

// Helper: Register fonts using local TTF files or System Fallbacks
function registerLocalFonts() {
  const fontsDir = path.join(process.cwd(), "public", "fonts");

  // 1. AoLSerif (Use your local .ttf files - these are safe)
  const serifRegular = path.join(fontsDir, "AoLSerif-Regular.ttf");
  const serifItalic = path.join(fontsDir, "AoLSerif-Italic.ttf");

  if (fsSync.existsSync(serifRegular) && fsSync.existsSync(serifItalic)) {
    Font.register({
      family: "AoLSerif",
      fonts: [
        { src: serifRegular, fontWeight: 400 },
        { src: serifItalic, fontWeight: 400, fontStyle: "italic" },
      ],
    });
    console.log("✅ Registered AoLSerif (Local .ttf)");
  } else {
    console.warn("⚠️ AoLSerif .ttf files missing. Using Times-Roman.");
    Font.register({ family: "AoLSerif", src: "Times-Roman" });
  }

  // 2. AoLMono (FIX: Use Courier instead of the corrupt WOFF2 file)
  // The 'Bad base 128 number' error comes from parsing the woff2 file.
  // Courier is a standard PDF font and guaranteed to work.
  Font.register({
    family: "AoLMono",
    src: "Courier",
  });
  console.log("✅ Registered AoLMono (System Courier)");

  // 3. AoLSans (Use Helvetica to prevent network fetch/crash)
  Font.register({
    family: "AoLSans",
    src: "Helvetica",
  });
  console.log("✅ Registered AoLSans (System Helvetica)");
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  try {
    // 1. Register fonts first
    registerLocalFonts();

    // 2. Prepare output directories
    const outDir = path.join(process.cwd(), "public", "downloads");
    const outFile = path.join(outDir, "ultimate-purpose-of-man-editorial.pdf");
    await ensureDir(outDir);

    // 3. Resolve cover image
    const publicDir = path.join(process.cwd(), "public");
    const primaryCoverPath = path.join(publicDir, "assets", "images", "purpose-cover.jpg");
    const fallbackCoverPath = path.join(publicDir, "assets", "images", "writing-desk.webp");

    let coverToUse = primaryCoverPath;
    try {
      await fs.access(primaryCoverPath);
    } catch {
      console.warn("⚠️ Primary cover not found, using fallback image.");
      coverToUse = fallbackCoverPath;
    }

    // 4. Render PDF
    console.log("📄 Generating PDF...");
    await renderToFile(
      <UltimatePurposeOfManDocument coverImagePath={coverToUse} />,
      outFile
    );

    console.log(`✅ Success! PDF saved to: ${outFile}`);
  } catch (error) {
    console.error("❌ PDF generation failed:", error);
    process.exit(1);
  }
}

main();