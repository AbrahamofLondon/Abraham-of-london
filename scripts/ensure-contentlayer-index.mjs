#!/usr/bin/env node
/**
 * Repair the lightweight Contentlayer barrel on Windows when Contentlayer2
 * emits per-type JSON indexes but skips `.contentlayer/generated/index.mjs`.
 *
 * This keeps the build honest: it does not fabricate documents. It only
 * re-exports the already-generated `_index.json` artifacts.
 */

import { access, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const ROOT = process.cwd();
const GENERATED_DIR = join(ROOT, ".contentlayer", "generated");
const INDEX_MJS = join(GENERATED_DIR, "index.mjs");
const INDEX_JS = join(GENERATED_DIR, "index.js");

const pluralExports = new Map([
  ["Post", "allPosts"],
  ["Short", "allShorts"],
  ["Book", "allBooks"],
  ["Canon", "allCanons"],
  ["Brief", "allBriefs"],
  ["VaultBrief", "allVaultBriefs"],
  ["Intelligence", "allIntelligence"],
  ["Dispatch", "allDispatches"],
  ["Download", "allDownloads"],
  ["Event", "allEvents"],
  ["Print", "allPrints"],
  ["Resource", "allResources"],
  ["Strategy", "allStrategy"],
  ["Lexicon", "allLexicon"],
  ["Vault", "allVaults"],
  ["Playbook", "allPlaybooks"],
]);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function loadGeneratedCollections() {
  const entries = await readdir(GENERATED_DIR, { withFileTypes: true });
  const collections = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const exportName = pluralExports.get(entry.name);
    if (!exportName) continue;

    const indexPath = join(GENERATED_DIR, entry.name, "_index.json");
    if (!(await exists(indexPath))) continue;

    const raw = await readFile(indexPath, "utf8");
    const docs = JSON.parse(raw);
    collections.push({ typeName: entry.name, exportName, docs });
  }

  return collections;
}

function buildEsm(collections) {
  const lines = [];
  for (const collection of collections) {
    lines.push(`export const ${collection.exportName} = ${JSON.stringify(collection.docs)};`);
  }
  lines.push(
    `export const allDocuments = [${collections
      .map((collection) => `...${collection.exportName}`)
      .join(", ")}];`,
  );
  lines.push(
    `export default { ${collections
      .map((collection) => collection.exportName)
      .concat("allDocuments")
      .join(", ")} };`,
  );
  lines.push("");
  return lines.join("\n");
}

function buildCjs(collections) {
  const body = Object.fromEntries(collections.map((collection) => [collection.exportName, collection.docs]));
  body.allDocuments = collections.flatMap((collection) => collection.docs);
  return `module.exports = ${JSON.stringify(body)};\n`;
}

async function main() {
  if (await exists(INDEX_MJS)) {
    console.log("[CONTENTLAYER_REPAIR] index.mjs already present.");
    return;
  }

  const collections = await loadGeneratedCollections();
  if (collections.length === 0) {
    throw new Error("No generated Contentlayer collections were found; refusing to fabricate an empty barrel.");
  }

  await writeFile(INDEX_MJS, buildEsm(collections), "utf8");
  await writeFile(INDEX_JS, buildCjs(collections), "utf8");

  const url = pathToFileURL(INDEX_MJS).href;
  await import(url);
  console.log(`[CONTENTLAYER_REPAIR] Rebuilt index exports from ${collections.length} generated collections.`);
}

main().catch((error) => {
  console.error("[CONTENTLAYER_REPAIR] Failed:", error);
  process.exit(1);
});
