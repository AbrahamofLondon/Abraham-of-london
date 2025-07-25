// lib/books.ts (Ensure this structure)
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const booksDirectory = join(process.cwd(), 'books');

export function getBookSlugs() {
  return fs.readdirSync(booksDirectory).map(filename => filename.replace(/\.mdx$/, ''));
}

// Ensure BookItem interface is defined and exported
export interface BookItem { // <--- THIS MUST BE EXPORTED
  slug: string;
  title: string;
  coverImage: string;
  excerpt: string;
  content: string; // The raw markdown content before HTML conversion
  buyLink?: string;
  // Add other properties from your MDX frontmatter like genre, author, etc.
  [key: string]: any; // Allows for additional frontmatter fields
}

export function getBookBySlug(slug: string, fields: string[] = []): BookItem {
  const fullPath = join(booksDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const items: BookItem = { slug } as BookItem;

  fields.forEach((field) => {
    if (field === 'slug') {
      items[field] = slug;
    }
    if (field === 'content') {
      items[field] = content;
    }
    if (data[field]) {
      items[field] = data[field];
    }
  });

  return items;
}

export function getAllBooks(fields: string[] = []): BookItem[] {
  const slugs = getBookSlugs();
  const books = slugs.map((slug) => getBookBySlug(slug, fields));
  // You might want to sort these if you have a date field in your MDX frontmatter
  // .sort((book1, book2) => (book1.date > book2.date ? -1 : 1));
  return books;
}