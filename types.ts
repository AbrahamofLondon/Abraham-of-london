// types.ts
export type Post = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readTime: string;
  category: string;
};

export type Book = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
};




