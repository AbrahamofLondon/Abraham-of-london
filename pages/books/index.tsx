import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Calendar, Clock, Sparkles, ArrowRight } from "lucide-react";

import Layout from "@/components/Layout";
import SilentSurface from "@/components/ui/SilentSurface";
import {
  assertContentlayerHasDocs,
  getAllBooks,
  normalizeSlug,
} from "@/lib/contentlayer";

export type BookListItem = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  description: string | null;
  coverImage: string | null;
  readTime: string | null;
  tags: string[];
  featured: boolean;
  author: string | null;
  publishedDate: string | null;
};

interface BooksPageProps {
  books: BookListItem[];
}

export const getStaticProps: GetStaticProps<BooksPageProps> = async () => {
  // FIX: Removed argument
  assertContentlayerHasDocs();

  const raw = getAllBooks();

  const books: BookListItem[] = raw.map((b: any) => {
    const publishedDate =
      typeof b.date === "string" ? b.date : typeof b.publishedDate === "string" ? b.publishedDate : null;

    return {
      slug: normalizeSlug(b),
      title: b.title ?? "Untitled",
      subtitle: b.subtitle ?? null,
      excerpt: (b.excerpt ?? b.description) ?? null,
      description: b.description ?? null,
      coverImage: b.coverImage ?? b.image ?? null,
      readTime: b.readTime ?? null,
      tags: Array.isArray(b.tags) ? b.tags : [],
      featured: Boolean(b.featured),
      author: b.author ?? null,
      publishedDate,
    };
  });

  books.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;

    const da = a.publishedDate ? new Date(a.publishedDate).getTime() : 0;
    const db = b.publishedDate ? new Date(b.publishedDate).getTime() : 0;
    if (da !== db) return db - da;

    return a.title.localeCompare(b.title);
  });

  return { props: { books }, revalidate: 3600 };
};

const BooksPage: NextPage<BooksPageProps> = ({ books }) => {
  return (
    <Layout
      title="Volumes & Manuscripts"
      description="Long-form works, teaching editions, and canonical volumes from the Abraham of London canon."
      className="bg-charcoal"
    >
      <Head>
        <title>Books | Abraham of London</title>
        <meta
          name="description"
          content="Volumes, teaching editions, and long-form works from Abraham of London."
        />
        <meta property="og:title" content="Books | Abraham of London" />
        <meta
          property="og:description"
          content="Explore the volumes and manuscripts that underpin the Abraham of London canon."
        />
      </Head>

      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-black via-[#050608] to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.12),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(205,127,50,0.09),_transparent_55%)]" />
        <div className="container relative mx-auto px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-gold/70">
              Canon · Volumes
            </p>
            <h1 className="mb-3 font-serif text-4xl font-normal tracking-tight text-cream sm:text-5xl">
              Books & Volumes
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/70">
              Long-form works that sit behind the shorts, posts, and soundbites:
              the manuscripts where the arguments are built properly.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 sm:px-6 lg:px-8">
        {books.length === 0 ? (
          <div className="py-16 text-center text-white/50">
            No books available yet. The canon is still being arranged.
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col items-center justify-between gap-4 border-b border-white/5 pb-4 text-sm text-white/50 md:flex-row">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-gold/80" />
                <span>
                  {books.length} {books.length === 1 ? "volume" : "volumes"} currently available
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                  {books.filter((b) => b.featured).length} featured
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-white/40" />
                  {books.filter((b) => b.publishedDate !== null).length} with dates
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {books.map((book) => (
                <Link
                  key={book.slug}
                  href={`/books/${book.slug}`}
                  className="group block h-full"
                  aria-label={`View ${book.title}`}
                >
                  <SilentSurface className="flex h-full flex-col overflow-hidden" hover>
                    {book.coverImage ? (
                      <div className="relative aspect-[3/4] overflow-hidden">
                        <Image
                          src={book.coverImage}
                          alt={book.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                        {book.featured && (
                          <div className="absolute left-3 top-3">
                            <div className="flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-1 backdrop-blur-sm">
                              <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                              <span className="text-[10px] font-medium text-[#FBEED4]">
                                Featured Volume
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="relative flex aspect-[3/4] items-center justify-center bg-gradient-to-br from-charcoal to-softBlack">
                        <div className="text-center">
                          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                            <BookOpen className="h-6 w-6 text-white/30" />
                          </div>
                          <p className="text-xs text-white/40">Cover in preparation</p>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-4">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h2 className="line-clamp-2 font-serif text-base font-normal text-cream">
                            {book.title}
                          </h2>
                          {book.subtitle && (
                            <p className="mt-1 line-clamp-1 text-xs text-white/50">
                              {book.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {book.excerpt && (
                        <p className="mb-3 line-clamp-3 text-xs text-white/60">
                          {book.excerpt}
                        </p>
                      )}

                      <div className="mt-auto space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-white/45">
                          <div className="flex items-center gap-2">
                            {book.publishedDate && (
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(book.publishedDate).toLocaleDateString("en-GB", {
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                            )}
                            {book.readTime && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {book.readTime}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-white/45">
                          <div className="flex flex-wrap gap-1">
                            {book.tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="rounded-full bg-white/5 px-2 py-0.5">
                                #{tag}
                              </span>
                            ))}
                            {book.tags.length > 2 && (
                              <span className="text-white/35">
                                +{book.tags.length - 2} more
                              </span>
                            )}
                          </div>
                          <ArrowRight className="h-3 w-3 text-white/40 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </SilentSurface>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default BooksPage;
