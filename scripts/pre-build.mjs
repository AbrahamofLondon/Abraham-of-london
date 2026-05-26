#!/usr/bin/env node
/**
 * scripts/pre-build.mjs
 *
 * Pre-Next-build wrapper — runs in sequence:
 *   1. generate-briefs-registry.mjs  (writes public/system/briefs-registry.json)
 *   2. check-contentlayer-runtime-imports.mjs  (guard: fails if runtime code
 *      re-introduces require("contentlayer/generated"))
 *
 * Referenced from vercel.json buildCommand to keep the command string under
 * the 256-character Vercel schema limit.
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scripts = (...parts) => path.join(__dirname, ...parts);

function run(script) {
  console.log(`[pre-build] running ${path.basename(script)}`);
  execFileSync(process.execPath, [script], { stdio: "inherit" });
}

run(scripts("generate-briefs-registry.mjs"));
run(scripts("check-contentlayer-runtime-imports.mjs"));

console.log("[pre-build] ✓ pre-build steps complete");
