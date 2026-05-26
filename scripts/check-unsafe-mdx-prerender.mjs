#!/usr/bin/env node
/**
 * scripts/check-unsafe-mdx-prerender.mjs
 *
 * Fails if any Pages Router route with getStaticProps imports:
 *   - useMDXComponent
 *   - next-contentlayer2/hooks
 *   - mdx-bundler/client
 *   - getMDXComponent
 *
 * These imports trigger Next.js 16's <Html> document import guard during
 * static generation, causing build failures on MDX-rendering pages.
 *
 * SSG pages must use StaticMDXRenderer (from lib/mdx/static-mdx-runtime.ts)
 * instead, which renders markdown/HTML without runtime MDX evaluation.
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

// Patterns that are UNSAFE in SSG context
const UNSAFE_IMPORT_PATTERNS = [
  /from\s+["']next-contentlayer2\/hooks["']/,
  /from\s+["']mdx-bundler\/client["']/,
  /\buseMDXComponent\b/,
  /\bgetMDXComponent\b/,
];

const sourceFiles = globSync("pages/**/*.{ts,tsx}", {
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

  // Skip API routes and _app/_document/_error
  if (normalized.startsWith("pages/api/") || normalized.startsWith("pages/_")) {
    continue;
  }

  // Only check pages with getStaticProps (SSG pages)
  const hasGetStaticProps = /getStaticProps/.test(content);
  if (!hasGetStaticProps) continue;

  // Check for unsafe imports
  for (const pattern of UNSAFE_IMPORT_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      violations.push(
        `${normalized}: imports unsafe MDX runtime (${match ? match[0].trim() : pattern}) in SSG page`,
      );
    }
  }

  // Also check if the page imports a component that transitively uses unsafe runtime
  // (Simple check: does it import SafeMDXRenderer or ServerMDXRenderer which use useMDXComponent?)
  if (
    /from\s+["']@\/components\/mdx\/SafeMDXRenderer["']/.test(content) ||
    /from\s+["']@\/components\/mdx\/ServerMDXRenderer["']/.test(content) ||
    /from\s+["']@\/components\/canon\/CanonContent["']/.test(content) ||
    /from\s+["']@\/components\/shorts\/ShortContent["']/.test(content) ||
    /from\s+["']@\/components\/content\/ContentLayout["']/.test(content)
  ) {
    violations.push(
      `${normalized}: imports component that transitively uses unsafe MDX runtime (useMDXComponent) in SSG page`,
    );
  }
}

if (violations.length > 0) {
  console.error(`\n❌ [UNSAFE_MDX_PRERENDER] Found ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`  - ${v}`);
  }
  console.error(
    "\n  Fix: Replace with StaticMDXRenderer from '@/lib/mdx/static-mdx-runtime'\n",
  );
  process.exit(1);
} else {
  console.log("✅ [UNSAFE_MDX_PRERENDER] No SSG page imports unsafe MDX runtime.");
  process.exit(0);
}
