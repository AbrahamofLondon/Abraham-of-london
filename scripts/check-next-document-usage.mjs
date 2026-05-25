#!/usr/bin/env node
/**
 * scripts/check-next-document-usage.mjs
 *
 * Canary: Ensures next/document is only imported in pages/_document.tsx.
 * Fails if any other file imports from "next/document".
 *
 * Usage: node scripts/check-next-document-usage.mjs
 * Exit code 0 = pass, 1 = fail
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const __dirname = join(fileURLToPath(import.meta.url), "..", "..");
const ROOT = join(__dirname);

// Only check source files, not node_modules or .next
const IGNORE_DIRS = ["node_modules", ".next", ".contentlayer", ".git"];

function shouldIgnore(filePath) {
  return IGNORE_DIRS.some((dir) => filePath.includes(dir));
}

// Find all .ts, .tsx, .js, .jsx files
const sourceFiles = globSync("**/*.{ts,tsx,js,jsx}", {
  cwd: ROOT,
  ignore: [...IGNORE_DIRS.map((d) => `${d}/**`), "next-sitemap.config.*"],
});

let violations = [];

for (const file of sourceFiles) {
  const fullPath = join(ROOT, file);
  if (!existsSync(fullPath)) continue;
  if (shouldIgnore(fullPath)) continue;

  const content = readFileSync(fullPath, "utf-8");

  // Check for imports from "next/document"
  const importRegex = /from\s+["']next\/document["']/;
  if (importRegex.test(content)) {
    // Only pages/_document.tsx is allowed
    const normalized = file.replace(/\\/g, "/");
    if (normalized !== "pages/_document.tsx") {
      violations.push(normalized);
    }
  }

  // Check for usage of <Html> tag (JSX)
  const htmlTagRegex = /<Html[\s>]/;
  if (htmlTagRegex.test(content)) {
    const normalized = file.replace(/\\/g, "/");
    if (normalized !== "pages/_document.tsx") {
      violations.push(`${normalized} (uses <Html> tag)`);
    }
  }
}

if (violations.length > 0) {
  console.error(
    `❌ [next-document-usage] Found ${violations.length} file(s) illegally importing from next/document or using <Html>:`
  );
  for (const v of violations) {
    console.error(`   - ${v}`);
  }
  console.error(
    "\n   next/document may only be used in pages/_document.tsx."
  );
  process.exit(1);
} else {
  console.log(
    "✅ [next-document-usage] No illegal next/document imports found."
  );
  process.exit(0);
}
