// types/strategy.ts

export interface StrategyMeta {
  slug: string;
  title: string;

  // Description / body meta
  excerpt?: string;
  description?: string;
  readTime?: string;

  // Classification
  category?: string;         // e.g. "Market Entry", "Governance"
  tags?: string[];
  stage?: string;            // e.g. "concept", "playbook", "field-notes"

  // Meta
  author?: string;
  date?: string;
  draft?: boolean;
  featured?: boolean;

  // Media
  coverImage?: string | { src?: string } | null;
  heroImage?: string;

  // Links / CTAs
  ctaLabel?: string;
  ctaHref?: string;
}
