// scripts/contentlayer-build-safe.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const ROOT = process.cwd();
const CONTENTLAYER_DIR = path.join(ROOT, ".contentlayer");
const GENERATED_DIR = path.join(CONTENTLAYER_DIR, "generated");

// Behaviour toggles
const ALLOW_FALLBACK = process.env.CONTENTLAYER_ALLOW_FALLBACK === "1";
const STRICT = process.env.CONTENTLAYER_STRICT !== "0";
const EXPECT_DOCS = process.env.CONTENTLAYER_EXPECT_DOCS !== "0";

console.log("🚀 Starting HARDENED Contentlayer build...");
console.log(`📁 CWD: ${ROOT}`);
console.log(`🧠 Node: ${process.version}`);
console.log(
  `🧱 STRICT: ${STRICT} | EXPECT_DOCS: ${EXPECT_DOCS} | ALLOW_FALLBACK: ${ALLOW_FALLBACK}`
);

function run(cmd) {
  const env = {
    ...process.env,
    FORCE_COLOR: "1",
    NODE_OPTIONS: "--max-old-space-size=4096",
  };
  execSync(cmd, { stdio: "inherit", cwd: ROOT, env });
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function listDirSafe(p) {
  try {
    return fs.readdirSync(p);
  } catch {
    return [];
  }
}

function verifyGenerated() {
  if (!fs.existsSync(GENERATED_DIR)) {
    return { ok: false, reason: "generated-dir-missing", files: [] };
  }
  const files = listDirSafe(GENERATED_DIR);
  if (files.length === 0) {
    return { ok: false, reason: "generated-dir-empty", files };
  }
  const hasIndex = files.includes("index.js") || files.includes("index.mjs");
  return { ok: hasIndex, reason: hasIndex ? "ok" : "index-missing", files };
}

function writeFallback(generatedDir) {
  ensureDir(generatedDir);

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
    allDocuments: [],
  };

  fs.writeFileSync(
    path.join(generatedDir, "index.js"),
    `module.exports = ${JSON.stringify(fallbackData, null, 2)};\n`
  );

  fs.writeFileSync(
    path.join(generatedDir, "index.mjs"),
    `export default ${JSON.stringify(fallbackData, null, 2)};\nexport const ${Object.keys(
      fallbackData
    )
      .map((k) => `${k} = []`)
      .join(", ")};\n`
  );

  console.log("🟡 Fallback contentlayer/generated written (EMPTY DATA).");
}

function hasCL2() {
  try {
    require.resolve("@contentlayer2/cli", { paths: [ROOT] });
    require.resolve("@contentlayer2/core", { paths: [ROOT] });
    return true;
  } catch {
    return false;
  }
}

try {
  // 1) Clean cache
  console.log("🧹 Cleaning .contentlayer cache...");
  rmrf(CONTENTLAYER_DIR);
  ensureDir(CONTENTLAYER_DIR);

  // 2) Ensure Contentlayer2 exists
  console.log("🔍 Checking Contentlayer2 deps...");
  if (!hasCL2()) {
    const msg =
      "Contentlayer2 not detected (missing @contentlayer2/cli and/or @contentlayer2/core).";
    if (ALLOW_FALLBACK) {
      console.warn(`🟠 ${msg} Writing fallback because CONTENTLAYER_ALLOW_FALLBACK=1`);
      writeFallback(GENERATED_DIR);
      process.exit(0);
    }
    console.error(`🔴 ${msg}`);
    console.error("Install: pnpm add -D @contentlayer2/cli @contentlayer2/core");
    process.exit(1);
  }

  // 3) Run Contentlayer2 build using REAL config (no temp config)
  console.log("🔨 Running Contentlayer2 build (real config)...");
  try {
    run("pnpm exec contentlayer2 build --clearCache");
    console.log("✅ Contentlayer build succeeded!");
  } catch (err) {
    console.error("❌ Contentlayer build failed:", err?.message ?? err);

    if (ALLOW_FALLBACK) {
      console.warn("🟠 Writing fallback because CONTENTLAYER_ALLOW_FALLBACK=1");
      writeFallback(GENERATED_DIR);
      process.exit(0);
    }
    throw err;
  }

  // 4) Verify output
  console.log("🔍 Verifying generated output...");
  const result = verifyGenerated();

  if (!result.ok) {
    const msg = `Contentlayer build produced no usable generated exports (${result.reason}).`;
    if (ALLOW_FALLBACK) {
      console.warn(`🟠 ${msg} Writing fallback because CONTENTLAYER_ALLOW_FALLBACK=1`);
      writeFallback(GENERATED_DIR);
      process.exit(0);
    }
    console.error(`🔴 ${msg}`);
    console.error(`Files seen: ${JSON.stringify(result.files)}`);
    process.exit(1);
  }

  // 5) Optional strict check: must have more than just index
  if (STRICT && EXPECT_DOCS) {
    // we won’t try to parse exports here; Contentlayer already generated docs.
    // this is just a sanity gate to prevent empty runs.
    const files = result.files;
    if (files.length <= 2) {
      const msg = "Generated exports exist but look suspiciously minimal.";
      if (!ALLOW_FALLBACK) {
        console.error(`🔴 ${msg}`);
        console.error("If intended, set CONTENTLAYER_EXPECT_DOCS=0.");
        process.exit(1);
      }
      console.warn(`🟠 ${msg} Allowing due to fallback mode.`);
    }
  }

  console.log("🎉 Contentlayer build SUCCESS (verified).");
} catch (err) {
  console.error("❌ Contentlayer build crashed:", err?.message ?? err);

  if (ALLOW_FALLBACK) {
    console.warn("🟠 Writing emergency fallback because CONTENTLAYER_ALLOW_FALLBACK=1");
    writeFallback(GENERATED_DIR);
    process.exit(0);
  }

  process.exit(1);
}