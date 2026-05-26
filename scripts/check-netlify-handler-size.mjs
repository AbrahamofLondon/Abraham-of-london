#!/usr/bin/env node
/**
 * scripts/check-netlify-handler-size.mjs
 *
 * Checks the size of the Netlify server handler after build.
 * Fails if projected unzipped size > 240 MB.
 * Warns if > 220 MB.
 *
 * Run after: pnpm build:netlify
 */

import { existsSync, statSync, readdirSync, readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import { globSync } from "glob";

const __dirname = join(fileURLToPath(import.meta.url), "..", "..");
const ROOT = join(__dirname);

const HANDLER_DIR = join(ROOT, ".netlify", "functions", "___netlify-server-handler");
const HANDLER_ZIP = join(ROOT, ".netlify", "functions", "___netlify-server-handler.zip");
const FUNCTIONS_DIR = join(ROOT, ".netlify", "functions");

const LIMIT_WARN_MB = 220;
const LIMIT_FAIL_MB = 240;

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getDirSize(dirPath) {
  let total = 0;
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);
      if (entry.isDirectory()) {
        total += getDirSize(fullPath);
      } else if (entry.isFile()) {
        total += statSync(fullPath).size;
      }
    }
  } catch {
    // skip inaccessible
  }
  return total;
}

function getTopFiles(dirPath, maxFiles = 50) {
  const files = [];
  try {
    const entries = readdirSync(dirPath, { withFileTypes: true, recursive: true });
    for (const entry of entries) {
      if (entry.isFile()) {
        const fullPath = join(entry.parentPath ?? entry.path, entry.name);
        try {
          files.push({ path: fullPath, size: statSync(fullPath).size });
        } catch {
          // skip
        }
      }
    }
  } catch {
    // recursive not available in older Node — fallback
    try {
      const allFiles = globSync("**/*", { cwd: dirPath, nodir: true });
      for (const f of allFiles) {
        const fullPath = join(dirPath, f);
        try {
          files.push({ path: fullPath, size: statSync(fullPath).size });
        } catch {
          // skip
        }
      }
    } catch {
      // skip
    }
  }
  files.sort((a, b) => b.size - a.size);
  return files.slice(0, maxFiles);
}

function main() {
  console.log("\n=== NETLIFY HANDLER SIZE CHECK ===\n");

  // Check handler directory
  if (!existsSync(HANDLER_DIR) && !existsSync(HANDLER_ZIP)) {
    // Check if any functions exist
    if (existsSync(FUNCTIONS_DIR)) {
      const funcDirs = readdirSync(FUNCTIONS_DIR).filter(
        (f) => f !== "." && f !== ".."
      );
      console.log(`Found ${funcDirs.length} function(s) in .netlify/functions/`);
      for (const func of funcDirs) {
        const funcPath = join(FUNCTIONS_DIR, func);
        const funcZip = join(FUNCTIONS_DIR, `${func}.zip`);
        if (existsSync(funcPath) && statSync(funcPath).isDirectory()) {
          const size = getDirSize(funcPath);
          console.log(`  ${func}: ${formatSize(size)} (unzipped)`);
        }
        if (existsSync(funcZip)) {
          const size = statSync(funcZip).size;
          console.log(`  ${func}.zip: ${formatSize(size)} (zipped)`);
        }
      }
    } else {
      console.log("⚠️  No Netlify functions directory found.");
      console.log("   Run 'pnpm build:netlify' first.");
      process.exit(0); // not a failure — build hasn't run
    }
    return;
  }

  let unzippedSize = 0;
  let zippedSize = 0;

  if (existsSync(HANDLER_DIR)) {
    unzippedSize = getDirSize(HANDLER_DIR);
    console.log(`Handler directory: ${HANDLER_DIR}`);
    console.log(`Unzipped size:    ${formatSize(unzippedSize)}`);

    // Top 20 largest files
    console.log("\nTop 20 largest files in handler:");
    const topFiles = getTopFiles(HANDLER_DIR, 20);
    for (const f of topFiles) {
      const relPath = f.path.replace(HANDLER_DIR, "");
      console.log(`  ${formatSize(f.size).padStart(10)}  ${relPath}`);
    }
  }

  if (existsSync(HANDLER_ZIP)) {
    zippedSize = statSync(HANDLER_ZIP).size;
    console.log(`\nZipped size:      ${formatSize(zippedSize)}`);
  }

  const projectedMB = unzippedSize / (1024 * 1024);

  console.log(`\n--- Result ---`);
  console.log(`Projected unzipped size: ${projectedMB.toFixed(1)} MB`);

  if (projectedMB > LIMIT_FAIL_MB) {
    console.error(
      `❌ FAIL: Handler exceeds ${LIMIT_FAIL_MB} MB limit (${projectedMB.toFixed(1)} MB).`
    );
    console.error(
      "   Netlify upload will fail. Reduce handler size before deploying."
    );
    process.exit(1);
  } else if (projectedMB > LIMIT_WARN_MB) {
    console.warn(
      `⚠️  WARN: Handler exceeds ${LIMIT_WARN_MB} MB warning threshold (${projectedMB.toFixed(1)} MB).`
    );
    console.warn("   Consider reducing handler size before production deploy.");
    process.exit(0);
  } else {
    console.log(`✅ PASS: Handler is within limits.`);
    process.exit(0);
  }
}

main();
