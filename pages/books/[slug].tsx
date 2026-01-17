/* pages/books/[slug].tsx - FIXED */
import React, { useState, useEffect } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";

import Layout from "@/components/Layout";

// Server content layer
import { getServerAllBooks, getServerBookBySlug, getContentlayerData } from "@/lib/contentlayer-compat";

// MDX utilities (use simple components for build safety)
import { prepareMDX, simpleMdxComponents, sanitizeData } from "@/lib/server/md-utils";

// UI Components
import BookHero from "@/components/books/BookHero";
import BookDetails from "@/components/books/BookDetails";
import BookContent from "@/components/books/BookContent";
import PurchaseOptions from "@/components/books/PurchaseOptions";
import BookReviews from "@/components/books/BookReviews";
import RelatedBooks from "@/components/books/RelatedBooks";
import { Share2, Download, Layers, ChevronLeft, Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";

type Book = {
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  slug: string;
  url: string;
  isbn: string | null;
  author: string | null;
  publisher: string | null;
  pages: number | null;
  publishedDate: string | null;
  description: string | null;
  price?: number;
  currency?: string;
  availableFormats?: string[];
  categories?: string[];
};

type Props = {
  book: Book;
  source: MDXRemoteSerializeResult;
};

const BookPage: NextPage<Props> = ({ book, source }) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check bookmarks
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBooks') || '[]');
        setIsBookmarked(bookmarks.includes(book.slug));
      } catch (error) {
        console.error('Error parsing bookmarks:', error);
        localStorage.setItem('bookmarkedBooks', '[]');
      }
    }
  }, [book.slug]);

  const handleBookmark = () => {
    if (typeof window !== 'undefined') {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedBooks') || '[]');
        
        if (isBookmarked) {
          const updated = bookmarks.filter((slug: string) => slug !== book.slug);
          localStorage.setItem('bookmarkedBooks', JSON.stringify(updated));
          setIsBookmarked(false);
        } else {
          bookmarks.push(book.slug);
          localStorage.setItem('bookmarkedBooks', JSON.stringify(bookmarks));
          setIsBookmarked(true);
        }
      } catch (error) {
        console.error('Error updating bookmarks:', error);
      }
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const shareData = {
        title: book.title,
        text: book.excerpt || '',
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      if (!navigator.share) {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } finally {
      setIsSharing(false);
    }
  };

  const metaDescription =
    book.excerpt || book.description || "A definitive volume from Abraham of London";

  const formattedDate = book.publishedDate 
    ? new Date(book.publishedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : '';

  return (
    <Layout>
      <Head>
        <title>{book.title} | Books | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={book.title} />
        <meta property="og:description" content={metaDescription} />
        <meta
          property="og:image"
          content={book.coverImage || "/assets/images/book-default.jpg"}
        />
        <meta property="og:type" content="book" />
        <meta property="og:url" content={`https://abrahamoflondon.com${book.url}`} />
        <meta name="twitter:card" content="summary_large_image" />
        {book.isbn ? <meta property="book:isbn" content={book.isbn} /> : null}
        {book.author ? <meta property="book:author" content={book.author} /> : null}
        <link rel="canonical" href={`https://abrahamoflondon.com${book.url}`} />
      </Head>

      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Library
          </button>
        </div>
      </div>

      <div className="min-h-screen bg-black selection:bg-amber-500 selection:text-black">
        {/* Institutional Hero Section */}
        <BookHero
          title={book.title}
          author={book.author || ""}
          coverImage={book.coverImage || ""}
          excerpt={book.excerpt}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            {/* Main Manuscript Content */}
            <main className="lg:col-span-8">
              <div className="bg-zinc-900/30 backdrop-blur-md border border-white/10 rounded-3xl p-6 md:p-8 lg:p-12 shadow-2xl">
                {/* Action buttons */}
                <div className="flex flex-wrap gap-4 mb-8">
                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isBookmarked 
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                        : 'bg-white/5 text-gray-400 border border-white/10 hover:border-amber-500/30 hover:text-amber-400'
                    }`}
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span className="text-sm font-medium">Save for Later</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShare}
                    disabled={isSharing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:border-amber-500/30 hover:text-amber-400 transition-colors disabled:opacity-50"
                  >
                    <Share2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Share</span>
                  </button>
                  {book.isbn && (
                    <a
                      href={`https://www.amazon.com/s?k=${book.isbn}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 text-gray-400 border border-white/10 hover:border-blue-500/30 hover:text-blue-400 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span className="text-sm font-medium">Find on Amazon</span>
                    </a>
                  )}
                </div>

                {/* Physical Specifications */}
                <BookDetails
                  isbn={book.isbn}
                  publisher={book.publisher}
                  pages={book.pages}
                  publishedDate={formattedDate}
                />

                <div className="mt-8 prose prose-invert prose-lg max-w-none">
                  <BookContent>
                    {/* IMPORTANT: Use simpleMdxComponents for guaranteed availability */}
                    <MDXRemote {...source} components={simpleMdxComponents} />
                  </BookContent>
                </div>

                {/* Categories */}
                {book.categories && book.categories.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-white/10">
                    <div className="flex flex-wrap gap-2">
                      {book.categories.map((category) => (
                        <span
                          key={category}
                          className="px-3 py-1.5 bg-white/5 text-gray-300 text-sm rounded-full border border-white/10"
                        >
                          {category}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-12 pt-8 border-t border-white/10">
                  <PurchaseOptions book={book} />
                </div>

                <div className="mt-12">
                  <BookReviews bookTitle={book.title} />
                </div>
              </div>
            </main>

            {/* Strategic Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Related Volumes */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
                  <h3 className="text-lg font-serif font-semibold text-white mb-6 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-amber-500" />
                    Related Intelligence
                  </h3>
                  <RelatedBooks currentBookSlug={book.slug} />
                </div>

                {/* Digital Formats & Downloads */}
                <div className="bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-semibold text-amber-200 mb-6 flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Transmission Formats
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Standard PDF", icon: "📄", action: () => {} },
                      { label: "EPUB / E-Reader", icon: "📱", action: () => {} },
                      { label: "Institutional Audio", icon: "🎧", action: () => {} },
                    ].map((format) => (
                      <button
                        key={format.label}
                        onClick={format.action}
                        className="w-full bg-white/5 text-gray-200 border border-white/10 rounded-xl px-4 py-4 text-sm font-medium hover:bg-white/10 hover:border-amber-500/30 transition-all flex items-center justify-between group"
                        type="button"
                      >
                        <span className="flex items-center gap-2">
                          <span>{format.icon}</span>
                          <span>{format.label}</span>
                        </span>
                        <svg className="w-4 h-4 text-gray-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Author Info */}
                {book.author && (
                  <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">About the Author</h3>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-300">
                        {book.author} is a strategic thinker and author focused on institutional design and long-term value creation.
                      </p>
                      <button
                        onClick={() => router.push(`/authors/${book.author?.toLowerCase().replace(/\s+/g, '-')}`)}
                        className="w-full text-sm text-amber-400 hover:text-amber-300 transition-colors text-left"
                      >
                        View all works by {book.author} →
                      </button>
                    </div>
                  </div>
                )}

                {/* Book Stats */}
                <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Book Details</h3>
                  <div className="space-y-4">
                    {book.pages && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Pages</span>
                        <span className="text-sm text-white font-medium">{book.pages.toLocaleString()}</span>
                      </div>
                    )}
                    {book.publishedDate && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Published</span>
                        <span className="text-sm text-white font-medium">{formattedDate}</span>
                      </div>
                    )}
                    {book.isbn && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">ISBN</span>
                        <span className="text-sm text-white font-mono">{book.isbn}</span>
                      </div>
                    )}
                    {book.publisher && (
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-400">Publisher</span>
                        <span className="text-sm text-white font-medium">{book.publisher}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Newsletter CTA */}
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-2xl p-6">
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-white mb-3">New Releases</h3>
                    <p className="text-sm text-gray-300 mb-6">
                      Get notified when new volumes are published.
                    </p>
                    <button
                      onClick={() => router.push('/newsletter')}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:from-blue-400 hover:to-blue-500 transition-all shadow-lg shadow-blue-900/30"
                    >
                      Subscribe to Updates
                    </button>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookPage;

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    await getContentlayerData();
    const books = await getServerAllBooks();
    
    const filteredBooks = books
      .filter((x: any) => x && !(x as any).draft)
      .filter((x: any) => {
        const slug = (x as any).slug || (x as any)._raw?.flattenedPath || "";
        return slug && !String(slug).includes("replace") && slug.trim() !== '';
      });

    const paths = filteredBooks
      .filter((b: any) => b && !b.draft)
      .map((b: any) => {
        const slug = b.slug || b._raw?.flattenedPath?.replace(/^books\//, '');
        return slug ? { params: { slug } } : null;
      })
      .filter(Boolean) as { params: { slug: string } }[];

    return { 
      paths, 
      fallback: 'blocking' 
    };
  } catch (error) {
    console.error('Error generating static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const slug = params?.slug as string;
    if (!slug) return { notFound: true };

    const bookData: any = await getServerBookBySlug(slug);
    if (!bookData || bookData.draft) return { notFound: true };

    const rawMdx = bookData?.body?.raw ?? bookData?.body ?? "";
    const source = await prepareMDX(typeof rawMdx === "string" ? rawMdx : "");

    const book: Book = {
      title: bookData.title || "Untitled Volume",
      excerpt: bookData.excerpt || bookData.description || null,
      coverImage: bookData.coverImage || null,
      slug: bookData.slug || slug,
      url: `/books/${bookData.slug || slug}`,
      isbn: bookData.isbn ?? null,
      author: bookData.author ?? null,
      publisher: bookData.publisher ?? null,
      pages: bookData.pages ?? null,
      publishedDate: bookData.date ?? null,
      description: bookData.description ?? null,
      price: bookData.price,
      currency: bookData.currency,
      availableFormats: bookData.availableFormats,
      categories: bookData.categories,
    };

    // Sanitize ONLY the book model, NOT the MDX source.
    return {
      props: { book: sanitizeData(book), source },
      revalidate: 1800,
    };
  } catch (error) {
    console.error('Error generating static props:', error);
    return {
      notFound: true
    };
  }
};