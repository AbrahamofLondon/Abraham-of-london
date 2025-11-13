export type Book = {
  slug: string;
  title?: string;
  author?: string | null;
  coverImage?: string | null;
  excerpt?: string | null;
};

export function getAllBooks(): Book[] {
  // Non-blocking server helper; keep simple & typed
  try {
    // If you wire Contentlayer later, map it here.
    return [];
  } catch {
    return [];
  }
}

export function getBookBySlug(slug: string): Book | undefined {
  const key = String(slug || "").toLowerCase();
  return getAllBooks().find((b) => String(b.slug || "").toLowerCase() === key);
}