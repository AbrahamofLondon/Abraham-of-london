// lib/fs-safe.ts
// Enterprise-grade "fail-soft" filesystem helpers.
// Guarantees: never scandir a file path; never throw on EPERM/ENOENT; deterministic outputs.

import fs from "fs";
import path from "path";

export function isDirectory(absPath: string): boolean {
  try {
    return !!absPath && fs.existsSync(absPath) && fs.statSync(absPath).isDirectory();
  } catch {
    return false;
  }
}

export function isFile(absPath: string): boolean {
  try {
    return !!absPath && fs.existsSync(absPath) && fs.statSync(absPath).isFile();
  } catch {
    return false;
  }
}

export type SafeReadDirOptions = {
  /** return absolute paths (default true) */
  absolute?: boolean;
  /** include hidden entries starting with "." (default false) */
  includeHidden?: boolean;
  /** include files (default false) */
  includeFiles?: boolean;
  /** include directories (default true) */
  includeDirs?: boolean;
};

const DEFAULT_OPTS: Required<SafeReadDirOptions> = {
  absolute: true,
  includeHidden: false,
  includeFiles: false,
  includeDirs: true,
};

/**
 * SAFE DIRECTORY LISTING
 * - Only reads directories (will return [] if absPath isn't a directory)
 * - Filters by dirent type (directories/files)
 * - Never throws on EPERM/ENOENT; returns []
 */
export function safeReadDir(absPath: string, opts: SafeReadDirOptions = {}): string[] {
  const o = { ...DEFAULT_OPTS, ...opts };

  try {
    if (!isDirectory(absPath)) return [];

    const entries = fs.readdirSync(absPath, { withFileTypes: true });

    const filtered = entries.filter((d) => {
      if (!o.includeHidden && d.name.startsWith(".")) return false;
      if (d.isDirectory()) return o.includeDirs;
      if (d.isFile()) return o.includeFiles;
      return false;
    });

    return filtered
      .map((d) => (o.absolute ? path.join(absPath, d.name) : d.name))
      .sort((a, b) => a.localeCompare(b));
  } catch (e: any) {
    if (e?.code === "EPERM" || e?.code === "ENOENT") return [];
    return [];
  }
}

/** Convenience: list only directories */
export function safeReadDirDirs(absPath: string, opts: Omit<SafeReadDirOptions, "includeFiles" | "includeDirs"> = {}) {
  return safeReadDir(absPath, { ...opts, includeDirs: true, includeFiles: false });
}

/** Convenience: list only files */
export function safeReadDirFiles(absPath: string, opts: Omit<SafeReadDirOptions, "includeFiles" | "includeDirs"> = {}) {
  return safeReadDir(absPath, { ...opts, includeDirs: false, includeFiles: true });
}

