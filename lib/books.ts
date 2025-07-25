// lib/books.ts (Example structure)
import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

const booksDirectory = join(process.cwd(), 'books'); // Path to your 'books' folder

export function getBookSlugs() {
  // Reads all file names in the 'books' directory
  return fs.readdirSync(booksDirectory).map(filename => filename.replace(/\.mdx$/, ''));
}

interface BookItem {
  slug: string;
  title: string;
  coverImage: string;
  excerpt: string;
  content: string;
  buyLink?: string;
  // Add other frontmatter types here
  [key: string]: any; // Allow arbitrary properties
}

export function getBookBySlug(slug: string, fields: string[] = []): BookItem {
  const fullPath = join(booksDirectory, `${slug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents); // 'data' is frontmatter, 'content' is markdown body

  const items: BookItem = { slug } as BookItem;

  // Ensure only the requested fields are returned
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
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields))
    // Sort books by date in descending order (newest first)
    // You might want to add a 'date' field to your book MDX if sorting is needed.
    // .sort((book1, book2) => (book1.date > book2.date ? -1 : 1));
  return books;
}