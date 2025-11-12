// pages/print/index.tsx
<<<<<<< HEAD
import type { GetStaticProps } from "next";
import Head from "next/head";
import * as React from "react";
import Link from "next/link";
import { toJSONSafe } from '...';
import SiteLayout from "@/components/SiteLayout";
import ErrorBoundary from "@/components/ErrorBoundary";

// Contentlayer imports
import { allPosts, allBooks, allEvents, allPages } from '...';

// Types
type PrintItem = {
  slug: string;
  title: string;
  type: "post" | "book" | "event" | "page";
  description?: string;
  date?: string;
  category?: string;
  printUrl: string;
};

type PrintIndexProps = {
  items: PrintItem[];
  categories: string[];
  performanceMetrics?: {
    generationTime: number;
    itemCount: number;
  };
};

// Utility functions
const getAllPrintableItems = (): PrintItem[] => {
  const items: PrintItem[] = [];

  // Add posts
  allPosts
    .filter((post) => post.slug && !post.draft && post.printable !== false)
    .forEach((post) => {
      items.push({
        slug: post.slug,
        title: post.title || "Untitled Post",
        type: "post",
        description: post.description || post.excerpt,
        date: post.date,
        category: post.category,
        printUrl: `/print/post/${post.slug}`,
      });
    });

  // Add books
  allBooks
    .filter((book) => book.slug && !book.draft && book.printable !== false)
    .forEach((book) => {
      items.push({
        slug: book.slug,
        title: book.title || "Untitled Book",
        type: "book",
        description: book.description || book.excerpt,
        date: book.publicationDate,
        category: book.category,
        printUrl: `/print/book/${book.slug}`,
      });
    });

  // Add events
  allEvents
    .filter((event) => event.slug && !event.draft && event.printable !== false)
    .forEach((event) => {
      items.push({
        slug: event.slug,
        title: event.title || "Untitled Event",
        type: "event",
        description: event.description || event.excerpt,
        date: event.date,
        category: event.category,
        printUrl: `/print/events/${event.slug}`,
      });
    });

  // Add pages
  allPages
    .filter((page) => page.slug && !page.draft && page.printable !== false)
    .forEach((page) => {
      items.push({
        slug: page.slug,
        title: page.title || "Untitled Page",
        type: "page",
        description: page.description,
        printUrl: `/print/${page.slug}`,
      });
    });

  return items;
};

const getTypeIcon = (type: PrintItem['type']) => {
  switch (type) {
    case 'post':
      return '📝';
    case 'book':
      return '📚';
    case 'event':
      return '📅';
    case 'page':
      return '📄';
    default:
      return '📄';
  }
};

