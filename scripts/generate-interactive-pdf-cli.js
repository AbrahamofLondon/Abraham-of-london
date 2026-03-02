#!/usr/bin/env node
/**
 * ABRAHAM OF LONDON — PDF ORCHESTRATOR CLI (SSOT) v3.0.0
 * Canonical entry: scripts/pdf/pdf-ops.ts
 */
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { spawn } from "child_process";
import { existsSync, writeFileSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = resolve(__dirname, "..");
const MANIFEST_PATH = resolve(ROOT_DIR, ".vault-manifest.json");

const TSX = process.platform === "win32"
  ? resolve(ROOT_DIR, "node_modules", ".bin", "tsx.cmd")
  : resolve(ROOT_DIR, "node_modules", ".bin", "tsx");

const OPS_SCRIPT = resolve(ROOT_DIR, "scripts", "pdf", "pdf-ops.ts");

function updateManifest(code: number, args: string[]) {
  const payload = {
    last_run: new Date().toISOString(),
    status: code === 0 ? "SUCCESS" : "FAILURE",
    scope: args.length ? args.join(" ") : "pdf_ops",
    integrity_check: true,
  };
  try {
    writeFileSync(MANIFEST_PATH, JSON.stringify(payload, null, 2));
  } catch (e: any) {
    console.error(`⚠️ Manifest Update Failed: ${e?.message || String(e)}`);
  }
}

async function run() {
  if (!existsSync(OPS_SCRIPT)) {
    console.error("❌ Missing canonical ops script: scripts/pdf/pdf-ops.ts");
    process.exit(1);
  }
  if (!existsSync(TSX)) {
    console.error("❌ Missing tsx binary. Run pnpm install.");
    process.exit(1);
  }

  const args = process.argv.slice(2);

  console.log("\n" + "─".repeat(60));
  console.log(`🏛️  ABRAHAM OF LONDON | PDF ORCHESTRATOR (SSOT)`);
  console.log(`📡 STATUS: Canonical Pipeline`);
  console.log("─".repeat(60) + "\n");

  const child = spawn(TSX, [OPS_SCRIPT, ...args], {
    stdio: "inherit",
    shell: true,
    cwd: ROOT_DIR,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  child.on("close", (code) => {
    const c = code ?? 1;
    updateManifest(c, args);

    console.log("\n" + "─".repeat(60));
    console.log(c === 0 ? `✅ PDF OPS COMPLETE | Manifest Updated` : `⚠️ PDF OPS FAILED | Check Logs`);
    console.log("─".repeat(60) + "\n");
    process.exit(c);
  });
}

run().catch((err) => {
  console.error("💥 Fatal Crash:", err);
  process.exit(1);
});