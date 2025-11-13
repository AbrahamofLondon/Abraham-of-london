export type ResourceLink = { label: string; href: string };
export type EventResources = { downloads?: ResourceLink[]; reads?: ResourceLink[] };

export type Book = { slug: string; title?: string; author?: string | null; coverImage?: string | null };
export type Download = { slug: string; title?: string; fileUrl?: string | null };

export function safeBooks(input: unknown): Book[] {
  return Array.isArray(input) ? (input as Book[]).filter((b) => b && b.slug) : [];
}
export function safeDownloads(input: unknown): Download[] {
  return Array.isArray(input) ? (input as Download[]).filter((d) => d && d.slug) : [];
}

export function buildEventResources(opts?: {
  downloads?: Download[];
  reads?: ResourceLink[];
}): EventResources | null {
  const downloads =
    (opts?.downloads || []).map((d) => ({ label: d.title || d.slug, href: `/downloads/${d.slug}` })) || [];
  const reads = opts?.reads || [];
  const any = (downloads?.length || 0) + (reads?.length || 0);
  return any ? { downloads, reads } : null;
}