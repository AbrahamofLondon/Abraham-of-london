// lib/contentlayer-guards.ts
import { allDocuments } from "contentlayer/generated";

export function isContentlayerLoaded(): boolean {
  return Array.isArray(allDocuments) && allDocuments.length > 0;
}

export function assertContentlayerHasDocs(context: string = "Contentlayer"): void {
  if (isContentlayerLoaded()) return;

  throw new Error(
    `[${context}] No documents found. Ensure Contentlayer generation ran and produced .contentlayer before Next.js prerender/export.`
  );
}
