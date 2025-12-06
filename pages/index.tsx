// pages/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import {
  getPublicPosts,
  getPublicBooks,
  getPublicDownloads,
  getFeaturedCanon,
  type Post,
  type Book,
  type Download,
  type Canon,
} from "@/lib/content";
import {
  BlogPostCard,
  BookCard,
  BaseCard,
} from "@/components/Cards";

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

type HomePageProps = {
  featuredPost: Post | null;
  latestPosts: Post[];
  featuredBooks: Book[];
  featuredDownloads: Download[];
  canonPrimary: Canon | null;
  canonSecondary: Canon[];
};

type CanonEntryType = "catechism" | "campaign" | "letter";

type CanonEntryProps = {
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  type: CanonEntryType;
};

/* -------------------------------------------------------------------------- */
/* Data helpers                                                               */
/* -------------------------------------------------------------------------- */

function safeSortByDate<T extends { date?: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return db - da;
  });
}

function mapCanonToEntryProps(
  canon: Canon,
  fallbackType: CanonEntryType,
): CanonEntryProps {
  const anyCanon = canon as any;

  const entryType: CanonEntryType =
    anyCanon.entryType && ["catechism", "campaign", "letter"].includes(anyCanon.entryType)
      ? anyCanon.entryType
      : fallbackType;

  return {
    title: canon.title,
    subtitle:
      anyCanon.subtitle ||
      canon.excerpt ||
      canon.description ||
      "Entry from the Abraham of London Canon.",
    href: `/canon/${canon.slug}`,
    imageSrc:
      anyCanon.coverImage ||
      "/assets/images/books/the-architecture-of-human-purpose.jpg",
    type: entryType,
  };
}

/* -------------------------------------------------------------------------- */
/* Canon Cards                                                                */
/* -------------------------------------------------------------------------- */

const canonEntryColors: Record<
  CanonEntryType,
  { bg: string; text: string; border: string; accent: string }
