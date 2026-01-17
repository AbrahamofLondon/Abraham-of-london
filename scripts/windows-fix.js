// scripts/windows-fix.js
// ESM-safe (repo has "type": "module").
// Purpose: do small Windows hygiene WITHOUT ever scandir'ing files.
// This must NEVER throw, otherwise it breaks prebuild -> build.

import fs from "node:fs";
import path from "node:path";

const fsp = fs.promises;

function isWindows() {
  return process.platform === "win32" || String(process.env.IS_WINDOWS).toLowerCase() === "true";
}

async function safeLstat(p) {
  try {
    return await fsp.lstat(p);
  } catch {
    return null;
  }
}

async function safeReaddir(dir) {
  try {
    return await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

/**
 * Walk directories safely.
 * - Only calls readdir on confirmed directories.
 * - Silently skips unreadable nodes (EPERM) instead of failing builds.
 */
async function walkDirs(rootDir, onFile) {
  const st = await safeLstat(rootDir);
  if (!st || !st.isDirectory()) return;

  const entries = await safeReaddir(rootDir);
  for (const ent of entries) {
    const full = path.join(rootDir, ent.name);

    // Never follow symlinks/junctions during build hygiene
    if (ent.isSymbolicLink?.()) continue;

    if (ent.isDirectory()) {
      await walkDirs(full, onFile);
      continue;
    }

    if (ent.isFile()) {
      await onFile(full);
    }
  }
}

// Best-effort: remove read-only attribute by chmodding writable bit.
// (On Windows this is limited, but harmless. Do NOT fail.)
async function tryMakeWritable(filePath) {
  try {
    const st = await fsp.lstat(filePath);
    if (!st.isFile()) return;
    // Add owner-write bit
    await fsp.chmod(filePath, st.mode | 0o200);
  } catch {
    // swallow
  }
}

async function main() {
  if (!isWindows()) {
    console.log("[fix:windows] Not Windows; skipping.");
    return;
  }

  console.log("[fix:windows] Running safe Windows hygiene...");

  // Only touch what actually needs “writability” during build steps.
  // Avoid walking ALL of /public — that’s exactly how you hit random EPERM.
  const targets = [
    path.resolve("public", "fonts"),
    path.resolve("public", "assets", "images"),
    path.resolve(".contentlayer"),
    path.resolve(".next"),
  ];

  for (const t of targets) {
    const st = await safeLstat(t);
    if (!st) continue;

    if (st.isFile()) {
      await tryMakeWritable(t);
      continue;
    }

    if (st.isDirectory()) {
      await walkDirs(t, tryMakeWritable);
    }
  }

  console.log("[fix:windows] Done (non-fatal).");
}

main().catch((e) => {
  // HARD RULE: this script must never break builds
  console.warn("[fix:windows] Non-fatal error:", e?.message || e);
});