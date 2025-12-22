/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";
import fs from "node:fs";
import path from "node:path";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const cleanStr = (v: unknown) => String(v ?? "").trim();
const trimLeadingSlashes = (s: string) => s.replace(/^\/+/, "");
const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

/**
 * Build-time only. Resolves a public URL path ("/assets/...") to an absolute FS path.
 * Returns null if the URL path is not a site-local absolute path.
 */
export function publicUrlToFsPath(publicUrl: string): string | null {
  const u = cleanStr(publicUrl);
  if (!u.startsWith("/")) return null;
  // Map "/assets/downloads/x.pdf" -> "<repo>/public/assets/downloads/x.pdf"
  return path.join(process.cwd(), "public", trimLeadingSlashes(u));
}

/**
 * Build-time only. True if the file exists on disk.
 */
export function publicFileExists(publicUrl: string): boolean {
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return false;
  try {
    return fs.existsSync(fsPath);
  } catch {
    return false;
  }
}

/**
 * Build-time only. Returns file size in bytes for a site-local public URL.
 */
export function publicFileSizeBytes(publicUrl: string): number | null {
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return null;
  try {
    const stat = fs.statSync(fsPath);
    return typeof stat.size === "number" ? stat.size : null;
  } catch {
    return null;
  }
}

/**
 * Formats bytes into a small, UI-friendly string ("7 KB", "1.2 MB").
 */
export function formatBytes(bytes: number): string {
  const b = Math.max(0, bytes);
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

/* -------------------------------------------------------------------------- */
/* Access control                                                             */
/* -------------------------------------------------------------------------- */

export function getAccessLevel(
  doc: any,
): "public" | "inner-circle" | "private" {
  const v = cleanStr(doc?.accessLevel).toLowerCase();
  if (v === "inner-circle" || v === "private" || v === "public") return v;
  return "public";
}

/* -------------------------------------------------------------------------- */
/* Slug normalisation (existing in your file)                                 */
/* -------------------------------------------------------------------------- */
// keep your normalizeSlug(...) as-is

/* -------------------------------------------------------------------------- */
/* Download URL resolution (STRICT + CANONICAL)                               */
/* -------------------------------------------------------------------------- */

/**
 * Normalises download urls:
 * - If legacy "/downloads/..." is found, rewrite to "/assets/downloads/..."
 * - If "/assets/downloads/..." is already provided, preserve it
 * - If something else is provided, preserve it as a site-local path (leading slash)
 *
 * No auto-prefixing filenames (no guessing). We only rewrite what we *know* is legacy.
 */
export function resolveDocDownloadUrl(doc: any): string | null {
  const raw =
    cleanStr(doc?.downloadUrl) ||
    cleanStr(doc?.fileUrl) ||
    cleanStr(doc?.pdfPath) ||
    cleanStr(doc?.file) ||
    cleanStr(doc?.downloadFile);

  if (!raw) return null;

  const url = ensureLeadingSlash(raw);

  // Canonical rewrite: legacy "/downloads/*" -> "/assets/downloads/*"
  if (url.startsWith("/downloads/")) {
    return url.replace(/^\/downloads\//, "/assets/downloads/");
  }

  // Already correct:
  if (url.startsWith("/assets/downloads/")) {
    return url;
  }

  // Keep other site-local paths unchanged (still absolute).
  return url;
}

/**
 * Returns the *effective* href for a download button.
 * Public downloads go direct to the file.
 * Inner-circle/private go through an API redirect gate.
 */
export function resolveDocDownloadHref(doc: any): string | null {
  const direct = resolveDocDownloadUrl(doc);
  if (!direct) return null;

  const access = getAccessLevel(doc);
  if (access === "public") return direct;

  // Gate by slug (deterministic) — API will redirect if allowed.
  // Uses your existing normalizeSlug(doc).
  const slug = normalizeSlug(doc);
  if (!slug) return null;

  return `/api/downloads/${encodeURIComponent(slug)}`;
}