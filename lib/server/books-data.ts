// lib/server/books-data.ts
import type { BookMeta, BookFilters, BookListResponse } from '@/types/book';

// Mock data - replace with your actual data source (CMS, database, etc.)
const mockBooks: BookMeta[] = [
  {
    slug: 'sample-book',
    title: 'Sample Book Title',
    author: 'Sample Author',
    publisher: 'Sample Publisher',
    publishedDate: '2024-01-01',
    isbn: '978-0-00-000000-0',
    description: 'This is a sample book description that provides an overview.',
    summary: 'A brief summary of the sample book content and key insights.',
    coverImage: '/images/books/sample-cover.jpg',
    heroImage: '/images/books/sample-hero.jpg',
    tags: ['technology', 'programming', 'web-development'],
    category: 'Technology',
    content: '# Sample Book Content\n\nThis is sample book content in MDX format.\n\n## Chapter 1: Introduction\n\nWelcome to this sample book.\n\n## Key Features\n\n- Feature one\n- Feature two\n- Feature three',
    excerpt: 'A short excerpt from the book that highlights key concepts.',
    status: 'published',
    featured: true,
    rating: 4.5,
    pages: 300,
    language: 'English',
    format: 'paperback',
    purchaseLinks: [
      {
        platform: 'Amazon',
        url: 'https://amazon.com/sample-book',
        price: '$29.99'
      },
      {
        platform: 'Bookshop',
        url: 'https://bookshop.org/sample-book',
        price: '$27.99'
      }
    ],
    resources: {
      downloads: [
        { href: '/downloads/sample-chapter', title: 'Sample Chapter PDF' }
      ],
      reads: [
        { href: '/blog/sample-review', title: 'Book Review' }
      ]
    }
  },
  {
    slug: 'another-book',
    title: 'Another Great Book',
    author: 'Another Author',
    publisher: 'Tech Press',
    publishedDate: '2023-06-15',
    description: 'Another excellent book on modern web technologies.',
    tags: ['javascript', 'react', 'nextjs'],
    category: 'Web Development',
    status: 'published',
    featured: false
  }
];

/**
 * Get all book slugs for static generation
 */
export function getBookSlugs(): string[] {
  return mockBooks
    .filter(book => book.status !== 'draft')
    .map(book => book.slug);
}

/**
 * Get a single book by slug with optional field filtering
 */
export function getBookBySlug(slug: string, fields: string[] = []): BookMeta | null {
  const book = mockBooks.find(b => b.slug === slug && b.status !== 'draft');
  
  if (!book) {
    return null;
  }

  // If specific fields are requested, filter the book object
  if (fields.length > 0) {
    const filteredBook: any = {};
    fields.forEach(field => {
      if (field in book) {
        filteredBook[field] = (book as any)[field];
      }
    });
    return filteredBook;
  }

  return book;
}

/**
 * Get multiple books by slugs
 */
export function getBooksBySlugs(slugs: string[], fields: string[] = []): BookMeta[] {
  return slugs
    .map(slug => getBookBySlug(slug, fields))
    .filter((book): book is BookMeta => book !== null);
}

/**
 * Get all books with optional filtering and pagination
 */
export function getAllBooks(filters: BookFilters = {}, limit?: number, offset = 0): BookListResponse {
  let filteredBooks = [...mockBooks].filter(book => book.status !== 'draft');

  // Apply filters
  if (filters.category) {
    filteredBooks = filteredBooks.filter(book => book.category === filters.category);
  }

  if (filters.author) {
    filteredBooks = filteredBooks.filter(book => book.author === filters.author);
  }

  if (filters.featured !== undefined) {
    filteredBooks = filteredBooks.filter(book => book.featured === filters.featured);
  }

  if (filters.tags && filters.tags.length > 0) {
    filteredBooks = filteredBooks.filter(book => 
      book.tags && filters.tags!.some(tag => book.tags!.includes(tag))
    );
  }

  // Sort by featured first, then by publication date (newest first)
  filteredBooks.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    
    const dateA = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const dateB = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    
    return dateB - dateA;
  });

  // Apply pagination
  const total = filteredBooks.length;
  const startIndex = offset;
  const endIndex = limit ? startIndex + limit : total;
  const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
  const hasMore = endIndex < total;

  return {
    books: paginatedBooks,
    total,
    page: Math.floor(offset / (limit || total)) + 1,
    limit: limit || total,
    hasMore
  };
}

/**
 * Get books by category
 */
export function getBooksByCategory(category: string, limit?: number): BookMeta[] {
  const result = getAllBooks({ category }, limit);
  return result.books;
}

/**
 * Get featured books
 */
export function getFeaturedBooks(limit?: number): BookMeta[] {
  const result = getAllBooks({ featured: true }, limit);
  return result.books;
}

/**
 * Get all available categories
 */
export function getBookCategories(): string[] {
  const categories = mockBooks
    .map(book => book.category)
    .filter((category): category is string => !!category);
  
  return [...new Set(categories)]; // Remove duplicates
}

/**
 * Get all available tags
 */
export function getBookTags(): string[] {
  const allTags = mockBooks
    .flatMap(book => book.tags || [])
    .filter((tag): tag is string => !!tag);
  
  return [...new Set(allTags)]; // Remove duplicates
}

/**
 * Search books by title, author, or description
 */
export function searchBooks(query: string, limit?: number): BookMeta[] {
  const lowercaseQuery = query.toLowerCase();
  
  const results = mockBooks.filter(book => 
    book.status !== 'draft' && (
      book.title?.toLowerCase().includes(lowercaseQuery) ||
      book.author?.toLowerCase().includes(lowercaseQuery) ||
      book.description?.toLowerCase().includes(lowercaseQuery) ||
      book.summary?.toLowerCase().includes(lowercaseQuery) ||
      book.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  );

  return limit ? results.slice(0, limit) : results;
}