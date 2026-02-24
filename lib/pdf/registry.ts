/* eslint-disable @typescript-eslint/no-explicit-any */
import { GENERATED_PDF_CONFIGS } from "./pdf-registry.generated";

/** --- TYPES --- */
export type PDFType = 
  | "editorial" 
  | "framework" 
  | "academic" 
  | "strategic" 
  | "brief" 
  | "other" 
  | "worksheet" 
  | "assessment" 
  | "tool";  // ✅ Expanded to match landing page usage

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
  lastModified?: string;
  fileSizeBytes?: number;
  fileSize?: string;
}

export interface PDFItem extends PDFConfig {
  fileUrl: string;
  lastModifiedISO: string;
  fileSizeHuman: string;
  existsOnDisk: boolean;
}

/** --- INTERNAL HELPERS --- */
function canUseNodeFs(): boolean {
  if (typeof window !== "undefined") return false;
  if (typeof (globalThis as any).EdgeRuntime === "string") return false;
  return typeof process !== "undefined" && !!(process as any).versions?.node;
}

function canonicalizeWebPath(p: string): string {
  let v = String(p || "").trim();
  if (!v.startsWith("/")) v = `/${v}`;
  return v.replace(/\/{2,}/g, "/");
}

function bytesToHuman(bytes?: number): string {
  const n = Number(bytes || 0);
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let v = n;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function normalizeEntry(raw: any): PDFConfig {
  // Validate type against expanded union
  const rawType = raw.type || "other";
  const validType = isValidPDFType(rawType) ? rawType : "other";
  
  return {
    ...raw,
    id: String(raw.id),
    title: String(raw.title || raw.id),
    outputPath: canonicalizeWebPath(raw.outputPath || `/downloads/pdfs/${raw.id}.pdf`),
    type: validType,
    tier: (raw.tier || "free") as PDFTier,
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
  };
}

// Type guard for PDFType
function isValidPDFType(type: string): type is PDFType {
  const validTypes: PDFType[] = [
    "editorial", "framework", "academic", "strategic", 
    "brief", "other", "worksheet", "assessment", "tool"
  ];
  return validTypes.includes(type as PDFType);
}

function toItemBase(cfg: PDFConfig): PDFItem {
  const webPath = canonicalizeWebPath(cfg.outputPath);
  return {
    ...cfg,
    fileUrl: webPath,
    lastModifiedISO: cfg.lastModified || new Date(0).toISOString(),
    fileSizeHuman: cfg.fileSize || bytesToHuman(cfg.fileSizeBytes),
    existsOnDisk: !!cfg.exists,
  };
}

/** --- PUBLIC API EXPORTS --- */

/**
 * Returns the full registry map.
 */
export function getPDFRegistry(): Record<string, PDFConfig> {
  const arr = Array.isArray(GENERATED_PDF_CONFIGS) ? GENERATED_PDF_CONFIGS : [];
  const out: Record<string, PDFConfig> = {};
  for (const raw of arr) {
    const cfg = normalizeEntry(raw);
    if (cfg.id) out[cfg.id] = cfg;
  }
  return out;
}

/**
 * ✅ FIX: Used by lib/pdf-generator.ts and scripts
 */
export function getPDFById(id: string): PDFConfig | undefined {
  return getPDFRegistry()[id];
}

/**
 * Returns all configs as an array.
 */
export function getAllPDFs(): PDFConfig[] {
  return Object.values(getPDFRegistry());
}

/**
 * Returns UI-ready items. Safe for both Client and Server.
 */
export function getAllPDFItems(opts?: { includeMissing?: boolean }): PDFItem[] {
  const cfgs = getAllPDFs();
  const items = cfgs.map(toItemBase);
  return opts?.includeMissing ? items : items.filter(i => i.existsOnDisk);
}

/**
 * Get PDFs filtered by type
 */
export function getPDFsByType(type: PDFType): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.type === type);
}

/**
 * Get PDFs filtered by tier
 */
export function getPDFsByTier(tier: PDFTier): PDFConfig[] {
  return getAllPDFs().filter(pdf => pdf.tier === tier);
}

/**
 * ✅ FIX: Used by institutional-analytics.ts
 */
export function getRegistryStats() {
  const all = getAllPDFItems({ includeMissing: true });
  return {
    total: all.length,
    generated: all.filter(i => i.existsOnDisk).length,
    missing: all.filter(i => !i.existsOnDisk).length,
    byTier: all.reduce((acc, curr) => {
      const tier = curr.tier || 'free';
      acc[tier] = (acc[tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byType: all.reduce((acc, curr) => {
      const type = curr.type || 'other';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };
}

/** --- NODE-ONLY ENRICHMENT --- */

/**
 * ✅ FIX: Used by sync-vault.ts. 
 * Performs actual disk checks to verify file existence.
 */
export async function getAllPDFItemsNode(opts?: { includeMissing?: boolean }): Promise<PDFItem[]> {
  const cfgs = getAllPDFs();
  const items = await Promise.all(cfgs.map(async (cfg) => {
    const base = toItemBase(cfg);
    if (!canUseNodeFs()) return base;
    try {
      const fs = await import("fs");
      const path = await import("path");
      const fsPath = path.join(process.cwd(), "public", base.fileUrl.replace(/^\/+/, ""));
      if (fs.existsSync(fsPath)) {
        const st = fs.statSync(fsPath);
        return { 
          ...base, 
          existsOnDisk: true, 
          lastModifiedISO: st.mtime.toISOString(), 
          fileSizeHuman: bytesToHuman(st.size) 
        };
      }
    } catch (e) {
      // Log only in non-production to avoid noise
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Registry] File not found on disk: ${base.fileUrl}`);
      }
    }
    return base;
  }));
  return opts?.includeMissing ? items : items.filter(i => i.existsOnDisk);
}