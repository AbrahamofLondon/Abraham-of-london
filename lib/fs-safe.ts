// lib/fs-safe.ts
import fs from "node:fs";
import path from "node:path";

export function isDirectory(absPath: string): boolean {
  try {
    return !!absPath && fs.existsSync(absPath) && fs.statSync(absPath).isDirectory();
  } catch {
    return false;
  }
}

export function safeReadDir(absPath: string): string[] {
  try {
    if (!isDirectory(absPath)) return [];
    return fs
      .readdirSync(absPath, { withFileTypes: true })
      .filter((d) => !d.name.startsWith("."))
      .map((d) => path.join(absPath, d.name));
  } catch {
    return [];
  }
}