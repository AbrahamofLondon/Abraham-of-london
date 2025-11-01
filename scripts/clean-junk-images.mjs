// scripts/clean-junk-images.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { globSync } from "glob";

function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

const IMAGE_DIR = path.join(process.cwd(), "public/assets/images");

async function deleteJunkImages() {
  console.log("Scanning for junk images (e.g., 'image@1600@1600.jpg')...");
  
  // Find only files that have been processed more than once
  const pattern = `${normalizePath(IMAGE_DIR)}/**/*@1600@1600.*`;
  const files = globSync(pattern);

  if (files.length === 0) {
    console.log("No junk images found to delete.");
    return;
  }

  console.log(`Found ${files.length} junk images. Deleting...`);
  let deletedCount = 0;

  for (const file of files) {
    try {
      await fs.unlink(file);
      console.log(`- Deleted: ${file.replace(normalizePath(process.cwd()), "")}`);
      deletedCount++;
    } catch (err) {
      console.error(`✖ Error deleting ${file}:`, err.message);
    }
  }

  console.log(`\nDone. Deleted ${deletedCount} junk image files.`);
}

deleteJunkImages();