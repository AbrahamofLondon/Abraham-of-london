// types/print.ts

export interface PrintMeta {
  slug: string;
  title: string;

  // Text / description
  excerpt?: string;
  description?: string;

  // Classification
  category?: string;
  tags?: string[];

  // Media
  coverImage?: string | { src?: string } | null;
  heroImage?: string;

  // Availability / commerce
  available?: boolean;
  priceLabel?: string;        // "£45", "£120 framed"
  sizeLabel?: string;         // "A3", "500 x 700 mm"
  sku?: string | null;

  // Meta
  date?: string;
  author?: string;
  readTime?: string;          // if you render them with longer copy
  draft?: boolean;
  featured?: boolean;
}