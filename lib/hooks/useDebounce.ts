// lib/generated/pdf-registry.generated.ts
// Placeholder committed to repo.
// It will be overwritten by scripts/pdf/intelligent-generator.ts.
// Browser-safe: no fs, no side effects.

export type GeneratedPDFOverlayItem = {
  id: string;
  exists: boolean;
  fileSize: string;
  lastModified: string;
  md5?: string;
  isInteractive?: boolean;
  isFillable?: boolean;
  outputPath?: string;
};

export const GENERATED_PDF_OVERLAY: Record<string, GeneratedPDFOverlayItem> = {};
