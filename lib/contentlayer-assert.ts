// lib/contentlayer-assert.ts
let warned: Set<string> | null = null;

function isProd(): boolean {
  try {
    return typeof process !== "undefined" && process.env?.NODE_ENV === "production";
  } catch {
    return true;
  }
}

function getWarnedSet(): Set<string> {
  if (!warned) warned = new Set<string>();
  return warned;
}

export function assertContentlayerHasDocs<T>(
  docs: T[] | undefined,
  label?: string
): T[] {
  if (docs && docs.length > 0) return docs;

  // Don't pollute production build/deploy logs
  if (!isProd()) {
    const safeLabel = (label && String(label).trim()) || "unknown";
    const key = `no-docs:${safeLabel}`;

    const seen = getWarnedSet();
    if (!seen.has(key)) {
      console.warn(`⚠ No ContentLayer documents found for: ${safeLabel}`);
      seen.add(key);
    }
  }

  return [];
}