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
  title?: string | null;
  date?: string | null;
  endDate?: string | null;
  location?: string | null;
  summary?: string | null;
  excerpt?: string | null;
  chatham?: boolean | null;
  tags?: string[] | null;
  resources?: EventResources | null;
  heroImage?: string | null;
  coverImage?: string | null;
  // Optional presentation/CTA fields
  subtitle?: string | null;
  ctaHref?: string | null;
  ctaLabel?: string | null;
  // Cross-compat
  author?: string | null | { name?: string; image?: string };
  readTime?: string | null;
  category?: string | null;
  content?: string;
};
