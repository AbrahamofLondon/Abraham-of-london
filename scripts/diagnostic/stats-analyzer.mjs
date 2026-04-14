#!/usr/bin/env node
/* eslint-disable no-console */
/**
 * scripts/diagnostic/stats-analyzer.mjs
 *
 * Reads .next/server/server-stats.json (emitted by the ServerStatsEmitter
 * plugin in next.config.mjs) and reports:
 *
 *   1. Which entrypoints own each target chunk
 *   2. Top 30 modules by size inside each target chunk
 *   3. Which modules appear in ALL three target chunks (cross-chunk shared)
 *
 * This is the authoritative reading — unlike manifest inspection or raw
 * content grep, webpack stats gives exact module lists with sizes.
 *
 * Target chunks are hard-coded to the three 44 MB commons chunks from the
 * last diagnostic. Update TARGET_CHUNKS if Netlify emits new chunk IDs.
 *
 * Output is bracketed by ===STATS ANALYSIS=== / ===END STATS===. Defensive
 * file reads: missing stats file or malformed JSON produce a clean line
 * and exit 0 so the script never masks the real deploy error.
 */

import fs from "node:fs";
import path from "node:path";

const TARGET_CHUNKS = ["60897", "95979", "18126"];
const STATS_PATH = ".next/server/server-stats.json";

console.log("===STATS ANALYSIS===");

if (!fs.existsSync(STATS_PATH)) {
  console.log("server-stats.json not found at " + STATS_PATH);
  console.log("===END STATS===");
  process.exit(0);
}

let stats;
try {
  stats = JSON.parse(fs.readFileSync(STATS_PATH, "utf8"));
} catch (err) {
  console.log("server-stats.json: parse failed — " + String(err));
  console.log("===END STATS===");
  process.exit(0);
}

const chunks = Array.isArray(stats.chunks) ? stats.chunks : [];
const cwd = process.cwd();

function cleanName(raw) {
  if (!raw) return "";
  return String(raw).replace(cwd, "").replace(/^[/\\]/, "");
}

function findChunk(targetId) {
  return chunks.find((c) => {
    if (String(c.id) === targetId) return true;
    const files = Array.isArray(c.files) ? c.files : [];
    return files.some((f) => String(f).includes(targetId));
  });
}

// ---------------------------------------------------------------------------
// 1 + 2. Per-chunk report
// ---------------------------------------------------------------------------
const resolvedChunks = [];
for (const targetId of TARGET_CHUNKS) {
  const chunk = findChunk(targetId);

  if (!chunk) {
    console.log("");
    console.log("CHUNK " + targetId + ": not found in stats");
    resolvedChunks.push(null);
    continue;
  }

  resolvedChunks.push(chunk);

  const sizeMb = Math.round(((chunk.size || 0) / (1024 * 1024)) * 10) / 10;
  console.log("");
  console.log("=== CHUNK " + targetId + " (" + sizeMb + " MB) ===");

  // Entrypoint ownership
  const entries = Object.entries(stats.entrypoints || {});
  const owners = entries
    .filter(([, ep]) => {
      const epChunks = Array.isArray(ep?.chunks) ? ep.chunks : [];
      return epChunks.includes(chunk.id);
    })
    .map(([name]) => name);
  console.log("Owned by entrypoints: " + (owners.join(", ") || "none"));

  // Top 30 modules by size
  const modules = Array.isArray(chunk.modules) ? chunk.modules : [];
  const sized = modules
    .filter((m) => (m?.size || 0) > 0)
    .sort((a, b) => (b.size || 0) - (a.size || 0))
    .slice(0, 30);

  console.log("Top modules by size:");
  if (sized.length === 0) {
    console.log("  (no modules in chunk)");
  } else {
    for (const m of sized) {
      const kb = Math.round((m.size || 0) / 1024);
      const name = cleanName(m.name || m.identifier || "");
      console.log("  " + String(kb).padStart(6) + "KB  " + name);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Cross-chunk shared modules
// ---------------------------------------------------------------------------
console.log("");
console.log("=== MODULES IN ALL 3 CHUNKS ===");

const allResolved = resolvedChunks.filter((c) => c !== null && c !== undefined);
if (allResolved.length < 3) {
  console.log("Could not find all 3 chunks for comparison");
} else {
  const sets = allResolved.map((c) => {
    const s = new Set();
    const mods = Array.isArray(c.modules) ? c.modules : [];
    for (const m of mods) {
      const n = m?.name || m?.identifier || "";
      if (n) s.add(String(n));
    }
    return s;
  });

  const first = [...sets[0]];
  const shared = first
    .filter((n) => sets[1].has(n) && sets[2].has(n))
    .map((n) => {
      // Pull size from chunk 0 for sorting
      const mod = (allResolved[0].modules || []).find(
        (m) => (m?.name || m?.identifier || "") === n,
      );
      return { name: cleanName(n), size: mod?.size || 0 };
    })
    .sort((a, b) => b.size - a.size);

  if (shared.length === 0) {
    console.log("  (no modules shared across all 3 chunks)");
  } else {
    console.log("  " + shared.length + " shared modules (showing top 30 by size):");
    for (const s of shared.slice(0, 30)) {
      const kb = Math.round(s.size / 1024);
      console.log("  " + String(kb).padStart(6) + "KB  " + s.name);
    }
  }
}

console.log("");
console.log("===END STATS===");
