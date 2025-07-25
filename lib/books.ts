// lib/books.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const booksDirectory = path.join(process.cwd(), 'content/books');

// THIS INTERFACE MUST BE PRESENT AND EXPORTED
export interface BookMeta {
  slug: string;
  title: string;
  coverImage: string; // Path to the cover image
  excerpt: string;
  author?: string; // Optional field
  buyLink?: string; // Optional field
  genre?: string[]; // Optional field, assuming an array of strings
  // Add any other fields that you expect to find in your book MDX frontmatter
  [key: string]: any; // Allow for additional arbitrary fields if they exist
}

export function getAllBooks(fields: string[] = []) {
  const slugs = fs.readdirSync(booksDirectory);

  return slugs
    .filter((slug) => slug.endsWith('.mdx'))
    .map((slug) => {
      const fullPath = path.join(booksDirectory, slug);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      const book: { [key: string]: any } = {}; // Use a generic object initially

      // Ensure 'slug' is always included, even if not in fields explicitly
      book['slug'] = slug.replace(/\.mdx$/, '');

      fields.forEach((field) => {
        if (field !== 'slug' && data[field]) { // Avoid re-assigning slug if already handled
          book[field] = data[field];
        }
      });

      return book as BookMeta; // Cast to BookMeta type
    });
}