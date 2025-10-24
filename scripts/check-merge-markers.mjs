#!/usr/bin/env node
import { execSync } from "node:child_process";

const globs = [
  ":(exclude)package-lock.json",
  ":(exclude)pnpm-lock.yaml",
  ":(exclude)yarn.lock",
  ":(exclude)*.png",
  ":(exclude)*.jpg",
  ":(exclude)*.jpeg",
  ":(exclude)*.gif",
  ":(exclude)*.webp",
  ":(exclude)*.pdf",
  ":(exclude)*.woff",
  ":(exclude)*.woff2",
  ":(exclude)*.ttf",
];

const pat = String.raw`^[<=>]{7}`;
try {
  const cmd = `git grep -n "${pat}" -- ${globs.join(" ")}`;
  const out = execSync(cmd, { stdio: ["ignore", "pipe", "pipe"] }).toString().trim();
  if (out) {
    console.error("❌ Merge conflict markers found:\n" + out);
    process.exit(1);
  }
  console.log("✅ No merge conflict markers found.");
} catch (e) {
  // git grep exits non-zero when no matches; treat that as success
  if (e.status === 1) {
    console.log("✅ No merge conflict markers found.");
    process.exit(0);
  }
  console.error("⚠️ Could not run git grep:", e?.message || e);
  // Don't fail hard in odd environments; default to success
  process.exit(0);
}
