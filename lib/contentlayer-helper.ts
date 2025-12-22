/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

/* -------------------------------------------------------------------------- */
/* Types & Helpers                                                            */
/* -------------------------------------------------------------------------- */

export type DocKind = "post" | "book" | "download" | "event" | "print" | "resource" | "strategy" | "canon" | "short" | "unknown";
export type AccessLevel = "public" | "inner-circle" | "private";
export type ContentDoc = any;

const KIND_URL_MAP: Record<DocKind, string> = {
  post: "/blog",
  book: "/books",
  canon: "/canon",
  download: "/downloads",
  event: "/events",
  print: "/prints",
  short: "/shorts",
  resource: "/resources",
  strategy: "/strategy",
  unknown: "/content",
};

const cleanStr = (v: unknown) => String(v ?? "").trim();
const cleanLower = (v: unknown) => cleanStr(v).toLowerCase();
const trimLeadingSlashes = (s: string) => s.replace(/^\/+/, "");
const ensureLeadingSlash = (s: string) => (s.startsWith("/") ? s : `/${s}`);

/* -------------------------------------------------------------------------- */
/* Build-Time File Logic (Conditional - Server-Side Only)                     */
/* -------------------------------------------------------------------------- */

export function publicUrlToFsPath(publicUrl: string): string | null {
  // This function only works during build time (server-side)
  if (typeof window !== "undefined") return null;
  
  try {
    // CRITICAL: Use "path" not "node:path" - Next.js handles this differently
    const path = require("path"); // Changed from "node:path"
    const u = cleanStr(publicUrl);
    if (!u.startsWith("/")) return null;
    return path.join(process.cwd(), "public", trimLeadingSlashes(u));
  } catch {
    return null;
  }
}

export function publicFileExists(publicUrl: string): boolean {
  // This function only works during build time (server-side)
  if (typeof window !== "undefined") return false;
  
  try {
    // CRITICAL: Use "fs" not "node:fs"
    const fs = require("fs"); // Changed from "node:fs"
    const fsPath = publicUrlToFsPath(publicUrl);
    if (!fsPath) return false;
    return fs.existsSync(fsPath);
  } catch {
    return false;
  }
}

export function publicFileSizeBytes(publicUrl: string): number | null {
  // This function only works during build time (server-side)
  if (typeof window !== "undefined") return null;
  
  try {
    // CRITICAL: Use "fs" not "node:fs"
    const fs = require("fs"); // Changed from "node:fs"
    const fsPath = publicUrlToFsPath(publicUrl);
    if (!fsPath) return null;
    const stat = fs.statSync(fsPath);
    return typeof stat.size === "number" ? stat.size : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/* Normalization & Resolution                                                 */
/* -------------------------------------------------------------------------- */

export function normalizeSlug(doc: ContentDoc): string {
  if (!doc) return "";
  const s = cleanStr(doc.slug || doc._raw?.flattenedPath?.split("/").pop());
  return s.toLowerCase().trim();
}

export function resolveDocDownloadUrl(doc: ContentDoc): string | null {
  const raw = cleanStr(doc?.downloadUrl || doc?.fileUrl || doc?.downloadFile);
  if (!raw) return null;
  const url = ensureLeadingSlash(raw);
  return url.startsWith("/downloads/") ? url.replace(/^\/downloads\//, "/assets/downloads/") : url;
}

export function resolveDocDownloadSizeLabel(doc: ContentDoc): string | null {
  // First check if there's a manually specified fileSize
  if (doc?.fileSize && typeof doc.fileSize === "string" && doc.fileSize.trim().length) {
    return doc.fileSize.trim();
  }
  
  // Otherwise, try to calculate from the actual file during build
  const fileUrl = resolveDocDownloadUrl(doc);
  if (!fileUrl) return null;
  
  const bytes = publicFileSizeBytes(fileUrl);
  if (bytes === null) return null;
  
  // Format bytes to human readable size
  const units = ["B", "KB", "MB", "GB"];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/* -------------------------------------------------------------------------- */
/* Collection Pickers                                                         */
/* -------------------------------------------------------------------------- */

const pickArray = (name: string): ContentDoc[] => 
  Array.isArray((generated as any)[name]) ? (generated as any)[name] : [];

export const allPosts = pickArray("allPosts");
export const allDownloads = pickArray("allDownloads");
export const allResources = pickArray("allResources");
export const allCanons = pickArray("allCanons");

export const getDownloadBySlug = (s: string) => 
  allDownloads.find(d => normalizeSlug(d) === s.toLowerCase().trim()) ?? null;

/* -------------------------------------------------------------------------- */
/* Helper Functions for Downloads Index                                       */
/* -------------------------------------------------------------------------- */

export function getAllDownloads(): ContentDoc[] {
  return allDownloads;
}

export function assertContentlayerHasDocs(caller: string): void {
  if (allDownloads.length === 0) {
    console.warn(`⚠️ No downloads found from Contentlayer (called by ${caller})`);
  }
}

export function assertDownloadFilesExist(docs: ContentDoc[]): void {
  // Only run this check during build, not in browser
  if (typeof window !== "undefined") return;
  
  for (const doc of docs) {
    const fileUrl = resolveDocDownloadUrl(doc);
    if (fileUrl && !publicFileExists(fileUrl)) {
      console.warn(`⚠️ Download file not found: ${fileUrl} (for ${doc.title || doc.slug})`);
    }
  }
}

export function resolveDocCoverImage(doc: ContentDoc): string | null {
  const cover = doc?.cover || doc?.coverImage || doc?.image;
  if (!cover) return null;
  const cleaned = cleanStr(cover);
  return cleaned ? ensureLeadingSlash(cleaned) : null;
}

export function resolveDocDownloadHref(doc: ContentDoc): string | null {
  const fileUrl = resolveDocDownloadUrl(doc);
  if (!fileUrl) return null;
  
  // For public downloads, use direct link
  const access = getAccessLevel(doc);
  if (access === "public") {
    return fileUrl;
  }
  
  // For protected downloads, use API route
  return `/api/downloads/${normalizeSlug(doc)}`;
}

export function getAccessLevel(doc: ContentDoc): AccessLevel {
  const level = cleanLower(doc.accessLevel || doc.access || doc.visibility);
  
  if (level.includes("inner-circle")) {
    if (level.includes("plus")) return "inner-circle-plus";
    if (level.includes("elite")) return "inner-circle-elite";
    return "inner-circle";
  }
  
  if (level.includes("private") || level.includes("hidden")) {
    return "private";
  }
  
  return "public";
}