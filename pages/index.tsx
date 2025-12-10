// pages/index.tsx – CRISP, PROFESSIONAL HOMEPAGE (STATIC EXPORT READY)

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

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type HomePageProps = {
  latestPosts: Post[];
  featuredBooks: Book[];
  latestShorts: Short[];
};

// -----------------------------------------------------------------------------
// SECTION DIVIDER
// -----------------------------------------------------------------------------

const SectionDivider = () => (
  <div className="relative h-16 overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
      <div className="mx-6 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
        <div className="h-1 w-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
        <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
      </div>
      <div className="h-px w-32 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// STATS BAR
// -----------------------------------------------------------------------------

const StatsBar = () => (
  <div className="py-8 md:py-12">
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      {[
        { label: "Canon Volumes", value: "4+", color: "text-amber-600" },
        { label: "Essays", value: "12+", color: "text-blue-600" },
        { label: "Frameworks", value: "8+", color: "text-emerald-600" },
        { label: "Active Years", value: "5+", color: "text-purple-600" },
      ].map((stat) => (
        <div key={stat.label} className="text-center">
          <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
          <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-400">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// CANON ENTRY CARD
// -----------------------------------------------------------------------------

const CanonEntryCard = ({
  title,
  subtitle,
  href,
  imageSrc,
  type,
}: {
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  type: "catechism" | "campaign" | "letter";
}) => {
  const typeStyles = {
    catechism: "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
    campaign: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    letter: "bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  };

  return (
    <Link href={href} className="group block">
      <div className={`rounded-xl border p-4 transition-all hover:-translate-y-1 ${typeStyles[type]}`}>
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-16 overflow-hidden rounded border border-gray-300 dark:border-gray-700">
            <Image
              src={imageSrc}
              alt={title}
              fill
              className="object-cover"
              sizes="80px"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <h4 className="font-serif text-sm font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h4>
              <span className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider bg-white/50 dark:bg-black/30">
                {type === "catechism" ? "Q&A" : type === "campaign" ? "Strategy" : "Personal"}
              </span>
            </div>
            <p className="mb-2 text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
              {subtitle}
            </p>
            <div className="text-xs font-medium uppercase tracking-[0.1em]">
              Canon Entry
            </div>
          </div>
          <div className="opacity-60 transition-transform group-hover:translate-x-2">
            →
          </div>
        </div>
      </div>
    </Link>
  );
};

// -----------------------------------------------------------------------------
// CANON PRIMARY CARD
// -----------------------------------------------------------------------------

const CanonPrimaryCard = () => (
  <Link href="/books/the-architecture-of-human-purpose" className="group block h-full">
    <div className="h-full overflow-hidden rounded-2xl border border-amber-200 dark:border-amber-800 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative aspect-[3/4] w-full max-w-sm">
            <div className="absolute inset-0 overflow-hidden rounded-lg border border-amber-300 dark:border-amber-700">
              <Image
                src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                alt="The Architecture of Human Purpose"
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 40vw"
              />
            </div>
          </div>
          
          <div className="flex-1 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Entry into the Canon
              </span>
              <span className="rounded-full border border-amber-300 dark:border-amber-700 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">
                Volume I · Prelude
              </span>
            </div>

            <h3 className="font-serif text-2xl font-light text-gray-900 dark:text-white">
              The Architecture of Human Purpose
            </h3>

            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-400">
              Canon · Foundations of Purpose
            </p>

            <p className="text-gray-600 dark:text-gray-300">
              A distilled prelude to the Canon — for men who know that human flourishing 
              is not accidental but designed. This is the reference point for everything 
              else on the site.
            </p>

            <div className="flex items-center justify-between border-t border-amber-200 dark:border-amber-800 pt-4">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Foundational Text · Limited Release
              </span>
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 transition-colors group-hover:text-amber-500">
                <span className="font-semibold">Open Prelude</span>
                <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">
                  ↠
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Link>
);

// -----------------------------------------------------------------------------
// DATA FETCHING
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const publishedPosts = getPublishedPosts();
  const allBooks = getAllBooks().filter((b) => !(b as any).draft);
  const publishedShorts = getPublishedShorts();

  return {
    props: {
      latestPosts: publishedPosts.slice(0, 3),
      featuredBooks: allBooks.slice(0, 2),
      latestShorts: publishedShorts.slice(0, 3),
    },
  };
};

// -----------------------------------------------------------------------------
// PAGE COMPONENT
// -----------------------------------------------------------------------------

const HomePage: NextPage<HomePageProps> = ({ latestPosts, featuredBooks, latestShorts }) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const siteTitle = "Abraham of London";
  const siteTagline = "Canon, ventures, and structural tools for fathers, founders, and builders of legacy.";

  return (
    <Layout
      title={siteTitle}
      description={siteTagline}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteTitle,
        description: siteTagline,
        url: siteUrl,
      }}
    >
      <Head>
        <title>{siteTitle} | Structural Thinking for Builders of Legacy</title>
        <meta name="description" content={siteTagline} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteTagline} />
        <meta property="og:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteTagline} />
        <meta name="twitter:image" content={`${siteUrl}/assets/images/social/twitter-image.jpg`} />
        <meta name="theme-color" content="#ffffff" />
        <link rel="canonical" href={siteUrl} />
      </Head>

      {/* HERO */}
      <section className="relative min-h-[90vh] overflow-hidden bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 dark:border-amber-700 dark:bg-amber-900/20">
                <div className="text-lg text-amber-600 dark:text-amber-400">𓆓</div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                  Library of Applied Wisdom
                </span>
              </div>

              <h1 className="mb-4 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Abraham of London
                <span className="mt-4 block text-xl font-normal text-gray-700 dark:text-gray-300 lg:text-2xl">
                  Structural thinking for fathers, founders,
                  <br className="hidden sm:block" />
                  and builders of legacy.
                </span>
              </h1>

              <p className="mb-8 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                For men who carry responsibility for a family, a company, or a
                community — this is where faith, history, and strategy are
                turned into operating systems, not slogans.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/canon"
                  className="group inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-gray-900 to-black px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                >
                  <span>Enter the Canon</span>
                  <span className="transition-transform group-hover:translate-x-1">↠</span>
                </Link>
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all hover:scale-105 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                >
                  <span>Work with Abraham</span>
                  <span className="transition-transform hover:translate-x-1">→</span>
                </Link>
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-gray-500 dark:text-gray-400">
                Essays · Canon Volumes · Execution Tools · Inner Circle
              </p>
            </div>

            <div className="relative lg:col-span-2">
              <div className="overflow-hidden rounded-2xl border border-gray-300 shadow-2xl dark:border-gray-700">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
                </div>
                <div className="border-t border-gray-200 bg-gradient-to-r from-white to-gray-50 p-5 text-center dark:border-gray-700 dark:from-gray-800 dark:to-gray-900">
                  <p className="font-medium text-gray-700 dark:text-gray-200">
                    Built for men who refuse to outsource responsibility — to
                    the state, the culture, or the algorithm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="border-y border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* CANON SPOTLIGHT */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-16 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 dark:border-amber-700 dark:bg-amber-900/20">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Entry into the Canon
              </span>
            </div>
            <h2 className="mb-4 font-serif text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
              Start with the Prelude &amp; the three doorways
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-300">
              The Canon opens through a limited-release Prelude and three entry
              pieces. Together they frame purpose, destiny, and resilience the
              way serious men actually live them.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1.3fr]">
            <CanonPrimaryCard />

            <div className="space-y-4">
              <CanonEntryCard
                type="catechism"
                title="The Ultimate Purpose of Man"
                subtitle="A catechism-style walkthrough of why we exist — anchored in Scripture, stripped of sentimentality."
                href="/ultimate-purpose-of-man"
                imageSrc="/assets/images/books/the-architecture-of-human-purpose.jpg"
              />
              <CanonEntryCard
                type="campaign"
                title="Foundations of Purpose · Volume I"
                subtitle="The first movement in the Canon — building a scaffold for multi-generational, covenant-level thinking."
                href="/canon/volume-i-foundations-of-purpose"
                imageSrc="/assets/images/books/the-architecture-of-human-purpose.jpg"
              />
              <CanonEntryCard
                type="letter"
                title="When the Storm Finds You"
                subtitle="A field letter for the man blindsided by loss, delay, and institutional injustice — and still required to stand."
                href="/when-the-storm-finds-you"
                imageSrc="/assets/images/writing-desk.webp"
              />
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* SHORTS */}
      <section className="bg-gray-50 py-12 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              Shorts · Outer Court
            </p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-gray-900 dark:text-white">
                  For when you&apos;re too tired for long form
                </h2>
                <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">
                  High-protein reflections in under five minutes.
                </p>
              </div>
              <Link
                href="/shorts"
                className="text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-amber-300"
              >
                Browse all Shorts →
              </Link>
            </div>
          </div>

          {latestShorts.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {latestShorts.map((short) => (
                <ShortCard key={short._id} short={short} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              Shorts are being prepared.
            </p>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* LATEST ESSAYS */}
      <section className="bg-white py-12 dark:bg-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              Latest Essays
            </p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-gray-900 dark:text-white">
                  From the Canon in motion
                </h2>
                <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">
                  Long-form essays for builders who prefer structure over hype.
                </p>
              </div>
              <Link
                href="/blog"
                className="text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-amber-300"
              >
                View all essays →
              </Link>
            </div>
          </div>

          {latestPosts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <BlogPostCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No essays published yet.
            </p>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* BOOKS */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              Canon &amp; Narrative
            </p>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-3xl font-semibold text-gray-900 dark:text-white">
                  Books in active development
                </h2>
                <p className="mt-2 max-w-xl text-gray-600 dark:text-gray-300">
                  Theology, strategy, and story in one spine.
                </p>
              </div>
              <Link
                href="/books"
                className="text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-amber-300"
              >
                View all books →
              </Link>
            </div>
          </div>

          {featuredBooks.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {featuredBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">
              No books registered yet.
            </p>
          )}
        </div>
      </section>

      {/* ACCESSIBILITY */}
      <style jsx global>{`
        @media (max-width: 768px) {
          input, textarea, select {
            font-size: 16px;
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        html {
          scroll-behavior: smooth;
        }
      `}</style>
    </Layout>
  );
};

export default HomePage;