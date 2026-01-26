// lib/pdfs/registry.ts — RUNTIME SAFE (client + server)
// NO fs, NO path, NO node:*, NO require.

import {
  GENERATED_PDF_CONFIGS,
  GENERATED_AT,
  GENERATED_COUNT,
} from "@/scripts/pdf/pdf-registry.generated";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

// Canonical runtime types (what your app should depend on)
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
  lastModified: string; // ISO string for serialization
  exists: boolean;

  tags: string[];
  requiresAuth: boolean;
  version: string;

  priority?: number;
  preload?: boolean;
  placeholder?: string;
  md5?: string;
}

export interface PDFItem extends PDFConfig {
  fileUrl: string;
}

/* -------------------------------------------------------------------------- */
/* NORMALIZATION                                                              */
/* -------------------------------------------------------------------------- */

function canonicalizeOutputPath(p: string): string {
  let v = (p || "").trim();
  if (!v.startsWith("/")) v = `/${v}`;
  v = v.replace(/^\/public\//, "/");
  v = v.replace(/^\/assets\/downloads\/downloads\//, "/assets/downloads/");
  return v;
}

function normalizeTier(t: unknown): PDFTier {
  const v = String(t || "").toLowerCase().trim();

  // Your generator produced an illegal tier "public" in one record.
  // Policy: treat "public" as "free" (or map it to member if you want).
  if (v === "public") return "free";

  if (v === "free" || v === "member" || v === "architect" || v === "inner-circle") return v;
  return "free";
}

function normalizeType(x: unknown): PDFType {
  const v = String(x || "").toLowerCase().trim();

  // Your generator produced "Download" as a type for many.
  // Policy: treat Download(s) as "tool" (generic download artifact).
  if (v === "download" || v === "downloads") return "tool";

  // Accept canonical types
  if (
    v === "editorial" ||
    v === "framework" ||
    v === "academic" ||
    v === "strategic" ||
    v === "tool" ||
    v === "canvas" ||
    v === "worksheet" ||
    v === "assessment" ||
    v === "journal" ||
    v === "tracker" ||
    v === "bundle" ||
    v === "other"
  ) return v;

  return "other";
}

function normalizeFormat(x: unknown): PDFFormat {
  const v = String(x || "").toUpperCase().trim();
  if (v === "PDF" || v === "EXCEL" || v === "POWERPOINT" || v === "ZIP" || v === "BINARY") return v;
  return "BINARY";
}

function normalizePaperFormats(x: unknown): PaperFormat[] {
  const arr = Array.isArray(x) ? x : ["A4"];
  const out: PaperFormat[] = [];
  for (const item of arr) {
    const v = String(item || "").trim();
    if (v === "A4" || v === "Letter" || v === "A3" || v === "bundle") out.push(v);
  }
  return out.length ? out : ["A4"];
}

function toRuntimeConfig(g: any): PDFConfig {
  const lastModified =
    typeof g.lastModified === "string" && g.lastModified.trim()
      ? g.lastModified
      : new Date().toISOString();

  return {
    id: String(g.id),
    title: String(g.title),
    description: String(g.description || ""),
    excerpt: g.excerpt ? String(g.excerpt) : undefined,

    outputPath: canonicalizeOutputPath(String(g.outputPath || "")),
    type: normalizeType(g.type),
    format: normalizeFormat(g.format),

    isInteractive: Boolean(g.isInteractive),
    isFillable: Boolean(g.isFillable),

    category: String(g.category || "downloads"),
    tier: normalizeTier(g.tier),
    formats: normalizePaperFormats(g.formats),

    fileSize: String(g.fileSize || "0 KB"),
    lastModified,
    exists: Boolean(g.exists),

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
  return { ...config, fileUrl: config.outputPath };
}

/* -------------------------------------------------------------------------- */
/* REGISTRY                                                                    */
/* -------------------------------------------------------------------------- */

const PDF_REGISTRY_MAP: Map<string, PDFConfig> = new Map(
  (GENERATED_PDF_CONFIGS || []).map((g: any) => {
    const cfg = toRuntimeConfig(g);
    return [cfg.id, cfg] as const;
  })
);

export const STATIC_PDF_REGISTRY: Record<string, PDFConfig> = Object.fromEntries(PDF_REGISTRY_MAP);

// Back-compat alias expected by older imports
export const PDF_REGISTRY = STATIC_PDF_REGISTRY;

// Cached collections
let cachedAllExisting: PDFConfig[] | null = null;
let cachedAllExistingItems: PDFItem[] | null = null;

/* -------------------------------------------------------------------------- */
/* PUBLIC API                                                                  */
/* -------------------------------------------------------------------------- */

export function getPDFRegistry(): Record<string, PDFConfig> {
  return STATIC_PDF_REGISTRY;
}

export function getAllPDFs(opts?: { includeMissing?: boolean }): PDFConfig[] {
  if (opts?.includeMissing) {
    return Array.from(PDF_REGISTRY_MAP.values()).sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  }

  if (!cachedAllExisting) {
    cachedAllExisting = Array.from(PDF_REGISTRY_MAP.values())
      .filter((p) => p.exists)
      .sort((a, b) => (a.priority ?? 999) - (b.priority ?? 999));
  }
  return cachedAllExisting;
}

export function getAllPDFItems(opts?: { includeMissing?: boolean }): PDFItem[] {
  if (opts?.includeMissing) return getAllPDFs({ includeMissing: true }).map(configToItem);

  if (!cachedAllExistingItems) cachedAllExistingItems = getAllPDFs().map(configToItem);
  return cachedAllExistingItems;
}

export function getPDFById(id: string): PDFConfig | null {
  return PDF_REGISTRY_MAP.get(id) || null;
}

export function getPDFItemById(id: string): PDFItem | null {
  const cfg = getPDFById(id);
  return cfg ? configToItem(cfg) : null;
}

export function getPDFsByTier(tier: PDFTier, opts?: { includeMissing?: boolean }): PDFConfig[] {
  return getAllPDFs(opts).filter((p) => p.tier === tier);
}

export function getPDFsByType(type: PDFType, opts?: { includeMissing?: boolean }): PDFConfig[] {
  return getAllPDFs(opts).filter((p) => p.type === type);
}

export function getInteractivePDFs(opts?: { includeMissing?: boolean }): PDFConfig[] {
  return getAllPDFs(opts).filter((p) => p.isInteractive);
}

export function getFillablePDFs(opts?: { includeMissing?: boolean }): PDFConfig[] {
  return getAllPDFs(opts).filter((p) => p.isFillable);
}

export function searchPDFs(query: string, opts?: { includeMissing?: boolean }): PDFConfig[] {
  const q = (query || "").toLowerCase().trim();
  if (!q) return getAllPDFs(opts);
  return getAllPDFs(opts).filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.tags || []).some((t) => t.toLowerCase().includes(q))
  );
}

export function getPDFStats() {
  const all = Array.from(PDF_REGISTRY_MAP.values());
  return {
    generatedAt: GENERATED_AT,
    generatedCount: GENERATED_COUNT,
    total: all.length,
    available: all.filter((p) => p.exists).length,
    interactive: all.filter((p) => p.isInteractive).length,
    fillable: all.filter((p) => p.isFillable).length,
    byTier: {
      free: all.filter((p) => p.tier === "free").length,
      member: all.filter((p) => p.tier === "member").length,
      architect: all.filter((p) => p.tier === "architect").length,
      "inner-circle": all.filter((p) => p.tier === "inner-circle").length,
    },
  };
}

// Runtime-safe stubs (keep only if something imports them)
export function scanForDynamicAssets() {
  return { ok: true, found: [], message: "runtime-safe stub" };
}
export function needsRegeneration(_pdf: PDFConfig): boolean {
  return false;
}
export function getPDFsRequiringGeneration(): PDFConfig[] {
  return [];
}
export async function generateMissingPDFs() {
  return { ok: true, generated: 0, missing: [], message: "runtime no-op" };
}