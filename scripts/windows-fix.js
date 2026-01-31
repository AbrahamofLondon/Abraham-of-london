// scripts/windows-fix.js
// ESM-safe (repo has "type": "module").
// Purpose: Windows hygiene + Path Flattening for Deep Build Caches.
// This must NEVER throw, otherwise it breaks prebuild -> build.

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

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
 * Path Shortener (The Windows "Long Path" Killer)
 * Creates a Junction from deep cache dirs to a short root-relative dir.
 */
async function ensureShortCachePaths() {
  const shortDir = path.resolve(".wfix");
  const deepDirs = [
    { target: path.resolve(".contentlayer/.cache"), link: path.join(shortDir, "cc") },
    { target: path.resolve(".next/cache"), link: path.join(shortDir, "nc") }
  ];

  if (!fs.existsSync(shortDir)) {
    await fsp.mkdir(shortDir, { recursive: true });
  }

  for (const item of deepDirs) {
    // Ensure parent target exists before linking
    if (!fs.existsSync(path.dirname(item.target))) {
      await fsp.mkdir(path.dirname(item.target), { recursive: true });
    }
    if (!fs.existsSync(item.target)) {
      await fsp.mkdir(item.target, { recursive: true });
    }

    const linkExists = await safeLstat(item.link);
    if (!linkExists) {
      try {
        // 'junction' is the most stable Windows symlink type for directories
        // and doesn't require Admin privileges.
        await fsp.symlink(item.target, item.link, 'junction');
        console.log(`[fix:windows] Created junction: ${item.link} -> ${item.target}`);
      } catch (e) {
        console.warn(`[fix:windows] Could not create junction for ${item.target}:`, e.message);
      }
    }
  }
}

async function walkDirs(rootDir, onFile) {
  const st = await safeLstat(rootDir);
  if (!st || !st.isDirectory()) return;

  const entries = await safeReaddir(rootDir);
  for (const ent of entries) {
    const full = path.join(rootDir, ent.name);
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

async function tryMakeWritable(filePath) {
  try {
    const st = await fsp.lstat(filePath);
    if (!st.isFile()) return;
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

  console.log("[fix:windows] Running safe Windows hygiene and path flattening...");

  // 1. Handle Path Lengths first
  await ensureShortCachePaths();

  // 2. Handle Writability (Standard Hygiene)
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
  console.warn("[fix:windows] Non-fatal error:", e?.message || e);
});