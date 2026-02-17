// lib/content/route-normalize.ts
export function normalizeSlug(input: string): string {
  return (input || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

export function stripRepeatedPrefix(slug: string, prefix: string): string {
  const s = normalizeSlug(slug);
  const p = normalizeSlug(prefix);
  if (!p) return s;

  let out = s;
  const needle = p.endsWith("/") ? p : `${p}/`;

  // Strip prefix repeatedly: books/books/x -> x
  while (out.toLowerCase().startsWith(needle.toLowerCase())) {
    out = out.slice(needle.length);
  }
  return normalizeSlug(out);
}