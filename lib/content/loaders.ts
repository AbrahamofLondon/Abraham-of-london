// lib/content/loaders.ts

export function getDocsByPrefix(prefix: string) {
  const docs = getAllCombinedDocs();

  return docs.filter((d: any) =>
    String(d?._raw?.flattenedPath || "").startsWith(prefix)
  );
}