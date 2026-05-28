#!/usr/bin/env node
/**
 * scripts/execute-release.mjs
 *
 * Executes a content release by flipping draft: true → draft: false
 * on the specified file(s).
 *
 * Usage:
 *   node scripts/execute-release.mjs content/shorts/my-short.mdx
 *   node scripts/execute-release.mjs --all-pending
 *
 * Designed to be called by a GitHub Actions workflow after approval.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

function releaseFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`[release] File not found: ${relativePath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(fullPath, "utf8");

  // Check if already released
  if (!content.includes("draft: true")) {
    console.log(`[release] Already released: ${relativePath}`);
    return { file: relativePath, status: "already-released" };
  }

  // Flip draft: true → draft: false
  const updated = content.replace(/^draft:\s*true$/m, "draft: false");

  if (updated === content) {
    console.error(`[release] Could not find 'draft: true' in ${relativePath}`);
    return { file: relativePath, status: "error", reason: "draft: true not found" };
  }

  fs.writeFileSync(fullPath, updated, "utf8");
  console.log(`[release] ✅ Released: ${relativePath}`);
  return { file: relativePath, status: "released" };
}

// ─── Main ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0) {
  console.error("Usage: node scripts/execute-release.mjs <file-path> [file-path...]");
  console.error("   or: node scripts/execute-release.mjs --all-pending");
  process.exit(1);
}

if (args[0] === "--all-pending") {
  // Read pending releases from the report file
  const reportPath = path.join(ROOT, "reports", "pending-releases.json");
  if (!fs.existsSync(reportPath)) {
    console.error("[release] No pending releases report found. Run check-and-stage-releases.mjs first.");
    process.exit(1);
  }

  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
  const allDue = [...(report.dueToday || []), ...(report.overdue || [])];

  if (allDue.length === 0) {
    console.log("[release] No pending releases.");
    process.exit(0);
  }

  const results = allDue.map(entry => releaseFile(entry.file));
  const released = results.filter(r => r.status === "released");
  const skipped = results.filter(r => r.status === "already-released");

  console.log(`\n[release] Released: ${released.length}, Already released: ${skipped.length}`);
  process.exit(released.length > 0 ? 0 : 0);
} else {
  // Release specific files
  const results = args.map(releaseFile);
  const released = results.filter(r => r.status === "released");
  console.log(`\n[release] Released: ${released.length}/${args.length}`);
  process.exit(0);
}
