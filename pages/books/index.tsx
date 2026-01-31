import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { BookOpen, ChevronRight, Sparkles } from "lucide-react";

import Layout from "@/components/Layout";

type BookItem = {
  title: string;
  slug: string;
  href: string;
  excerpt?: string | null;
  coverImage?: string | null;
};

type Props = { books: BookItem[] };

function safeNormalizeSlug(input: string): string {
  return (input || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  // Prefer your compat layer if it exists
  let allBooks: any[] = [];
  try {
    const compat = await import("@/lib/contentlayer-compat");
    allBooks = Array.isArray((compat as any).allBooks) ? (compat as any).allBooks : [];
  } catch {
    try {
      // fallback
      const gen = await import("contentlayer/generated");
      allBooks = Array.isArray((gen as any).allBooks) ? (gen as any).allBooks : [];
    } catch {
      allBooks = [];
    }
  }

  const books: BookItem[] = allBooks
    .map((b: any) => {
      const raw = b?.slug || b?.slugComputed || b?._raw?.flattenedPath || "";
      const slug = safeNormalizeSlug(String(raw).replace(/^books\//, ""));
      return {
        title: b?.title || "Untitled",
        slug,
        href: `/books/${slug}`,
        excerpt: b?.excerpt || b?.description || null,
        coverImage: b?.coverImage || null,
      };
    })
    .filter((x) => x.slug)
    .sort((a, b) => a.title.localeCompare(b.title));

  return {
    props: { books: JSON.parse(JSON.stringify(books)) },
    revalidate: 1800,
  };
};

const BooksIndex: NextPage<Props> = ({ books }) => {
  const title = "Books";
  const description = "Primary works and mini-books that anchor the system — readable, deployable, structured.";

  // Spotlight your Canon front door
  const spotlight = books.find((b) => b.slug.includes("the-architecture-of-human-purpose")) || books[0];

  return (
    <Layout title={title} description={description} fullWidth>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
      </Head>

      <section className="relative overflow-hidden bg-black border-b border-white/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 relative">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.45em] text-amber-300">
            Primary works
          </p>
          <h1 className="mt-4 font-serif text-5xl font-bold text-white">
            Books
          </h1>
          <p className="mt-5 max-w-2xl text-gray-300 font-light">
            This is not “content.” These are structured works — designed for builders, not browsers.
          </p>

          {spotlight && (
            <Link
              href={spotlight.href}
              className="mt-10 block rounded-3xl border border-amber-400/20 bg-white/[0.03] p-8 backdrop-blur-xl hover:border-amber-400/35 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-4 py-2">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                    <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-amber-200">
                      Canon front door
                    </span>
                  </div>

                  <h2 className="mt-5 font-serif text-3xl font-semibold text-amber-100">
                    {spotlight.title}
                  </h2>

                  {spotlight.excerpt && (
                    <p className="mt-4 text-sm leading-relaxed text-gray-300 font-light line-clamp-3">
                      {spotlight.excerpt}
                    </p>
                  )}
                </div>

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                  <BookOpen className="h-6 w-6" />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                <span className="text-[10px] font-extrabold uppercase tracking-[0.35em] text-gray-500">
                  open file
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Read <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="bg-black">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {books.map((b) => (
              <Link
                key={b.slug}
                href={b.href}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 hover:border-white/20 hover:bg-white/[0.05] transition-all"
              >
                <h3 className="font-serif text-2xl font-semibold text-amber-100">
                  {b.title}
                </h3>
                {b.excerpt && (
                  <p className="mt-3 text-sm text-gray-300 font-light line-clamp-3">
                    {b.excerpt}
                  </p>
                )}
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Read <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default BooksIndex;