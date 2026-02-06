/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/pdf/registry.ts — SINGLE SOURCE OF TRUTH (Next-safe)
 * Reads from: lib/pdf/pdf-registry.generated.ts (committed file)
 */

import fs from 'fs'
import path from 'path'
import { GENERATED_PDF_CONFIGS } from "./pdf-registry.generated";

/** --- TYPES --- */
export type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "assessment"
  | "journal"
  | "tracker"
  | "bundle"
  | "pack"
  | "playbook"
  | "brief"
  | "liturgy"
  | "study"
  | "checklist"
  | "toolkit"
  | "other";

export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PDFTier = "free" | "member" | "architect" | "inner-circle";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export interface PDFConfig {
  id: string;
  title: string;
  description?: string;
  excerpt?: string;

  outputPath: string;
  type?: PDFType;
  format?: PDFFormat;
  formats?: PaperFormat[];

  category?: string;
  tier?: PDFTier;

  isInteractive?: boolean;
  isFillable?: boolean;
  requiresAuth?: boolean;

  version?: string;
  author?: string;
  tags?: string[];

  exists?: boolean;
  lastModified?: string; // ISO
  fileSizeBytes?: number;
  fileSize?: string; // computed human-readable (optional)
}

export interface PDFItem extends PDFConfig {
  fileUrl: string;
  lastModifiedISO: string;
  fileSizeHuman: string;
  existsOnDisk: boolean;
}

/** --- HELPERS --- */
function canonicalizeWebPath(p: string): string {
  let v = String(p || "").trim();
  if (!v.startsWith("/")) v = `/${v}`;
  v = v.replace(/\/{2,}/g, "/");
  return v;
}

function toFsPathFromWebPath(webPath: string): string {
  // Assumes webPath is under /public
  // Example: /assets/downloads/foo.pdf -> <cwd>/public/assets/downloads/foo.pdf
  return path.join(process.cwd(), "public", webPath.replace(/^\/+/, ""));
}

function statSafe(fsPath: string): fs.Stats | null {
  try {
    return fs.statSync(fsPath);
  } catch {
    return null;
  }
}

function bytesToHuman(bytes?: number): string {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function normalizeEntry(raw: any): PDFConfig {
  const outputPath = canonicalizeWebPath(raw.outputPath);
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : [];

  return {
    id: String(raw.id),
    title: String(raw.title || raw.id),
    description: raw.description ? String(raw.description) : undefined,
    excerpt: raw.excerpt ? String(raw.excerpt) : undefined,

    outputPath,
    type: (raw.type || "other") as PDFType,
    format: (raw.format || "PDF") as PDFFormat,
    formats: (Array.isArray(raw.formats) && raw.formats.length ? raw.formats : ["A4"]) as PaperFormat[],

    category: raw.category ? String(raw.category) : "Vault",
    tier: (raw.tier || "free") as PDFTier,

    isInteractive: Boolean(raw.isInteractive),
    isFillable: Boolean(raw.isFillable),
    requiresAuth: Boolean(raw.requiresAuth),

    version: raw.version ? String(raw.version) : "1.0.0",
    author: raw.author ? String(raw.author) : undefined,
    tags,

    exists: typeof raw.exists === "boolean" ? raw.exists : undefined,
    lastModified: raw.lastModified ? String(raw.lastModified) : undefined,
    fileSizeBytes: typeof raw.fileSizeBytes === "number" ? raw.fileSizeBytes : undefined,
  };
}

function toItem(cfg: PDFConfig): PDFItem {
  const webPath = canonicalizeWebPath(cfg.outputPath);
  const fsPath = toFsPathFromWebPath(webPath);
  const st = statSafe(fsPath);

  const existsOnDisk = Boolean(st && st.isFile());
  const lastModifiedISO =
    cfg.lastModified ||
    (st?.mtime ? new Date(st.mtime).toISOString() : new Date(0).toISOString());

  const bytes =
    typeof cfg.fileSizeBytes === "number"
      ? cfg.fileSizeBytes
      : (st?.size ? Number(st.size) : 0);

  return {
    ...cfg,
    outputPath: webPath,
    fileUrl: webPath,
    lastModifiedISO,
    fileSizeHuman: bytesToHuman(bytes),
    existsOnDisk,
    fileSize: cfg.fileSize || bytesToHuman(bytes),
    exists: typeof cfg.exists === "boolean" ? cfg.exists : existsOnDisk,
  };
}

/** --- PUBLIC API --- */
export function getPDFRegistry(): Record<string, PDFConfig> {
  const arr = Array.isArray(GENERATED_PDF_CONFIGS) ? GENERATED_PDF_CONFIGS : [];
  const out: Record<string, PDFConfig> = {};
  for (const raw of arr as any[]) {
    const cfg = normalizeEntry(raw);
    if (cfg.id) out[cfg.id] = cfg;
  }
  return out;
}

export function getPDFById(id: string): PDFConfig | null {
  const reg = getPDFRegistry();
  return reg[id] || null;
}

export function getAllPDFs(opts?: { includeMissing?: boolean }): PDFConfig[] {
  const includeMissing = Boolean(opts?.includeMissing);
  const reg = getPDFRegistry();
  const arr = Object.values(reg);
  if (includeMissing) return arr;
  return arr.filter((x) => Boolean(x.exists));
}

export function getAllPDFItems(opts?: { includeMissing?: boolean }): PDFItem[] {
  const includeMissing = Boolean(opts?.includeMissing);
  const arr = getAllPDFs({ includeMissing }).map(toItem);
  // Stable sort: category then title
  return arr.sort((a, b) => {
    const ca = String(a.category || "");
    const cb = String(b.category || "");
    if (ca !== cb) return ca.localeCompare(cb);
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

/** * --- INSTITUTIONAL STATS API --- 
 * Provides aggregate data for the vault-audit and stats routes.
 */
export async function getRegistryStats() {
  const allItems = getAllPDFItems({ includeMissing: true });
  
  // Calculate category distribution
  const categories: Record<string, number> = {};
  allItems.forEach(item => {
    const cat = item.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;
  });

  return {
    totalAssets: allItems.length,
    existsOnDisk: allItems.filter(i => i.existsOnDisk).length,
    missingAssets: allItems.filter(i => !i.existsOnDisk).length,
    categories,
    lastUpdated: new Date().toISOString()
  };
}