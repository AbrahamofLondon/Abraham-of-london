// types/page.ts
export interface PageMeta {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  heroImage?: string;
  coverImage?: string;
  date?: string;
  author?: string;
  tags?: string[];
  category?: string;
  resources?: {
    downloads?: Array<{ href: string; title?: string }>;
    reads?: Array<{ href: string; title?: string }>;
  };
  content?: string;
}