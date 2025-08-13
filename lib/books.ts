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

const booksDirectory = join(process.cwd(), "_books");

export function getBookSlugs(): string[] {
  return fs.readdirSync(booksDirectory);
}

export function getBookBySlug(slug: string, fields: (keyof BookMeta)[]): Partial<BookMeta> {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(booksDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items: Partial<BookMeta> = {};

  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = realSlug;
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
