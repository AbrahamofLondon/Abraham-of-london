#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * scripts/diagnostic/chunk-inspector.mjs
 *
 * Runs in the Netlify build stage AFTER `pnpm build:netlify`. Reads Next's
 * build manifests and chunk trace files to answer:
 *
 *   1. Which pages own each of the oversized server chunks?
 *   2. Which modules are traced into each chunk?
 *   3. Which App Router pages reference them?
 *
 * Target chunks are hard-coded to the three 44 MB ones from the last
 * failing diagnostic. Update the array if Netlify emits new chunk IDs.
 *
 * Output is bracketed by ===CHUNK MANIFEST=== / ===END CHUNK MANIFEST===
 * so the operator can paste only that section of the build log.
 */

import fs from "node:fs";
import path from "node:path";

const CHUNK_IDS = ["60897", "95979", "18126"];
const SERVER_DIR = ".next/server/chunks";

console.log("===CHUNK MANIFEST===");

// ---------------------------------------------------------------------------
// 1. NFT traces — who is traced INTO each chunk
// ---------------------------------------------------------------------------
for (const id of CHUNK_IDS) {
  const traceFile = path.join(SERVER_DIR, `${id}.js.nft.json`);

  if (!fs.existsSync(traceFile)) {
    console.log(`CHUNK ${id}: no nft trace found`);
    continue;
  }

  let trace;
  try {
    trace = JSON.parse(fs.readFileSync(traceFile, "utf8"));
  } catch (err) {
    console.log(`CHUNK ${id}: failed to parse nft trace — ${String(err)}`);
    continue;
  }

  const files = Array.isArray(trace.files) ? trace.files : [];
  const sized = files
    .map((f) => {
      try {
        return { f, size: fs.statSync(path.join(SERVER_DIR, f)).size };
      } catch {
        return { f, size: 0 };
      }
    })
    .sort((a, b) => b.size - a.size)
    .slice(0, 20);

  console.log(`CHUNK ${id} top traced files:`);
  for (const s of sized) {
    console.log(`  ${Math.round(s.size / 1024)}KB ${s.f}`);
  }
}

// ---------------------------------------------------------------------------
// 2. Pages Router build manifest — which pages own each chunk
// ---------------------------------------------------------------------------
const buildManifestPath = ".next/build-manifest.json";
if (fs.existsSync(buildManifestPath)) {
  try {
    const bm = JSON.parse(fs.readFileSync(buildManifestPath, "utf8"));
    const pages = Object.keys(bm.pages || {});
    const ownerMap = Object.fromEntries(CHUNK_IDS.map((id) => [id, []]));

    for (const page of pages) {
      const chunks = bm.pages[page] || [];
      for (const chunk of chunks) {
        for (const id of CHUNK_IDS) {
          if (chunk.includes(id)) {
            ownerMap[id].push(page);
          }
        }
      }
    }

    for (const id of CHUNK_IDS) {
      console.log(`CHUNK ${id} owned by Pages Router pages:`);
      const owners = ownerMap[id] || [];
      if (owners.length === 0) {
        console.log("  (none)");
      } else {
        for (const p of owners) {
          console.log(`  ${p}`);
        }
      }
    }
  } catch (err) {
    console.log(`build-manifest.json: parse failed — ${String(err)}`);
  }
} else {
  console.log("build-manifest.json: not present");
}

// ---------------------------------------------------------------------------
// 3. App Router build manifest — same question for App Router
// ---------------------------------------------------------------------------
const appBuildManifestPath = ".next/server/app-build-manifest.json";
if (fs.existsSync(appBuildManifestPath)) {
  try {
    const abm = JSON.parse(fs.readFileSync(appBuildManifestPath, "utf8"));
    const appPages = Object.keys(abm.pages || {});
    console.log("App Router pages referencing chunks:");
    let hit = false;

    for (const page of appPages) {
      const chunks = abm.pages[page] || [];
      for (const chunk of chunks) {
        for (const id of CHUNK_IDS) {
          if (chunk.includes(id)) {
            console.log(`  APP: ${page} -> chunk ${id}`);
            hit = true;
          }
        }
      }
    }

    if (!hit) {
      console.log("  (none)");
    }
  } catch (err) {
    console.log(`app-build-manifest.json: parse failed — ${String(err)}`);
  }
} else {
  console.log("app-build-manifest.json: not present");
}

console.log("===END CHUNK MANIFEST===");
