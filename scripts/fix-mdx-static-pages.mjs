#!/usr/bin/env node
/**
 * scripts/fix-mdx-static-pages.mjs
 *
 * Replaces getStaticProps + getStaticPaths with getServerSideProps
 * on Pages Router pages that render MDX content.
 *
 * This prevents the Next.js 16 <Html> build error during static generation.
 *
 * Usage: node scripts/fix-mdx-static-pages.mjs
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

const GSSP_BLOCK = `
/** @see https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props */
import type { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
  // This page renders MDX content and must be server-rendered.
  // Static generation causes a Next.js 16 runtime error:
  // "<Html> should not be imported outside of pages/_document"
  // This is a Next.js bug triggered by the MDX rendering pipeline during prerender.
  return { props: {} };
};
`;

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

  // Only fix pages with getStaticProps + MDX render
  const hasGetStaticProps = /getStaticProps/.test(content);
  const hasMDXRender = /SafeMDXRenderer|MDXComponent|getRenderableBody/.test(content);

  if (!hasGetStaticProps || !hasMDXRender) {
    skipped++;
    continue;
  }

  // Skip _document, _app, _error, API routes
  if (normalized.startsWith("pages/_") || normalized.startsWith("pages/api/")) {
    skipped++;
    continue;
  }

  // Remove getStaticPaths block (from export to the closing brace of the function)
  content = content.replace(/export\s+const\s+getStaticPaths[\s\S]*?^};/gm, "// getStaticPaths removed — using getServerSideProps");
  
  // Remove getStaticProps block
  content = content.replace(/export\s+const\s+getStaticProps[\s\S]*?^};/gm, "// getStaticProps removed — using getServerSideProps");
  
  // Also remove async function getStaticProps
  content = content.replace(/export\s+async\s+function\s+getStaticProps[\s\S]*?^}/gm, "// getStaticProps removed — using getServerSideProps");

  // Remove import of GetStaticProps/GetStaticPaths if present
  content = content.replace(/import\s+type\s*\{\s*GetStaticProps[\s\S]*?\}\s+from\s+["']next["'];/g, "");
  content = content.replace(/import\s+type\s*\{\s*GetStaticPaths[\s\S]*?\}\s+from\s+["']next["'];/g, "");

  // Add getServerSideProps at the end
  content = content.trimEnd() + GSSP_BLOCK;

  writeFileSync(fullPath, content, "utf-8");
  console.log(`[FIXED] ${normalized}`);
  fixed++;
}

console.log(`\nFixed: ${fixed}, Skipped: ${skipped}`);