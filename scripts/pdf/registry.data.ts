/* scripts/pdf/registry.data.ts — PRODUCTION-OPTIMIZED, NEXT-SAFE, FS-AWARE */

import fs from "node:fs";
import path from "node:path";

// If your generator produces this file, keep it.
// If it doesn't exist in some environments, we fallback safely.
let GENERATED_PDF_CONFIGS: any[] = [];
type PDFConfigGenerated = any;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod = require("./pdf/pdf-registry.generated");
  GENERATED_PDF_CONFIGS = Array.isArray(mod.GENERATED_PDF_CONFIGS) ? mod.GENERATED_PDF_CONFIGS : [];
} catch {
  GENERATED_PDF_CONFIGS = [];
}

/* --- TYPES --- */
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
  | "other";

export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PDFTier = "free" | "member" | "architect" | "inner-circle";
export type PaperFormat = "A4" | "Letter" | "A3" | "bundle";

export interface PDFConfig {
  id: string;
  title: string;
  description: string;
  excerpt?: string;
  outputPath: string;

  type: PDFType;
  format: PDFFormat;
  isInteractive: boolean;
  isFillable: boolean;

  category: string;
  tier: PDFTier;
  formats: PaperFormat[];
  fileSize: string;

  lastModified: Date;
  exists: boolean;

  tags: string[];
  requiresAuth: boolean;

  version: string;
  priority?: number;
  preload?: boolean;
  placeholder?: string;
  md5?: string;
}

export interface PDFItem extends Omit<PDFConfig, "lastModified"> {
  lastModified: string;
  fileUrl: string;
}

/* --- CONSTANTS (CANONICAL VAULT PATH) --- */
const VAULT_LIB_PDF_WEB_ROOT = "/vault/downloads/lib-pdf";
const VAULT_LIB_PDF_FS_ROOT = path.join(process.cwd(), "public", "vault", "downloads", "lib-pdf");

/* --- HELPERS --- */
function canonicalizeOutputPath(p: string): string {
  let v = String(p || "").trim();
  if (!v.startsWith("/")) v = `/${v}`;
  v = v.replace(/^\/public\//, "/");
  // Remove accidental double slashes
  v = v.replace(/\/{2,}/g, "/");
  return v;
}

function toFsPathFromWebPath(webPath: string): string {
  return path.join(process.cwd(), "public", webPath.replace(/^\/+/, ""));
}

function fileStatSafe(fsPath: string): fs.Stats | null {
  try {
    return fs.statSync(fsPath);
  } catch {
    return null;
  }
}

function fileExistsSafeFromWebPath(webPath?: string): boolean {
  if (!webPath) return false;
  const st = fileStatSafe(toFsPathFromWebPath(webPath));
  return Boolean(st && st.isFile());
}

function bytesToHuman(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v = v / 1024;
    i++;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.[^.]+$/, "");
}

function titleFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferFormatFromExt(ext: string): PDFFormat {
  const e = ext.toLowerCase();
  if (e === ".pdf") return "PDF";
  if (e === ".xlsx" || e === ".xls") return "EXCEL";
  if (e === ".pptx" || e === ".ppt") return "POWERPOINT";
  if (e === ".zip") return "ZIP";
  return "BINARY";
}

function inferTypeFromSlug(id: string): PDFType {
  const s = id.toLowerCase();
  if (s.includes("court") || s.includes("legal")) return "tool";
  if (s.includes("starter") || s.includes("kit")) return "bundle";
  if (s.includes("guide")) return "tool";
  if (s.includes("canvas")) return "canvas";
  if (s.includes("framework")) return "framework";
  if (s.includes("journal")) return "journal";
  if (s.includes("tracker")) return "tracker";
  return "other";
}

function toRuntimeConfig(g: PDFConfigGenerated): PDFConfig {
  const outputPath = canonicalizeOutputPath(g.outputPath);
  const exists = typeof g.exists === "boolean" ? g.exists : fileExistsSafeFromWebPath(outputPath);
  const lastModified = g.lastModified ? new Date(g.lastModified) : new Date(0);

  return {
    id: String(g.id),
    title: String(g.title || g.id),
    description: String(g.description || ""),
    excerpt: g.excerpt ? String(g.excerpt) : undefined,
    outputPath,

    type: (g.type || "other") as PDFType,
    format: (g.format || "PDF") as PDFFormat,
    isInteractive: Boolean(g.isInteractive),
    isFillable: Boolean(g.isFillable),

    category: String(g.category || "Vault"),
    tier: (g.tier || "free") as PDFTier,
    formats: (Array.isArray(g.formats) && g.formats.length ? g.formats : ["A4"]) as PaperFormat[],
    fileSize: String(g.fileSize || ""),

    lastModified,
    exists,

    tags: Array.isArray(g.tags) ? g.tags.map(String) : [],
    requiresAuth: Boolean(g.requiresAuth),

    version: String(g.version || "1.0.0"),
    priority: typeof g.priority === "number" ? g.priority : undefined,
    preload: Boolean(g.preload),
    placeholder: g.placeholder ? String(g.placeholder) : undefined,
    md5: g.md5 ? String(g.md5) : undefined,
  };
}

export function configToItem(config: PDFConfig): PDFItem {
  return {
    ...config,
    lastModified: config.lastModified.toISOString(),
    fileUrl: config.outputPath,
  };
}

