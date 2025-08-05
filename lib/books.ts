import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { formatDate, parseDate } from './dateUtils';
import { safeString } from './stringUtils';

const booksDirectory = join(process.cwd(), 'content/books');

export interface BookMeta {
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  coverImage?: string;
  excerpt?: string;
  author?: string;
  description?: string;
  buyLink?: string;
  downloadLink?: string;
  downloadEpubLink?: string;
  readTime?: string;
  category?: string;
  tags?: string;
  content?: string;
}

export function getBookSlugs(): string[] {
  try {
    if (!fs.existsSync(booksDirectory)) {
      console.warn('Books directory does not exist, creating it...');
      fs.mkdirSync(booksDirectory, { recursive: true });
      return [];
    }
    return fs.readdirSync(booksDirectory).filter(name => name.endsWith('.mdx'));
  } catch (error) {
    console.error('Error reading books directory:', error);
    return [];
  }
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = join(booksDirectory, `${realSlug}.mdx`);
  
  try {
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Book file not found: ${fullPath}`);
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    const book: BookMeta = {
      slug: realSlug,
      title: safeString(data.title) || 'Untitled',
      date: formatDate(data.date || data.publishedAt),
      publishedAt: formatDate(data.date || data.publishedAt),
      content: content || '',
      excerpt: safeString(data.excerpt) || '',
      author: safeString(data.author) || 'Abraham of London',
      description: safeString(data.description) || '',
      buyLink: safeString(data.buyLink),
      downloadLink: safeString(data.downloadLink),
      downloadEpubLink: safeString(data.downloadEpubLink),
      readTime: safeString(data.readTime),
      category: safeString(data.category),
      tags: safeString(data.tags),
    };

    if (fields.length > 0) {
      const filteredBook: Partial<BookMeta> = {};
      fields.forEach((field) => {
        if (field in book) {
          // Use a switch statement for type-safe assignment
          switch (field as keyof BookMeta) {
            case 'slug':
            case 'title':
            case 'date':
            case 'publishedAt':
            case 'coverImage':
            case 'excerpt':
            case 'author':
            case 'description':
            case 'buyLink':
            case 'downloadLink':
            case 'downloadEpubLink':
            case 'readTime':
            case 'category':
            case 'tags':
            case 'content':
              filteredBook[field as keyof BookMeta] = book[field as keyof BookMeta];
              break;
            default:
              break;
          }
        }
      });
      return filteredBook as BookMeta;
    }
    return book;

  } catch (error) {
    console.error(`Error reading book ${slug}:`, error);
    return {
      slug: realSlug,
      title: 'Book Not Found',
      date: formatDate(new Date()),
      publishedAt: formatDate(new Date()),
      content: '',
      description: 'This book could not be loaded.',
    };
  }
}

export function getAllBooks(fields: string[] = []): BookMeta[] {
  const slugs = getBookSlugs();
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields))
    .filter(book => book.title !== 'Book Not Found')
    .sort((book1, book2) => {
      const date1 = parseDate(book1.date);
      const date2 = parseDate(book2.date);
      return date2.getTime() - date1.getTime();
    });
  return books;
}