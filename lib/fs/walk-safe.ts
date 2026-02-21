// lib/fs/walk-safe.ts
import fs from "fs";
import path from "path";

export type WalkEntry = {
  fullPath: string;
  relPath: string;
  isFile: boolean;
  isDir: boolean;
};

function safeLstat(p: string): fs.Stats | null {
  try {
    return fs.lstatSync(p);
  } catch {
    return null;
  }
}

function safeReaddir(dir: string): string[] {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
}

/**
 * Walk a directory tree safely.
 * - Never calls readdir on a file.
 * - Ignores EPERM/ENOENT and continues.
 */
export function walkSafe(rootDir: string): WalkEntry[] {
  const out: WalkEntry[] = [];
  const rootAbs = path.resolve(rootDir);

  const rootStat = safeLstat(rootAbs);
  if (!rootStat || !rootStat.isDirectory()) return out;

  const stack: string[] = [rootAbs];

  while (stack.length) {
    const current = stack.pop()!;
    const items = safeReaddir(current);

    for (const name of items) {
      const full = path.join(current, name);
      const st = safeLstat(full);
      if (!st) continue;

      const rel = path.relative(rootAbs, full).replace(/\\/g, "/");
      const isDir = st.isDirectory();
      const isFile = st.isFile();

      out.push({ fullPath: full, relPath: rel, isFile, isDir });

      if (isDir) stack.push(full);
    }
  }

  return out;
}