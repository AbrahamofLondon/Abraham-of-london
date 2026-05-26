#!/usr/bin/env node
/**
 * Writes a local marker only after pnpm build:netlify reaches its final step.
 * The readiness gate uses this to reject stale plain `pnpm build` output.
 */

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBuildIdPath = path.join(ROOT, ".next", "BUILD_ID");
const netlifyDir = path.join(ROOT, ".netlify");
const markerPath = path.join(netlifyDir, "aol-parity-build.json");

if (!fs.existsSync(nextBuildIdPath)) {
  console.error("Cannot write Netlify parity marker: .next/BUILD_ID is missing.");
  process.exit(1);
}

let gitSha = null;
try {
  gitSha = execFileSync("git", ["rev-parse", "HEAD"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  gitSha = null;
}

fs.mkdirSync(netlifyDir, { recursive: true });
fs.writeFileSync(
  markerPath,
  `${JSON.stringify(
    {
      command: "pnpm build:netlify",
      nextBuildId: fs.readFileSync(nextBuildIdPath, "utf8").trim(),
      gitSha,
      writtenAt: new Date().toISOString(),
    },
    null,
    2,
  )}\n`,
);

console.log(`Netlify parity build marker written: ${path.relative(ROOT, markerPath)}`);
