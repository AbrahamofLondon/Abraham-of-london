// lib/server/books-data.ts
export type Book = {
  slug: string;
  title: string;
  author: string;
  excerpt?: string;
  coverImage?: string;
  genre?: string;
  buyLink?: string | null;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
};

// TODO: replace with real loader from /content/books or a JSON registry.
const BOOKS: Book[] = [];

export function getAllBooks(): Book[] { return BOOKS; }
export function getBookBySlug(slug: string): Book | undefined {
  return BOOKS.find(b => b.slug === slug);
}
