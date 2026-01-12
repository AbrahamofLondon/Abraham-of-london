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
  const env = { 
    ...process.env, 
    FORCE_COLOR: "1",
    NODE_OPTIONS: "--max-old-space-size=4096"
  };
  execSync(cmd, {
    stdio: "inherit",
    cwd: ROOT,
    env
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

  const hasIndexJs = files.includes("index.js") || files.includes("index.mjs");
  const hasTypes = files.includes("types.d.ts") || files.includes("index.d.ts");
  return { ok: hasIndexJs, reason: hasIndexJs ? "ok" : "index-missing", files, hasTypes };
}

function checkRequiredDeps() {
  const requiredDeps = ["@contentlayer2/cli", "@contentlayer2/core"];
  const missingDeps = [];
  
  for (const dep of requiredDeps) {
    try {
      require.resolve(dep, { paths: [ROOT] });
    } catch {
      missingDeps.push(dep);
    }
  }
  
  return missingDeps;
}

function createWorkingConfig() {
  const configPath = path.join(ROOT, "contentlayer.working.mjs");
  
  // Use contentlayer2/source-files for the correct exports
  const configContent = `
// Auto-generated WORKING Contentlayer config
import { defineDocumentType, makeSource } from 'contentlayer2/source-files';

// Simple document type
export const Post = defineDocumentType(() => ({
  name: "Post",
  filePathPattern: "blog/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: false },
    date: { type: "date", required: false },
    slug: { type: "string", required: false },
    draft: { type: "boolean", default: false },
  },
}));

export const Short = defineDocumentType(() => ({
  name: "Short",
  filePathPattern: "shorts/**/*.{md,mdx}",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: false },
    date: { type: "date", required: false },
    slug: { type: "string", required: false },
    draft: { type: "boolean", default: false },
  },
}));

export default makeSource({
  contentDirPath: 'content',
  documentTypes: [Post, Short],
  mdx: {
    esbuildOptions: (options) => {
      // Mark framer-motion as external
      options.external = [...(options.external || []), 'framer-motion'];
      options.platform = 'node';
      return options;
    },
  },
  onUnknownDocuments: 'skip-warn',
  onMissingOrInvalidDocuments: 'skip-warn',
  disableImportAliasWarning: true,
  onExtraFieldData: 'ignore',
});
`;
  
  fs.writeFileSync(configPath, configContent, 'utf8');
  return configPath;
}

try {
  // 1) Clean
  console.log("🧹 Cleaning .contentlayer cache...");
  rmrf(CONTENTLAYER_DIR);
  ensureDir(CONTENTLAYER_DIR);

  // 2) Check required dependencies
  console.log("🔍 Checking required dependencies...");
  const missingDeps = checkRequiredDeps();
  if (missingDeps.length > 0) {
    console.warn(`⚠️ Missing dependencies: ${missingDeps.join(", ")}`);
    if (ALLOW_FALLBACK) {
      console.warn("🟠 Writing fallback due to missing dependencies");
      writeFallback(GENERATED_DIR);
      process.exit(0);
    } else {
      console.error(`🔴 Please install: pnpm add -D @contentlayer2/cli @contentlayer2/core`);
      process.exit(1);
    }
  }

  // 3) Detect engine
  const hasCL2 = hasAny(["@contentlayer2/cli", "@contentlayer2/core", "contentlayer2"]);
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
    console.error("Install: pnpm add -D contentlayer2");
    process.exit(1);
  }

  // 4) Create working config with correct imports
  const workingConfigPath = createWorkingConfig();
  console.log("🔧 Created working Contentlayer config with correct imports");

  // 5) Build with working config
  if (hasCL2) {
    console.log("🔨 Running Contentlayer2 build with working config...");
    try {
      run(`pnpm exec contentlayer2 build --config ${workingConfigPath}`);
      console.log("✅ Contentlayer build succeeded!");
    } catch (error) {
      console.error("❌ Contentlayer build failed:", error.message);
      
      if (ALLOW_FALLBACK) {
        console.warn("🟠 Writing fallback because CONTENTLAYER_ALLOW_FALLBACK=1");
        writeFallback(GENERATED_DIR);
      } else {
        throw error;
      }
    } finally {
      // Clean up temporary config
      if (fs.existsSync(workingConfigPath)) {
        fs.unlinkSync(workingConfigPath);
      }
    }
  } else {
    console.log("🔨 Running Contentlayer v1 build...");
    run("pnpm exec contentlayer build");
  }

  // 6) Verify output
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

  // 7) Optional: assert docs are non-empty
  if (STRICT && EXPECT_DOCS) {
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