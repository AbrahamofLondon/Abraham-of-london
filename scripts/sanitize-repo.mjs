// scripts/sanitize-repo.mjs
// This script recursively finds all .ts, .tsx, .js, .mjs, .cjs, and .mdx files
// and fixes the "Unexpected }" or "early closing >" corruption.

import { promises as fsp } from "fs";
import path from "path";
import { globby } from "globby"; // You already have this from 'npm i -D globby'

const ROOT = process.cwd();
const PATTERNS = [
  "**/*.{ts,tsx,js,mjs,cjs}", // All script/component files
  "content/**/*.mdx",         // All content files
  "contentlayer.config.ts",   // The config file
  "next.config.mjs",          // The next config
];
const IGNORE = ["**/node_modules/**", "**/.next/**", "**/public/**"];

async function main() {
  console.log("[Sanitizer] Scanning repository for corrupted files...");
  
  const files = await globby(PATTERNS, {
    cwd: ROOT,
    ignore: IGNORE,
    absolute: true,
  });

  let fixedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const relPath = path.relative(ROOT, file);
    let raw;
    try {
      raw = await fsp.readFile(file, "utf8");
    } catch (e) {
      console.error(`[Sanitizer] ❌ FAILED to read ${relPath}: ${e.message}`);
      errorCount++;
      continue;
    }

    // This regex finds the last valid closing brace or bracket on its own line
    const match = raw.match(/^[\s\S]*^[\s]*[})\]]\s*$/m);

    if (!match) {
      // This file doesn't end in a brace/bracket, so it's probably not corrupted
      continue;
    }

    // Get the clean content up to that last brace
    const fixed = match[0].replace(/\s+$/, "") + "\n"; // Add a single newline

    if (fixed !== raw) {
      try {
        await fsp.writeFile(file, fixed, "utf8");
        console.log(`[Sanitizer] ✅ Fixed corruption in: ${relPath}`);
        fixedCount++;
      } catch (e) {
        console.error(`[Sanitizer] ❌ FAILED to write ${relPath}: ${e.message}`);
        errorCount++;
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  if (errorCount > 0) {
    console.error(`[Sanitizer] Finished with ${errorCount} error(s).`);
  } else {
    console.log(`[Sanitizer] ✅ Success! Scanned ${files.length} files. Fixed ${fixedCount} corrupted files.`);
  }
  console.log("=".repeat(60));
}
