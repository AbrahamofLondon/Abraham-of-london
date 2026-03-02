// scripts/codemods/fix-prisma-imports.ts
// Abraham of London — Prisma Import Codemod (Pages/App Router SSOT)
// ------------------------------------------------------------------
// Rules:
// - app/** must import from "@/lib/prisma.server"
// - pages/** must import from "@/lib/prisma"
// - We rewrite both static imports and dynamic imports.
//
// Usage:
//   pnpm tsx scripts/codemods/fix-prisma-imports.ts --write
//   pnpm tsx scripts/codemods/fix-prisma-imports.ts --write --verbose
//
// Dry-run (default):
//   pnpm tsx scripts/codemods/fix-prisma-imports.ts

import fs from "fs";
import path from "path";

type Mode = "dry" | "write";

type Opts = {
  mode: Mode;
  verbose: boolean;
};

const ROOT = process.cwd();
const TARGET_EXT = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);

const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".contentlayer",
  "dist",
  "out",
  ".git",
  "public",
]);

function parseArgs(argv: string[]): Opts {
  const set = new Set(argv);
  return {
    mode: set.has("--write") ? "write" : "dry",
    verbose: set.has("--verbose") || set.has("-v"),
  };
}

function isIgnoredDir(name: string) {
  return IGNORE_DIRS.has(name);
}

function walk(dirAbs: string, out: string[]) {
  const entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  for (const ent of entries) {
    const abs = path.join(dirAbs, ent.name);
    if (ent.isDirectory()) {
      if (isIgnoredDir(ent.name)) continue;
      walk(abs, out);
      continue;
    }
    const ext = path.extname(ent.name).toLowerCase();
    if (!TARGET_EXT.has(ext)) continue;
    out.push(abs);
  }
}

function rel(p: string) {
  return path.relative(ROOT, p).replace(/\\/g, "/");
}

function isUnder(pAbs: string, top: "app" | "pages") {
  const r = rel(pAbs);
  return r === top || r.startsWith(`${top}/`);
}

function applyRewrites(code: string, kind: "app" | "pages") {
  let next = code;
  let changed = false;

  // Normalize quotes handling: match both " and '
  // Static imports:
  //   import ... from "@/lib/prisma";
  //   import ... from '@/lib/prisma';
  // Dynamic imports:
  //   await import("@/lib/prisma")
  //   await import('@/lib/prisma')

  if (kind === "app") {
    // app/** must use prisma.server
    const before = next;

    next = next
      // static imports
      .replace(
        /(from\s+)(["'])@\/lib\/prisma\2/g,
        `$1$2@/lib/prisma.server$2`,
      )
      // dynamic imports
      .replace(
        /(import\(\s*)(["'])@\/lib\/prisma\2(\s*\))/g,
        `$1$2@/lib/prisma.server$2$3`,
      );

    if (next !== before) changed = true;
  } else {
    // pages/** must use prisma (barrel)
    const before = next;

    next = next
      // static imports
      .replace(
        /(from\s+)(["'])@\/lib\/prisma\.server\2/g,
        `$1$2@/lib/prisma$2`,
      )
      // dynamic imports
      .replace(
        /(import\(\s*)(["'])@\/lib\/prisma\.server\2(\s*\))/g,
        `$1$2@/lib/prisma$2$3`,
      );

    if (next !== before) changed = true;
  }

  return { code: next, changed };
}

function safeWrite(abs: string, content: string) {
  const tmp = `${abs}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(tmp, content, "utf8");
  fs.renameSync(tmp, abs);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  const files: string[] = [];
  // Only scan relevant top-level dirs for speed and safety
  for (const top of ["app", "pages", "lib", "components"] as const) {
    const p = path.join(ROOT, top);
    if (fs.existsSync(p)) walk(p, files);
  }

  let touched = 0;
  let changedCount = 0;

  const changes: Array<{ file: string; kind: "app" | "pages"; }> = [];

  for (const abs of files) {
    const inApp = isUnder(abs, "app");
    const inPages = isUnder(abs, "pages");

    // Only enforce router-specific rewrite rules where it matters:
    // - app/** rewrites prisma -> prisma.server
    // - pages/** rewrites prisma.server -> prisma
    if (!inApp && !inPages) continue;

    const kind = inApp ? "app" : "pages";

    const raw = fs.readFileSync(abs, "utf8");
    const { code, changed } = applyRewrites(raw, kind);

    if (!changed) continue;

    touched++;
    changes.push({ file: rel(abs), kind });

    if (opts.mode === "write") {
      safeWrite(abs, code);
      changedCount++;
    }

    if (opts.verbose) {
      console.log(`• ${kind.toUpperCase()} :: ${rel(abs)}`);
    }
  }

  console.log("\n════════════════════════════════════════════════════════");
  console.log("🧬 PRISMA IMPORT CODEMOD — SUMMARY");
  console.log("════════════════════════════════════════════════════════");
  console.log(`Mode:         ${opts.mode === "write" ? "WRITE" : "DRY-RUN"}`);
  console.log(`Files scanned: ${files.length}`);
  console.log(`Files matched: ${touched}`);
  console.log(`Files changed: ${opts.mode === "write" ? changedCount : 0}`);
  console.log("════════════════════════════════════════════════════════\n");

  if (opts.mode !== "write" && touched > 0) {
    console.log("Next step:");
    console.log("  pnpm tsx scripts/codemods/fix-prisma-imports.ts --write\n");
  }

  if (touched === 0) {
    console.log("✅ No Prisma import rewrites needed.\n");
  }
}

main().catch((e) => {
  console.error("❌ Codemod failed:", e?.message || String(e));
  process.exit(1);
});