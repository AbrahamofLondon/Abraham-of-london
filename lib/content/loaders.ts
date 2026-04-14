// lib/content/loaders.ts
import { getAllCombinedDocs } from "@/lib/content/server";

export function getDocsByPrefix(prefix: string) {
  const docs = getAllCombinedDocs();

  return docs.filter((d: any) =>
    String(d?._raw?.flattenedPath || "").startsWith(prefix)
  );
}