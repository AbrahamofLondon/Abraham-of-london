/* eslint-disable @typescript-eslint/no-explicit-any */
import * as generated from "contentlayer/generated";

/* -------------------------------------------------------------------------- */
/* Environment-Safe Node Imports                                              */
/* -------------------------------------------------------------------------- */

let fs: any = null;
let path: any = null;

if (typeof window === "undefined") {
  // We use require here so webpack doesn't try to bundle these for the browser
  fs = require("node:fs");
  path = require("node:path");
}

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
/* Build-Time File Logic (Safe Guards)                                        */
/* -------------------------------------------------------------------------- */

export function publicUrlToFsPath(publicUrl: string): string | null {
  if (typeof window !== "undefined" || !path) return null;
  const u = cleanStr(publicUrl);
  if (!u.startsWith("/")) return null;
  return path.join(process.cwd(), "public", trimLeadingSlashes(u));
}

export function publicFileExists(publicUrl: string): boolean {
  if (typeof window !== "undefined" || !fs) return false;
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return false;
  try {
    return fs.existsSync(fsPath);
  } catch {
    return false;
  }
}

export function publicFileSizeBytes(publicUrl: string): number | null {
  if (typeof window !== "undefined" || !fs) return null;
  const fsPath = publicUrlToFsPath(publicUrl);
  if (!fsPath) return null;
  try {
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

/* -------------------------------------------------------------------------- */
/* Collection Pickers                                                         */
/* -------------------------------------------------------------------------- */

const pickArray = (name: string): ContentDoc[] => Array.isArray((generated as any)[name]) ? (generated as any)[name] : [];

export const allPosts = pickArray("allPosts");
export const allDownloads = pickArray("allDownloads");
export const allResources = pickArray("allResources");
export const allCanons = pickArray("allCanons");

export const getDownloadBySlug = (s: string) => 
  allDownloads.find(d => normalizeSlug(d) === s.toLowerCase().trim()) ?? null;