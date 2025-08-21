export interface EventMeta {
  slug: string;
  title: string;
  date: string;      // ISO string
  location: string;
  summary?: string;
  heroImage?: string;
  ctaHref?: string;
  ctaLabel?: string;
  tags?: string[];
  content?: string;  // raw MDX (optional)
}