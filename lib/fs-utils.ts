/* lib/fs-utils.ts */
import fs from "fs";
import path from "path";

/**
 * SAFE FS ENTRY RESOLVER
 * Prevents EPERM/ENOENT errors by verifying type before access.
 * Outcome: Returns a deterministic array of absolute paths.
 */
export function safeListFsEntries(absPath: string): string[] {
  try {
    if (!absPath || typeof absPath !== "string") return [];

    if (!fs.existsSync(absPath)) {
      console.warn(`[FS_WARN] Path does not exist: ${absPath}`);
      return [];
    }

    const stat = fs.statSync(absPath);

    // If it's a file, return it as the only entry.
    // This prevents readdirSync from crashing on file paths.
    if (stat.isFile()) return [absPath];

    if (!stat.isDirectory()) return [];

    return fs
      .readdirSync(absPath, { withFileTypes: true })
      .filter((dirent) => !dirent.name.startsWith("."))
      .map((dirent) => path.join(absPath, dirent.name));
  } catch (error) {
    console.error(`[FS_CRITICAL] Failed to list entries for: ${absPath}`, error);
    return [];
  }
}

/**
 * RECURSIVE FILE RESOLVER
 * Returns only valid files, filtering out subdirectories.
 */
export function safeListFiles(absPath: string): string[] {
  const entries = safeListFsEntries(absPath);
  return entries.filter((p) => {
    try {
      return fs.statSync(p).isFile();
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
    if (!fs.existsSync(absPath)) return null;
    const st = fs.statSync(absPath);
    if (!st.isFile()) return null;
    return fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
}

