/* scripts/generate-ultimate-purpose-of-man-pdf.tsx */
import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import React from "react";
import { renderToFile, Font } from "@react-pdf/renderer";

import UltimatePurposeOfManDocument from "../lib/pdf/ultimate-purpose-of-man-pdf";

function registerFonts() {
  const fontsDir = path.join(process.cwd(), "public", "fonts");

  // 1. AoLSerif - Try local, fallback to Times-Roman
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
    console.log("✅ Registered AoLSerif (Local TTF)");
  } else {
    Font.register({ family: "AoLSerif", src: "Times-Roman" });
    console.log("✅ Registered AoLSerif (System Times-Roman)");
  }

  // 2. AoLSans - Force Helvetica
  // This is the cleanest sans-serif font available by default in PDFs
  Font.register({
    family: "AoLSans",
    src: "Helvetica", 
  });
  console.log("✅ Registered AoLSans (System Helvetica)");

  // 3. AoLMono - Force Courier
  Font.register({
    family: "AoLMono",
    src: "Courier",
  });
  console.log("✅ Registered AoLMono (System Courier)");
}

async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  try {
    // 1. Register fonts
    registerFonts();

    // 2. Prepare paths
    const outDir = path.join(process.cwd(), "public", "downloads");
    const outFile = path.join(outDir, "ultimate-purpose-of-man-editorial.pdf");
    await ensureDir(outDir);

    // 3. Resolve Assets
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

    // 4. Render
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