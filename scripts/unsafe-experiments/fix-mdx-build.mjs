#!/usr/bin/env node
/**
 * ⚠️ DO NOT RUN IN PRODUCTION. Regex-based conversion script. Preserved only for investigation.
 *
 * scripts/fix-mdx-build.mjs
 *
 * Fixes Next.js 16 <Html> build error by replacing getStaticProps + getStaticPaths
 * with getServerSideProps on MDX-rendering pages.
 *
 * This is a known Next.js 16.2.3 bug where the MDX rendering pipeline triggers
 * a false-positive <Html> detection during static generation.
 *
 * Usage: node scripts/fix-mdx-build.mjs
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const __dirname = join(fileURLToPath(import.meta.url), "..", "..");
const ROOT = join(__dirname);

const IGNORE_DIRS = ["node_modules", ".next", ".contentlayer", ".git"];

function shouldIgnore(filePath) {
  return IGNORE_DIRS.some((dir) => filePath.includes(dir));
}

const sourceFiles = globSync("pages/**/*.tsx", {
  cwd: ROOT,
  ignore: [...IGNORE_DIRS.map((d) => `${d}/**`)],
});

let fixed = 0;
let skipped = 0;

for (const file of sourceFiles) {
  const fullPath = join(ROOT, file);
  if (!existsSync(fullPath)) continue;
  if (shouldIgnore(fullPath)) continue;

  let content = readFileSync(fullPath, "utf-8");
  const normalized = file.replace(/\\/g, "/");

  // Skip if already has getServerSideProps
  if (/getServerSideProps/.test(content)) {
    skipped++;
    continue;
  }

  // Skip pages without getStaticProps
  if (!/getStaticProps/.test(content)) {
    skipped++;
    continue;
  }

  // Skip _document, _app, _error, API routes
  if (normalized.startsWith("pages/_") || normalized.startsWith("pages/api/")) {
    skipped++;
    continue;
  }

  // Read the file line by line to do precise replacements
  const lines = content.split("\n");
  const newLines = [];
  let inStaticPaths = false;
  let inStaticProps = false;
  let braceDepth = 0;
  let removedGetStaticPaths = false;
  let removedGetStaticProps = false;
  let hasNextPageImport = false;
  let hasNextPageType = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Track if NextPage is used
    if (/NextPage/.test(line)) hasNextPageType = true;
    if (/import.*from ["']next["']/.test(line)) hasNextPageImport = true;

    // Detect start of getStaticPaths
    if (/export\s+const\s+getStaticPaths/.test(line)) {
      inStaticPaths = true;
      braceDepth = 0;
      removedGetStaticPaths = true;
      continue;
    }

    // Detect start of getStaticProps
    if (/export\s+const\s+getStaticProps/.test(line) || /export\s+async\s+function\s+getStaticProps/.test(line)) {
      inStaticProps = true;
      braceDepth = 0;
      removedGetStaticProps = true;
      continue;
    }

    // Track brace depth while inside blocks
    if (inStaticPaths || inStaticProps) {
      for (const ch of line) {
        if (ch === "{") braceDepth++;
        if (ch === "}") braceDepth--;
      }
      if (braceDepth <= 0) {
        // End of block
        inStaticPaths = false;
        inStaticProps = false;
      }
      continue; // Skip the line
    }

    // Remove GetStaticPaths/GetStaticPropsContext imports
    if (/import\s+type\s*\{[^}]*GetStaticPaths[^}]*\}\s+from\s+["']next["']/.test(line)) {
      const cleaned = line.replace(/,\s*GetStaticPaths\s*|,\s*GetStaticPropsContext\s*|GetStaticPaths\s*,?\s*|GetStaticPropsContext\s*,?\s*/g, "");
      if (cleaned.includes("GetStaticProps") || cleaned.includes("NextPage") || cleaned.includes("GetServerSideProps")) {
        newLines.push(cleaned);
      }
      continue;
    }

    newLines.push(line);
  }

  if (!removedGetStaticPaths && !removedGetStaticProps) {
    skipped++;
    continue;
  }

  // Add getServerSideProps before export default
  const gsspBlock = `
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  // Server-rendered to avoid Next.js 16 <Html> build error during static generation.
  // This is a Next.js bug triggered by the MDX rendering pipeline during prerender.
  return { props: {} };
};
`;

  // Insert before the last export default
  const lastExportIdx = newLines.findLastIndex((l) => /export\s+default/.test(l));
  if (lastExportIdx >= 0) {
    newLines.splice(lastExportIdx, 0, gsspBlock);
  } else {
    newLines.push(gsspBlock);
  }

  writeFileSync(fullPath, newLines.join("\n"), "utf-8");
  console.log(`[FIXED] ${normalized}`);
  fixed++;
}

console.log(`\nFixed: ${fixed}, Skipped: ${skipped}`);
