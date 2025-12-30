/* lib/fs-utils.ts */
import fs from "node:fs";
import path from "node:path";

/**
 * SAFE FS ENTRY RESOLVER
 * Principled Analysis: Prevents EPERM/ENOENT errors by verifying type before access.
 * Outcome: Returns a deterministic array of absolute paths.
 */
export function safeListFsEntries(absPath: string): string[] {
  try {
    if (!absPath || typeof absPath !== "string") return [];
    
    // Check existence without throwing
    if (!fs.existsSync(absPath)) {
      console.warn(`[FS_WARN] Path does not exist: ${absPath}`);
      return [];
    }

    const stat = fs.statSync(absPath);

    // If the path is actually a file, return it as the only entry
    // This prevents readdirSync from crashing on file paths.
    if (stat.isFile()) return [absPath];

    // Safety check for non-directory/non-file entries (e.g. sockets)
    if (!stat.isDirectory()) return [];

    // Filter out hidden system files (.DS_Store, .git, etc.)
    return fs
      .readdirSync(absPath, { withFileTypes: true })
      .filter((dirent) => !dirent.name.startsWith("."))
      .map((dirent) => path.join(absPath, dirent.name));
  } catch (error) {
    // Fail-soft: Institutional integrity requires the system to stay online
    console.error(`[FS_CRITICAL] Failed to list entries for: ${absPath}`, error);
    return [];
  }
}

/**
 * RECURSIVE FILE RESOLVER
 * Outcome: Returns only valid files, filtering out subdirectories.
 * Used by: Contentlayer fallback and asset verification scripts.
 */
export function safeListFiles(absPath: string): string[] {
  const entries = safeListFsEntries(absPath);
  return entries.filter((p) => {
    try {
      const stat = fs.statSync(p);
      return stat.isFile();
    } catch {
      return false;
    }
  });
}

/**
 * ATOMIC FILE READER
 * Returns file content or null if unreadable.
 */
export function safeReadFile(absPath: string): string | null {
  try {
    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) return null;
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
}