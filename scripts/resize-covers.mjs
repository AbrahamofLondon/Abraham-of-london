// scripts/resize-covers.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { globSync } from "glob";

// ✅ FIX: Helper function to convert Windows backslashes to forward slashes
function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

const IMAGE_DIR = path.join(process.cwd(), "public/assets/images");
const TARGET_WIDTH = 1600;

async function resizeImages() {
  console.log(`Starting image audit & resize for ${TARGET_WIDTH}px...`);
  
  // ✅ FIX: Normalize the path and pattern for glob
  const normalizedImageDir = normalizePath(IMAGE_DIR);
  const pattern = `${normalizedImageDir}/**/*.{jpg,jpeg,png,webp}`;
  
  const files = globSync(pattern, {
    ignore: [
      `**/*@${TARGET_WIDTH}.jpg`,
      `**/*@${TARGET_WIDTH}.webp`,
    ],
  });

  if (files.length === 0) {
    console.log("No new images to process. All assets are up-to-date.");
    return;
  }

  console.log(`Found ${files.length} new images to process.`);
  let processed = 0;
  let skipped = 0;

  for (const inPath of files) {
    try {
      if (inPath.endsWith(".svg")) {
        console.log(`- Skipping SVG: ${inPath}`);
        skipped++;
        continue;
      }
      
      const outPath = inPath.replace(/\.(jpe?g|png|webp)$/i, "");
      const outWebp = `${outPath}@${TARGET_WIDTH}.webp`;
      const outJpg  = `${outPath}@${TARGET_WIDTH}.jpg`;

      await fs.access(inPath, fs.constants.F_OK);

      const imageBuffer = await fs.readFile(inPath);
      const image = sharp(imageBuffer);

      await image
        .resize({ width: TARGET_WIDTH })
        .webp({ quality: 72 })
        .toFile(outWebp);

      await image
        .resize({ width: TARGET_WIDTH })
        .flatten({ background: '#FFFFFF' }) // Add white background for PNG transparency
        .jpeg({ quality: 80 })
        .toFile(outJpg);
      
      console.log(`✔ Wrote: ${outJpg.replace(normalizePath(process.cwd()), "")}`);
      processed++;
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.error(`✖ Error: File not found ${inPath}`);
      } else {
        console.error(`✖ Error processing ${inPath}:`, err.message);
      }
      skipped++;
    }
  }
  console.log(`\nDone. Processed ${processed} images. Skipped ${skipped}.`);
}

resizeImages();