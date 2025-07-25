// lib/books.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const booksDirectory = path.join(process.cwd(), 'content/books');

export function getAllBooks(fields: string[] = []) {
  const slugs = fs.readdirSync(booksDirectory);

  return slugs
    .filter((slug) => slug.endsWith('.mdx'))
    .map((slug) => {
      const fullPath = path.join(booksDirectory, slug);
      const fileContents = fs.readFileSync(fullPath, 'utf8');
      const { data } = matter(fileContents);

      const book: { [key: string]: any } = {};

      fields.forEach((field) => {
        if (field === 'slug') {
          book[field] = slug.replace(/\.mdx$/, '');
        }
        if (data[field]) {
          book[field] = data[field];
        }
      });

      return book;
    });
}
