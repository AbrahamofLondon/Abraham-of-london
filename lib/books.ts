// lib/books.ts
import fs from "fs";
import { join } from "path";
import matter from "gray-matter";

export interface BookMeta {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
  downloadPdf?: string;
  downloadEpub?: string;
  content?: string;
}

const booksDirectory = join(process.cwd(), "content/books");

export function getBookSlugs(): string[] {
  // Corrected to remove the file extension from the slug
  return fs.readdirSync(booksDirectory).map(file => file.replace(/\.mdx?$/, ''));
}

export function getBookBySlug(slug: string, fields: (keyof BookMeta)[]): Partial<BookMeta> {
  // Corrected to use the original slug directly and add the correct extension
  // Use .mdx if your files are .mdx, otherwise use .md
  const fullPath = join(booksDirectory, `${slug}.mdx`); 
  
  if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items: Partial<BookMeta> = {};

  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = slug; // Pass the corrected slug without the extra extension
    }
    if (field === "content") {
      items[field] = content;
    }
    if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
  });

  return items;
}

export function getAllBooks(fields: (keyof BookMeta)[] = []): Partial<BookMeta>[] {
  return getBookSlugs()
    .map((slug) => getBookBySlug(slug, fields))
    .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}