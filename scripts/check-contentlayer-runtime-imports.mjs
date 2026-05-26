#!/usr/bin/env node
/**
 * scripts/check-contentlayer-runtime-imports.mjs
 *
 * Guard script: fails CI / build if require("contentlayer/generated") or a
 * static import("contentlayer/generated") appears in any file OUTSIDE the
 * approved SSG / build-only allow-list.
 *
 * Background
 * ----------
 * webpack bundles every statically-analysable require/import it can trace.
 * `require("contentlayer/generated")` inlines ALL 300+ MDX documents
 * (~47 MB of JSON) into the server chunk, which exceeds Vercel Hobby's
 * 50 MB unzipped Lambda limit and causes "Deploying outputs... Error".
 *
 * Approved files may import contentlayer/generated because they run ONLY
 * at build time (getStaticProps / getStaticPaths scripts) or are dead-code
 * stubs that webpack never reaches via a live import path.
 *
 * Usage
 *   node scripts/check-contentlayer-runtime-imports.mjs
 *
 * Exit codes
 *   0 — no violations found
 *   1 — one or more violations found (fails the build)
 */

import fs from "node:fs";
import path from "node:path";

// ─── Allow-list ──────────────────────────────────────────────────────────────
// Files allowed to reference "contentlayer/generated" (build-only / dead-code).
// Paths are relative to the project root and use POSIX separators.
const ALLOWED = new Set([
  // These stubs have no live importers — webpack never reaches them.
  "lib/contentlayer/index.ts",
  "lib/contentlayer/ssot.ts",
  "lib/content/queries.ts",
  "lib/content/server-override.ts",
  "lib/server/site-counts.ts",

  // TYPE-only import — erased by tsc, not bundled by webpack.
  "pages/playbooks/index.tsx",
  "pages/playbooks/[slug].tsx",

  // Dev-only diagnostic, never in production bundle.
  "pages/api/debug/contentlayer-exports.ts",
]);

// ─── Patterns that trigger a violation ───────────────────────────────────────
// These match static require/import that webpack CAN trace.
const VIOLATION_PATTERNS = [
  // Static synchronous require
  /require\s*\(\s*['"]contentlayer\/generated['"]\s*\)/,
  // Dynamic import — also traced by webpack into a separate async chunk
  /import\s*\(\s*['"]contentlayer\/generated['"]\s*\)/,
  // Static ESM import (would be caught by tsc but guard it here too)
  /from\s+['"]contentlayer\/generated['"]/,
];

// ─── Directories to scan ─────────────────────────────────────────────────────
const SCAN_DIRS = ["lib", "pages", "app", "components", "src"];
const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

// ─── Skip directories ─────────────────────────────────────────────────────────
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".contentlayer",
  ".netlify",
  ".vercel",
  "dist",
  "out",
  ".git",
]);

const projectRoot = process.cwd();

function* walkDir(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walkDir(full);
    } else if (entry.isFile() && SCAN_EXTENSIONS.has(path.extname(entry.name))) {
      yield full;
    }
  }
}

let violations = 0;

for (const scanDir of SCAN_DIRS) {
  const absDir = path.join(projectRoot, scanDir);
  if (!fs.existsSync(absDir)) continue;

  for (const filePath of walkDir(absDir)) {
    const rel = path.relative(projectRoot, filePath).replace(/\\/g, "/");

    // Read file
    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch {
      continue;
    }

    // Skip if the ONLY matches are in "import type" positions (erased by tsc)
    // and skip entire allow-listed files.
    if (ALLOWED.has(rel)) continue;

    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Allow type-only imports (erased by TypeScript, invisible to webpack)
      if (/^\s*import\s+type\b/.test(line)) continue;
      // Allow comment lines
      if (/^\s*\/\//.test(line) || /^\s*\*/.test(line)) continue;

      for (const pattern of VIOLATION_PATTERNS) {
        if (pattern.test(line)) {
          console.error(
            `[check-contentlayer] VIOLATION: ${rel}:${i + 1}\n  ${line.trim()}`,
          );
          violations++;
          break; // one error per line is enough
        }
      }
    }
  }
}

if (violations > 0) {
  console.error(
    `\n[check-contentlayer] ${violations} violation(s) found.\n` +
      `Runtime files must NOT import contentlayer/generated — use\n` +
      `lib/contentlayer-helper.ts (reads _index.json from disk) instead.\n` +
      `If the file is build-only / dead-code, add it to the ALLOWED set\n` +
      `in scripts/check-contentlayer-runtime-imports.mjs.`,
  );
  process.exit(1);
}

console.log(
  `[check-contentlayer] ✓ No runtime contentlayer/generated imports found.`,
);
