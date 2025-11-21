// pages/books/index.tsx
import * as React from "react";
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, Clock, User, ArrowRight, Search, Filter } from "lucide-react";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import { getAllBooks, type Book } from "@/lib/books";

type SerializedBook = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  date: string | null;
  author?: string;
  readingTime?: string;
  category?: string;
  status?: "published" | "draft" | "forthcoming";
};

type BooksIndexProps = {
  books: SerializedBook[];
};

export const getStaticProps: GetStaticProps<BooksIndexProps> = async () => {
  const rawBooks = (getAllBooks() ?? []) as Book[];

  const books: SerializedBook[] = rawBooks.map((b: any) => {
    const rawDate = b.date ?? null;
    const date =
      rawDate instanceof Date
        ? rawDate.toISOString()
        : typeof rawDate === "string"
        ? rawDate
        : null;

    return {
      slug: String(b.slug ?? ""),
      title: String(b.title ?? "Untitled Book"),
      excerpt:
        typeof b.excerpt === "string" && b.excerpt.trim().length
          ? b.excerpt
          : null,
      coverImage:
        typeof b.coverImage === "string" && b.coverImage.trim().length
          ? b.coverImage
          : null,
      date,
      author: b.author || "Abraham of London",
      readingTime: b.readingTime || null,
      category: b.category || null,
      status: b.status || "published",
    };
  });

  return {
    props: {
      books,
    },
    revalidate: 3600,
  };
};

