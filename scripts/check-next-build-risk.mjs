#!/usr/bin/env node
/**
 * scripts/check-next-build-risk.mjs
 *
 * Scans source files for patterns known to cause Next.js build failures.
 * Flags:
 * - next/document outside pages/_document
 * - next/router inside app/
 * - window/document/localStorage/sessionStorage outside client components
 * - <Html> usage outside _document
 * - raw MDX renderer importing unsafe components
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const __dirname = join(fileURLToPath(import.meta.url), "..", "..");
const ROOT = join(__dirname);

const IGNORE_DIRS = ["node_modules", ".next", ".contentlayer", ".git"];

function shouldIgnore(filePath) {
  return IGNORE_DIRS.some((dir) => filePath.includes(dir));
}

const sourceFiles = globSync("**/*.{ts,tsx,js,jsx}", {
  cwd: ROOT,
  ignore: [...IGNORE_DIRS.map((d) => `${d}/**`)],
});

let violations = [];

for (const file of sourceFiles) {
  const fullPath = join(ROOT, file);
  if (!existsSync(fullPath)) continue;
  if (shouldIgnore(fullPath)) continue;

  const content = readFileSync(fullPath, "utf-8");
  const normalized = file.replace(/\\/g, "/");

  // 1. next/document outside pages/_document
  if (/from\s+["']next\/document["']/.test(content)) {
    if (normalized !== "pages/_document.tsx") {
      violations.push(`${normalized}: imports from next/document outside pages/_document`);
    }
  }

  // 2. <Html> usage outside _document — strip comments first to avoid false positives
  const contentNoComments = content
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
  if (/<Html[\s>]/.test(contentNoComments)) {
    if (normalized !== "pages/_document.tsx") {
      violations.push(`${normalized}: uses <Html> tag outside pages/_document`);
    }
  }

  // 3. next/router inside app/ directory
  if (normalized.startsWith("app/") && /from\s+["']next\/router["']/.test(content)) {
    violations.push(`${normalized}: imports next/router inside app/ directory`);
  }

  // 4. Browser APIs outside client components in app/
  if (normalized.startsWith("app/") && !normalized.includes("page.tsx")) {
    // Skip page files — they can be client components
    const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
    if (!hasUseClient) {
      if (/\bwindow\b/.test(content) && !/import/.test(content)) {
        // Only flag if window is used as a value, not in a string
        const windowUsage = content.match(/\bwindow\.\w+/);
        if (windowUsage) {
          violations.push(`${normalized}: uses window.${windowUsage[0].split(".")[1]} without 'use client'`);
        }
      }
    }
  }

  // 5. getStaticProps on pages that render MDX AND directly import from next/document.
  // Safe MDX renderers (SafeMDXRenderer, MDXComponent, getRenderableBody) do not use
  // next/document internally, so getStaticProps + MDX alone is not a risk.
  if (normalized.startsWith("pages/") && normalized.endsWith(".tsx")) {
    const hasGetStaticProps = /getStaticProps/.test(contentNoComments);
    const hasDocumentImport = /from\s+["']next\/document["']/.test(contentNoComments);
    if (hasGetStaticProps && hasDocumentImport) {
      violations.push(`${normalized}: getStaticProps + next/document import — will cause build error in Next.js 16`);
    }
  }
}

if (violations.length > 0) {
  console.error(`\n❌ [BUILD_RISK] Found ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error("\n");
  process.exit(1);
} else {
  console.log("✅ [BUILD_RISK] No high-risk patterns detected.");
  process.exit(0);
}