> = {
  catechism: {
    bg: "bg-blue-50 dark:bg-blue-900/10",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-800/40",
    accent: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  campaign: {
    bg: "bg-emerald-50 dark:bg-emerald-900/10",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-800/40",
    accent: "bg-gradient-to-r from-emerald-500 to-emerald-600",
  },
  letter: {
    bg: "bg-purple-50 dark:bg-purple-900/10",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-800/40",
    accent: "bg-gradient-to-r from-purple-500 to-purple-600",
  },
};

const CanonEntryCard: React.FC<CanonEntryProps> = ({
  title,
  subtitle,
  href,
  imageSrc,
  type,
}) => {
  const colors = canonEntryColors[type];

  return (
    <Link href={href} className="group block h-full">
      <article
        className={[
          "flex h-full items-center gap-4 rounded-2xl border-2 p-4 transition-all",
          "hover:-translate-y-0.5 hover:shadow-xl",
          colors.bg,
          colors.border,
        ].join(" ")}
      >
        <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-md border border-gray-200/70 dark:border-gray-700/70">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="80px"
            className="object-cover object-center"
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="font-serif text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h4>
            <span
              className={[
                "rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider",
                colors.text,
              ].join(" ")}
            >
              {type === "catechism"
                ? "Q&A"
                : type === "campaign"
                ? "Strategy"
                : "Personal"}
            </span>
          </div>
          <p className="mb-2 text-xs text-gray-700 dark:text-gray-300">
            {subtitle}
          </p>
          <div
            className={[
              "inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white",
              colors.accent,
            ].join(" ")}
          >
            <span>Canon Entry</span>
            <span className="transition-transform group-hover:translate-x-1">
              ↠
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

type CanonPrimaryCardProps = {
  canon: Canon | null;
};

const CanonPrimaryCard: React.FC<CanonPrimaryCardProps> = ({ canon }) => {
  const anyCanon = canon as any;

  const slug = canon ? canon.slug : "the-architecture-of-human-purpose";
  const href = canon
    ? `/canon/${slug}`
    : "/books/the-architecture-of-human-purpose";

  const title = canon ? canon.title : "The Architecture of Human Purpose";
  const subtitle =
    anyCanon?.subtitle ||
    canon?.description ||
    canon?.excerpt ||
    "Prelude MiniBook — foundations of purpose, governance, and human destiny.";

  const coverImage =
    anyCanon?.coverImage ||
    "/assets/images/books/the-architecture-of-human-purpose.jpg";

  const volumeLabel =
    anyCanon?.volumeLabel || "Volume I · Prelude (Limited Release)";
  const categoryLabel =
    anyCanon?.categoryLabel || "Canon · Foundations of Purpose";

  return (
    <Link href={href} className="group block h-full">
      <article
        className={[
          "relative flex h-full flex-col overflow-hidden rounded-3xl",
          "border border-softGold/15 bg-gradient-to-br",
          "from-charcoal via-black to-softBlack",
          "shadow-2xl transition-all duration-500",
          "hover:-translate-y-1 hover:shadow-3xl hover:shadow-softGold/20",
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -inset-32 bg-[radial-gradient(circle_at_top,_rgba(233,200,130,0.12),_transparent_60%)]" />
          <div className="absolute left-10 top-0 h-full w-px bg-gradient-to-b from-softGold/50 via-transparent to-transparent" />
          <div className="absolute right-16 bottom-0 h-full w-px bg-gradient-to-t from-softGold/40 via-transparent to-transparent" />
        </div>

        <div className="relative grid gap-8 p-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:p-10">
          {/* Book cover */}
          <div className="relative flex items-center justify-center">
            <div className="relative aspect-[3/4] w-full max-w-sm rounded-2xl bg-gradient-to-br from-softGold/15 via-black to-charcoal shadow-[0_25px_60px_rgba(0,0,0,0.85)]">
              <div className="absolute inset-[6%] overflow-hidden rounded-xl border border-softGold/25 bg-black">
                <Image
                  src={coverImage}
                  alt={title}
                  fill
                  sizes="(max-width: 768px) 80vw, 40vw"
                  className="object-contain"
                  priority
                />
              </div>
              <div className="pointer-events-none absolute left-0 top-8 h-[72%] w-1 rounded-full bg-gradient-to-b from-softGold/40 via-transparent to-transparent" />
            </div>
          </div>

          {/* Copy */}
          <div className="flex flex-col justify-center">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-softGold/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-softGold">
                Entry into the Canon
              </span>
              <span className="rounded-full border border-softGold/30 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
                {volumeLabel}
              </span>
            </div>

            <h3 className="mb-3 font-serif text-2xl font-light text-ivory md:text-3xl lg:text-4xl">
              {title}
            </h3>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-softGold/80">
              {categoryLabel}
            </p>

            <p className="mb-6 text-sm leading-relaxed text-ivory/75 md:text-[0.95rem]">
              {subtitle}
            </p>

            <div className="mt-auto flex items-center justify-between border-t border-softGold/15 pt-4">
              <span className="text-[0.7rem] font-medium uppercase tracking-[0.22em] text-ivory/55">
                Foundational Text · {canon ? "Canon Entry" : "Prelude · Limited Release"}
              </span>
              <div className="flex items-center gap-2 text-softGold transition-all group-hover:gap-3 group-hover:text-softGold/80">
                <span className="text-sm font-semibold">
                  {canon ? "Enter Canon" : "Open Prelude"}
                </span>
                <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">
                  ↠
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* Stats strip                                                                */
/* -------------------------------------------------------------------------- */

const StatPill: React.FC<{
  label: string;
  value: number;
  helper?: string;
}> = ({ label, value, helper }) => (
  <div className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-gray-200 backdrop-blur-sm sm:px-5">
    <div className="flex items-baseline gap-2">
      <span className="font-serif text-2xl font-normal text-softGold">
        {value}
      </span>
      <span className="text-[0.7rem] uppercase tracking-[0.22em] text-gray-400">
        {label}
      </span>
    </div>
    {helper && (
      <p className="mt-1 text-xs text-gray-400">
        {helper}
      </p>
    )}
  </div>
);

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

const HomePage: NextPage<HomePageProps> = ({
  featuredPost,
  latestPosts,
  featuredBooks,
  featuredDownloads,
  canonPrimary,
  canonSecondary,
}) => {
  const siteTitle = "Abraham of London";
  const siteDescription =
    "Structural thinking for fathers, founders, and builders of legacy.";

  return (
    <Layout title={siteTitle} description={siteDescription}>
      {/* HERO – tall, bold, image-dominant, text-wrapped */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-slate-950 to-charcoal">
        <div className="pointer-events-none absolute inset-0 opacity-60">
          <div className="absolute -inset-40 bg-[radial-gradient(circle_at_top,_rgba(233,200,130,0.16),_transparent_60%)]" />
          <div className="absolute inset-y-0 left-10 w-px bg-gradient-to-b from-softGold/70 via-transparent to-transparent" />
          <div className="absolute inset-y-0 right-24 w-px bg-gradient-to-t from-softGold/60 via-transparent to-transparent" />
        </div>

        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col gap-12 px-4 pb-16 pt-20 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:pb-24 lg:pt-24">
          {/* Left column: text wrapping the hero visual */}
          <div className="relative z-10 flex-1 space-y-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-softGold/40 bg-softGold/10 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-softGold">
              Canon · Strategy · Fatherhood
            </p>

            <h1 className="font-serif text-4xl font-normal leading-tight text-cream sm:text-5xl lg:text-[3.1rem]">
              Structural thinking for{" "}
              <span className="text-softGold">fathers</span>,{" "}
              <span className="text-softGold">founders</span>, and{" "}
              <span className="text-softGold">builders of legacy</span>.
            </h1>

            <p className="max-w-xl text-sm leading-relaxed text-gray-200 sm:text-[0.95rem]">
              Not motivational noise. Not abstract theology. A canon of
              lived strategy — purpose, governance, and multi-generational
              stewardship — for those who intend to carry weight in history,
              not just comment on it.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href="/canon"
                className="inline-flex items-center gap-2 rounded-full bg-softGold px-5 py-2.5 text-sm font-semibold text-black shadow-[0_12px_30px_rgba(226,197,120,0.35)] transition-transform hover:-translate-y-0.5"
              >
                Enter the Canon
                <span className="text-lg">↠</span>
              </Link>
              <Link
                href="/content"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-semibold text-cream transition hover:border-softGold/50 hover:bg-white/10"
              >
                Browse the Library
              </Link>
            </div>

            <div className="pt-6">
              <div className="inline-flex flex-wrap gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-gray-400">
                <span>Essays</span>
                <span className="h-px w-6 bg-gray-600" />
                <span>Volumes</span>
                <span className="h-px w-6 bg-gray-600" />
                <span>Tools & Covenants</span>
              </div>
            </div>
          </div>

          {/* Right column: tall hero banner / stacked visual */}
          <div className="relative z-10 flex-1">
            <div className="relative mx-auto h-[420px] max-w-sm">
              {/* Base panel */}
              <div className="absolute inset-0 rounded-3xl border border-softGold/20 bg-gradient-to-br from-black/80 via-slate-950 to-black/90 shadow-[0_26px_80px_rgba(0,0,0,0.9)]" />
              {/* Book / canon preview image */}
              <div className="absolute inset-x-6 top-6 bottom-20 rounded-2xl border border-softGold/25 bg-black/80">
                <Image
                  src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                  alt="The Architecture of Human Purpose"
                  fill
                  sizes="(max-width: 768px) 80vw, 28vw"
                  className="object-contain"
                  priority
                />
              </div>
              {/* Lower stat band */}
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-xs text-gray-200 backdrop-blur-md">
                <div className="flex flex-col">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-softGold/90">
                    Prelude · Volume I
                  </span>
                  <span className="text-[0.75rem] text-gray-300">
                    The Architecture of Human Purpose
                  </span>
                </div>
                <Link
                  href="/books/the-architecture-of-human-purpose"
                  className="inline-flex items-center gap-1 rounded-full border border-softGold/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-softGold hover:bg-softGold/10"
                >
                  Open
                  <span className="text-sm">↠</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS STRIP – compact, grown-up */}
      <section className="border-b border-white/10 bg-black/70">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="max-w-md text-xs text-gray-300">
            <p className="font-semibold uppercase tracking-[0.22em] text-softGold/80">
              The Canon as Operating System
            </p>
            <p className="mt-1 text-[0.8rem] text-gray-400">
              Essays for diagnosis, volumes for depth, tools for execution.
              All anchored in a coherent view of God, man, and history.
            </p>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 sm:max-w-md sm:grid-cols-4">
            <StatPill label="Essays" value={latestPosts.length + (featuredPost ? 1 : 0)} helper="First-principles analysis" />
            <StatPill label="Volumes" value={featuredBooks.length} helper="Curated long-form" />
            <StatPill label="Tools" value={featuredDownloads.length} helper="Execution frameworks" />
            <StatPill label="Canon" value={1 + canonSecondary.length} helper="Core structural texts" />
          </div>
        </div>
      </section>

      {/* FEATURED ESSAY SECTION (if available) */}
      {featuredPost && (
        <section className="border-b border-white/5 bg-gradient-to-b from-charcoal via-black to-slate-950">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:py-16">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
                  Featured Essay
                </p>
                <h2 className="mt-1 font-serif text-2xl font-normal text-cream sm:text-3xl">
                  Strategic essay currently at the front of the queue
                </h2>
              </div>
              <Link
                href="/content"
                className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 hover:text-softGold"
              >
                View all essays ↠
              </Link>
            </div>

            <BlogPostCard
              slug={featuredPost.slug}
              title={featuredPost.title}
              subtitle={(featuredPost as any).subtitle ?? null}
              excerpt={featuredPost.excerpt ?? null}
              description={featuredPost.description ?? null}
              coverImage={featuredPost.coverImage ?? null}
              date={featuredPost.date ?? null}
              author={(featuredPost as any).author ?? "Abraham of London"}
              tags={featuredPost.tags ?? []}
              featured={true}
              readTime={(featuredPost as any).readTime ?? null}
              category={(featuredPost as any).category ?? "Strategic Essay"}
              href={`/${featuredPost.slug}`}
              className="mt-2"
            />
          </div>
        </section>
      )}

      {/* CANON SPOTLIGHT – wired to featured canon, 1 + 3 balanced items */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/40 dark:bg-amber-900/10">
              <div className="h-1 w-5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
              <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                Entry into the Canon
              </span>
            </div>
            <h2 className="mb-3 font-serif text-3xl font-semibold text-gray-900 dark:text-white sm:text-4xl">
              Begin with the Prelude and the opening Canon entries
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-gray-600 dark:text-gray-300 sm:text-[0.95rem]">
              The Canon doesn’t start with abstract theory. It begins with a
              Prelude and a handful of entry pieces that frame purpose,
              governance, and fatherhood as one continuous assignment.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
            {/* Primary Canon spotlight */}
            <CanonPrimaryCard canon={canonPrimary} />

            {/* Side Canon entries */}
            <div className="flex flex-col gap-4">
              {canonSecondary.length === 0 && (
                <div className="rounded-2xl border border-dashed border-amber-300/60 bg-amber-50/60 p-4 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-900/10 dark:text-amber-100">
                  Additional Canon entries are being catalogued. As volumes and
                  catechisms go live, they will surface here automatically.
                </div>
              )}

              {canonSecondary.map((canon, idx) => {
                const defaultType: CanonEntryType =
                  idx === 0 ? "catechism" : idx === 1 ? "campaign" : "letter";

                const props = mapCanonToEntryProps(canon, defaultType);
                return <CanonEntryCard key={canon.slug} {...props} />;
              })}
            </div>
          </div>
        </div>
      </section>

      {/* BOOKS & TOOLS ROW – compact, grown-up grid */}
      <section className="border-t border-white/10 bg-black/90 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-softGold/80">
                Volumes & Execution Tools
              </p>
              <h2 className="mt-1 font-serif text-2xl font-normal text-cream sm:text-3xl">
                Read deeply. Then implement ruthlessly.
              </h2>
            </div>
            <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-gray-400">
              <Link
                href="/books"
                className="hover:text-softGold"
              >
                All volumes ↠
              </Link>
              <span className="h-px w-6 bg-gray-700" />
              <Link
                href="/downloads"
                className="hover:text-softGold"
              >
                All tools ↠
              </Link>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)]">
            {/* Books */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                Canon Volumes
              </h3>
              {featuredBooks.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Volumes are being prepared for release.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {featuredBooks.map((book) => (
                    <BookCard
                      key={book.slug}
                      slug={book.slug}
                      title={book.title}
                      subtitle={(book as any).subtitle ?? null}
                      author={(book as any).author ?? "Abraham of London"}
                      excerpt={book.excerpt ?? null}
                      description={book.description ?? null}
                      coverImage={book.coverImage ?? null}
                      publishDate={book.date ?? null}
                      isbn={(book as any).isbn ?? null}
                      tags={book.tags ?? []}
                      featured={book.featured ?? false}
                      href={`/books/${book.slug}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tools / Downloads */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-400">
                Execution Tools & Frameworks
              </h3>
              {featuredDownloads.length === 0 ? (
                <p className="text-xs text-gray-500">
                  Tools and frameworks will appear here as they are published.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {featuredDownloads.map((dl) => (
                    <BaseCard
                      key={dl.slug}
                      slug={dl.slug}
                      title={dl.title}
                      subtitle={(dl as any).subtitle ?? null}
                      excerpt={dl.excerpt ?? null}
                      description={dl.description ?? null}
                      coverImage={dl.coverImage ?? null}
                      date={dl.date ?? null}
                      tags={dl.tags ?? []}
                      featured={dl.featured ?? false}
                      category={(dl as any).category ?? "Execution Tool"}
                      readingTime={(dl as any).readTime ?? null}
                      href={`/downloads/${dl.slug}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* LATEST ESSAYS STRIP (non-featured) */}
      {latestPosts.length > 0 && (
        <section className="border-t border-white/5 bg-charcoal py-14">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-serif text-2xl font-normal text-cream sm:text-3xl">
                Latest essays in circulation
              </h2>
              <Link
                href="/content"
                className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-400 hover:text-softGold"
              >
                Open content library ↠
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {latestPosts.map((post) => (
                <BlogPostCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  subtitle={(post as any).subtitle ?? null}
                  excerpt={post.excerpt ?? null}
                  description={post.description ?? null}
                  coverImage={post.coverImage ?? null}
                  date={post.date ?? null}
                  author={(post as any).author ?? "Abraham of London"}
                  tags={post.tags ?? []}
                  featured={false}
                  readTime={(post as any).readTime ?? null}
                  category={(post as any).category ?? "Strategic Essay"}
                  href={`/${post.slug}`}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* getStaticProps                                                             */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Posts
  const allPosts = safeSortByDate(getPublicPosts());
  const featuredPost = allPosts[0] ?? null;
  const latestPosts = allPosts.slice(1, 4);

  // Books
  const allBooks = safeSortByDate(getPublicBooks());
  const featuredBooks = allBooks.slice(0, 3);

  // Downloads / tools
  const allDownloads = safeSortByDate(getPublicDownloads());
  const featuredDownloads = allDownloads.slice(0, 3);

  // Canon spotlight
  const featuredCanon = getFeaturedCanon(4);
  const [primary, ...rest] = featuredCanon;
  const canonPrimary = primary ?? null;
  const canonSecondary = rest.slice(0, 3);

  return {
    props: {
      featuredPost,
      latestPosts,
      featuredBooks,
      featuredDownloads,
      canonPrimary,
      canonSecondary,
    },
    revalidate: 3600,
  };
};

export default HomePage;