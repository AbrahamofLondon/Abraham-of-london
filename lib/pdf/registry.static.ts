// lib/pdf/registry.static.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * STATIC PDF REGISTRY
 * - No generators
 * - No runtime imports
 * - No webpack ambiguity
 */

export const PDF_REGISTRY = [
  /* 🔥 paste your entire GENERATED_PDF_CONFIGS array here 🔥 */
] as const;

export type PDFRegistryEntry = (typeof PDF_REGISTRY)[number];

export function getAllPDFs(): PDFRegistryEntry[] {
  return PDF_REGISTRY;
}

export function getPDFById(id: string): PDFRegistryEntry | undefined {
  return PDF_REGISTRY.find(p => p.id === id);
}