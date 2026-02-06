// lib/pdf/registry.client.ts
import { GENERATED_PDF_CONFIGS } from "./pdf-registry.generated";
export type PDFItem = (typeof GENERATED_PDF_CONFIGS)[number];

export function getAllPDFItemsClient() {
  // No fs/path here — just data.
  return Array.isArray(GENERATED_PDF_CONFIGS) ? [...GENERATED_PDF_CONFIGS] : [];
}