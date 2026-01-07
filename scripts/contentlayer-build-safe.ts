/* scripts/contentlayer-build-safe.ts - Safe Contentlayer build script (PNPM-FIRST, ESM-SAFE) */
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

console.log("🚀 Starting SAFE Contentlayer build process...");
console.log(`📁 Current directory: ${process.cwd()}`);
console.log(`📁 Node version: ${process.version}`);

function hasPackage(name: string): boolean {
  try {
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
}

function run(cmd: string) {
  execSync(cmd, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, FORCE_COLOR: "1" },
  });
}

function createFallbackData(generatedDir: string) {
  if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });

  const fallbackData = {
    allPosts: [],
    allBooks: [],
    allCanons: [],
    allDownloads: [],
    allEvents: [],
    allPrints: [],
    allResources: [],
    allShorts: [],
    allStrategies: [],
  };

  fs.writeFileSync(path.join(generatedDir, "index.js"), `module.exports = ${JSON.stringify(fallbackData, null, 2)};\n`);
  fs.writeFileSync(path.join(generatedDir, "index.mjs"), `export default ${JSON.stringify(fallbackData, null, 2)};\n`);

  console.log("✅ Created fallback content data");
}

try {
  // 1) Clean cache
  console.log("🧹 Cleaning previous Contentlayer cache...");
  const contentlayerDir = path.join(process.cwd(), ".contentlayer");
  const generatedDir = path.join(contentlayerDir, "generated");

  if (fs.existsSync(contentlayerDir)) {
    fs.rmSync(contentlayerDir, { recursive: true, force: true });
    console.log("✅ Contentlayer cache cleaned");
  }

  // 2) Decide which engine exists (prefer contentlayer2)
  const hasCL2 = hasPackage("contentlayer2");
  const hasCL1 = hasPackage("contentlayer");

  if (!hasCL2 && !hasCL1) {
    console.error("❌ Neither contentlayer2 nor contentlayer is installed.");
    console.log("💡 Run: pnpm add -D contentlayer2 contentlayer");
    createFallbackData(generatedDir);
    process.exit(0);
  }

  // 3) Run build using pnpm exec (stable in CI + Windows)
  if (hasCL2) {
    console.log("🔨 Running Contentlayer2 build (pnpm exec)...");
    run("pnpm exec contentlayer2 build");
  } else {
    console.log("🔨 Running Contentlayer v1 build (pnpm exec)...");
    run("pnpm exec contentlayer build");
  }

  // 4) Verify output
  console.log("🔍 Verifying Contentlayer build...");
  if (!fs.existsSync(generatedDir)) {
    console.log("⚠️  .contentlayer/generated not found, creating fallback...");
    createFallbackData(generatedDir);
  } else {
    const files = fs.readdirSync(generatedDir);
    console.log(`✅ Contentlayer build output present (${files.length} entries).`);

    // Defensive: if empty, fallback
    if (files.length === 0) {
      console.log("⚠️  Generated directory is empty, creating fallback...");
      createFallbackData(generatedDir);
    }
  }

  console.log("🎉 Contentlayer build completed!");
} catch (error: any) {
  console.error("❌ Contentlayer build failed:", error?.message ?? error);
  console.log("🔄 Creating emergency fallback data...");

  const fallbackDir = path.join(process.cwd(), ".contentlayer", "generated");
  createFallbackData(fallbackDir);

  console.log("✅ Emergency fallback created (build will continue, content may be empty).");
}