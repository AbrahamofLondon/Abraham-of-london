// lib/fs-safe-walk.ts
import fs from "fs/promises";
import path from "path";
import type { Dirent } from "fs"; // Import Dirent from fs, not fs/promises

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

    // FIXED: Use imported Dirent type
    let entries: Dirent[];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true }) as Dirent[];
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

// Helper function for safe file existence check
export async function safeFileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

// Helper function for safe directory creation
export async function safeMkdir(dirPath: string): Promise<boolean> {
  try {
    await fs.mkdir(dirPath, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

// Helper function for safe file read with fallback
export async function safeReadFile(
  filePath: string, 
  encoding: BufferEncoding = 'utf-8'
): Promise<string | null> {
  try {
    return await fs.readFile(filePath, encoding);
  } catch {
    return null;
  }
}

// Helper function for safe directory reading
export async function safeReaddir(dirPath: string): Promise<string[]> {
  try {
    return await fs.readdir(dirPath);
  } catch {
    return [];
  }
}

// Helper function to check if path is a directory
export async function safeIsDirectory(dirPath: string): Promise<boolean> {
  try {
    const stat = await fs.stat(dirPath);
    return stat.isDirectory();
  } catch {
    return false;
  }
}