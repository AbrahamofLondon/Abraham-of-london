// lib/fs-safe-walk.ts
import fs from "fs/promises";
import path from "path";

export type WalkOptions = {
  ignoreExt?: Set<string>;
  ignoreNames?: Set<string>;
  ignorePathsContaining?: string[];
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

      // Collect files but never scandir them
      const ext = path.extname(ent.name).toLowerCase();
      if (ignoreExt.has(ext)) continue;

      results.push(full);
    }
  }

  await walk(rootDir);
  return results;
}

