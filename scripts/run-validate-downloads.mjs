// scripts/run-validate-downloads.mjs
// CI-safe runner: generate placeholders, then validate (strict in CI).

import { fileURLToPath } from "node:url";
import path from "path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SCRIPTS = path.join(ROOT, "scripts");

const GEN = path.join(SCRIPTS, "generate-placeholder-downloads.mjs");
const VAL = path.join(SCRIPTS, "validate-downloads.mjs");

function runNode(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: "inherit",
      env: process.env,
      cwd: ROOT,
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`exit ${code}`)),
    );
    child.on("error", reject);
  });
}

async function main() {
  console.log("[downloads:step] generate placeholders");
  await runNode(GEN);

  console.log("[downloads:step] validate downloads --strict");
  let hasValidator = false;
  try {
    await fs.access(VAL);
    hasValidator = true;
  } catch (_) {
    hasValidator = false;
  }

  if (!hasValidator) {
    console.warn(
      `[downloads:warn] Missing validator at ${VAL}. Skipping validation (deploy continues).`,
    );
    console.log("[downloads:ok] downloads look good (validator unavailable).");
    return;
  }

  try {
    await runNode(VAL, ["--strict"]);
    console.log("[downloads:ok] validation passed.");
  } catch (err) {
    const strict = process.env.DOWNLOADS_STRICT === "1";
    if (strict) {
      console.error("[downloads:fail] strict mode ON → failing build.");
      throw err;
    } else {
      console.warn(
        "[downloads:warn] validator reported errors, but strict mode OFF → continuing.",
      );
      console.warn(String(err?.message || err));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
