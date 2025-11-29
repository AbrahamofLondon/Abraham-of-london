// pages/books/index.tsx
import React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/Layout";
import { getAllBooks } from "@/lib/books";
import type { BookMeta } from "@/types/index";

interface BooksPageProps {
  books: BookMeta[];
}

// Remove ExtendedBookMeta interface - use BookMeta directly since we updated types/index.ts
// BookMeta now includes accessLevel and lockMessage from BaseContentMeta

// Enhanced Featured Book Card Component
function FeaturedBookCard({ book, index }: { book: BookMeta; index: number }) {
  const isInnerCircle = book.accessLevel === "inner-circle";

  return (
    <Link href={`/books/${book.slug}`} className="block group">
      <div
        className="
        relative overflow-hidden rounded-2xl 
        bg-gradient-to-br from-charcoal-light to-charcoal-dark
        border border-gray-700/50
        transform transition-all duration-500
        group-hover:scale-[1.02] group-hover:border-softGold/30
        group-hover:shadow-2xl
      "
      >
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-softGold/5 via-transparent to-softGold/3 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

        <div className="relative p-8">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Book Cover */}
            {book.coverImage && (
              <div className="flex-shrink-0">
                <div className="relative group/image">
                  <div
                    className="
                    absolute -inset-4 bg-gradient-to-r from-softGold/20 to-softGold/10 
                    rounded-2xl blur-xl opacity-50 group-hover/image:opacity-75 
                    transition-opacity duration-500
                  "
                  ></div>
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    width={200}
                    height={280}
                    className="
                      relative rounded-xl shadow-2xl 
                      transform group-hover/image:scale-105 
                      transition-transform duration-500
                      border-2 border-softGold/20
                    "
                  />
                </div>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-4">
                {isInnerCircle && (
                  <span
                    className="
                    inline-flex items-center gap-1.5
                    rounded-full border border-softGold/70 bg-softGold/10 
                    px-3 py-1 text-xs font-semibold uppercase 
                    tracking-[0.15em] text-softGold
                  "
                  >
                    <span>🔒</span>
                    Inner Circle
                  </span>
                )}
                <span className="text-sm text-softGold font-semibold uppercase tracking-[0.2em]">
                  Featured
                </span>
              </div>

              <h3 className="font-serif text-2xl lg:text-3xl font-light text-cream mb-3 group-hover:text-softGold transition-colors duration-300 leading-tight">
                {book.title}
              </h3>

              {book.subtitle && (
                <p className="text-lg text-gray-300 mb-4 leading-relaxed">
                  {book.subtitle}
                </p>
              )}

              <div className="space-y-3 mb-6">
                {book.author && (
                  <p className="text-gray-300">
                    by{" "}
                    <span className="font-semibold text-softGold">
                      {book.author}
                    </span>
                  </p>
                )}
                {book.readTime && (
                  <p className="text-sm text-gray-400">{book.readTime}</p>
                )}
              </div>

              <p className="text-gray-300 leading-relaxed mb-6">
                {book.excerpt ||
                  book.description ||
                  "A valuable resource for leaders and thinkers shaping the future."}
              </p>

              <div className="flex items-center justify-between">
                <span
                  className="
                  inline-flex items-center gap-2 
                  text-softGold font-semibold 
                  group-hover:gap-3 transition-all duration-300
                "
                >
                  Explore Volume
                  <span className="text-lg">→</span>
                </span>

                {book.date && (
                  <time className="text-sm text-gray-400" dateTime={book.date}>
                    {new Date(book.date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                    })}
                  </time>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Enhanced Regular Book Card Component
function BookCard({ book, index }: { book: BookMeta; index: number }) {
  const isInnerCircle = book.accessLevel === "inner-circle";

  return (
    <Link href={`/books/${book.slug}`} className="block group">
      <div
        className="
        h-full bg-charcoal-light border border-gray-700/50 
        rounded-2xl overflow-hidden
        transform transition-all duration-500
        group-hover:scale-105 group-hover:border-softGold/30
        group-hover:shadow-2xl
        flex flex-col
      "
      >
        {/* Book Cover */}
        {book.coverImage && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={book.coverImage}
              alt={book.title}
              fill
              className="object-cover transform group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal-light via-transparent to-transparent"></div>

            {/* Access Level Badge */}
            {isInnerCircle && (
              <div className="absolute top-4 right-4">
                <span
                  className="
                  inline-flex items-center gap-1
                  rounded-full border border-softGold/70 bg-softGold/10 
                  px-2 py-1 text-xs font-semibold uppercase 
                  tracking-[0.15em] text-softGold
                "
                >
                  <span className="text-xs">🔒</span>
                  Inner
                </span>
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1">
            <h3 className="font-serif text-xl font-light text-cream mb-3 group-hover:text-softGold transition-colors duration-300 leading-tight">
              {book.title}
            </h3>

            {book.subtitle && (
              <p className="text-gray-300 text-sm mb-3 leading-relaxed">
                {book.subtitle}
              </p>
            )}

            <div className="space-y-2 mb-4">
              {book.author && (
                <p className="text-sm text-gray-300">
                  by{" "}
                  <span className="font-semibold text-softGold">
                    {book.author}
                  </span>
                </p>
              )}
              {book.readTime && (
                <p className="text-xs text-gray-400">{book.readTime}</p>
              )}
            </div>

            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
              {book.excerpt ||
                book.description ||
                "Essential reading for thoughtful leaders and builders."}
            </p>
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700/50">
            <span
              className="
              inline-flex items-center gap-2 
              text-softGold text-sm font-semibold 
              group-hover:gap-3 transition-all duration-300
            "
            >
              Read More
              <span className="text-lg">→</span>
            </span>

            {book.date && (
              <time className="text-xs text-gray-400" dateTime={book.date}>
                {new Date(book.date).getFullYear()}
              </time>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// Enhanced Empty State
function EmptyState() {
  return (
    <div className="text-center py-20">
      <div className="max-w-md mx-auto">
        <div className="text-6xl mb-6">📚</div>
        <h3 className="font-serif text-2xl text-cream mb-4">
          Library in Development
        </h3>
        <p className="text-gray-300 mb-6 leading-relaxed">
          Our book collection is currently being curated with valuable insights,
          frameworks, and original works that will equip leaders and builders
          for the challenges ahead.
        </p>
        <div className="space-y-4">
          <Link
            href="/content"
            className="
              inline-block bg-softGold text-charcoal px-8 py-3 
              rounded-full font-semibold 
              hover:bg-softGold/90 transition-all duration-300
              hover:scale-105 transform
            "
          >
            Browse All Content
          </Link>
          <div className="text-sm text-gray-400">
            New volumes added regularly
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BooksPage({ books }: BooksPageProps) {
  const hasBooks = books && books.length > 0;

  // Separate featured and regular books
  const featuredBooks = books.filter((book) => book.featured);
  const regularBooks = books.filter((book) => !book.featured);

  return (
    <Layout
      title="Books & Publications"
      pageTitle="Books & Publications"
      transparentHeader={false}
    >
      <Head>
        <title>Books & Publications | Abraham of London</title>
        <meta
          name="description"
          content="Curated book recommendations and publications from Abraham of London. Deep explorations of purpose, responsibility, and the architecture of enduring things."
        />
        <meta
          property="og:title"
          content="Books & Publications | Abraham of London"
        />
        <meta
          property="og:description"
          content="Curated book recommendations and publications for thoughtful leaders and builders."
        />
        <meta property="og:type" content="website" />
      </Head>

      {/* Enhanced Hero Section */}
      <div className="relative bg-gradient-to-br from-charcoal via-charcoal-dark to-black min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-softGold/10 via-transparent to-transparent"></div>

        {/* Animated Orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-softGold/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-softGold/3 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative text-center px-6 max-w-4xl mx-auto">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 rounded-full bg-softGold/10 border border-softGold/30 text-softGold text-sm font-semibold uppercase tracking-[0.2em] mb-4">
              Library Collection
            </span>
          </div>

          <h1 className="font-serif text-5xl lg:text-7xl font-light text-cream mb-6 leading-tight">
            Books &<br />
            <span className="text-softGold">Publications</span>
          </h1>

          <p className="text-xl lg:text-2xl text-gray-300 font-light max-w-2xl mx-auto leading-relaxed">
            Curated readings and original works for thoughtful leaders,
            builders, and those shaping the architecture of human purpose.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 lg:py-24">
        {/* Featured Books Section */}
        {featuredBooks.length > 0 && (
          <section className="mb-20">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl text-cream mb-4">
                Featured Works
              </h2>
              <p className="text-lg text-gray-300 max-w-2xl mx-auto">
                Essential reading for understanding purpose, civilisation, and
                the builder's calling
              </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {featuredBooks.map((book, index) => (
                <FeaturedBookCard key={book.slug} book={book} index={index} />
              ))}
            </div>
          </section>
        )}

        {/* All Books Grid */}
        {hasBooks ? (
          <section>
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl text-cream mb-4">
                Complete Collection
              </h2>
              <p className="text-lg text-gray-300">
                All published works and recommended readings
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {regularBooks.map((book, index) => (
                <BookCard key={book.slug} book={book} index={index} />
              ))}
            </div>
          </section>
        ) : (
          <EmptyState />
        )}
      </div>
    </Layout>
  );
}

export async function getStaticProps() {
  try {
    const books = await getAllBooks();

    // Since we updated types/index.ts, BookMeta now includes accessLevel and lockMessage
    // We just need to ensure all data is serializable
    const serializableBooks = books.map((book) => ({
      ...book,
      // Required fields
      slug: book.slug,
      title: book.title,

      // String fields that might be undefined
      excerpt: book.excerpt ?? null,
      description: book.description ?? null,
      subtitle: book.subtitle ?? null,
      coverImage: book.coverImage ?? null,
      author: book.author ?? null,
      date: book.date ?? null,
      readTime: book.readTime ?? null,
      lastModified: book.lastModified ?? null,
      category: book.category ?? null,
      isbn: book.isbn ?? null,
      publisher: book.publisher ?? null,
      publishedDate: book.publishedDate ?? null,
      language: book.language ?? null,
      price: book.price ?? null,
      purchaseLink: book.purchaseLink ?? null,
      accessLevel: book.accessLevel ?? null,
      lockMessage: book.lockMessage ?? null,

      // Array fields
      tags: book.tags ?? [],

      // Number fields
      pages: book.pages ?? null,
      rating: book.rating ?? null,

      // Boolean fields
      featured: book.featured ?? false,
      published: book.published ?? false,
      draft: book.draft ?? false,

      // Status field - use the existing BookMeta status type
      status: book.status ?? null,

      // Format field
      format: book.format ?? null,
    }));

    return {
      props: {
        books: serializableBooks,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching books:", error);
    return {
      props: {
        books: [],
      },
    };
  }
}
