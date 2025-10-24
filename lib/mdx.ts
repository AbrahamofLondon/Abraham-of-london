// lib/mdx.ts
export function stripMarkup(input: string): string {
  if (!input) return "";
  return input.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
}

export function buildExcerpt(html: string, max = 160): string {
  const plain = stripMarkup(html);
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max + 1);
  const at = cut.lastIndexOf(" ");
  const base = at > 80 ? cut.slice(0, at) : plain.slice(0, max);
  return `${base.trim()}…`;
}

export const excerpt = buildExcerpt;

export function isLocalPath(src?: unknown): src is string {
  return typeof src === "string" && src.startsWith("/");
}
