// pages/index.tsx - SIMPLIFIED & GUARANTEED WORKING VERSION
import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage, GetStaticProps } from "next";

import Layout from "@/components/Layout";
import { BookCard, BlogPostCard } from "@/components/Cards";
import ShortCard from "@/components/ShortCard";

import {
  getPublishedPosts,
  getAllBooks,
  getPublishedShorts,
} from "@/lib/contentlayer-helper";
import type { Post, Book, Short } from "contentlayer/generated";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

// -----------------------------------------------------------------------------
// Types & data fetching
// -----------------------------------------------------------------------------

type HomePageProps = {
  latestPosts: Post[];
  featuredBooks: Book[];
  latestShorts: Short[];
};

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const publishedPosts = getPublishedPosts() || [];
    const allBooks = getAllBooks() || [];
    const publishedShorts = getPublishedShorts() || [];

    const nonDraftBooks = allBooks.filter((b) => !(b as any).draft);

    return {
      props: {
        latestPosts: publishedPosts.slice(0, 3),
        featuredBooks: nonDraftBooks.slice(0, 2),
        latestShorts: publishedShorts.slice(0, 3),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Homepage getStaticProps error:", error);
    return {
      props: {
        latestPosts: [],
        featuredBooks: [],
        latestShorts: [],
      },
      revalidate: 60,
    };
  }
};

// -----------------------------------------------------------------------------
// Minimal Hero Component
// -----------------------------------------------------------------------------

const HeroSection = () => (
  <section className="relative overflow-hidden bg-gradient-to-b from-[#050608] via-[#0B0C10] to-[#050608]">
    <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-4 py-2">
          <span className="text-base text-amber-400">𓆓</span>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
            Library of Applied Wisdom
          </span>
        </div>

        <h1 className="mb-4 font-serif text-4xl font-semibold leading-tight text-[#F5F1E8] sm:text-5xl lg:text-6xl">
          Abraham of London
        </h1>
        <p className="mb-6 text-lg font-normal text-amber-100/90 sm:text-xl lg:text-2xl">
          Structural thinking for fathers, founders, and builders of legacy.
        </p>

        <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-200">
          For men who carry responsibility for a family, a company, or a
          community — this is where faith, history, and strategy are turned into
          operating systems, not slogans.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/canon"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-black shadow-lg transition-all hover:scale-105"
          >
            Enter the Canon
            <span>↠</span>
          </Link>
          <Link
            href="/consulting"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-400/50 bg-transparent px-6 py-3 text-sm font-semibold text-amber-100 transition-all hover:bg-amber-500/10"
          >
            Strategic work with Abraham
            <span>→</span>
          </Link>
        </div>
      </div>
    </div>
  </section>
);

// -----------------------------------------------------------------------------
// Simple Content Section
// -----------------------------------------------------------------------------

const ContentSection = ({
  title,
  subtitle,
  items,
  type,
  viewAllLink,
}: {
  title: string;
  subtitle: string;
  items: any[];
  type: "posts" | "books" | "shorts";
  viewAllLink: string;
}) => {
  if (items.length === 0) return null;

  return (
    <section className="py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl">
            {title}
          </h2>
          <p className="mb-4 text-gray-600 dark:text-gray-300">{subtitle}</p>
          <Link
            href={viewAllLink}
            className="text-sm font-semibold text-amber-600 hover:underline dark:text-amber-400"
          >
            View all →
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {type === "posts" &&
            items.map((post) => <BlogPostCard key={post._id} post={post} />)}
          {type === "books" &&
            items.map((book) => <BookCard key={book._id} book={book} />)}
          {type === "shorts" &&
            items.map((short) => <ShortCard key={short._id} short={short} />)}
        </div>
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// Main Page Component
// -----------------------------------------------------------------------------

const HomePage: NextPage<HomePageProps> = ({
  latestPosts = [],
  featuredBooks = [],
  latestShorts = [],
}) => {
  // Safety check
  const safeLatestPosts = Array.isArray(latestPosts) ? latestPosts : [];
  const safeFeaturedBooks = Array.isArray(featuredBooks) ? featuredBooks : [];
  const safeLatestShorts = Array.isArray(latestShorts) ? latestShorts : [];

  return (
    <>
      <Head>
        <title>Abraham of London | Structural Thinking for Builders</title>
        <meta
          name="description"
          content="Canon, ventures, and structural tools for fathers, founders, and builders of legacy."
        />
        <meta property="og:title" content="Abraham of London" />
        <meta
          property="og:description"
          content="Structural thinking for fathers, founders, and builders of legacy."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={siteUrl} />
      </Head>

      <Layout
        title="Abraham of London"
        description="Structural thinking for fathers, founders, and builders of legacy."
      >
        <HeroSection />

        {/* Stats Section - Simple */}
        <section className="border-y border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex justify-around text-center">
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {safeLatestPosts.length}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Essays
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {safeLatestShorts.length}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Shorts
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {safeFeaturedBooks.length}+
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Books
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        {safeLatestShorts.length > 0 && (
          <ContentSection
            title="Shorts"
            subtitle="High-protein reflections for busy builders"
            items={safeLatestShorts}
            type="shorts"
            viewAllLink="/shorts"
          />
        )}

        {safeLatestPosts.length > 0 && (
          <ContentSection
            title="Latest Essays"
            subtitle="Long-form thinking on purpose, power, and institutions"
            items={safeLatestPosts}
            type="posts"
            viewAllLink="/blog"
          />
        )}

        {safeFeaturedBooks.length > 0 && (
          <ContentSection
            title="Books in Development"
            subtitle="Canon volumes and narrative projects"
            items={safeFeaturedBooks}
            type="books"
            viewAllLink="/books"
          />
        )}

        {/* CTA Section */}
        <section className="bg-black py-12 text-white">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="mb-4 font-serif text-2xl font-semibold md:text-3xl">
              Ready to build with intention?
            </h2>
            <p className="mx-auto mb-6 max-w-2xl text-gray-300">
              Join builders who are applying these frameworks to their families,
              companies, and communities.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Link
                href="/consulting"
                className="rounded-lg bg-amber-500 px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-amber-600"
              >
                Start Strategic Work
              </Link>
              <Link
                href="/inner-circle"
                className="rounded-lg border border-gray-700 bg-gray-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-gray-800"
              >
                Join the Inner Circle
              </Link>
            </div>
          </div>
        </section>
      </Layout>

      {/* Debug script - remove in production */}
      {process.env.NODE_ENV === "development" && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              console.log('Homepage mounted successfully');
              console.log('Posts:', ${JSON.stringify(safeLatestPosts.length)});
              console.log('Books:', ${JSON.stringify(safeFeaturedBooks.length)});
              console.log('Shorts:', ${JSON.stringify(safeLatestShorts.length)});
            `,
          }}
        />
      )}
    </>
  );
};

export default HomePage;