export default function BooksIndexPage({
  books,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const pageTitle = "Books & Manuscripts";
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("all");

  // Get unique categories
  const categories = React.useMemo(() => {
    const cats = books
      .map(book => book.category)
      .filter(Boolean) as string[];
    return ["all", ...Array.from(new Set(cats))];
  }, [books]);

  // Filter books based on search and category
  const filteredBooks = React.useMemo(() => {
    return books.filter(book => {
      const matchesSearch = searchQuery === "" || 
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.excerpt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === "all" || 
        book.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [books, searchQuery, selectedCategory]);

  const publishedBooks = filteredBooks.filter(book => book.status === "published");
  const forthcomingBooks = filteredBooks.filter(book => book.status === "forthcoming");

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Explore books and manuscripts by Abraham of London on fatherhood, legacy, strategy, and faithful leadership in a fractured world."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-charcoal to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
            >
              <motion.p 
                className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70 mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                The Library
              </motion.p>
              <motion.h1 
                className="font-serif text-4xl font-bold text-cream sm:text-5xl lg:text-6xl mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Books & Manuscripts
              </motion.h1>
              <motion.p 
                className="mx-auto max-w-2xl text-lg text-gold/70 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                Long-form works that carry the Fathering Without Fear and Kingdom legacy 
                work into pages people can live with. Wisdom for fathers, founders, and 
                leaders navigating complexity.
              </motion.p>
            </motion.div>
          </div>
        </section>

        {/* Search and Filter Section */}
        <section className="py-8 border-b border-gold/20 bg-charcoal/50">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gold/60" />
                <input
                  type="text"
                  placeholder="Search books and manuscripts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-charcoal/70 border border-gold/20 rounded-xl text-cream placeholder-gold/40 focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-gold/60" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-charcoal/70 border border-gold/20 rounded-xl px-4 py-3 text-cream focus:outline-none focus:border-gold/60 focus:ring-2 focus:ring-gold/20"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all" ? "All Categories" : category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gold/60">
                Showing {filteredBooks.length} of {books.length} works
              </p>
              {(searchQuery || selectedCategory !== "all") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="text-sm text-gold hover:text-amber-200 transition-colors"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Published Books */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Published Works
              </h2>
              <p className="text-gold/70 max-w-2xl">
                Completed books and manuscripts available for reading and study. 
                Each work represents years of research, practice, and refinement.
              </p>
            </motion.div>

            {publishedBooks.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {publishedBooks.map((book, index) => (
                  <BookCard key={book.slug} book={book} index={index} />
                ))}
              </div>
            ) : (
              <motion.div 
                className="rounded-2xl border border-gold/20 bg-gold/5 p-12 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <BookOpen className="h-12 w-12 text-gold/40 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-semibold text-cream mb-4">
                  No Books Match Your Search
                </h3>
                <p className="text-gold/70 mb-6 max-w-md mx-auto">
                  Try adjusting your search terms or browse all categories to find 
                  the wisdom you're looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                  }}
                  className="inline-flex items-center rounded-xl bg-gold px-6 py-3 font-semibold text-charcoal transition-all hover:bg-amber-200"
                >
                  Show All Books
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Forthcoming Books */}
        {forthcomingBooks.length > 0 && (
          <section className="py-16 border-t border-gold/20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                  Forthcoming Works
                </h2>
                <p className="text-gold/70 max-w-2xl">
                  Books and manuscripts currently in development. Join the newsletter 
                  to receive updates on release dates and early access opportunities.
                </p>
              </motion.div>

              <div className="grid gap-8 md:grid-cols-2">
                {forthcomingBooks.map((book, index) => (
                  <BookCard key={book.slug} book={book} index={index} isForthcoming={true} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 border-t border-gold/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <motion.div 
              className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Join the Literary Circle
              </h2>
              <p className="text-gold/70 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                Get early access to new manuscripts, exclusive content from works in progress, 
                and invitations to private reading circles and author discussions.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/newsletter"
                  className="inline-flex items-center gap-3 rounded-xl bg-gold px-8 py-4 font-semibold text-charcoal transition-all hover:bg-amber-200"
                >
                  <BookOpen className="h-5 w-5" />
                  Join Literary Circle
                </Link>
                <Link
                  href="/content"
                  className="inline-flex items-center gap-3 rounded-xl border border-gold px-8 py-4 font-semibold text-gold transition-all hover:bg-gold/10"
                >
                  <ArrowRight className="h-5 w-5" />
                  Explore More Content
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Book Card Component
function BookCard({ 
  book, 
  index, 
  isForthcoming = false 
}: { 
  book: SerializedBook; 
  index: number; 
  isForthcoming?: boolean;
}) {
  const displayDate = book.date 
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(book.date))
    : null;

  return (
    <motion.article
      className="group overflow-hidden rounded-2xl border border-gold/20 bg-charcoal/60 backdrop-blur-sm transition-all hover:border-gold/40 hover:bg-charcoal/70"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/books/${book.slug}`} className="block">
        {/* Book Cover */}
        <div className="relative h-64 overflow-hidden">
          {book.coverImage ? (
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-amber-200/5 flex items-center justify-center">
              <BookOpen className="h-12 w-12 text-gold/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/90 via-charcoal/20 to-transparent" />
          
          {/* Status Badge */}
          {isForthcoming && (
            <div className="absolute top-4 right-4 rounded-full bg-gold/20 backdrop-blur-sm px-3 py-1 text-xs font-semibold text-gold">
              Forthcoming
            </div>
          )}
        </div>
        
        {/* Book Content */}
        <div className="p-6">
          {/* Meta Information */}
          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs font-medium text-gold/70">
            {displayDate && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {displayDate}
              </span>
            )}
            {book.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {book.author}
              </span>
            )}
            {book.readingTime && (
              <span>{book.readingTime}</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-serif text-xl font-semibold text-cream mb-3 leading-tight group-hover:text-gold transition-colors line-clamp-2">
            {book.title}
          </h3>

          {/* Category */}
          {book.category && (
            <span className="inline-block rounded-full bg-gold/10 px-3 py-1 text-xs font-semibold text-gold mb-3">
              {book.category}
            </span>
          )}

          {/* Excerpt */}
          {book.excerpt && (
            <p className="text-sm text-gold/60 leading-relaxed line-clamp-3 mb-4">
              {book.excerpt}
            </p>
          )}

          {/* CTA */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gold group-hover:underline flex items-center gap-2">
              {isForthcoming ? "Learn More" : "Read Book"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}