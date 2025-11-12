// types/book.ts

export interface BookMeta {
  slug: string;
  title: string;
  date: string;
  author: string;
  readTime: string;
  category: string;
  coverImage?: string;
  description?: string;
  ogDescription?: string;
  excerpt?: string;
}