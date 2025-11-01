// scripts/resize-covers.mjs
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { globSync } from "glob";

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

const IMAGE_DIR = path.join(process.cwd(), "public/assets/images");
const TARGET_WIDTH = 1600;
const SUFFIX = `@${TARGET_WIDTH}`;

async function resizeImages() {
  console.log(`Starting image audit & resize for ${TARGET_WIDTH}px...`);
  
  const pattern = `${normalizePath(IMAGE_DIR)}/**/*.{jpg,jpeg,png,webp}`;
  
  // 1. Get ALL images
  const allFiles = globSync(pattern);

  // 2. Filter out images that have ALREADY been processed
  const filesToProcess = allFiles.filter(file => !file.includes(SUFFIX));
  
  if (filesToProcess.length === 0) {
    console.log("No new images to process. All assets are up-to-date.");
    return;
  }

  console.log(`Found ${filesToProcess.length} new images to process.`);
  let processed = 0;
  let skipped = 0;

  for (const inPath of filesToProcess) {
    try {
      if (inPath.endsWith(".svg")) {
        console.log(`- Skipping SVG: ${inPath}`);
        skipped++;
        continue;
      }
      
      const outPath = inPath.replace(/\.(jpe?g|png|webp)$/i, "");
      const outWebp = `${outPath}${SUFFIX}.webp`;
      const outJpg  = `${outPath}${SUFFIX}.jpg`;

      await fs.access(inPath, fs.constants.F_OK);
      const imageBuffer = await fs.readFile(inPath);
      const image = sharp(imageBuffer);

      await image.resize({ width: TARGET_WIDTH }).webp({ quality: 72 }).toFile(outWebp);
      await image.resize({ width: TARGET_WIDTH }).flatten({ background: '#FFFFFF' }).jpeg({ quality: 80 }).toFile(outJpg);
      
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