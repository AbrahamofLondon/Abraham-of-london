// types/index.ts
// Centralised re-export of content types via the safe helper

import type {
  Post,
  Book,
  Download,
  Event,
  Print,
  Resource,
  Strategy,
  Canon,
  DocumentTypes,
} from "@/lib/contentlayer-helper";

export type {
  Post,
  Book,
  Download,
  Event,
  Print,
  Resource,
  Strategy,
  Canon,
  DocumentTypes,
};

// Book metadata type
export interface BookMeta {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  readTime?: string;
  coverImage?: string;
}



// Post metadata type
export interface PostMeta {
  slug: string;
  title: string;
  description?: string;
  excerpt?: string;
  date?: string;
  author?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  readTime?: string;
  coverImage?: string;
}

