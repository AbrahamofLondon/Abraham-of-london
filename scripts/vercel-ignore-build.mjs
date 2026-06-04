#!/usr/bin/env node
/**
 * scripts/vercel-ignore-build.mjs
 *
 * Vercel Ignored Build Step script.
 * Set in vercel.json: "ignoreCommand": "node scripts/vercel-ignore-build.mjs"
 *
 * Exit codes:
 *   0 → ignore deployment / skip build
 *   1 → continue deployment / build
 *
 * Vercel docs: https://vercel.com/docs/projects/overview#ignored-build-step
 */

import { execFileSync } from "child_process";

const PREV = process.env.VERCEL_GIT_PREVIOUS_SHA || "";
const CURR = process.env.VERCEL_GIT_COMMIT_SHA   || "";

// ─── Get changed files ────────────────────────────────────────────────────────

function getChangedFiles() {
  if (!PREV || !CURR || PREV === CURR) {
    // No diff info — conservative: always build
    console.log("[vercel-ignore] No previous SHA available. Building.");
    return null;
  }

  if (!/^[0-9a-f]{7,40}$/i.test(PREV) || !/^[0-9a-f]{7,40}$/i.test(CURR)) {
    console.log("[vercel-ignore] Invalid SHA input. Building conservatively.");
    return null;
  }

  try {
    const out = execFileSync("git", ["diff", "--name-only", PREV, CURR], {
      encoding: "utf-8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return out.trim().split("\n").filter(Boolean);
  } catch {
    console.log("[vercel-ignore] git diff failed. Building conservatively.");
    return null;
  }
}

// ─── Pattern matchers ─────────────────────────────────────────────────────────

// Files in these patterns ALWAYS trigger a build — any match here → build
const RUNTIME_PATTERNS = [
  /^pages\//,
  /^app\//,
  /^components\//,
  /^lib\//,
  /^content\//,
  /^public\//,
  /^styles\//,
  /^middleware\//,
  /^hooks\//,
  /^contexts\//,
  /^types\//,
  /^prisma\//,
  /^next\.config\./,
  /^contentlayer\.config\./,
  /^package\.json$/,
  /^pnpm-lock\.yaml$/,
  /^netlify\.toml$/,
  /^vercel\.json$/,
  /^proxy\.ts$/,
  /^\.env/,
  /^emails\//,
  /^migrations\//,
  /^sql\//,
  /^store\//,
  /^services\//,
];

// Files in these patterns NEVER trigger a build on their own — safe to skip
const SKIP_PATTERNS = [
  /^docs\//,
  /^tests\//,
  /^__tests__\//,
  /^_tests_\//,
  /^\.codex\//,
  /^screenshots\//,
  /^_ct600_working\//,
  /^_ct600_workingalomarada/,
  /^local-tax\//,
  /^_archive\//,
  /^archive\//,
  /^reports\//,
  /^playwright-report\//,
  /^test-results\//,
  /^coverage\//,
  /^\.github\//,
  /^\.vscode\//,
  /^design migration\//,
  /^old manual\//,
  /^video\//,
  /^triage_hold\//,
  /^backup\//,
  // Root-level markdown docs (not content/)
  /^[A-Z_-]+\.md$/,
  /^CONTRIBUTING\.md$/,
  /^DEBT\.md$/,
  /^MIGRATION\.md$/,
  /^README\.md$/,
  // Audit/log files
  /build-.*\.log$/,
  /\.log$/,
  /changed-.*\.txt$/,
  /bucket-.*\.txt$/,
  // Scripts that are only used for local audit/governance (not Vercel build)
  /^scripts\/audit\//,
  /^scripts\/verify/,
  /^scripts\/check/,
  /^scripts\/scan/,
  /^scripts\/validate/,
  // Test config
  /^jest\.config/,
  /^vitest\.config/,
  /^playwright\.config/,
];

function isRuntimeFile(file) {
  return RUNTIME_PATTERNS.some((p) => p.test(file));
}

function isSkipFile(file) {
  return SKIP_PATTERNS.some((p) => p.test(file));
}

// ─── Decision ─────────────────────────────────────────────────────────────────

const files = getChangedFiles();

if (!files) {
  // Conservative: build
  process.exit(1);
}

const runtimeFiles  = files.filter(isRuntimeFile);
const skipFiles     = files.filter(isSkipFile);
const unknownFiles  = files.filter((f) => !isRuntimeFile(f) && !isSkipFile(f));

console.log(`[vercel-ignore] Changed files: ${files.length}`);
console.log(`[vercel-ignore] Runtime files: ${runtimeFiles.length}`);
console.log(`[vercel-ignore] Skip-safe files: ${skipFiles.length}`);
console.log(`[vercel-ignore] Unknown files: ${unknownFiles.length}`);

if (unknownFiles.length > 0) {
  console.log("[vercel-ignore] Unknown files (conservative — building):");
  unknownFiles.forEach((f) => console.log(`  ${f}`));
}

if (runtimeFiles.length > 0) {
  console.log("[vercel-ignore] Runtime changes detected — building:");
  runtimeFiles.slice(0, 10).forEach((f) => console.log(`  ${f}`));
  if (runtimeFiles.length > 10) console.log(`  ... and ${runtimeFiles.length - 10} more`);
  process.exit(1); // Build
}

if (unknownFiles.length > 0) {
  // Unknown files: conservative — build
  process.exit(1);
}

// Only skip files changed
console.log("[vercel-ignore] Only non-runtime files changed. Skipping build.");
console.log("[vercel-ignore] Skipped files:");
skipFiles.slice(0, 10).forEach((f) => console.log(`  ${f}`));
if (skipFiles.length > 10) console.log(`  ... and ${skipFiles.length - 10} more`);
process.exit(0); // Skip
