// type s/book.ts

export type BookMeta = {
  slug: string;
  title: string;
  author?: string;
  excerpt?: string;
  coverImage?: string;
  buyLink?: string;
  genre?: string;
  downloadPdf?: string;
  downloadEpub?: string;
};
