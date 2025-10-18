#!/usr/bin/env node
/**
 * Windows/CI-safe wrapper around:
 *   - scripts/generate-placeholder-downloads.mjs
 *   - scripts/validate-downloads.mjs
 *
 * Behaviour:
 *  - Always runs the generator first (creates missing placeholders + covers).
 *  - Runs the validator with `--strict`.
 *  - On CI: if DOWNLOADS_STRICT === "1" → fail on errors; otherwise log and continue.
 *  - Locally: never block your `npm run build`; prints actionable errors but exits 0.
 */

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");

const isCI = !!(process.env.CI || process.env.NETLIFY);
const strictEnv = String(process.env.DOWNLOADS_STRICT || "").trim();
const STRICT = isCI ? strictEnv === "1" : false;

function runNode(scriptRel, args = []) {
  const scriptAbs = path.join(ROOT, scriptRel);
  const res = spawnSync(process.execPath, [scriptAbs, ...args], {
    stdio: "inherit",
    cwd: path.join(ROOT, ".."),
    env: process.env,
    windowsHide: true
  });
  return res.status ?? 0;
}

function log(label, msg) {
  console.log(`[downloads:${label}] ${msg}`);
}

(async function main() {
  try {
    log("info", `CI=${isCI ? "1" : "0"} STRICT=${STRICT ? "1" : "0"}`);

    // 1) generate placeholders + covers
    log("step", "generate placeholders");
    const genCode = runNode("scripts/generate-placeholder-downloads.mjs", []);
    if (genCode !== 0) {
      log("error", `generator exited with code ${genCode}`);
      if (STRICT) process.exit(genCode);
      // Non-strict: continue
    }

    // 2) validate (strict)
    log("step", "validate downloads --strict");
    const valCode = runNode("scripts/validate-downloads.mjs", ["--strict"]);

    if (valCode !== 0) {
      log("warn", `validator reported issues (exit ${valCode})`);
      if (STRICT) {
        log("fail", "STRICT=1 on CI → failing build.");
        process.exit(valCode);
      } else {
        log("pass", "Continuing (STRICT!=1).");
      }
    } else {
      log("ok", "downloads look good.");
    }

    process.exit(0);
  } catch (e) {
    log("fatal", String(e && e.message ? e.message : e));
    // Only fail in strict mode on CI
    process.exit(STRICT ? 1 : 0);
  }
})();
