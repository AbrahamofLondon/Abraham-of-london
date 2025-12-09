// pages/books/index.tsx - MODERNIZED RESPONSIVE VERSION
import * as React from "react";
import type {
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import { motion } from "framer-motion";
import { BookOpen, Filter, Search, Grid, List } from "lucide-react";

import Layout from "@/components/Layout";
import { BookCard } from "@/components/Cards";

// Centralised content access
import { getAllBooks, type Book } from "@/lib/content";

type Props = {
  books: Book[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  // Non-draft books, already sorted by date desc via lib/content
  const books = getAllBooks();

  // Ensure all fields have proper values for serialization
  const serializableBooks = books.map(book => ({
    ...book,
    // Ensure string fields are never undefined
    title: book.title || "Untitled",
    author: book.author || "",
    description: book.description || "",
    subtitle: book.subtitle || "",
    excerpt: book.excerpt || "",
    coverImage: book.coverImage || "/images/book-placeholder.jpg",
    publisher: book.publisher || "",
    isbn: book.isbn || "",
    category: book.category || "",
    // Ensure tags is always an array
    tags: book.tags || [],
    // Ensure date is properly formatted
    date: book.date ? new Date(book.date).toISOString().split('T')[0] : "",
    // Ensure booleans have defaults
    draft: book.draft || false,
    featured: book.featured || false,
  }));

  return {
    props: {
      books: serializableBooks,
    },
    revalidate: 3600, // 1 hour
  };
};

const BooksIndexPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ books }) => {
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const deviceRef = React.useRef<HTMLDivElement>(null);

  // Extract unique categories from books
  const categories = React.useMemo(() => {
    const cats = new Set<string>();
    books.forEach(book => {
      if (book.category) cats.add(book.category);
    });
    return ['all', ...Array.from(cats)].sort();
  }, [books]);

  // Filter books based on search and category
  const filteredBooks = React.useMemo(() => {
    return books.filter(book => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Category filter
      const matchesCategory = selectedCategory === 'all' || 
        book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  return (
    <Layout
      title="Books & Canon Volumes"
      description="Memoir, theology, and strategy for men who want to carry weight in history, not just comment on it."
    >
      <Head>
        <title>Books & Canon Volumes | Abraham of London</title>
        <meta 
          name="description" 
          content="Explore the Canon volumes and published works by Abraham of London. Memoir, theology, and strategy for builders of legacy." 
        />
        <meta property="og:title" content="Books & Canon Volumes" />
        <meta 
          property="og:description" 
          content="Memoir, theology and strategy for builders who want to carry weight in history, not just comment on it."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/books`} />
        <meta 
          property="og:image" 
          content={`${siteUrl}/api/og/books?title=Books%20%26%20Canon%20Volumes`} 
        />
        <link rel="canonical" href={`${siteUrl}/books`} />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[url('/assets/images/pattern.svg')] opacity-5" />
            <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
            <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 mb-6">
                <BookOpen className="h-4 w-4 text-amber-400" />
                <span className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                  Canon · Volumes & Works
                </span>
              </div>

              <h1 className="mb-4 font-serif text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                Books & Canon Volumes
              </h1>

              <p className="mx-auto max-w-2xl text-lg text-gray-300">
                Memoir, theology and strategy for builders who want to carry weight
                in history, not just comment on it.
              </p>

              {/* Stats */}
              <div className="mt-8 flex flex-wrap justify-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{books.length}</div>
                  <div className="text-sm text-gray-400">Published Volumes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {categories.length - 1}
                  </div>
                  <div className="text-sm text-gray-400">Categories</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">
                    {new Date().getFullYear() - 2020}
                  </div>
                  <div className="text-sm text-gray-400">Years of Writing</div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/95 py-4">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="search"
                  placeholder="Search books by title, author, or topic..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm placeholder-gray-500 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-amber-400"
                  aria-label="Search books"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Category Filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                    aria-label="Filter by category"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* View Toggle */}
                <div className="flex rounded-lg border border-gray-300 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-amber-500 text-white' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                    aria-label="Grid view"
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded-md p-2 transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-amber-500 text-white' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Books Grid/List */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filteredBooks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                  <Search className="h-6 w-6 text-gray-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-white">
                  No books found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'The shelves are being stocked. Check back soon.'
                  }
                </p>
                {(searchQuery || selectedCategory !== 'all') && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                    }}
                    className="mt-4 text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                  >
                    Clear all filters
                  </button>
                )}
              </motion.div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-6 flex items-center justify-between">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-semibold">{filteredBooks.length}</span> of{' '}
                    <span className="font-semibold">{books.length}</span> books
                  </p>
                  {filteredBooks.length < books.length && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedCategory('all');
                      }}
                      className="text-sm font-medium text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                {/* Books Display */}
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className={`${
                    viewMode === 'grid' 
                      ? 'grid gap-6 md:grid-cols-2 lg:grid-cols-3' 
                      : 'space-y-4'
                  }`}
                >
                  {filteredBooks.map((book) => (
                    <motion.div
                      key={book.slug ?? book._id}
                      variants={itemVariants}
                      className={viewMode === 'list' ? 'max-w-3xl' : ''}
                    >
                      <BookCard
                        book={book as any}
                        variant={viewMode}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}
          </div>
        </section>

        {/* Featured Section */}
        {books.some(b => b.featured) && (
          <section className="border-t border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-8 text-center">
                <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                  Featured Volumes
                </h2>
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  Start with these foundational works
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {books
                  .filter(book => book.featured)
                  .slice(0, 2)
                  .map((book) => (
                    <motion.div
                      key={book.slug ?? book._id}
                      whileHover={{ y: -4 }}
                      className="h-full"
                    >
                      <BookCard
                        book={book as any}
                        variant="grid"
                        featured
                      />
                    </motion.div>
                  ))}
              </div>
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="py-12">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-black p-8 dark:from-amber-900/20 dark:to-amber-800/10">
              <h3 className="mb-4 font-serif text-2xl font-semibold text-white dark:text-white">
                Can&apos;t find what you&apos;re looking for?
              </h3>
              <p className="mb-6 text-gray-300 dark:text-gray-400">
                Some volumes are still in development or available exclusively to 
                the Inner Circle. Reach out for access to advanced materials.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <a
                  href="/contact"
                  className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-amber-600"
                >
                  Request Access
                </a>
                <a
                  href="/canon"
                  className="rounded-lg border border-amber-500/30 bg-transparent px-6 py-3 text-sm font-semibold text-amber-500 transition-colors hover:bg-amber-500/10"
                >
                  Explore the Canon
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile optimizations */}
      <style jsx global>{`
        /* Mobile optimizations */
        @media (max-width: 768px) {
          /* Prevent zoom on iOS inputs */
          input, 
          select,
          textarea {
            font-size: 16px !important;
          }
          
          /* Better touch targets */
          button,
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Optimize sticky header */
          .sticky {
            position: -webkit-sticky;
            position: sticky;
          }
        }
        
        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        /* Smooth scrolling */
        html {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        
        /* Line clamp for better text handling */
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        /* Focus styles */
        *:focus-visible {
          outline: 2px solid #f59e0b;
          outline-offset: 2px;
        }
      `}</style>
    </Layout>
  );
};

export default BooksIndexPage;