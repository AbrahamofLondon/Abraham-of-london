// types/print.ts
export interface PrintMeta {
  slug: string;
  title: string;
  description: string | null;
  excerpt: string | null;
  author: string | null;
  date: string | null;
  category: string | null;
  tags: string[];
  coverImage: string | null;
  heroImage: string | null;
  isChathamRoom: boolean;
  source: string;
  kind: 'book' | 'download' | 'print';
  content: string;
  published: boolean;
}