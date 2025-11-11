// types/resource.ts
export interface ResourceMeta {
  [key: string]: unknown;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt?: string;
  date?: string;
  description?: string;
  file?: string;
  size?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  coverImage?: string;
  pdfPath?: string;
  readTime?: string;
}
