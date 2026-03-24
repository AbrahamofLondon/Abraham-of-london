// lib/pdf/registry.ts — PDF Registry Facade (SSOT Aligned, Compile-Safe, Path-Hardenened)
// -----------------------------------------------------------------------------
// Provides:
//  - Backward-compatible exports for legacy imports
//  - Extra helper functions for UI / dashboards
//  - Path Normalization to prevent filesystem target errors
//
// HARD RULE:
//  - Do NOT import+re-export the same type names in this file.
//  - Re-export types ONLY via `export type { ... } from "./registry.static"`.

import {
  getAllPDFs as getStaticAllPDFs,
  getPDFById as getStaticGetPDFById,
  getAllPDFItemsNode as getStaticGetAllPDFItemsNode,
  getRegistryStats as getStaticGetRegistryStats,
  getGeneratedPDFs as getStaticGetGeneratedPDFs,
  GENERATED_PDF_CONFIGS,
  PDF_REGISTRY as STATIC_PDF_REGISTRY,
} from "./registry.static";

// -----------------------------------------------------------------------------
// Re-export SSOT runtime exports (values)
// -----------------------------------------------------------------------------
export {
  GENERATED_PDF_CONFIGS,
  STATIC_PDF_REGISTRY as PDF_REGISTRY, // canonical alias
  getStaticGetGeneratedPDFs as getGeneratedPDFs,
  getStaticAllPDFs as getAllPDFs,
  getStaticGetPDFById as getPDFById,
  getStaticGetAllPDFItemsNode as getAllPDFItemsNode,
  // FIXED: Pointing to the correct aliased import variable
  getStaticGetRegistryStats as getRegistryStats, 
};

// -----------------------------------------------------------------------------
// Re-export SSOT types (types ONLY)
// -----------------------------------------------------------------------------
export type { 
  PDFRegistryEntry, 
  PDFType, 
  PDFFormat, 
  PaperFormat, 
  GeneratedPDFId, 
  NodePDFItem 
} from "./registry.static";

// -----------------------------------------------------------------------------
// Local helper types (safe extensions)
// -----------------------------------------------------------------------------
export type PDFItem = import("./registry.static").PDFRegistryEntry & {
  existsOnDisk?: boolean;
  fileSizeHuman?: string;
  lastModifiedISO?: string;
  isGenerating?: boolean;
  error?: string;
  downloadCount?: number;
  status?: string;
  metadata?: Record<string, unknown>;
};

export type PDFWithNormalizedTier = import("./registry.static").PDFRegistryEntry & {
  normalizedTier?: string;
  requiresAuth?: boolean;
};

// -----------------------------------------------------------------------------
// Core Normalization Helpers
// -----------------------------------------------------------------------------

/**
 * Ensures paths use forward slashes and have no leading double-slashes.
 * Fixes the "C:\Abraham-of-london..." literal path leak by sanitizing input.
 */
function normalizePublicPath(p: unknown): string {
  const s = String(p ?? "").trim();
  if (!s) return "";
  return s
    .replace(/\\/g, "/")       // Convert Windows backslashes to forward slashes
    .replace(/^\/+/, "/")      // Ensure exactly one leading slash
    .replace(/\/+/g, "/");     // Remove any double internal slashes
}

