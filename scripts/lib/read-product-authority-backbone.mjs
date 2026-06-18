import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const REPORTS_DIR = join(ROOT, "reports");
export function ensureProductAuthorityArtifacts() {
  execSync("pnpm exec tsx scripts/generate-product-authority-backbone.ts", {
    cwd: ROOT,
    shell: true,
    stdio: "inherit",
  });
}

export function readJson(file) {
  return JSON.parse(readFileSync(join(REPORTS_DIR, file), "utf8"));
}

export function loadProductAuthorityArtifacts() {
  ensureProductAuthorityArtifacts();
  return {
    backbone: readJson("product-authority-backbone.json"),
    ledger: readJson("product-evidence-ledger-status.json"),
    contract: readJson("product-authority-contract.json"),
  };
}
