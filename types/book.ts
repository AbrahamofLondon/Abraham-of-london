// types/book.ts

export interface BookMeta {
  slug: string;
  title: string;

  // Optional text fields
  subtitle?: string;
  excerpt?: string;
  description?: string;

  // Attribution / dating
  author?: string;
  date?: string;
  readTime?: string;

  // Taxonomy
  category?: string;
  tags?: string[];

  // Media
  coverImage?: string | { src?: string } | null;
  heroImage?: string;

  // Commercial / links
  buyUrl?: string;
  sampleUrl?: string;
  downloadUrl?: string;

  // Editorial flags
  featured?: boolean;
  published?: boolean;
  draft?: boolean;

  // Access control (if you re-use Inner Circle here)
  accessLevel?: string;
  lockMessage?: string | null;
}