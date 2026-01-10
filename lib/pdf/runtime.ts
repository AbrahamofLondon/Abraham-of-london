/**
 * ABRAHAM OF LONDON: PDF RUNTIME EXPORTS (Next-safe)
 * - SAFE to import from Next.js pages/components/api routes
 * - No require()
 * - No child_process usage
 */

import { getAllPDFs, getPDFById } from "./pdf-registry";

export {
  PDF_REGISTRY,
  getPDFRegistry,
  // getPDFById is imported above, but we can still re-export it:
  getPDFById,
  getAllPDFs,
  getPDFsByTier,
  getPDFsByType,
  getInteractivePDFs,
  getFillablePDFs,
  scanForDynamicAssets,
  getPDFsRequiringGeneration,
  needsRegeneration,
  generateMissingPDFs,
  type PDFConfig,
  type PDFTier,
  type PDFType,
  type PDFFormat,
} from "./pdf-registry";

/**
 * Resolve file metadata from filename
 */
export function resolveFileMetadata(filename: string): {
  format: "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
  isInteractive: boolean;
  isFillable: boolean;
  type:
    | "editorial"
    | "framework"
    | "academic"
    | "strategic"
    | "tool"
    | "canvas"
    | "worksheet"
    | "other";
} {
  const ext = filename.toLowerCase().split(".").pop() || "";
  const name = filename.toLowerCase();

  let format: "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY" = "BINARY";
  if (ext === "pdf") format = "PDF";
  if (["xlsx", "xls", "csv"].includes(ext)) format = "EXCEL";
  if (["pptx", "ppt"].includes(ext)) format = "POWERPOINT";
  if (ext === "zip") format = "ZIP";

  const isFillable = name.includes("-fillable") || name.includes("-canvas");
  const isInteractive = isFillable || name.includes("-form") || name.includes("-worksheet");

  let type:
    | "editorial"
    | "framework"
    | "academic"
    | "strategic"
    | "tool"
    | "canvas"
    | "worksheet"
    | "other" = "other";

  if (name.includes("canvas") || name.includes("template")) type = "canvas";
  else if (name.includes("worksheet") || name.includes("checklist")) type = "worksheet";
  else if (name.includes("framework") || name.includes("model")) type = "framework";
  else if (name.includes("guide") || name.includes("manual")) type = "strategic";
  else if (name.includes("editorial") || name.includes("article")) type = "editorial";
  else if (name.includes("academic") || name.includes("research")) type = "academic";
  else if (name.includes("tool") || name.includes("utility")) type = "tool";

  return { format, isInteractive, isFillable, type };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"] as const;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function hasAccessToPDF(
  userTier: "free" | "member" | "architect" | "inner-circle",
  pdfTier: "free" | "member" | "architect" | "inner-circle",
): boolean {
  const tierHierarchy = {
    free: 0,
    member: 1,
    architect: 2,
    "inner-circle": 3,
  } as const;

  return tierHierarchy[userTier] >= tierHierarchy[pdfTier];
}

export function getPDFDownloadUrl(
  pdfId: string,
  userId?: string,
  userTier?: string,
): { url: string; requiresAuth: boolean; accessGranted: boolean } {
  const pdf = getPDFById(pdfId);
  if (!pdf) throw new Error(`PDF with ID "${pdfId}" not found`);

  const requiresAuth = pdf.requiresAuth;
  const accessGranted =
    !requiresAuth ||
    (userId && userTier && hasAccessToPDF(userTier as any, pdf.tier as any));

  return { url: pdf.outputPath, requiresAuth, accessGranted };
}

export function generatePDFManifest(): {
  version: string;
  generatedAt: string;
  count: number;
  pdfs: Array<{
    id: string;
    title: string;
    type: string;
    tier: string;
    path: string;
    size?: string;
    interactive: boolean;
    fillable: boolean;
    requiresAuth: boolean;
  }>;
} {
  const allPDFs = getAllPDFs();
  const now = new Date().toISOString();

  return {
    version: "1.1.0",
    generatedAt: now,
    count: allPDFs.length,
    pdfs: allPDFs.map((pdf) => ({
      id: pdf.id,
      title: pdf.title,
      type: pdf.type,
      tier: pdf.tier,
      path: pdf.outputPath,
      size: pdf.fileSize ? formatFileSize(pdf.fileSize) : undefined,
      interactive: pdf.isInteractive,
      fillable: pdf.isFillable,
      requiresAuth: pdf.requiresAuth,
    })),
  };
}

// Convenience re-export types
export type PDFType =
  | "editorial"
  | "framework"
  | "academic"
  | "strategic"
  | "tool"
  | "canvas"
  | "worksheet"
  | "other";
export type PDFTier = "free" | "member" | "architect" | "inner-circle";
export type PDFFormat = "PDF" | "EXCEL" | "POWERPOINT" | "ZIP" | "BINARY";
