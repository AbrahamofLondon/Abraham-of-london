// lib/books.ts
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Define the path to your markdown books directory
const booksDirectory = path.join(process.cwd(), 'books'); // Assuming your books are in a 'books' directory at the root

export interface BookMeta {
  title: string;
  date?: string; // Books might not always have a date like blog posts
  excerpt: string;
  coverImage: string;
  category?: string;
  author: string;
  readTime?: string; // Can be added if you want to track
  slug: string;
}

interface Book {
  slug: string;
  data: BookMeta;
  content: string;
}

export function getBookSlugs(): string[] {
  // Ensure the directory exists before reading
  if (!fs.existsSync(booksDirectory)) {
    console.warn(`Warning: Books directory not found at ${booksDirectory}. Returning empty array.`);
    return [];
  }
  return fs.readdirSync(booksDirectory)
           .filter(fileName => fileName.endsWith('.md') || fileName.endsWith('.mdx'))
           .map(fileName => fileName.replace(/\.mdx?$/, ''));
}

export function getBookBySlug(slug: string): Book {
  const fullPath = path.join(booksDirectory, `${slug}.md`); // Assuming .md files
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  return {
    slug,
    data: data as BookMeta, // Cast data to BookMeta interface
    content,
  };
}

export function getAllBooks(): Book[] {
  const slugs = getBookSlugs();
  const books = slugs.map(slug => getBookBySlug(slug));

  // Optional: Sort books by a property if needed (e.g., date)
  // books.sort((a, b) => {
  //   const dateA = new Date(a.data.date || '1970-01-01'); // Provide a default date if optional
  //   const dateB = new Date(b.data.date || '1970-01-01');
  //   return dateB.getTime() - dateA.getTime();
  // });

  return books;
}