/* -----------------------------------------------------------------------------
   FS DISCOVERY — make sure VAULT files appear even if generator/registry missed them
----------------------------------------------------------------------------- */
function discoverVaultLibPdfFiles(): PDFConfig[] {
  const configs: PDFConfig[] = [];

  const dirStat = fileStatSafe(VAULT_LIB_PDF_FS_ROOT);
  if (!dirStat || !dirStat.isDirectory()) return configs;

  const files = fs.readdirSync(VAULT_LIB_PDF_FS_ROOT, { withFileTypes: true });
  for (const f of files) {
    if (!f.isFile()) continue;

    const filename = f.name;
    const ext = path.extname(filename);
    if (!ext) continue;

    // Only include known downloadable binaries
    const fmt = inferFormatFromExt(ext);
    if (!["PDF", "EXCEL", "POWERPOINT", "ZIP", "BINARY"].includes(fmt)) continue;

    const id = slugFromFilename(filename);
    const webPath = canonicalizeOutputPath(`${VAULT_LIB_PDF_WEB_ROOT}/${filename}`);
    const fsPath = path.join(VAULT_LIB_PDF_FS_ROOT, filename);
    const st = fileStatSafe(fsPath);

    configs.push({
      id,
      title: titleFromSlug(id),
      description: "Vault asset (filesystem-discovered).",
      excerpt: undefined,
      outputPath: webPath,

      type: inferTypeFromSlug(id),
      format: fmt,
      isInteractive: false,
      isFillable: false,

      category: "Vault",
      tier: "member", // default: safer than "free" if this is your Inner Circle vault
      formats: ["A4"],
      fileSize: bytesToHuman(st?.size ? Number(st.size) : 0),

      lastModified: st?.mtime ? new Date(st.mtime) : new Date(),
      exists: true,

      tags: [],
      requiresAuth: true,

      version: "1.0.0",
      priority: 999,
      preload: false,
      placeholder: undefined,
      md5: undefined,
    });
  }

  return configs;
}

/* -----------------------------------------------------------------------------
   REGISTRY BUILD — merge generated configs + filesystem-discovered configs
----------------------------------------------------------------------------- */
function buildRegistryMap(): Map<string, PDFConfig> {
  const map = new Map<string, PDFConfig>();

  // 1) Generated registry first (authoritative metadata)
  for (const g of GENERATED_PDF_CONFIGS || []) {
    try {
      const cfg = toRuntimeConfig(g);
      if (cfg?.id) map.set(cfg.id, cfg);
    } catch {
      // ignore bad generated rows
    }
  }

  // 2) FS discovered vault files (fill gaps)
  for (const cfg of discoverVaultLibPdfFiles()) {
    if (!map.has(cfg.id)) map.set(cfg.id, cfg);
  }

  return map;
}

/* -----------------------------------------------------------------------------
   CACHING — opts-sensitive caches (bug fix)
----------------------------------------------------------------------------- */
let _registryMap: Map<string, PDFConfig> | null = null;
let _registryObj: Record<string, PDFConfig> | null = null;

// Cache keyed by includeMissing flag
const _allCache = new Map<string, PDFConfig[]>();
const _itemsCache = new Map<string, PDFItem[]>();

function getRegistryMap(): Map<string, PDFConfig> {
  if (!_registryMap) _registryMap = buildRegistryMap();
  return _registryMap;
}

function getRegistryObj(): Record<string, PDFConfig> {
  if (!_registryObj) _registryObj = Object.fromEntries(getRegistryMap());
  return _registryObj;
}

/* --- PUBLIC API --- */
export function getPDFRegistry(): Record<string, PDFConfig> {
  return getRegistryObj();
}

export function getPDFById(id: string): PDFConfig | null {
  return getRegistryMap().get(id) || null;
}

export function getAllPDFs(opts?: { includeMissing?: boolean }): PDFConfig[] {
  const includeMissing = Boolean(opts?.includeMissing);
  const key = includeMissing ? "includeMissing:1" : "includeMissing:0";

  const cached = _allCache.get(key);
  if (cached) return cached;

  const arr = Array.from(getRegistryMap().values())
    .filter((pdf) => (includeMissing ? true : pdf.exists))
    .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));

  _allCache.set(key, arr);
  return arr;
}

export function getAllPDFItems(opts?: { includeMissing?: boolean }): PDFItem[] {
  const includeMissing = Boolean(opts?.includeMissing);
  const key = includeMissing ? "includeMissing:1" : "includeMissing:0";

  const cached = _itemsCache.get(key);
  if (cached) return cached;

  const items = getAllPDFs({ includeMissing }).map(configToItem);
  _itemsCache.set(key, items);
  return items;
}

/**
 * Useful for build steps/debugging: forces a full refresh.
 * (Don't call per-request in Next pages; use at build tooling time only.)
 */
export function __refreshPdfRegistryForBuildOnly(): void {
  _registryMap = null;
  _registryObj = null;
  _allCache.clear();
  _itemsCache.clear();
}

/**
 * MISSING EXPORT - Added to fix build error
 * Alias for __refreshPdfRegistryForBuildOnly to match expected import name
 */
export function clearRegistryCache(): void {
  __refreshPdfRegistryForBuildOnly();
}

/**
 * Alternative export name for compatibility
 */
export const refreshPdfRegistry = __refreshPdfRegistryForBuildOnly;