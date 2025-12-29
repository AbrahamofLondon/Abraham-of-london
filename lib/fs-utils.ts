// lib/fs-utils.ts
import fs from "node:fs";
import path from "node:path";

/**
 * Safe directory listing.
 * - If absPath is a directory => returns absolute paths of children
 * - If absPath is a file => returns [absPath]
 * - If absPath doesn't exist / permission issues => returns []
 *
 * This prevents Windows EPERM when code accidentally calls readdirSync on a file.
 */
export function safeListFsEntries(absPath: string): string[] {
  try {
    if (!absPath) return [];
    if (!fs.existsSync(absPath)) return [];

    const stat = fs.statSync(absPath);

    // ✅ If a file was passed by mistake, treat it as a single entry (not a directory)
    if (stat.isFile()) return [absPath];

    if (!stat.isDirectory()) return [];

    return fs
      .readdirSync(absPath, { withFileTypes: true })
      .filter((d) => !d.name.startsWith("."))
      .map((d) => path.join(absPath, d.name));
  } catch {
    return [];
  }
}

/**
 * Return only files in a directory (or a single file if a file path is passed).
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