import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';
import { formatDate, parseDate } from './dateUtils';
import { safeString, safeSplit } from './stringUtils';

const booksDirectory = join(process.cwd(), 'content/books');

export type BookMeta = {
  slug: string;
  title: string;
  date: string;
  publishedAt: string;
  coverImage?: string;
  excerpt: string;
  author: string;
  description: string;
  image?: string;
  readTime?: string;
  category?: string;
  tags?: string[];
  content?: string;
};

export function getBookSlugs(): string[] {
  try {
    if (!fs.existsSync(booksDirectory)) {
      console.warn('Books directory does not exist, creating it...');
      fs.mkdirSync(booksDirectory, { recursive: true });
      return [];
    }
    return fs.readdirSync(booksDirectory).filter(name => name.endsWith('.mdx') || name.endsWith('.md'));
  } catch (error) {
    console.error('Error reading books directory:', error);
    return [];
  }
}

export function getBookBySlug(slug: string, fields: string[] = []): BookMeta {
  const realSlug = slug.replace(/\.(mdx|md)$/, '');
  const fullPath = join(booksDirectory, `${realSlug}.mdx`);
  const fallbackPath = join(booksDirectory, `${realSlug}.md`);

  try {
    let fileContents: string;

    if (fs.existsSync(fullPath)) {
      fileContents = fs.readFileSync(fullPath, 'utf8');
    } else if (fs.existsSync(fallbackPath)) {
      fileContents = fs.readFileSync(fallbackPath, 'utf8');
    } else {
      throw new Error(`Book file not found: ${fullPath} or ${fallbackPath}`);
    }

    const { data, content } = matter(fileContents);

    const book: BookMeta = {
      slug: realSlug,
      title: safeString(data.title) || 'Untitled',
      date: formatDate(data.date || data.publishedAt),
      publishedAt: formatDate(data.date || data.publishedAt),
      excerpt: safeString(data.excerpt) || '',
      author: safeString(data.author) || 'Abraham of London',
      description: safeString(data.description) || '',
      content: content || '',
    };

    const allFields = Object.keys(data);
    const requestedFields = fields.length > 0 ? fields : ['slug', 'content', ...allFields];

    const bookRecord: Partial<BookMeta> = { ...book };

    requestedFields.forEach((field) => {
      switch (field) {
        case 'slug':
          bookRecord.slug = realSlug;
          break;
        case 'content':
          bookRecord.content = content || '';
          break;
        case 'date':
        case 'publishedAt':
          if (data.date || data.publishedAt) {
            const formattedDate = formatDate(data.date || data.publishedAt);
            bookRecord.date = formattedDate;
            bookRecord.publishedAt = formattedDate;
          }
          break;
        case 'tags':
          if (data.tags) {
            bookRecord.tags = Array.isArray(data.tags)
              ? data.tags.map(tag => safeString(tag))
              : safeSplit(safeString(data.tags), ',').map(tag => tag.trim()).filter(Boolean);
          }
          break;
        default:
          if (field in data && field in bookRecord) {
            bookRecord[field as keyof BookMeta] = data[field];
          }
          break;
      }
    });

    return bookRecord as BookMeta;
  } catch (error) {
    console.error(`Error reading book ${slug}:`, error);
    return {
      slug: realSlug,
      title: 'Book Not Found',
      date: formatDate(new Date()),
      publishedAt: formatDate(new Date()),
      excerpt: '',
      author: 'Abraham of London',
      description: 'This book could not be loaded.',
      content: '',
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