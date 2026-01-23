/**
 * ABRAHAM OF LONDON: PDF RUNTIME EXPORTS (Next-safe)
 * - SAFE to import from Next.js pages/components/api routes
 * - No dynamic require
 * - No child_process usage
 */

import {
  PDF_REGISTRY,
  getPDFRegistry,
  getPDFById,
  getAllPDFs,
  getAllPDFItems,
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
  type PDFItem,
} from "./pdf-registry";

export {
  PDF_REGISTRY,
  getPDFRegistry,
  getPDFById,
  getAllPDFs,
  getAllPDFItems,
  getPDFsByTier,
  getPDFsByType,
  getInteractivePDFs,
  getFillablePDFs,
  scanForDynamicAssets,
  getPDFsRequiringGeneration,
  needsRegeneration,
  generateMissingPDFs,
};

export type { PDFConfig, PDFTier, PDFType, PDFFormat, PDFItem };

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
    | "assessment"
    | "journal"
    | "tracker"
    | "bundle"
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
    | "assessment"
    | "journal"
    | "tracker"
    | "bundle"
    | "other" = "other";

  if (name.includes("canvas") || name.includes("template")) type = "canvas";
  else if (name.includes("worksheet") || name.includes("checklist")) type = "worksheet";
  else if (name.includes("assessment") || name.includes("diagnostic")) type = "assessment";
  else if (name.includes("journal")) type = "journal";
  else if (name.includes("tracker")) type = "tracker";
  else if (name.includes("bundle") || ext === "zip") type = "bundle";
  else if (name.includes("framework") || name.includes("model")) type = "framework";
  else if (name.includes("guide") || name.includes("manual")) type = "strategic";
  else if (name.includes("editorial") || name.includes("article")) type = "editorial";
  else if (name.includes("academic") || name.includes("research")) type = "academic";
  else if (name.includes("tool") || name.includes("utility")) type = "tool";

  return { format, isInteractive, isFillable, type };
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
      // fileSize in your registry is already human-readable string
      size: pdf.fileSize || undefined,
      interactive: pdf.isInteractive,
      fillable: pdf.isFillable,
      requiresAuth: pdf.requiresAuth,
    })),
  };
}