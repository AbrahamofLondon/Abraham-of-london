import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export type BookMeta = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage: string;
  buyLink: string;
  genre: string;
  downloadPdf?: string;
  downloadEpub?: string;
};

// Added so pages/books/[slug].tsx compiles
export type BookWithContent = BookMeta & {
  content: string;
};

const booksDirectory = path.join(process.cwd(), 'content/books');

export function getBookSlugs(): string[] {
  return fs.readdirSync(booksDirectory).filter((file) => file.endsWith('.mdx'));
}

export function getBookBySlug(slug: string, fields: string[] = []): Partial<BookMeta> & { content?: string } {
  const realSlug = slug.replace(/\.mdx$/, '');
  const fullPath = path.join(booksDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const item: any = {};

  fields.forEach((field) => {
    if (field === 'slug') {
      item[field] = realSlug;
    }
    if (field === 'content') {
      item[field] = content;
    }
    if (data[field] !== undefined) {
      item[field] = data[field];
    }
  });

  return item;
}

export function getAllBooks(fields: string[] = []): Partial<BookMeta>[] {
  const slugs = getBookSlugs();
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields))
    .sort((book1, book2) =>
      (book1.title || '').localeCompare(book2.title || '')
    );
  return books;
}
