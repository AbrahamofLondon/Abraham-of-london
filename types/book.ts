// types/book.ts
import type { BaseContentMeta } from "./index";

export interface BookMeta extends BaseContentMeta {
  // Book identification
  isbn?: string;
  asin?: string;

  // Publication details
  publisher?: string;
  publishedDate?: string;
  pages?: number;
  language?: string;
  format?: "hardcover" | "paperback" | "ebook" | "audiobook";

  // Commercial details
  price?: string;
  currency?: string;
  purchaseLink?: string;
  affiliateLink?: string;

  // Content details
  genre?: string[];
  rating?: number; // 1-5 scale
  review?: string;
  featuredQuote?: string;

  // Technical details for display
  coverAspect?: string;
  coverFit?: "contain" | "cover";
  coverPosition?: string;

  // Reading status
  status?: "want-to-read" | "reading" | "completed" | "abandoned";
  startDate?: string;
  endDate?: string;

  // Additional metadata
  goodreadsUrl?: string;
  amazonUrl?: string;
}

// Book-specific utility functions
export const createBookMeta = (
  overrides: Partial<BookMeta> = {},
): BookMeta => ({
  slug: "",
  title: "",
  ...overrides,
});

export const isValidBookMeta = (meta: unknown): meta is BookMeta => {
  return (
    typeof meta === "object" &&
    meta !== null &&
    "slug" in meta &&
    "title" in meta &&
    typeof (meta as BookMeta).slug === "string" &&
    typeof (meta as BookMeta).title === "string"
  );
};

// Book collection utilities
export interface BookCollection {
  books: BookMeta[];
  total: number;
  categories: string[];
  genres: string[];
}

export const createBookCollection = (books: BookMeta[]): BookCollection => {
  const categories = Array.from(
    new Set(books.map((book) => book.category).filter(Boolean)),
  ) as string[];
  const genres = Array.from(new Set(books.flatMap((book) => book.genre || [])));

  return {
    books: books.sort((a, b) => (a.title || "").localeCompare(b.title || "")),
    total: books.length,
    categories,
    genres,
  };
};
