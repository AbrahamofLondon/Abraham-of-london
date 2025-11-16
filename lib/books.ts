// lib/books.ts
import {
  ensureDir,
  listMdFiles,
  fileToSlug,
  readFrontmatter,
  sortByDateDesc,
} from "@/lib/server/md-utils";

export interface Book {
  slug: string;
  title: string;
  excerpt?: string;
  coverImage?: string;
  date?: string;
  author?: string;
  [key: string]: unknown;
}

// ------------------------------
// Internal FS loader
// ------------------------------

function loadAllBooksFromFs(): Book[] {
  // We assume /content/books holds your book MD/MDX
  const abs = ensureDir("books");
  if (!abs) {
    // No books directory – empty, but safe
    return [];
  }

  const files = listMdFiles(abs);
  if (!files.length) return [];

  const books: Book[] = files.map((absFile) => {
    const { data, content } = readFrontmatter(absFile);
    const rawSlug = (data.slug as string) || fileToSlug(absFile);

    const slug = String(rawSlug || "").trim().replace(/^\/+|\/+$/g, "");

    const title =
      (data.title as string | undefined) ||
      slug ||
      "Untitled";

    const excerpt =
      (data.excerpt as string | undefined) ||
      (data.description as string | undefined) ||
      undefined;

    const coverImage =
      (data.coverImage as string | undefined) ||
      (data.cover as string | undefined) ||
      undefined;

    const date = (data.date as string | undefined) || undefined;

    const author =
      (data.author as string | undefined) ||
      (data.primaryAuthor as string | undefined) ||
      undefined;

    return {
      slug,
      title,
      excerpt,
      coverImage,
      date,
      author,
      content,
      ...data,
    };
  });

  return sortByDateDesc(books);
}

// Simple cache
let BOOKS_CACHE: Book[] | null = null;

export function getAllBooks(): Book[] {
  if (!BOOKS_CACHE) {
    BOOKS_CACHE = loadAllBooksFromFs();
  }
  return BOOKS_CACHE;
}

export function getBookBySlug(slug: string): Book | undefined {
  const key = String(slug || "").toLowerCase();
  const books = getAllBooks();
  return books.find((b) => String(b.slug || "").toLowerCase() === key);
}