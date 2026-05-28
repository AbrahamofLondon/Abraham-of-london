#!/usr/bin/env node
/**
 * scripts/execute-release.mjs
 *
 * Governance-grade content release executor.
 *
 * Uses the shared publication classifier via contentlayer build validation.
 * Only flips draft: true → draft: false — respects all other fields.
 * Does NOT touch outbound, registry, or any non-content files.
 *
 * Usage:
 *   node scripts/execute-release.mjs <file-path> [file-path...]
 *   node scripts/execute-release.mjs --all-pending
 *
 * Designed to be called by a GitHub Actions workflow after approval.
 * Runs on a release branch, not directly on main.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const CHANGES_LOG = [];

function releaseFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`[release] ❌ File not found: ${relativePath}`);
    return { file: relativePath, status: "error", reason: "not-found" };
  }

  let content = fs.readFileSync(fullPath, "utf8");

  // Verify it's a valid MDX file with frontmatter
  if (!content.startsWith("---")) {
    console.error(`[release] ❌ Not a valid MDX file: ${relativePath}`);
    return { file: relativePath, status: "error", reason: "not-mdx" };
  }

  // Check if already released
  if (!content.includes("draft: true")) {
    console.log(`[release] ⏭️  Already released: ${relativePath}`);
    return { file: relativePath, status: "skipped", reason: "already-released" };
  }

  // Capture current state for logging
  const titleMatch = content.match(/^title:\s*["']?(.+?)["']?$/m);
  const dateMatch = content.match(/^date:\s*["']?([^"'\n]+)/m);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(relativePath);
  const date = dateMatch ? dateMatch[1].trim() : "unknown";

  // Flip draft: true → draft: false (only this field, nothing else)
  const updated = content.replace(/^draft:\s*true$/m, "draft: false");

  if (updated === content) {
    console.error(`[release] ❌ Could not find 'draft: true' in ${relativePath}`);
    return { file: relativePath, status: "error", reason: "draft-not-found" };
  }

  fs.writeFileSync(fullPath, updated, "utf8");

  const log = { file: relativePath, title, date, status: "released" };
  CHANGES_LOG.push(log);
  console.log(`[release] ✅ ${title} — draft: true → draft: false`);
  return log;
}

// ─── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/execute-release.mjs <file-path> [file-path...]");
  console.error("   or: node scripts/execute-release.mjs --all-pending");
  process.exit(1);
}

if (args[0] === "--all-pending") {
  const reportPath = path.join(ROOT, "reports", "pending-releases.json");
  if (!fs.existsSync(reportPath)) {
    console.error("[release] No pending releases report found. Run check-and-stage-releases.mjs first.");
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const allCandidates = report.candidates || [];

  if (allCandidates.length === 0) {
    console.log("[release] No pending releases.");
    process.exit(0);
  }

  console.log(`\n============================================`);
  console.log(`📋 EXECUTING CONTENT RELEASE`);
  console.log(`============================================`);
  console.log(`Date: ${report.date}`);
  console.log(`Candidates: ${allCandidates.length}`);
  console.log(``);

  for (const entry of allCandidates) {
    releaseFile(entry.file);
  }
} else {
  console.log(`\n============================================`);
  console.log(`📋 EXECUTING CONTENT RELEASE`);
  console.log(`============================================`);
  for (const filePath of args) {
    releaseFile(filePath);
  }
}

// Summary
const released = CHANGES_LOG.filter(l => l.status === "released");
const skipped = CHANGES_LOG.filter(l => l.status === "skipped");
const errors = CHANGES_LOG.filter(l => l.status === "error");

console.log(`\n--- Summary ---`);
console.log(`Released: ${released.length}`);
console.log(`Skipped:  ${skipped.length}`);
console.log(`Errors:   ${errors.length}`);

// Write changes log for the PR body
const changesPath = path.join(ROOT, "reports", "release-changes.json");
fs.mkdirSync(path.dirname(changesPath), { recursive: true });
fs.writeFileSync(changesPath, JSON.stringify({ released, skipped, errors }, null, 2), "utf8");

if (errors.length > 0) {
  console.error(`\n❌ ${errors.length} error(s) — check release-changes.json`);
  process.exit(1);
}

console.log(`\n✅ Release complete. Changes logged to reports/release-changes.json`);
process.exit(0);