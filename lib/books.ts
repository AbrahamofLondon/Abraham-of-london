import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Define the directory where your book MDX files are stored
const booksDirectory = path.join(process.cwd(), 'books');

// Interface defining the book metadata structure
export interface BookMeta {
  slug: string;
  title: string;
  date?: string; // Add date if you sort by it, or remove if not used for books
  coverImage: string;
  excerpt: string;
  content: string;
  buyLink: string;
  author?: string; // Add author if it's a common field
  // Add other specific properties as they exist in your markdown frontmatter for books
  // For example:
  // publicationDate: string;

  // IMPORTANT: Add the index signature to allow dynamic property access
  // This tells TypeScript that BookMeta can be indexed with a string,
  // and the value at that index can be of 'any' type.
  [key: string]: any;
}

// Function to get all book slugs
export function getBookSlugs(): string[] {
  return fs.readdirSync(booksDirectory).map((fileName) => fileName.replace(/\.mdx$/, ''));
}

// Function to get a single book by slug
export function getBookBySlug(slug: string, fields: (keyof BookMeta)[] = []): Partial<BookMeta> {
  const fullPath = path.join(booksDirectory, `${slug}.mdx`);
  try {
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Create a base book object, ensuring all expected fields from frontmatter are mapped
    const book: BookMeta = {
      slug,
      title: data.title || '',
      date: data.date ? new Date(data.date).toISOString() : '', // Example: if date is used
      coverImage: data.coverImage || '',
      excerpt: data.excerpt || '',
      content: content || '', // Include content from gray-matter
      buyLink: data.buyLink || '',
      author: data.author || '', // Example: if author is used
      // Map other frontmatter fields as needed, e.g.:
      // publicationDate: data.publicationDate || '',
    };

    // Select only the requested fields using a type-safe approach
    return fields.reduce((acc, field) => {
      // Use a type assertion here to tell TypeScript that 'field' is a valid key of 'BookMeta'
      // and that 'book[field]' will return a value assignable to acc[field].
      // Since BookMeta now has [key: string]: any;, this should be safe.
      if (Object.prototype.hasOwnProperty.call(book, field)) {
        (acc as any)[field] = (book as any)[field]; // Explicitly cast 'acc' and 'book' to 'any' for the assignment if necessary
      }
      return acc;
    }, {} as Partial<BookMeta>); // Initialize accumulator with Partial<BookMeta>
  } catch (error) {
    console.error(`Error reading book ${slug}:`, error);
    return {};
  }
}

// Function to get all books
export function getAllBooks(fields: (keyof BookMeta)[] = []): BookMeta[] {
  const slugs = getBookSlugs();
  const books = slugs
    .map((slug) => getBookBySlug(slug, fields))
    .filter((book) => Object.keys(book).length > 0) as BookMeta[]; // Filter out empty objects and cast

  // You might want to sort books by date or another field if available
  // Example: sort by publicationDate if you add it to BookMeta and your frontmatter
  // .sort((a, b) => (a.publicationDate < b.publicationDate ? 1 : -1)); // Sort by date descending

  return books;
}