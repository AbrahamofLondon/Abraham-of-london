// scripts/strip-bom-lf.mjs
// Removes UTF-8 BOM and converts CRLF to LF for all text files.

import fsp from "node:fs/promises";
import path from "node:path";
import glob from "fast-glob";

const ROOT = process.cwd();
const PATTERNS = [
  "**/*.{js,mjs,cjs,ts,tsx,md,mdx,json,css,html,yml,yaml}",
  "content/**",
  "public/assets/**/*.svg",
];
const IGNORE = ["**/node_modules/**", "**/.next/**", "**/out/**"];
const BOM = "\uFEFF";

async function main() {
  console.log("[bom-fix] Stripping BOM and normalizing line endings...");
  
  const files = await glob(PATTERNS, {
    cwd: ROOT,
    ignore: IGNORE,
    absolute: true,
    dot: true, // Include dotfiles like .eslintrc
  });

  if (!files.length) {
    console.log("[bom-fix] No files found to process.");
    return;
  }

  let fixed = 0;
  for (const file of files) {
    try {
      const raw = await fsp.readFile(file, "utf8");
      let content = raw;
      let changed = false;

      // 1. Fix Line Endings (CRLF -> LF)
      if (content.includes("\r\n")) {
        content = content.replace(/\r\n/g, "\n");
        changed = true;
      }

      // 2. Fix BOM
      if (content.startsWith(BOM)) {
        content = content.substring(1);
        changed = true;
      }

      if (changed) {
        await fsp.writeFile(file, content, "utf8");
        fixed++;
      }
    } catch (e) {
      console.warn(`[bom-fix] Could not process file ${file}: ${e.message}`);
    }
  }

  console.log(`[bom-fix] Done. Scanned ${files.length} files, fixed ${fixed}.`);
}
