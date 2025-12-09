// types/event.ts

export type ResourceLink = {
  href: string;
  label?: string | null;
};

export type EventResources = {
  downloads?: ResourceLink[];
  reads?: ResourceLink[];
};

export type EventMeta = {
  slug: string;

  // Core identity
  title?: string | null;
  subtitle?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  description?: string | null;

  // Timing
  date?: string | null;
  endDate?: string | null;

  // Location / context
  location?: string | null;
  chatham?: boolean | null;

  // Taxonomy
  tags?: string[] | null;
  category?: string | null;

  // Media
  heroImage?: string | null;
  coverImage?: string | null;

  // CTA
  ctaHref?: string | null;
  ctaLabel?: string | null;

  // Meta
  author?: string | null | { name?: string; image?: string };
  readTime?: string | null;
  draft?: boolean | null;

  // Extended content (for MDX-backed events)
  content?: string;
  resources?: EventResources | null;
};