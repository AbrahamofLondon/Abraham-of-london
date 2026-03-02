// lib/pdf/registry.ts — PDF Registry with SSOT Alignment
import { 
  getAllPDFs as getStaticAllPDFs, 
  getPDFById as getStaticGetPDFById, 
  getAllPDFItemsNode as getStaticGetAllPDFItemsNode,
  getRegistryStats as getStaticGetRegistryStats,
  getGeneratedPDFs as getStaticGetGeneratedPDFs,
  GENERATED_PDF_CONFIGS,
  type PDFRegistryEntry,
  type PDFType,
  type PDFFormat,
  type PaperFormat,
  type GeneratedPDFId,
} from "./registry.static";

// Re-export from static registry
export { 
  GENERATED_PDF_CONFIGS,
  getGeneratedPDFs,
  getAllPDFs,
  getPDFById,
  getAllPDFItemsNode,
  getRegistryStats,
  type PDFRegistryEntry,
  type PDFType,
  type PDFFormat,
  type PaperFormat,
  type GeneratedPDFId,
} from "./registry.static";

// Export PDFItem type for dashboard components
export type PDFItem = PDFRegistryEntry & {
  existsOnDisk?: boolean;
  fileSizeHuman?: string;
  lastModifiedISO?: string;
  isGenerating?: boolean;
  error?: string;
  downloadCount?: number;
  status?: string;
  metadata?: Record<string, any>;
};

// Export PDF_REGISTRY alias for backward compatibility
export const PDF_REGISTRY = GENERATED_PDF_CONFIGS;

// Local type with normalized tier
export type PDFWithNormalizedTier = PDFRegistryEntry & {
  normalizedTier?: string;
  requiresAuth?: boolean;
};

/**
 * Get all PDFs with normalized tier information
 */
export function getAllPDFsWithNormalizedTier(): PDFWithNormalizedTier[] {
  const allPDFs = getStaticAllPDFs();
  
  return allPDFs.map((pdf) => {
    // Normalize tier from whatever source is available
    const tierValue = pdf.tier || pdf.accessLevel || "public";
    
    return {
      ...pdf,
      normalizedTier: String(tierValue).toLowerCase(),
      requiresAuth: String(tierValue).toLowerCase() !== "public",
    };
  });
}

/**
 * Get PDF by ID with normalized tier
 */
export function getPDFByIdWithNormalizedTier(id: string): PDFWithNormalizedTier | undefined {
  const pdf = getStaticGetPDFById(id);
  if (!pdf) return undefined;
  
  const tierValue = pdf.tier || pdf.accessLevel || "public";
  
  return {
    ...pdf,
    normalizedTier: String(tierValue).toLowerCase(),
    requiresAuth: String(tierValue).toLowerCase() !== "public",
  };
}

/**
 * Get all PDF items (with optional filtering by existence)
 * Used by dashboards and UI components
 */
export function getAllPDFItems(options?: { includeMissing?: boolean }): PDFItem[] {
  const allPDFs = getStaticAllPDFs();

  const items: PDFItem[] = allPDFs.map((pdf) => {
    const exists =
      Boolean((pdf as any).exists) ||
      Boolean((pdf as any).existsOnDisk) ||
      (typeof (pdf as any).fileSizeBytes === "number" && (pdf as any).fileSizeBytes > 0);

    const sizeBytes =
      typeof (pdf as any).fileSizeBytes === "number" ? (pdf as any).fileSizeBytes : 0;

    const lastModified =
      String((pdf as any).lastModified || "") || new Date().toISOString();

    return {
      ...pdf,

      // ✅ Canonical boolean existence (and backwards compatible)
      exists,
      existsOnDisk: exists,

      // ✅ Display helpers
      fileSizeHuman: sizeBytes ? formatFileSize(sizeBytes) : "0 B",
      lastModifiedISO: lastModified,

      // ✅ UI state fields
      isGenerating: false,
      downloadCount: 0,
      status: exists ? "generated" : "pending",
      metadata: {},
    };
  });

  if (options?.includeMissing) return items;
  return items.filter((item) => item.exists === true);
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Get accessible PDFs for a user tier
 */
export function getAccessiblePDFs(userTier: string): PDFRegistryEntry[] {
  const allPDFs = getStaticAllPDFs();
  const userTierLower = userTier.toLowerCase();
  
  // Simple tier hierarchy (can be replaced with proper SSOT import)
  const tierRank: Record<string, number> = {
    'public': 0,
    'member': 1,
    'inner-circle': 2,
    'client': 3,
    'legacy': 4,
    'architect': 5,
    'owner': 6,
  };
  
  const userRank = tierRank[userTierLower] ?? 0;
  
  return allPDFs.filter((pdf) => {
    const pdfTier = (pdf.tier || pdf.accessLevel || "public").toLowerCase();
    const pdfRank = tierRank[pdfTier] ?? 0;
    return pdfRank <= userRank;
  });
}

/**
 * Get PDF stats by tier
 */
export function getPDFStatsByTier(): Record<string, number> {
  const allPDFs = getStaticAllPDFs();
  const stats: Record<string, number> = {};
  
  allPDFs.forEach((pdf) => {
    const tier = (pdf.tier || pdf.accessLevel || "public").toLowerCase();
    stats[tier] = (stats[tier] || 0) + 1;
  });
  
  return stats;
}

/**
 * Get PDFs by tier
 */
export function getPDFsByTier(tier: string): PDFRegistryEntry[] {
  const allPDFs = getStaticAllPDFs();
  const tierLower = tier.toLowerCase();
  
  return allPDFs.filter((pdf) => {
    const pdfTier = (pdf.tier || pdf.accessLevel || "public").toLowerCase();
    return pdfTier === tierLower;
  });
}

export default {
  GENERATED_PDF_CONFIGS,
  PDF_REGISTRY,
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

// Re-export types
export type { 
  PDFRegistryEntry, 
  PDFType, 
  PDFFormat, 
  PaperFormat, 
  GeneratedPDFId 
};