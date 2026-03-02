/**
 * ABRAHAM OF LONDON: PDF RUNTIME EXPORTS (Next-safe)
 * - SAFE to import from Next.js pages/components/api routes
 * - V3.0: SSOT aligned with tier-policy.ts
 */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess, getTierLabel } from "@/lib/access/tier-policy";
import { PDF_REGISTRY, getAllPDFs, getPDFById, type PDFRegistryEntry } from "./registry.static";

// Re-export core data and accessors
export { PDF_REGISTRY, getAllPDFs, getPDFById };
export type { PDFRegistryEntry };

// SSOT-aligned types
export type PDFTier = AccessTier;
export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
export type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "other";

// Local helper type to handle potential tier/accessLevel fields
type PDFWithAccess = PDFRegistryEntry & {
  accessLevel?: string | AccessTier;
};

// Tier hierarchy for PDF access (matches SSOT)
const TIER_HIERARCHY: Record<AccessTier, number> = {
  'public': 0,
  'member': 1,
  'inner-circle': 2,
  'client': 3,
  'legacy': 4,
  'architect': 5,
  'owner': 6,
};

/**
 * Resolve file metadata from filename
 */
export function resolveFileMetadata(filename: string): {
  format: PDFFormat;
  isInteractive: boolean;
  isFillable: boolean;
  type: PDFType;
} {
  const ext = filename.toLowerCase().split(".").pop() || "";
  const name = filename.toLowerCase();

  let format: PDFFormat = "BINARY";
  if (ext === "pdf") format = "PDF";
  if (["xlsx", "xls", "csv"].includes(ext)) format = "EXCEL";
  if (["pptx", "ppt"].includes(ext)) format = "POWERPOINT";
  if (ext === "zip") format = "ZIP";

  const isFillable = name.includes("-fillable") || name.includes("-canvas");
  const isInteractive = isFillable || name.includes("-form") || name.includes("-worksheet");

  let type: PDFType = "other";

  if (name.includes("canvas") || name.includes("template")) type = "canvas";
  else if (name.includes("worksheet") || name.includes("checklist")) type = "worksheet";
  else if (name.includes("framework") || name.includes("model")) type = "framework";
  else if (name.includes("guide") || name.includes("manual")) type = "strategic";
  else if (name.includes("editorial") || name.includes("article")) type = "editorial";
  else if (name.includes("academic") || name.includes("research")) type = "academic";
  else if (name.includes("tool") || name.includes("utility")) type = "tool";

  return { format, isInteractive, isFillable, type };
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if user has access to a PDF based on tier
 * Uses SSOT hasAccess for consistent comparison
 */
export function hasAccessToPDF(
  userTier: string | AccessTier | null | undefined,
  pdfTier: string | AccessTier
): boolean {
  const user = normalizeUserTier(userTier);
  const required = normalizeUserTier(pdfTier);
  return hasAccess(user, required);
}

/**
 * Legacy alias for backward compatibility
 * @deprecated Use hasAccessToPDF
 */
export function canAccessPDF(userTier: string, pdfTier: string): boolean {
  return hasAccessToPDF(userTier, pdfTier);
}

/**
 * Get PDF download URL with access check
 */
export function getPDFDownloadUrl(
  pdfId: string,
  userId?: string,
  userTier?: string,
): { url: string; requiresAuth: boolean; accessGranted: boolean; reason?: string } {
  const pdf = getPDFById(pdfId) as PDFWithAccess;
  if (!pdf) throw new Error(`PDF with ID "${pdfId}" not found`);

  // Determine required tier from PDF (use tier field or default to public)
  const tierValue = pdf.tier || pdf.accessLevel || "public";
  const requiredTier = normalizeUserTier(tierValue);
  const requiresAuth = requiredTier !== "public";
  
  // Check access
  let accessGranted = false;
  let reason: string | undefined;

  if (!requiresAuth) {
    accessGranted = true;
  } else if (!userId || !userTier) {
    reason = "Authentication required";
  } else {
    accessGranted = hasAccessToPDF(userTier, requiredTier);
    if (!accessGranted) {
      reason = `Insufficient access: requires ${getTierLabel(requiredTier)}`;
    }
  }

  return { 
    url: pdf.outputPath || "#", 
    requiresAuth, 
    accessGranted: !!accessGranted,
    reason,
  };
}

/**
 * Generate PDF manifest for API endpoints
 */
export function generatePDFManifest(): {
  version: string;
  generatedAt: string;
  count: number;
  pdfs: Array<any>;
} {
  const allPDFs = getAllPDFs() as PDFWithAccess[];
  const now = new Date().toISOString();

  return {
    version: "3.0.0",
    generatedAt: now,
    count: allPDFs.length,
    pdfs: allPDFs.map((pdf) => {
      const tierValue = pdf.tier || pdf.accessLevel || "public";
      const requiredTier = normalizeUserTier(tierValue);
      
      return {
        id: pdf.id,
        title: pdf.title,
        type: pdf.type,
        tier: requiredTier,
        tierLabel: getTierLabel(requiredTier),
        path: pdf.outputPath,
        size: pdf.fileSize ? formatFileSize(pdf.fileSize) : undefined,
        interactive: !!pdf.isInteractive,
        fillable: !!pdf.isFillable,
        requiresAuth: requiredTier !== "public",
      };
    }),
  };
}

/**
 * Get all PDFs accessible to a user
 * ✅ FIXED: Type-safe version that handles registry entries
 */
export function getAccessiblePDFs(userTier?: string | AccessTier | null): PDFRegistryEntry[] {
  const allPDFs = getAllPDFs() as PDFWithAccess[];
  const user = normalizeUserTier(userTier);
  
  return allPDFs.filter((pdf) => {
    // Handle both tier and accessLevel fields
    const tierValue = pdf.tier || pdf.accessLevel || "public";
    const required = normalizeUserTier(tierValue);
    return hasAccess(user, required);
  });
}

/**
 * Get tier label for PDF display
 */
export function getPDFTierLabel(pdfTier: string | AccessTier): string {
  return getTierLabel(pdfTier);
}