// lib/fs-safe-walk.ts (or inline in your script)
// Node.js: safe recursive walk that ONLY scandir's directories

import fs from "node:fs/promises";
import path from "node:path";

type WalkOptions = {
  ignoreExt?: Set<string>;          // e.g. new Set([".zip", ".psd"])
  ignoreNames?: Set<string>;        // e.g. new Set([".DS_Store"])
  ignorePathsContaining?: string[]; // e.g. ["node_modules", ".git"]
};

export async function safeWalkDirsOnly(
  rootDir: string,
  opts: WalkOptions = {}
): Promise<string[]> {
  const results: string[] = [];

  const ignoreExt = opts.ignoreExt ?? new Set<string>([".zip"]);
  const ignoreNames = opts.ignoreNames ?? new Set<string>([]);
  const ignorePathsContaining = opts.ignorePathsContaining ?? [];

  async function walk(dir: string) {
    for (const part of ignorePathsContaining) {
      if (dir.includes(part)) return;
    }

    let entries: Awaited<ReturnType<typeof fs.readdir>>;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (e: any) {
      // EPERM/ENOENT shouldn't kill builds; skip and continue
      if (e?.code === "EPERM" || e?.code === "ENOENT") return;
      throw e;
    }

    for (const ent of entries) {
      if (ignoreNames.has(ent.name)) continue;

      const full = path.join(dir, ent.name);

      if (ent.isDirectory()) {
        await walk(full);
        continue;
      }

      // Only collect files that are NOT ignored (but DO NOT scandir them)
      const ext = path.extname(ent.name).toLowerCase();
      if (ignoreExt.has(ext)) continue;

      results.push(full);
    }
  }

  await walk(rootDir);
  return results;
}
