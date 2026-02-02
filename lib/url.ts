/**
 * Institutional URL Governance
 * Ensures all internal links are normalized, preventing double-slashes 
 * and ensuring leading slashes.
 */

export function stripLeadingSlash(s: string): string {
  return (s || "").replace(/^\/+/, "");
}

export function joinHref(...parts: Array<string | null | undefined>): string {
  const joined = parts
    .filter(Boolean)
    .map(part => stripLeadingSlash(part!))
    .join("/")
    .replace(/\/+/g, "/"); // Collapse any accidental multiple slashes

  return `/${joined}`;
}

/**
 * Strips route prefixes from slugs to prevent /blog/blog/slug patterns.
 */
export function cleanSlug(slug: string, prefix: string): string {
  const s = stripLeadingSlash(slug);
  const p = stripLeadingSlash(prefix);
  if (s.startsWith(p + "/")) {
    return s.replace(new RegExp(`^${p}/`), "");
  }
  return s;
}