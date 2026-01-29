/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/pdf-handler.ts — PRODUCTION SAFE (Windows-safe, build-safe)
//
// ✅ Never calls readdir/scandir on a file
// ✅ Handles EPERM/ENOENT gracefully (Windows locks, antivirus, sync tools)
// ✅ No filesystem work at import-time (only inside functions)
// ✅ Can accept either a directory OR a single PDF file path as input
// ✅ Returns stable, predictable output

import path from "path";
import fs from "fs";

export type PdfItem = {
  id: string;          // e.g. "leadership-standards-blueprint"
  filename: string;    // e.g. "leadership-standards-blueprint.pdf"
  absPath: string;     // absolute file path on disk
  outputPath: string;  // public web path, e.g. "/assets/downloads/public-assets/resources/pdfs/leadership-standards-blueprint.pdf"
};

const fsp = fs.promises;

/**
 * Default directory where your public PDFs live (disk path).
 * Adjust if yours differs.
 */
const DEFAULT_PDFS_DIR = path.join(
  process.cwd(),
  "public",
  "assets",
  "downloads",
  "public-assets",
  "resources",
  "pdfs"
);

/**
 * Default public URL prefix that maps to DEFAULT_PDFS_DIR.
 * Must match your public folder structure.
 */
const DEFAULT_PUBLIC_PREFIX = "/assets/downloads/public-assets/resources/pdfs";

/**
 * Windows-safe stat helper. Returns null on any failure.
 */
async function safeLstat(p: string): Promise<fs.Stats | null> {
  try {
    return await fsp.lstat(p);
  } catch {
    return null;
  }
}

/**
 * True if the file looks like a PDF (case-insensitive).
 */
function isPdfFileName(name: string): boolean {
  return name.toLowerCase().endsWith(".pdf");
}

/**
 * Sanitizes a filename into a stable id.
 */
function toId(filename: string): string {
  return path.basename(filename, ".pdf");
}

/**
 * Build-safe directory read:
 * - If target is a directory: list pdf files within it.
 * - If target is a file: return it if it is a pdf.
 * - Otherwise: return [].
 */
async function listPdfAbsPaths(targetPath: string): Promise<string[]> {
  const stat = await safeLstat(targetPath);
  if (!stat) return [];

  // If user passed a direct file path
  if (stat.isFile()) {
    return isPdfFileName(targetPath) ? [targetPath] : [];
  }

  // If directory, read it safely
  if (stat.isDirectory()) {
    try {
      const entries = await fsp.readdir(targetPath, { withFileTypes: true });
      return entries
        .filter((e) => e.isFile() && isPdfFileName(e.name))
        .map((e) => path.join(targetPath, e.name));
    } catch (err: any) {
      // Windows commonly throws EPERM when file is locked or a sync tool blocks access.
      // We treat it as “no files” to prevent build failure.
      const code = String(err?.code || "");
      if (code === "EPERM" || code === "EACCES" || code === "ENOENT" || code === "ENOTDIR") {
        return [];
      }
      // Unknown error: still don’t crash builds
      console.warn("[pdf-handler] readdir failed:", { targetPath, code, message: err?.message });
      return [];
    }
  }

  // Not a file or directory (symlink/device/etc.) => ignore
  return [];
}

/**
 * Returns a public URL for a given pdf filename.
 */
export function getPdfPublicPath(filename: string, publicPrefix = DEFAULT_PUBLIC_PREFIX): string {
  const safeName = path.basename(filename); // prevents path traversal
  return `${publicPrefix.replace(/\/+$/, "")}/${safeName}`;
}

/**
 * Primary API: list available PDFs.
 *
 * @param options.dirOrFilePath - Either a directory path OR a single pdf file path.
 * @param options.publicPrefix - The public URL prefix mapping to that location.
 */
export async function listPdfs(options?: {
  dirOrFilePath?: string;
  publicPrefix?: string;
}): Promise<PdfItem[]> {
  const dirOrFilePath = options?.dirOrFilePath || DEFAULT_PDFS_DIR;
  const publicPrefix = options?.publicPrefix || DEFAULT_PUBLIC_PREFIX;

  const absList = await listPdfAbsPaths(dirOrFilePath);

  // Stable ordering for deterministic builds
  absList.sort((a, b) => a.localeCompare(b));

  return absList.map((absPath) => {
    const filename = path.basename(absPath);
    return {
      id: toId(filename),
      filename,
      absPath,
      outputPath: getPdfPublicPath(filename, publicPrefix),
    };
  });
}

/**
 * Convenience: resolves a known “id” to its public output path.
 */
export function resolvePdfById(id: string, publicPrefix = DEFAULT_PUBLIC_PREFIX): string {
  const filename = `${id}.pdf`;
  return getPdfPublicPath(filename, publicPrefix);
}