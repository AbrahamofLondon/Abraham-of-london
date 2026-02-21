/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * lib/pdf/registry.ts — TURBOPACK SAFE (NO TOP-LEVEL fs/path)
 *
 * Single source of truth: GENERATED_PDF_CONFIGS (committed).
 * - Safe in Browser / Edge: NO Node built-ins imported at module scope.
 * - Node runtime enrichment: dynamically imports "fs" + "path" only when executed on Node.
 */

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

  outputPath: string; // web path under /public (e.g. /assets/downloads/x.pdf)
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

  // optional registry-provided stats
  exists?: boolean;
  lastModified?: string; // ISO
  fileSizeBytes?: number;
  fileSize?: string; // human (optional)
}

export interface PDFItem extends PDFConfig {
  fileUrl: string;
  lastModifiedISO: string;
  fileSizeHuman: string;
  existsOnDisk: boolean;
}

/** --- RUNTIME DETECTION --- */
function isEdgeRuntime(): boolean {
  return typeof (globalThis as any).EdgeRuntime === "string";
}

function isBrowserRuntime(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

/**
 * We only do fs/path on Node runtime (not Edge, not browser).
 * Turbopack/Next can still *bundle* this file into edge/client graphs,
 * so we must not reference "fs" or "path" at top-level.
 */
function canUseNodeFs(): boolean {
  if (isBrowserRuntime()) return false;
  if (isEdgeRuntime()) return false;
  return typeof process !== "undefined" && !!(process as any).versions?.node;
}

/** --- HELPERS (NO fs/path) --- */
function canonicalizeWebPath(p: string): string {
  let v = String(p || "").trim();
  if (!v.startsWith("/")) v = `/${v}`;
  v = v.replace(/\/{2,}/g, "/");
  return v;
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
    fileSize: raw.fileSize ? String(raw.fileSize) : undefined,
  };
}

/** --- NODE-ONLY ENRICHMENT (dynamic imports; NO "node:" scheme) --- */
type FsModule = typeof import("fs");
type PathModule = typeof import("path");

async function nodeStatIfPossible(webPath: string): Promise<{
  existsOnDisk: boolean;
  mtimeISO: string | null;
  sizeBytes: number | null;
}> {
  if (!canUseNodeFs()) {
    return { existsOnDisk: false, mtimeISO: null, sizeBytes: null };
  }

  try {
    const [fsMod, pathMod] = await Promise.all([
      import("fs") as Promise<FsModule>,
      import("path") as Promise<PathModule>,
    ]);

    const fs = (fsMod as any).default ?? fsMod;
    const path = (pathMod as any).default ?? pathMod;

    const fsPath = path.join(process.cwd(), "public", webPath.replace(/^\/+/, ""));
    const st = fs.statSync(fsPath);

    const existsOnDisk = !!st && st.isFile();
    return {
      existsOnDisk,
      mtimeISO: st?.mtime ? new Date(st.mtime).toISOString() : null,
      sizeBytes: typeof st?.size === "number" ? st.size : null,
    };
  } catch {
    return { existsOnDisk: false, mtimeISO: null, sizeBytes: null };
  }
}

/**
 * Base item (safe everywhere). No fs.
 */
function toItemBase(cfg: PDFConfig): PDFItem {
  const webPath = canonicalizeWebPath(cfg.outputPath);

  const lastModifiedISO = cfg.lastModified || new Date(0).toISOString();
  const bytes = typeof cfg.fileSizeBytes === "number" ? cfg.fileSizeBytes : 0;

  return {
    ...cfg,
    outputPath: webPath,
    fileUrl: webPath,
    lastModifiedISO,
    fileSizeHuman: cfg.fileSize || bytesToHuman(bytes),
    existsOnDisk: false,
    fileSize: cfg.fileSize || bytesToHuman(bytes),
    exists: typeof cfg.exists === "boolean" ? cfg.exists : false,
  };
}

/**
 * Enriched item (node only). Safe to call in API routes / node runtime.
 */
async function toItemEnriched(cfg: PDFConfig): Promise<PDFItem> {
  const base = toItemBase(cfg);
  const st = await nodeStatIfPossible(base.fileUrl);

  const lastModifiedISO = cfg.lastModified || st.mtimeISO || base.lastModifiedISO;

  const bytes =
    typeof cfg.fileSizeBytes === "number"
      ? cfg.fileSizeBytes
      : typeof st.sizeBytes === "number"
      ? st.sizeBytes
      : 0;

  const existsOnDisk = st.existsOnDisk;

  return {
    ...base,
    lastModifiedISO,
    fileSizeHuman: cfg.fileSize || bytesToHuman(bytes),
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

  // If registry doesn't have exists flags, assume includeMissing=false still returns all
  // (because we can't fs-stat in edge/browser safely)
  return arr.filter((x) => x.exists !== false);
}

/**
 * ✅ SAFE EVERYWHERE (no fs). For client dashboards.
 * existsOnDisk will be false unless registry provided exists=true.
 */
export function getAllPDFItems(opts?: { includeMissing?: boolean }): PDFItem[] {
  const includeMissing = Boolean(opts?.includeMissing);
  const arr = getAllPDFs({ includeMissing }).map(toItemBase);

  return arr.sort((a, b) => {
    const ca = String(a.category || "");
    const cb = String(b.category || "");
    if (ca !== cb) return ca.localeCompare(cb);
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

/**
 * ✅ NODE-ONLY accurate version (fs stats). Use in pages/api/* and node runtime app routes.
 * If called in edge/browser it will gracefully return base items.
 */
export async function getAllPDFItemsNode(opts?: { includeMissing?: boolean }): Promise<PDFItem[]> {
  const includeMissing = Boolean(opts?.includeMissing);
  const cfgs = getAllPDFs({ includeMissing });

  const items = await Promise.all(cfgs.map(toItemEnriched));

  return items.sort((a, b) => {
    const ca = String(a.category || "");
    const cb = String(b.category || "");
    if (ca !== cb) return ca.localeCompare(cb);
    return String(a.title || "").localeCompare(String(b.title || ""));
  });
}

/**
 * Stats API (safe everywhere).
 * - In node runtime, it will compute real on-disk stats.
 * - Else it will compute from registry-only.
 */
export async function getRegistryStats() {
  const allItems = canUseNodeFs()
    ? await getAllPDFItemsNode({ includeMissing: true })
    : getAllPDFItems({ includeMissing: true });

  const categories: Record<string, number> = {};
  allItems.forEach((item) => {
    const cat = item.category || "Uncategorized";
    categories[cat] = (categories[cat] || 0) + 1;
  });

  const existsOnDisk = allItems.filter((i) => i.existsOnDisk).length;

  return {
    totalAssets: allItems.length,
    existsOnDisk,
    missingAssets: allItems.length - existsOnDisk,
    categories,
    lastUpdated: new Date().toISOString(),
    runtime: canUseNodeFs() ? "node" : isEdgeRuntime() ? "edge" : "unknown",
  };
}