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

// ---------------------------------------------------------------------------
// 4. Raw chunk content signature scan.
//
// Manifests cannot explain anonymous shared commons chunks. This block reads
// the actual emitted .js file for each target chunk and counts occurrences of
// known package / module path signatures. It is a heuristic (minification can
// mangle some identifiers, but module path strings in webpack's __webpack_require__
// registry and sourcesContent-style comments usually survive), but it is
// the cheapest way to answer "which family of modules is in this 44 MB chunk".
//
// Signature groups are interpreted at runtime. Any group whose count is > 0
// for a given chunk is reported. Groups with zero hits are suppressed so
// operator review stays short.
// ---------------------------------------------------------------------------
const SIGNATURE_GROUPS = {
  "@react-pdf": [/@react-pdf\//g, /\breact-pdf\b/g],
  "pdfkit": [/\bpdfkit\//g, /pdfkit-next/g],
  "fontkit": [/\bfontkit\//g],
  "linebreak": [/\blinebreak\//g],
  "png-js": [/\bpng-js\//g],
  "brotli": [/\bbrotli\//g],
  "@prisma/client": [/@prisma\/client/g, /\.prisma\/client/g],
  "sharp": [/\bnode_modules\/sharp\b/g, /\/@img\/sharp/g],
  "canvas": [/\bnode_modules\/canvas\b/g],
  "jsdom": [/\bjsdom\//g],
  "puppeteer": [/\bpuppeteer(?:-core)?\//g, /sparticuz/g],
  "playwright": [/\bplaywright\//g],
  "contentlayer": [/contentlayer\/generated/g, /\.contentlayer\//g, /contentlayer2/g],
  "@aws-sdk": [/@aws-sdk\//g],
  "next-auth": [/\bnext-auth\b/g],
  "prisma engines": [/@prisma\/engines/g, /libquery_engine/g],

  // App-level clusters
  "lib/server/diagnostics": [/lib\/server\/diagnostics/g, /server\/diagnostics/g],
  "lib/admin/reporting": [/lib\/admin\/reporting/g, /admin\/reporting/g],
  "lib/diagnostics/pdf": [/lib\/diagnostics\/pdf/g, /diagnostics\/pdf/g],
  "lib/pdf/templates": [/lib\/pdf\/templates/g],
  "lib/pdf/artifacts": [/lib\/pdf\/artifacts/g],
  "lib/pdf/renderers": [/lib\/pdf\/renderers/g],
  "lib/content/server": [/lib\/content\/server/g],
  "lib/contentlayer-helper": [/lib\/contentlayer-helper/g],
  "DiagnosticReportDocument": [/DiagnosticReportDocument/g],
  "ExecutiveReportPdfDocument": [/ExecutiveReportPdfDocument/g],
  "AlignmentReportDocument": [/AlignmentReportDocument/g],
  "InstitutionalBriefDocument": [/InstitutionalBriefDocument/g],
  "register-fonts": [/register-fonts/g, /registerFonts/g],
  "build-manifest / sitemap": [/-sitemap\.xml/g, /buildSitemap/g],
};

for (const id of CHUNK_IDS) {
  const chunkFile = path.join(SERVER_DIR, `${id}.js`);

  if (!fs.existsSync(chunkFile)) {
    console.log(`CHUNK ${id} signature scan: file not present`);
    continue;
  }

  let raw;
  try {
    raw = fs.readFileSync(chunkFile, "utf8");
  } catch (err) {
    console.log(`CHUNK ${id} signature scan: read failed — ${String(err)}`);
    continue;
  }

  const sizeMb = (raw.length / (1024 * 1024)).toFixed(2);
  console.log(`CHUNK ${id} signature scan (${sizeMb} MB):`);

  const hits = [];
  for (const [label, patterns] of Object.entries(SIGNATURE_GROUPS)) {
    let count = 0;
    for (const re of patterns) {
      const matches = raw.match(re);
      if (matches) count += matches.length;
    }
    if (count > 0) hits.push({ label, count });
  }

  if (hits.length === 0) {
    console.log("  (no known signatures matched — chunk is minified beyond recognition)");
  } else {
    hits.sort((a, b) => b.count - a.count);
    for (const h of hits) {
      console.log(`  ${String(h.count).padStart(5)}  ${h.label}`);
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Cross-chunk duplication check.
//
// If the same signatures appear across all three chunks with similar counts,
// that is strong evidence of the SAME shared module subtree being duplicated
// by webpack's commons splitting, and the fix is cutting that subtree at its
// top import point (not per-chunk).
// ---------------------------------------------------------------------------
console.log("Cross-chunk shared signatures (present in all 3 target chunks):");

const perChunkCounts = {};
for (const id of CHUNK_IDS) {
  const chunkFile = path.join(SERVER_DIR, `${id}.js`);
  if (!fs.existsSync(chunkFile)) {
    perChunkCounts[id] = null;
    continue;
  }
  try {
    const raw = fs.readFileSync(chunkFile, "utf8");
    const counts = {};
    for (const [label, patterns] of Object.entries(SIGNATURE_GROUPS)) {
      let c = 0;
      for (const re of patterns) {
        const m = raw.match(re);
        if (m) c += m.length;
      }
      counts[label] = c;
    }
    perChunkCounts[id] = counts;
  } catch {
    perChunkCounts[id] = null;
  }
}

const sharedAll = [];
for (const label of Object.keys(SIGNATURE_GROUPS)) {
  const cs = CHUNK_IDS.map((id) => perChunkCounts[id]?.[label] ?? 0);
  if (cs.every((n) => n > 0)) {
    sharedAll.push({ label, counts: cs });
  }
}

if (sharedAll.length === 0) {
  console.log("  (none — either the chunks are unrelated or signature scan missed them)");
} else {
  sharedAll.sort(
    (a, b) =>
      b.counts.reduce((s, n) => s + n, 0) - a.counts.reduce((s, n) => s + n, 0),
  );
  for (const s of sharedAll) {
    console.log(
      `  [${s.counts.join(", ")}]  ${s.label}`,
    );
  }
}

console.log("===END CHUNK MANIFEST===");
