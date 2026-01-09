// scripts/contentlayer-build-safe.js
// HARDENED "VICTORY MODE" Contentlayer build for Windows + CI
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

const ROOT = process.cwd();
const CONTENTLAYER_DIR = path.join(ROOT, ".contentlayer");
const GENERATED_DIR = path.join(CONTENTLAYER_DIR, "generated");

// Behaviour toggles (explicit only)
const ALLOW_FALLBACK = process.env.CONTENTLAYER_ALLOW_FALLBACK === "1"; // opt-in only
const STRICT = process.env.CONTENTLAYER_STRICT !== "0"; // default strict
const EXPECT_DOCS = process.env.CONTENTLAYER_EXPECT_DOCS !== "0"; // default expects docs

console.log("🚀 Starting HARDENED Contentlayer build...");
console.log(`📁 CWD: ${ROOT}`);
console.log(`🧠 Node: ${process.version}`);
console.log(`🧱 STRICT: ${STRICT} | EXPECT_DOCS: ${EXPECT_DOCS} | ALLOW_FALLBACK: ${ALLOW_FALLBACK}`);

function hasAny(depNames) {
  for (const name of depNames) {
    try {
      require.resolve(name, { paths: [ROOT] });
      return true;
    } catch {}
  }
  return false;
}

function run(cmd) {
  execSync(cmd, {
    stdio: "inherit",
    cwd: ROOT,
    env: { ...process.env, FORCE_COLOR: "1" },
  });
}

function rmrf(p) {
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
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
    // optional convenience:
    allDocuments: [],
  };

  // CJS + ESM
  fs.writeFileSync(
    path.join(generatedDir, "index.js"),
    `module.exports = ${JSON.stringify(fallbackData, null, 2)};\n`
  );

  fs.writeFileSync(
    path.join(generatedDir, "index.mjs"),
    `export default ${JSON.stringify(fallbackData, null, 2)};\nexport const ${Object.keys(fallbackData)
      .map((k) => `${k} = []`)
      .join(", ")};\n`
  );

  console.log("🟡 Fallback contentlayer/generated written (EMPTY DATA).");
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

  // Stronger checks: expect at least one of these exports to exist
  const hasIndexJs = files.includes("index.js") || files.includes("index.mjs");
  const hasTypes = files.includes("types.d.ts") || files.includes("index.d.ts");
  return { ok: hasIndexJs, reason: hasIndexJs ? "ok" : "index-missing", files, hasTypes };
}

try {
  // 1) Clean
  console.log("🧹 Cleaning .contentlayer cache...");
  rmrf(CONTENTLAYER_DIR);
  ensureDir(CONTENTLAYER_DIR);

  // 2) Detect engine
  // Contentlayer2 reality check:
  // - CLI package: @contentlayer2/cli
  // - core package: @contentlayer2/core
  const hasCL2 = hasAny(["@contentlayer2/cli", "@contentlayer2/core"]);
  const hasCL1 = hasAny(["contentlayer"]);

  console.log(`🔎 Detected: CL2=${hasCL2} | CL1=${hasCL1}`);

  if (!hasCL2 && !hasCL1) {
    const msg = "Neither Contentlayer2 nor Contentlayer v1 detected in node_modules.";
    if (ALLOW_FALLBACK) {
      console.warn(`🟠 ${msg} Writing fallback because CONTENTLAYER_ALLOW_FALLBACK=1`);
      writeFallback(GENERATED_DIR);
      process.exit(0);
    }
    console.error(`🔴 ${msg}`);
    console.error("Install: pnpm add -D @contentlayer2/cli @contentlayer2/core (or contentlayer)");
    process.exit(1);
  }

  // 3) Build
  if (hasCL2) {
    console.log("🔨 Running Contentlayer2 build...");
    run("pnpm exec contentlayer2 build");
  } else {
    console.log("🔨 Running Contentlayer v1 build...");
    run("pnpm exec contentlayer build");
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

  // 5) Optional: assert docs are non-empty (STRICT + EXPECT_DOCS)
  if (STRICT && EXPECT_DOCS) {
    // You likely have a generated data JSON; if not, skip.
    // We can only do a safe "existence" check here without importing TS/ESM mess.
    // So instead we enforce: generated dir must contain more than index files.
    const nonTrivialCount = result.files.filter((f) => !["index.js", "index.mjs", "types.d.ts", "index.d.ts"].includes(f))
      .length;

    if (nonTrivialCount === 0) {
      const msg = "Generated exports exist but appear to contain no document data artifacts.";
      if (ALLOW_FALLBACK) {
        console.warn(`🟠 ${msg} Allowing due to fallback mode.`);
      } else {
        console.error(`🔴 ${msg}`);
        console.error("If this is intended (rare), set CONTENTLAYER_EXPECT_DOCS=0.");
        process.exit(1);
      }
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