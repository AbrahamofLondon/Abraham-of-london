import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, ".contentlayer", "generated");

function fail(msg) {
  console.error(`❌ content:check failed: ${msg}`);
  process.exit(1);
}

if (!fs.existsSync(outDir)) {
  fail(`Missing Contentlayer output directory: ${outDir}`);
}

const entries = fs.readdirSync(outDir, { withFileTypes: true });
const hasAny = entries.some((e) => e.isFile() || e.isDirectory());

if (!hasAny) {
  fail(`Contentlayer output directory is empty: ${outDir}`);
}

console.log("✅ content:check passed: .contentlayer output exists.");
process.exit(0);
