// scripts/update-image-paths.mjs
import fs from "node:fs/promises";
import path from "node:path";
import { globSync } from "glob";

// Helper to normalize paths for Windows
function normalizePath(p) {
  return p.replace(/\\/g, "/");
}

const CONTENT_DIR = path.join(process.cwd(), "content");

async function updateImagePaths() {
  console.log("Scanning all .mdx files for image paths to update...");
  
  const pattern = `${normalizePath(CONTENT_DIR)}/**/*.mdx`;
  const files = globSync(pattern);

  // This regex finds a 'coverImage' line and updates the path to the @1600.jpg version.
  // It uses a "negative lookbehind" (?<!@1600) to ensure it doesn't replace paths that are already fixed.
  const regex = /(coverImage:\s*["'])([^"']*)(?<!@1600)\.(jpe?g|webp)(["'])/gi;
  const replacement = '$1$2@1600.jpg$4';

  let updatedCount = 0;

  for (const file of files) {
    try {
      const originalContent = await fs.readFile(file, "utf8");
      const updatedContent = originalContent.replace(regex, replacement);

      if (originalContent !== updatedContent) {
        await fs.writeFile(file, updatedContent, "utf8");
        console.log(`✔ Updated: ${file.replace(normalizePath(process.cwd()), "")}`);
        updatedCount++;
      }
    } catch (err) {
      console.error(`✖ Error processing ${file}:`, err.message);
    }
  }

  console.log(`\nDone. Updated ${updatedCount} files to use new @1600.jpg images.`);
}

updateImagePaths();