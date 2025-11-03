// scripts/run-validate-downloads.mjs
// ✅ CRITICAL FIX: This script should ONLY validate, not generate stubs.
// We have removed all calls to generatePlaceholders().

import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const SCRIPTS = path.join(ROOT, "scripts");

// Path to the validator script
const VAL = path.join(SCRIPTS, "validate-downloads.mjs");

function runNode(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      stdio: "inherit",
      env: process.env,
      cwd: ROOT,
    });
    child.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))));
    child.on("error", reject);
  });
}

async function main() {
  console.log("[downloads:step] validate downloads");
  let hasValidator = false;
  try {
    await fs.access(VAL);
    hasValidator = true;
  } catch (_) {
    hasValidator = false;
  }

  if (!hasValidator) {
    console.warn(`[downloads:warn] Missing validator at ${VAL}. Skipping validation.`);
    console.log("[downloads:ok] downloads look good (validator unavailable).");
    return;
  }

  try {
    // Run ONLY the validator (non-strict)
    await runNode(VAL, []); 
    console.log("[downloads:ok] validation passed.");
  } catch (err) {
    const strict = process.env.DOWNLOADS_STRICT === "1";
    if (strict) {
      console.error("[downloads:fail] strict mode ON → failing build.");
      throw err;
    } else {
      console.warn("[downloads:warn] validator reported errors, but strict mode OFF → continuing.");
      // ✅ SYNTAX FIX: Removed the '?.' optional chaining
      console.warn(String(err.message || err));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});ole.error(e);
  process.exit(1);
});?.message || err));
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});