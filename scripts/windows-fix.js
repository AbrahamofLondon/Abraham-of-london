// scripts/windows-fix.js
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Running Windows build fix...");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function rmSafe(target) {
  if (!fs.existsSync(target)) return;
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch (e) {
    console.warn(`⚠ Could not remove ${target}: ${e.message}`);
  }
}

function tryCmd(cmd) {
  execSync(cmd, { stdio: "inherit", cwd: process.cwd(), env: { ...process.env, FORCE_COLOR: "1" } });
}

function writeFallbackGenerated(generatedDir) {
  ensureDir(generatedDir);

  const dummy = {
    allBooks: [],
    allCanons: [],
    allDownloads: [],
    allEvents: [],
    allPosts: [],
    allPrints: [],
    allResources: [],
    allShorts: [],
    allStrategies: [],
    allDocuments: [],
  };

  // CommonJS named exports (some tooling still resolves this)
  fs.writeFileSync(
    path.join(generatedDir, "index.js"),
    [
      "/* AUTO-GENERATED FALLBACK: contentlayer/generated */",
      "module.exports = {",
      ...Object.keys(dummy).map((k) => `  ${k}: ${JSON.stringify(dummy[k])},`),
      "};",
      "",
    ].join("\n")
  );

  // ESM named exports (what modern Next/TS typically hits)
  fs.writeFileSync(
    path.join(generatedDir, "index.mjs"),
    [
      "/* AUTO-GENERATED FALLBACK: contentlayer/generated */",
      ...Object.keys(dummy).map((k) => `export const ${k} = ${JSON.stringify(dummy[k])};`),
      "export default {",
      ...Object.keys(dummy).map((k) => `  ${k},`),
      "};",
      "",
    ].join("\n")
  );

  // Minimal TS types so `import type { DocumentTypes } from "contentlayer/generated"` doesn't crash
  fs.writeFileSync(
    path.join(generatedDir, "index.d.ts"),
    [
      "/* AUTO-GENERATED FALLBACK TYPES: contentlayer/generated */",
      "export type DocumentTypes = any;",
      ...Object.keys(dummy).map((k) => `export const ${k}: any[];`),
      "declare const _default: {",
      ...Object.keys(dummy).map((k) => `  ${k}: any[];`),
      "};",
      "export default _default;",
      "",
    ].join("\n")
  );

  console.log("✓ Created fallback contentlayer/generated exports (named + default)");
}

// 1) Ensure cache dir exists
const cacheDir = path.join(process.cwd(), ".contentlayer", ".cache");
ensureDir(cacheDir);

// 2) Clear the specific problematic cache version dir (keep this — it’s fine)
rmSafe(path.join(cacheDir, "v0.5.8"));

try {
  console.log("Running contentlayer build...");

  // Prefer contentlayer2 if installed; --no-install prevents surprise downloads in CI
  try {
    tryCmd("npx --no-install contentlayer2 build");
    console.log("✓ Contentlayer2 build successful!");
  } catch (e1) {
    console.warn("⚠ contentlayer2 build failed, trying contentlayer (v1)...");
    tryCmd("npx --no-install contentlayer build");
    console.log("✓ Contentlayer (v1) build successful!");
  }
} catch (e) {
  console.warn("⚠ Contentlayer build failed, creating fallback...");

  // Write fallback module at .contentlayer/generated
  const generatedDir = path.join(process.cwd(), ".contentlayer", "generated");
  writeFallbackGenerated(generatedDir);
}

console.log("✅ Windows fix completed!");