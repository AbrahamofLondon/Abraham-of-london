// types/resource.ts

export interface ResourceMeta {
  slug: string;
  title: string;

  // Description
  excerpt?: string;
  description?: string;

  // Classification
  category?: string;
  tags?: string[];

  // Link(s)
  url?: string;                // primary external/internal link
  external?: boolean;          // true if off-site
  secondaryLinks?: {
    label: string;
    href: string;
  }[];

  // Media
  coverImage?: string | { src?: string } | null;
  heroImage?: string;

  // Meta
  author?: string;
  date?: string;
  readTime?: string;
  draft?: boolean;
  featured?: boolean;
}