const getTypeColor = (type: PrintItem['type']) => {
  switch (type) {
    case 'post':
      return 'bg-blue-100 text-blue-800';
    case 'book':
      return 'bg-green-100 text-green-800';
    case 'event':
      return 'bg-purple-100 text-purple-800';
    case 'page':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default function PrintIndexPage({ items, categories, performanceMetrics }: PrintIndexProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [searchTerm, setSearchTerm] = React.useState<string>('');

  const filteredItems = items.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handlePrintAll = () => {
    // This would need a more sophisticated implementation for printing multiple items
    alert('Print all functionality would open multiple print dialogs. Consider printing items individually.');
  };

  return (
    <SiteLayout
      pageTitle="Printable Content - Abraham of London"
      metaDescription="Browse and print articles, books, events, and resources from Abraham of London"
      canonicalUrl="https://abrahamoflondon.com/print"
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <ErrorBoundary fallback={<div className="container mx-auto px-4 py-8">Error loading print index</div>}>
        <div className="min-h-screen bg-warmWhite">
          {/* Header */}
          <header className="bg-deepCharcoal text-cream py-16">
            <div className="container mx-auto px-4 max-w-6xl text-center">
              <h1 className="font-serif text-4xl md:text-5xl font-bold mb-6">
                Printable Content
              </h1>
              <p className="text-xl text-cream/80 max-w-3xl mx-auto leading-relaxed">
                Browse and print articles, books, events, and resources from Abraham of London. 
                All content is optimized for clean, readable printing.
              </p>
              
              <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
                <div className="bg-forest/20 px-4 py-2 rounded-full">
                  📝 {items.filter(item => item.type === 'post').length} Articles
                </div>
                <div className="bg-softGold/20 text-deepCharcoal px-4 py-2 rounded-full">
                  📚 {items.filter(item => item.type === 'book').length} Books
                </div>
                <div className="bg-blue-500/20 px-4 py-2 rounded-full">
                  📅 {items.filter(item => item.type === 'event').length} Events
                </div>
                <div className="bg-gray-500/20 px-4 py-2 rounded-full">
                  📄 {items.filter(item => item.type === 'page').length} Pages
                </div>
              </div>
            </div>
          </header>

          {/* Controls */}
          <section className="bg-white border-b border-lightGrey py-6 sticky top-0 z-40">
            <div className="container mx-auto px-4 max-w-6xl">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search */}
                <div className="flex-1 w-full lg:max-w-md">
                  <input
                    type="text"
                    placeholder="Search printable content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-lightGrey rounded-lg focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent"
                  />
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-lightGrey rounded-lg focus:outline-none focus:ring-2 focus:ring-forest focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={handlePrintAll}
                    className="bg-forest hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    🖨️ Print All Visible
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Content Grid */}
          <section className="py-12">
            <div className="container mx-auto px-4 max-w-6xl">
              {filteredItems.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item, index) => (
                    <div
                      key={item.slug}
                      className="bg-white rounded-xl border border-lightGrey p-6 hover:shadow-lg transition-all duration-300 group"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${getTypeColor(item.type)}`}>
                          {getTypeIcon(item.type)} {item.type}
                        </span>
                        {item.category && (
                          <span className="text-xs text-deepCharcoal/50 bg-warmWhite px-2 py-1 rounded">
                            {item.category}
                          </span>
                        )}
                      </div>

                      <h3 className="font-semibold text-deepCharcoal mb-2 text-lg group-hover:text-forest transition-colors">
                        <Link href={item.printUrl} className="before:absolute before:inset-0">
                          {item.title}
                        </Link>
                      </h3>

                      {item.description && (
                        <p className="text-deepCharcoal/70 text-sm mb-4 line-clamp-2">
                          {item.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-xs text-deepCharcoal/50">
                        {item.date && (
                          <span>
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        )}
                        <Link
                          href={item.printUrl}
                          className="text-forest hover:text-green-700 font-semibold flex items-center gap-1"
                        >
                          Print Version →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-deepCharcoal/10 rounded-full flex items-center justify-center">
                    <span className="text-4xl">🔍</span>
                  </div>
                  <h3 className="text-2xl font-bold text-deepCharcoal mb-2">
                    No Printable Content Found
                  </h3>
                  <p className="text-deepCharcoal/70 mb-6 max-w-md mx-auto">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Try adjusting your search terms or category filter.'
                      : 'No printable content is currently available.'}
                  </p>
                  {(searchTerm || selectedCategory !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                      className="bg-forest text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* Print Tips */}
          <section className="bg-deepCharcoal text-cream py-12">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="font-serif text-3xl font-bold text-center mb-8">
                Printing Tips
              </h2>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-sm">
                <div className="text-center">
                  <div className="text-3xl mb-3">🖨️</div>
                  <h3 className="font-semibold mb-2">Best Results</h3>
                  <p className="text-cream/70">Use "Save as PDF" for digital archives</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📄</div>
                  <h3 className="font-semibold mb-2">Paper Quality</h3>
                  <p className="text-cream/70">80-100gsm paper recommended</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">🎨</div>
                  <h3 className="font-semibold mb-2">Ink Saving</h3>
                  <p className="text-cream/70">Black & white mode for text-heavy content</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl mb-3">📏</div>
                  <h3 className="font-semibold mb-2">Margins</h3>
                  <p className="text-cream/70">Default margins work best for readability</p>
                </div>
              </div>
            </div>
          </section>

          {/* Performance Metrics (Development only) */}
          {process.env.NODE_ENV === 'development' && performanceMetrics && (
            <div className="fixed bottom-4 right-4 bg-deepCharcoal text-cream px-3 py-2 rounded text-xs">
              {performanceMetrics.itemCount} items in {performanceMetrics.generationTime}ms
            </div>
          )}
        </div>
      </ErrorBoundary>
    </SiteLayout>
  );
}

export const getStaticProps: GetStaticProps<PrintIndexProps> = async () => {
  const startTime = Date.now();

  try {
    const items = getAllPrintableItems();
    
    // Sort by date (newest first)
    const sortedItems = items.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });

    // Get unique categories
    const categories = Array.from(
      new Set(
        items
          .map((item) => item.category)
          .filter(Boolean)
          .sort()
      )
    );

    const performanceMetrics = {
      generationTime: Date.now() - startTime,
      itemCount: sortedItems.length,
    };

    return {
      props: toJSONSafe({
        items: sortedItems,
        categories,
        performanceMetrics,
      }),
      revalidate: 1800, // 30 minutes
    };
  } catch (error) {
    console.error('Error in getStaticProps for print index:', error);
    
    return {
      props: toJSONSafe({
        items: [],
        categories: [],
        performanceMetrics: {
          generationTime: 0,
          itemCount: 0,
        },
      }),
      revalidate: 1800,
    };
  }
};
=======
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllPrintDocuments } from "@/lib/server/print-utils";

type Props = {
  prints: Array<{
    title: string;
    slug: string;
    date: string;
    excerpt?: string;
    tags?: string[];
    url: string;
  }>;
};

export default function PrintIndexPage({ prints }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout pageTitle="Print Materials">
      <Head>
        <title>Print Materials | Abraham of London</title>
        <meta name="description" content="Collection of print materials, guides, and resources from Abraham of London." />
      </Head>

      <main className="container mx-auto max-w-4xl px-4 py-12">
        <header className="mb-12 text-center">
          <h1 className="text-4xl font-serif font-bold text-deepCharcoal mb-4">
            Print Materials
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Collection of guides, resources, and print materials for leadership, strategy, and personal development.
          </p>
        </header>

        {prints.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No print materials available yet.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {prints.map((print) => (
              <article 
                key={print.slug}
                className="border border-lightGrey rounded-lg p-6 hover:shadow-card transition-shadow"
              >
                <h2 className="text-xl font-semibold text-deepCharcoal mb-2">
                  <Link 
                    href={print.url}
                    className="hover:text-forest transition-colors"
                  >
                    {print.title}
                  </Link>
                </h2>
                
                {print.excerpt && (
                  <p className="text-gray-600 mb-3">{print.excerpt}</p>
                )}
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <time dateTime={print.date}>
                    {new Date(print.date).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </time>
                  
                  {print.tags && print.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {print.tags.map((tag, index) => (
                        <span 
                          key={index}
                          className="inline-block bg-warmWhite px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  const prints = getAllPrintDocuments().map((doc) => ({
    title: doc.title,
    slug: doc.slug,
    date: doc.date,
    excerpt: doc.excerpt || undefined,
    tags: doc.tags || undefined,
    url: doc.url
  }));

  return {
    props: {
      prints
    },
    revalidate: 60 * 60 // 1 hour
  };
};
>>>>>>> test-netlify-fix
