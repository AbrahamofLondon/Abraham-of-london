/* lib/contentlayer-assert.ts */
import { getAllContentlayerDocs } from "@/lib/content/server";

export function assertContentlayerHasDocs(): void {
  const docs = getAllContentlayerDocs();
  if (!Array.isArray(docs) || docs.length === 0) {
    throw new Error("Contentlayer registry resolved 0 docs.");
  }
}