function normalizeTierValue(v: unknown): string {
  const s = String(v ?? "public").trim().toLowerCase();
  if (s === "free") return "public"; // migration compatibility
  if (!s) return "public";
  return s;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

// -----------------------------------------------------------------------------
// Public helper APIs (UI / dashboards)
// -----------------------------------------------------------------------------

export function getAllPDFsWithNormalizedTier(): PDFWithNormalizedTier[] {
  const all = getStaticAllPDFs();
  return all.map((pdf) => {
    const tierValue = normalizeTierValue((pdf as any).tier ?? (pdf as any).accessLevel ?? "public");
    return { 
      ...pdf, 
      outputPath: normalizePublicPath(pdf.outputPath),
      normalizedTier: tierValue, 
      requiresAuth: tierValue !== "public" 
    };
  });
}

export function getPDFByIdWithNormalizedTier(id: string): PDFWithNormalizedTier | undefined {
  const pdf = getStaticGetPDFById(id);
  if (!pdf) return undefined;
  const tierValue = normalizeTierValue((pdf as any).tier ?? (pdf as any).accessLevel ?? "public");
  return { 
    ...pdf, 
    outputPath: normalizePublicPath(pdf.outputPath),
    normalizedTier: tierValue, 
    requiresAuth: tierValue !== "public" 
  };
}

export function getAllPDFItems(options?: { includeMissing?: boolean }): PDFItem[] {
  const all = getStaticAllPDFs();

  const items: PDFItem[] = all.map((pdf) => {
    const sizeBytes = typeof (pdf as any).fileSizeBytes === "number" ? (pdf as any).fileSizeBytes : 0;

    const exists =
      Boolean((pdf as any).exists) ||
      Boolean((pdf as any).existsOnDisk) ||
      sizeBytes > 0;

    const lastModifiedISO =
      typeof (pdf as any).lastModified === "string" && (pdf as any).lastModified
        ? String((pdf as any).lastModified)
        : new Date().toISOString();

    return {
      ...pdf,
      outputPath: normalizePublicPath(pdf.outputPath),
      existsOnDisk: exists,
      fileSizeHuman: sizeBytes ? formatFileSize(sizeBytes) : "0 B",
      lastModifiedISO,
      isGenerating: false,
      downloadCount: 0,
      status: exists ? "generated" : "pending",
      metadata: {},
      error: (pdf as any).error ? String((pdf as any).error) : undefined,
    };
  });

  if (options?.includeMissing) return items;
  return items.filter((x) => x.existsOnDisk === true);
}

export function getAccessiblePDFs(userTier: string): import("./registry.static").PDFRegistryEntry[] {
  const all = getStaticAllPDFs();
  const user = normalizeTierValue(userTier);

  const rank: Record<string, number> = {
    public: 0,
    member: 1,
    verified: 2,
    "inner-circle": 3,
    client: 4,
    legacy: 5,
    architect: 6,
    owner: 7,
  };

  const userRank = rank[user] ?? 0;

  return all.filter((pdf) => {
    const pdfTier = normalizeTierValue((pdf as any).tier ?? (pdf as any).accessLevel ?? "public");
    const pdfRank = rank[pdfTier] ?? 0;
    return pdfRank <= userRank;
  });
}

export function getPDFStatsByTier(): Record<string, number> {
  const all = getStaticAllPDFs();
  const stats: Record<string, number> = {};
  for (const pdf of all) {
    const tier = normalizeTierValue((pdf as any).tier ?? (pdf as any).accessLevel ?? "public");
    stats[tier] = (stats[tier] || 0) + 1;
  }
  return stats;
}

export function getPDFsByTier(tier: string): import("./registry.static").PDFRegistryEntry[] {
  const all = getStaticAllPDFs();
  const target = normalizeTierValue(tier);
  return all.filter((pdf) => normalizeTierValue((pdf as any).tier ?? (pdf as any).accessLevel ?? "public") === target);
}

/**
 * Returns all IDs for the batch processor.
 * Aliased for the vault-manifest-gen script.
 */
export function getAllBriefIds(): string[] {
  return Object.keys(GENERATED_PDF_CONFIGS);
}

// -----------------------------------------------------------------------------
// Default export (legacy consumers)
// -----------------------------------------------------------------------------
export default {
  GENERATED_PDF_CONFIGS,
  PDF_REGISTRY: STATIC_PDF_REGISTRY,
  getAllPDFs: getStaticAllPDFs,
  getPDFById: getStaticGetPDFById,
  getAllPDFItemsNode: getStaticGetAllPDFItemsNode,
  getRegistryStats: getStaticGetRegistryStats,
  getGeneratedPDFs: getStaticGetGeneratedPDFs,
  getAllPDFsWithNormalizedTier,
  getPDFByIdWithNormalizedTier,
  getAllPDFItems,
  getAccessiblePDFs,
  getPDFStatsByTier,
  getPDFsByTier,
};