// scripts/ssot-smoke.mjs
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

function walkMdxCounts(contentRoot) {
  const out = {};
  if (!fs.existsSync(contentRoot)) return out;

  const stack = [contentRoot];
  while (stack.length) {
    const dir = stack.pop();
    const ents = fs.readdirSync(dir, { withFileTypes: true });
    for (const ent of ents) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.isFile() && ent.name.endsWith(".mdx")) {
        const rel = full.replace(contentRoot, "").replace(/\\/g, "/").replace(/^\/+/, "");
        const top = rel.split("/")[0] || "unknown";
        out[top] = (out[top] || 0) + 1;
      }
    }
  }
  return out;
}

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function loadContentlayerIndexCounts(generatedRoot) {
  const counts = {};
  if (!fs.existsSync(generatedRoot)) return counts;

  const dirs = fs
    .readdirSync(generatedRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const d of dirs) {
    const idx = path.join(generatedRoot, d, "_index.json");
    if (!fs.existsSync(idx)) continue;

    const data = readJson(idx);
    if (!data) continue;

    // Contentlayer usually stores an array here; sometimes object with arrays.
    let docs = [];
    if (Array.isArray(data)) docs = data;
    else if (Array.isArray(data.documents)) docs = data.documents;
    else if (Array.isArray(data.allDocuments)) docs = data.allDocuments;
    else if (data && typeof data === "object") {
      for (const v of Object.values(data)) if (Array.isArray(v)) docs.push(...v);
    }

    counts[d] = docs.length;
  }

  return counts;
}

async function tryLoadContentlayerGeneratedAllDocuments() {
  // Try resolve via node resolution first.
  try {
    const resolved = require.resolve("contentlayer/generated"); // may point to .mjs
    const url = pathToFileURL(resolved).href;
    const mod = await import(url);
    const gen = mod?.default && !mod?.allDocuments ? mod.default : mod;
    const n = Array.isArray(gen?.allDocuments) ? gen.allDocuments.length : null;
    return { resolvable: true, resolved, allDocuments: n };
  } catch (e) {
    return { resolvable: false, error: String(e?.message || e) };
  }
}

function mustBeNonZeroIfFsHasDocs(fsCounts, key, actual, failures) {
  const fsN = fsCounts[key] || 0;
  if (fsN > 0 && (!Number.isFinite(actual) || actual === 0)) {
    failures.push(`${key}: content=${fsN} but contentlayer_index=${actual}`);
  }
}

async function main() {
  const cwd = process.cwd();
  const contentRoot = path.join(cwd, "content");
  const generatedRoot = path.join(cwd, ".contentlayer", "generated");

  const fsCounts = walkMdxCounts(contentRoot);
  const genCounts = loadContentlayerIndexCounts(generatedRoot);
  const genModule = await tryLoadContentlayerGeneratedAllDocuments();

  const failures = [];

  // These keys reflect your real folder taxonomy
  const folders = [
    "blog",
    "books",
    "canon",
    "downloads",
    "events",
    "prints",
    "resources",
    "shorts",
    "strategy",
    "lexicon",
    "vault",
    "briefs",
    "intelligence",
  ];

  // 1) If content exists but generated indexes are missing/zero → fail
  for (const k of folders) {
    // Generated root subfolders are capitalized types (Book, Canon, etc.)
    // So we only enforce "generated has something" using module allDocuments OR any index.json total.
    // But we DO enforce per-folder existence at least via fsCounts vs ANY generated signal.
    // (Per-type mapping differs by Contentlayer model naming.)
    if ((fsCounts[k] || 0) > 0) {
      const anyGenerated =
        Object.values(genCounts).reduce((a, b) => a + (b || 0), 0) > 0 ||
        (typeof genModule.allDocuments === "number" && genModule.allDocuments > 0);

      if (!anyGenerated) {
        failures.push(
          `generated: content has '${k}' (${fsCounts[k]}) but .contentlayer/generated appears empty/unreadable`
        );
        break;
      }
    }
  }

  // 2) Strong signal: if content exists at all, module should usually load in Next runtime;
  // but in pure node it may still fail (ESM/CJS). We report it, but don't hard fail only on this.
  const totalContent = Object.values(fsCounts).reduce((a, b) => a + b, 0);
  if (totalContent > 0 && genModule.resolvable === false) {
    failures.push(`module: cannot resolve 'contentlayer/generated' (${genModule.error})`);
  }

  // 3) If .contentlayer/generated exists, its type indexes should exist (at least some)
  if (fs.existsSync(generatedRoot)) {
    const totalGen = Object.values(genCounts).reduce((a, b) => a + (b || 0), 0);
    if (totalGen === 0) failures.push(`indexes: '.contentlayer/generated/**/_index.json' parsed to 0 docs`);
  }

  const report = {
    cwd,
    contentRoot,
    generatedRoot,
    fsCounts,
    generatedIndexCounts: genCounts,
    generatedModule: genModule,
  };

  if (failures.length) {
    console.error("SSOT SMOKE FAIL:\n" + failures.map((x) => `- ${x}`).join("\n"));
    console.error("\nREPORT:\n" + JSON.stringify(report, null, 2));
    process.exit(1);
  }

  console.log("SSOT SMOKE PASS");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});