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
    NODE_OPTIONS: `${process.env.NODE_OPTIONS || ""} --max-old-space-size=4096`.trim(),
  };

  execSync(cmd, { stdio: "inherit", cwd: ROOT, env });
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

  // CommonJS
  fs.writeFileSync(
    path.join(generatedDir, "index.js"),
    `module.exports = ${JSON.stringify(fallbackData, null, 2)};\n`,
    "utf8"
  );

  // ESM
  fs.writeFileSync(
    path.join(generatedDir, "index.mjs"),
    [
      `export default ${JSON.stringify(fallbackData, null, 2)};`,
      `export const ${Object.keys(fallbackData)
        .map((k) => `${k} = []`)
        .join(", ")};`,
      "",
    ].join("\n"),
    "utf8"
  );

  // Types (minimal to stop TS explosions)
  fs.writeFileSync(
    path.join(generatedDir, "types.d.ts"),
    `export type Document = Record<string, any>;
export const allPosts: any[];
export const allBooks: any[];
export const allCanons: any[];
export const allDownloads: any[];
export const allEvents: any[];
export const allPrints: any[];
export const allResources: any[];
export const allShorts: any[];
export const allStrategies: any[];
export const allDocuments: any[];
declare const _default: {
  allPosts: any[];
  allBooks: any[];
  allCanons: any[];
  allDownloads: any[];
  allEvents: any[];
  allPrints: any[];
  allResources: any[];
  allShorts: any[];
  allStrategies: any[];
  allDocuments: any[];
};
export default _default;
`,
    "utf8"
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

  const hasIndex = files.includes("index.js") || files.includes("index.mjs");
  const hasTypes = files.includes("types.d.ts") || files.includes("index.d.ts");
  return { ok: hasIndex, reason: hasIndex ? "ok" : "index-missing", files, hasTypes };
}

function checkRequiredDeps() {
  const requiredDeps = ["@contentlayer2/cli", "@contentlayer2/core"];
  const missing = [];

  for (const dep of requiredDeps) {
    try {
      require.resolve(dep, { paths: [ROOT] });
    } catch {
      missing.push(dep);
    }
  }

  return missing;
}

function createWorkingConfig() {
  const configPath = path.join(ROOT, "contentlayer.working.mjs");

  // A minimal, deterministic config that cannot explode on framer-motion import.
  // It also avoids alias import issues and accepts missing/unknown documents.
  const configContent = `
// Auto-generated WORKING Contentlayer config
import { defineDocumentType, makeSource } from 'contentlayer2/source-files';

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

  fs.writeFileSync(configPath, configContent, "utf8");
  return configPath;
}

try {
  console.log("🧹 Cleaning .contentlayer cache...");
  rmrf(CONTENTLAYER_DIR);
  ensureDir(CONTENTLAYER_DIR);

  console.log("🔍 Checking required dependencies...");
  const missingDeps = checkRequiredDeps();
  if (missingDeps.length > 0) {
    console.warn(`⚠️ Missing dependencies: ${missingDeps.join(", ")}`);
    if (ALLOW_FALLBACK) {
      console.warn("🟠 Writing fallback due to missing dependencies");
      writeFallback(GENERATED_DIR);
      process.exit(0);
    }
    console.error("🔴 Install missing deps:");
    console.error("   pnpm add -D @contentlayer2/cli @contentlayer2/core");
    process.exit(1);
  }

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

  const workingConfigPath = createWorkingConfig();
  console.log("🔧 Created working Contentlayer config");

  try {
    if (hasCL2) {
      console.log("🔨 Running Contentlayer2 build...");
      run(`pnpm exec contentlayer2 build --config ${workingConfigPath}`);
    } else {
      console.log("🔨 Running Contentlayer v1 build...");
      run("pnpm exec contentlayer build");
    }
    console.log("✅ Contentlayer build succeeded!");
  } catch (error) {
    console.error("❌ Contentlayer build failed:", error?.message || error);
    if (ALLOW_FALLBACK) {
      console.warn("🟠 Writing fallback because CONTENTLAYER_ALLOW_FALLBACK=1");
      writeFallback(GENERATED_DIR);
    } else {
      throw error;
    }
  } finally {
    if (fs.existsSync(workingConfigPath)) fs.unlinkSync(workingConfigPath);
  }

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

  if (STRICT && EXPECT_DOCS) {
    const nonTrivialCount = result.files.filter(
      (f) => !["index.js", "index.mjs", "types.d.ts", "index.d.ts"].includes(f)
    ).length;

    if (nonTrivialCount === 0) {
      const msg =
        "Generated exports exist but appear to contain no document data artifacts.";
      if (ALLOW_FALLBACK) {
        console.warn(`🟠 ${msg} Allowing due to fallback mode.`);
      } else {
        console.error(`🔴 ${msg}`);
        console.error("If intended, set CONTENTLAYER_EXPECT_DOCS=0.");
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