// lib/pdf/runtime.ts
/**
 * ABRAHAM OF LONDON: PDF RUNTIME EXPORTS (Next-safe)
 * -------------------------------------------------
 * SAFE to import from Next.js pages/components/api routes.
 * SSOT aligned with:
 *  - lib/pdf/registry.ts (facade)
 *  - lib/access/tier-policy.ts (tier SSOT)
 */

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, hasAccess, getTierLabel } from "@/lib/access/tier-policy";

// ✅ IMPORTANT: import from the FACADE, not registry.static
import { PDF_REGISTRY, getAllPDFs, getPDFById, type PDFRegistryEntry } from "./registry";

// Re-export core data + accessors
export { PDF_REGISTRY, getAllPDFs, getPDFById };
export type { PDFRegistryEntry };

// SSOT-aligned public types (runtime helpers)
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

// ----------------------------------------------------------------------------
// Legacy-tolerant shape (does NOT widen the SSOT type export)
// ----------------------------------------------------------------------------
type PDFWithAccess = PDFRegistryEntry & {
  accessLevel?: string | AccessTier; // legacy
  fileSize?: number; // legacy
  fileSizeBytes?: number; // preferred
  outputPath?: string;
};

// ----------------------------------------------------------------------------
// Filename heuristics (UI/ops convenience; not access logic)
// ----------------------------------------------------------------------------
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
  else if (["xlsx", "xls", "csv"].includes(ext)) format = "EXCEL";
  else if (["pptx", "ppt"].includes(ext)) format = "POWERPOINT";
  else if (ext === "zip") format = "ZIP";

  const isFillable = name.includes("fillable") || name.includes("canvas");
  const isInteractive = isFillable || name.includes("form") || name.includes("worksheet");

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

// ----------------------------------------------------------------------------
// Formatting
// ----------------------------------------------------------------------------
export function formatFileSize(bytes: number): string {
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

// ----------------------------------------------------------------------------
// Access (SSOT)
// ----------------------------------------------------------------------------
export function hasAccessToPDF(
  userTier: string | AccessTier | null | undefined,
  pdfTier: string | AccessTier,
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

function resolveRequiredTier(pdf: PDFWithAccess): AccessTier {
  // prefer tier, then legacy accessLevel, else public
  return normalizeUserTier((pdf.tier ?? pdf.accessLevel ?? "public") as any);
}

function resolveSizeBytes(pdf: PDFWithAccess): number | undefined {
  if (typeof pdf.fileSizeBytes === "number" && pdf.fileSizeBytes > 0) return pdf.fileSizeBytes;
  if (typeof pdf.fileSize === "number" && pdf.fileSize > 0) return pdf.fileSize;
  return undefined;
}

/**
 * Get PDF download URL with access check
 */
export function getPDFDownloadUrl(
  pdfId: string,
  userId?: string,
  userTier?: string,
): { url: string; requiresAuth: boolean; accessGranted: boolean; reason?: string } {
  const pdf = getPDFById(pdfId) as PDFWithAccess | undefined;
  if (!pdf) throw new Error(`PDF with ID "${pdfId}" not found`);

  const requiredTier = resolveRequiredTier(pdf);
  const requiresAuth = requiredTier !== "public";

  let accessGranted = false;
  let reason: string | undefined;

  if (!requiresAuth) {
    accessGranted = true;
  } else if (!userId || !userTier) {
    reason = "Authentication required";
  } else {
    accessGranted = hasAccessToPDF(userTier, requiredTier);
    if (!accessGranted) reason = `Insufficient access: requires ${getTierLabel(requiredTier)}`;
  }

  return {
    url: String(pdf.outputPath || "#"),
    requiresAuth,
    accessGranted,
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
  pdfs: Array<{
    id: string;
    title: string;
    type?: unknown;
    tier: AccessTier;
    tierLabel: string;
    path: string;
    size?: string;
    interactive: boolean;
    fillable: boolean;
    requiresAuth: boolean;
  }>;
} {
  const all = getAllPDFs() as PDFWithAccess[];
  const now = new Date().toISOString();

  return {
    version: "3.0.0",
    generatedAt: now,
    count: all.length,
    pdfs: all.map((pdf) => {
      const requiredTier = resolveRequiredTier(pdf);
      const sizeBytes = resolveSizeBytes(pdf);

      return {
        id: String(pdf.id),
        title: String(pdf.title || pdf.id),
        type: pdf.type,
        tier: requiredTier,
        tierLabel: getTierLabel(requiredTier),
        path: String(pdf.outputPath || ""),
        size: sizeBytes ? formatFileSize(sizeBytes) : undefined,
        interactive: Boolean(pdf.isInteractive),
        fillable: Boolean(pdf.isFillable),
        requiresAuth: requiredTier !== "public",
      };
    }),
  };
}

/**
 * Get all PDFs accessible to a user (uses SSOT hasAccess)
 */
export function getAccessiblePDFs(userTier?: string | AccessTier | null): PDFRegistryEntry[] {
  const all = getAllPDFs() as PDFWithAccess[];
  const user = normalizeUserTier(userTier);

  return all.filter((pdf) => {
    const required = resolveRequiredTier(pdf);
    return hasAccess(user, required);
  });
}

/**
 * Get tier label for PDF display
 */
export function getPDFTierLabel(pdfTier: string | AccessTier): string {
  return getTierLabel(pdfTier);
}

/**
 * Optional: tier rank (sometimes useful for sorting UI)
 * (Kept local and explicit so we don't depend on internal tier-policy structures.)
 */
const TIER_RANK: Record<AccessTier, number> = {
  public: 0,
  member: 1,
  "inner-circle": 2,
  client: 3,
  legacy: 4,
  architect: 5,
  owner: 6,
};

export function getTierRank(tier: string | AccessTier): number {
  const t = normalizeUserTier(tier);
  return TIER_RANK[t] ?? 0;
}