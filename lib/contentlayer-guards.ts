// lib/contentlayer-guards.ts
import { getAllDocuments, isDraftContent } from "@/lib/contentlayer-helper";

export async function assertContentlayerHasDocs() {
  const docs = await getAllDocuments();
  return Array.isArray(docs) && docs.some((d: any) => d && !isDraftContent(d));
}

export async function isContentlayerLoaded() {
  const docs = await getAllDocuments();
  return Array.isArray(docs) && docs.length > 0;
}
