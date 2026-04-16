export interface NormalizedListItem {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  coverImage: string | null;
  date?: string;
  author?: string;
  citationCount?: number;
  securityLevel?: 'confidential' | 'restricted' | 'top-secret';
  readTime?: number;
}

export function normalizeCanonItem(raw: any): NormalizedListItem {
  return {
    id: raw.id,
    title: raw.title,
    excerpt: raw.excerpt || null,
    slug: raw.slug,
    coverImage: raw.featuredImage || null,
    date: raw.publishedAt ? new Date(raw.publishedAt).toLocaleDateString() : undefined,
    author: raw.author?.name,
    citationCount: raw.citations?.length || 0,
    readTime: Math.ceil((raw.content?.length || 0) / 1000),
  };
}

export function normalizeVaultItem(raw: any): NormalizedListItem {
  return {
    id: raw.id,
    title: raw.name,
    excerpt: raw.description || null,
    slug: raw.slug,
    coverImage: raw.coverArt || null,
    date: raw.createdAt ? new Date(raw.createdAt).toLocaleDateString() : undefined,
    securityLevel: raw.classification?.toLowerCase(),
    readTime: Math.ceil((raw.content?.length || 0) / 1200),
  };
}