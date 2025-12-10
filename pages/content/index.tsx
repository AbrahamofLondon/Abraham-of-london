// pages/index.tsx – MASTER HOMEPAGE (Canon spine + Ventures)

import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage, GetStaticProps } from "next";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import { BookCard, BlogPostCard } from "@/components/Cards";
import ShortCard from "@/components/ShortCard";

import VenturesSection from "@/components/homepage/VenturesSection";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import StatsBar from "@/components/homepage/StatsBar";
import AboutSection from "@/components/homepage/AboutSection";

import {
  getPublishedPosts,
  getAllBooks,
  getPublishedShorts,
} from "@/lib/contentlayer-helper";

import type { Post, Book, Short } from "contentlayer/generated";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

// -----------------------------------------------------------------------------
// Section divider
// -----------------------------------------------------------------------------

const SectionDivider: React.FC = () => (
  <div className="relative h-12 overflow-hidden md:h-16">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700 md:w-32" />
      <div className="mx-4 flex items-center gap-2 md:mx-6">
        <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 md:h-2 md:w-2" />
        <div className="h-1 w-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
        <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 md:h-2 md:w-2" />
      </div>
      <div className="h-px w-16 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700 md:w-32" />
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// Canon entry cards
// -----------------------------------------------------------------------------

type CanonEntryType = "catechism" | "campaign" | "letter";

const canonEntryColors: Record<
  CanonEntryType,
  { bg: string; text: string; border: string; badge: string }
> = {
  catechism: {
    bg: "bg-blue-50 dark:bg-blue-900/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/40",
    badge: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  campaign: {
    bg: "bg-emerald-50 dark:bg-emerald-900/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/40",
    badge: "bg-gradient-to-r from-emerald-500 to-emerald-600",
  },
  letter: {
    bg: "bg-purple-50 dark:bg-purple-900/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800/40",
    badge: "bg-gradient-to-r from-purple-500 to-purple-600",
  },
};

type CanonEntryProps = {
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  type: CanonEntryType;
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
    <Link href={href} className="group block">
      <article
        className={`flex items-center gap-3 rounded-xl border ${colors.border} ${colors.bg} p-3 transition-all hover:-translate-y-0.5 hover:shadow-lg md:gap-4 md:rounded-2xl md:p-4`}
      >
        <div className="relative h-16 w-12 overflow-hidden rounded border border-gray-200/60 bg-white/60 dark:border-gray-700/70 dark:bg-gray-900/40 md:h-20 md:w-14">
          <div className="relative h-full w-full">
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="(max-width: 768px) 60px, 80px"
              className="object-cover object-center"
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="truncate font-serif text-sm font-semibold text-gray-900 dark:text-white md:text-base">
              {title}
            </h4>
            <span
              className={`whitespace-nowrap rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.18em] ${colors.text}`}
            >
              {type === "catechism"
                ? "Q&A"
                : type === "campaign"
                ? "Strategy"
                : "Field Letter"}
            </span>
          </div>
          <p className="mb-2 line-clamp-2 text-xs text-gray-700 dark:text-gray-300 md:text-sm">
            {subtitle}
          </p>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-white ${colors.badge} md:px-3 md:py-1 md:text-[0.7rem]`}
          >
            Canon Entry
          </div>
        </div>

        <div
          className={`${colors.text} flex-shrink-0 opacity-70 transition-transform group-hover:translate-x-1 md:group-hover:translate-x-2`}
        >
          →
        </div>
      </article>
    </Link>
  );
};

// -----------------------------------------------------------------------------
// Canon primary card – SSR safe
// -----------------------------------------------------------------------------

const CanonPrimaryCard: React.FC = () => {
  return (
    <Link
      href="/books/the-architecture-of-human-purpose"
      className="group block h-full"
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-[#FDF9F1] to-gray-50 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-amber-900/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="p-4 md:p-6 lg:p-8">
          {/* Mobile layout */}
          <div className="block space-y-4 md:hidden">
            <div className="flex items-center justify-center">
              <div className="relative aspect-[3/4] w-40 rounded-xl bg-gradient-to-br from-amber-500/10 via-transparent to-gray-200 dark:from-amber-500/5 dark:to-gray-800 sm:w-48">
                <div className="absolute inset-[4%] overflow-hidden rounded-lg border border-amber-200/80 dark:border-amber-800/60">
                  <Image
                    src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                    alt="The Architecture of Human Purpose — Prelude MiniBook"
                    fill
                    sizes="(max-width: 768px) 80vw"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Entry into the Canon
                </span>
                <span className="rounded-full border border-amber-300/80 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:border-amber-800/70 dark:text-amber-300/80">
                  Volume I · Prelude
                </span>
              </div>

              <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">
                The Architecture of Human Purpose
              </h3>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-300/80">
                Canon · Foundations of Purpose
              </p>

              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                A distilled prelude to the Canon — for men who know human
                flourishing is designed, not accidental.
              </p>

              <div className="flex items-center justify-between border-t border-amber-200/80 pt-3 dark:border-amber-900/40">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Foundational Text
                </span>
                <div className="flex items-center gap-1 text-amber-700 dark:text-amber-300">
                  <span className="text-sm font-semibold">Open Prelude</span>
                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                    ↠
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop layout */}
          <div className="hidden grid-cols-1 gap-6 md:grid md:grid-cols-2">
            <div className="relative flex items-center justify-center">
              <div className="relative aspect-[3/4] w-full max-w-sm rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-gray-200 dark:from-amber-500/5 dark:to-gray-800">
                <div className="absolute inset-[5%] overflow-hidden rounded-xl border border-amber-200/80 dark:border-amber-800/70">
                  <Image
                    src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                    alt="The Architecture of Human Purpose — Prelude MiniBook"
                    fill
                    sizes="(max-width: 768px) 90vw, 40vw"
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center space-y-4 md:space-y-6">
              <div className="flex flex-wrap items-center gap-2 md:gap-3">
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                  Entry into the Canon
                </span>
                <span className="rounded-full border border-amber-300/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:border-amber-800/70 dark:text-amber-300/80">
                  Volume I · Prelude
                </span>
              </div>

              <h3 className="font-serif text-2xl font-light text-gray-900 dark:text-white md:text-3xl">
                The Architecture of Human Purpose
              </h3>

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700/80 dark:text-amber-300/80 md:text-sm">
                Canon · Foundations of Purpose
              </p>

              <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 md:text-base">
                A high-level prelude to the Canon — written for men who know
                that families, companies, and nations are built by design, not
                by accident. This is the reference point for everything else on
                the site.
              </p>

              <div className="flex items-center justify-between border-t border-amber-200/80 pt-4 dark:border-amber-900/40">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                  Foundational Text · Limited Release
                </span>
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                  <span className="text-sm font-semibold">Open Prelude</span>
                  <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">
                    ↠
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

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
    // eslint-disable-next-line no-console
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
// Page component
// -----------------------------------------------------------------------------

const HomePage: NextPage<HomePageProps> = ({
  latestPosts = [],
  featuredBooks = [],
  latestShorts = [],
}) => {
  const siteTitle = "Abraham of London";
  const siteTagline =
    "Canon, ventures, and structural tools for fathers, founders, and builders of legacy.";

  const safeLatestPosts = Array.isArray(latestPosts) ? latestPosts : [];
  const safeFeaturedBooks = Array.isArray(featuredBooks)
    ? featuredBooks
    : [];
  const safeLatestShorts = Array.isArray(latestShorts)
    ? latestShorts
    : [];

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
        publisher: {
          "@type": "Person",
          name: "Abraham of London",
        },
      }}
    >
      <Head>
        <title>
          {siteTitle} | Structural Thinking for Builders of Legacy
        </title>
        <meta name="description" content={siteTagline} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteTagline} />
        <meta
          property="og:image"
          content={`${siteUrl}/assets/images/social/og-image.jpg`}
        />
        <meta property="og:url" content={siteUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={siteTitle} />
        <meta name="twitter:description" content={siteTagline} />
        <meta
          name="twitter:image"
          content={`${siteUrl}/assets/images/social/twitter-image.jpg`}
        />
        <meta name="theme-color" content="#050608" />
      </Head>

      {/* HERO – Canon spine + ventures narrative */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050608] via-[#0B0C10] to-[#050608]">
        <div className="absolute inset-0">
          <div className="pointer-events-none absolute -top-40 -right-32 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl sm:h-80 sm:w-80" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-64 w-64 rounded-full bg-emerald-500/12 blur-3xl sm:h-80 sm:w-80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-16">
            {/* Left – philosophy & CTAs */}
            <div className="max-w-xl lg:col-span-3 xl:col-span-2">
              <div className="mb-7">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 sm:px-4 sm:py-2">
                  <span className="text-base text-amber-400">𓆓</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-200">
                    Library of Applied Wisdom
                  </span>
                </div>

                <h1 className="mb-4 font-serif text-3xl font-semibold leading-tight text-[#F5F1E8] sm:text-4xl lg:text-5xl xl:text-6xl">
                  Abraham of London
                  <span className="mt-3 block text-lg font-normal text-amber-100/90 sm:text-xl lg:text-2xl">
                    Structural thinking for fathers, founders,
                    <br className="hidden sm:block" />
                    and builders of legacy.
                  </span>
                </h1>

                <p className="mb-8 text-sm leading-relaxed text-gray-200 sm:text-base">
                  For men who carry responsibility for a family, a company, or a
                  community — this is where faith, history, and strategy are
                  turned into operating systems, not slogans.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  href="/canon"
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-900/40 transition-all hover:scale-105 hover:shadow-xl active:scale-95"
                >
                  <span>Enter the Canon</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    ↠
                  </span>
                </Link>
                <Link
                  href="/consulting"
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-400/50 bg-transparent px-6 py-2.5 text-sm font-semibold text-amber-100 transition-all hover:scale-105 hover:bg-amber-500/10 active:scale-95"
                >
                  <span>Strategic work with Abraham</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              <p className="mt-5 text-[0.7rem] uppercase tracking-[0.22em] text-gray-400">
                Canon · Essays · Field Letters · Tools · Inner Circle
              </p>
            </div>

            {/* Right – hero banner */}
            <div className="relative lg:col-span-2 xl:col-span-3">
              <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black/60 shadow-2xl">
                <div className="relative aspect-video w-full">
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London — Canon, ventures, and structural tools for builders of legacy"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                </div>
                <div className="border-t border-white/10 bg-gradient-to-r from-black/90 via-black/80 to-black/90 px-4 py-4 text-center sm:px-5">
                  <p className="text-xs font-medium text-gray-200 sm:text-sm">
                    The Canon is the philosophical spine. The ventures are the
                    working arms. Together they exist to build men, families,
                    and institutions that outlast headlines.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* CANON SPOTLIGHT */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-12 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                Canon · Foundational Spine
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                Philosophy first. Then practice.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                A multi-volume Canon that frames purpose, governance, and
                civilisation — and then translates it into standards for
                households, boards, and ventures.
              </p>
            </div>

            <Link
              href="/canon"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
            >
              Browse Canon Index ↗
            </Link>
          </header>

          <div className="grid gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Primary Canon book */}
            <div className="lg:col-span-2">
              <CanonPrimaryCard />
            </div>

            {/* Key entries – catechism, campaign, letter */}
            <div className="space-y-4">
              <CanonEntryCard
                type="catechism"
                title="The Builders’ Catechism"
                subtitle="Twelve core questions every serious man must settle about purpose, power, and responsibility."
                href="/books/the-builders-catechism"
                imageSrc="/assets/images/books/the-builders-catechism.jpg"
              />
              <CanonEntryCard
                type="campaign"
                title="Canon Campaign"
                subtitle="A long-term movement to rebuild standards for leadership, fatherhood, and institutional design."
                href="/resources/canon-campaign"
                imageSrc="/assets/images/books/the-architecture-of-human-purpose.jpg"
              />
              <CanonEntryCard
                type="letter"
                title="Fathering Without Fear"
                subtitle="A field letter from the front-lines of fatherhood, justice, and stubborn hope."
                href="/books/fathering-without-fear"
                imageSrc="/assets/images/books/fathering-without-fear.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* VENTURES – working arms */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700 dark:text-emerald-400">
                Ventures · Working Arms
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                Where the ideas go to work.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                Advisory, ventures, and platforms built to turn the Canon’s
                principles into client outcomes, operating systems, and
                multi-generational assets.
              </p>
            </div>

            <Link
              href="/ventures"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-300"
            >
              View all ventures →
            </Link>
          </header>

          <VenturesSection />
        </div>
      </section>

      {/* STRATEGIC FUNNEL – sessions, salons, rooms */}
      <section className="border-y border-gray-200/70 bg-gradient-to-r from-gray-900 via-black to-gray-900 py-10 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                Strategic Sessions · Professional Work
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-cream sm:text-3xl">
                Private rooms for serious builders.
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-gray-300">
                From Chatham-style rooms in London to founder strategy days and
                fatherhood councils — structured conversations with outcomes,
                not theatre.
              </p>
            </div>

            <Link
              href="/consulting"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300 underline-offset-4 hover:underline"
            >
              Explore strategic work →
            </Link>
          </header>

          <StrategicFunnelStrip />
        </div>
      </section>

      <SectionDivider />

      {/* LATEST SHORTS */}
      {safeLatestShorts.length > 0 && (
        <section className="bg-white py-10 dark:bg-gray-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                  Shorts · Diagnostic Signals
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                  When something in your world feels off.
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                  Brief field notes for the moments when your calendar, faith,
                  or metrics look impressive — but something in your spirit
                  knows better.
                </p>
              </div>

              <Link
                href="/shorts"
                className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 underline-offset-4 hover:underline dark:text-gray-200"
              >
                Browse all shorts →
              </Link>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              {safeLatestShorts.map((short) => (
                <ShortCard key={short.slug} short={short} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* LATEST POSTS + BOOKS */}
      {(safeLatestPosts.length > 0 || safeFeaturedBooks.length > 0) && (
        <section className="bg-gradient-to-b from-gray-50 to-white py-12 dark:from-gray-950 dark:to-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
            {/* Posts */}
            {safeLatestPosts.length > 0 && (
              <div>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                      Field Notes · Essays
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                      Commentary from the front-lines.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                      Essays and dispatches on purpose, institution-building,
                      and the quiet work of becoming a man people can trust.
                    </p>
                  </div>

                  <Link
                    href="/blog"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 underline-offset-4 hover:underline dark:text-gray-100"
                  >
                    Read the blog →
                  </Link>
                </header>

                <div className="grid gap-6 md:grid-cols-3">
                  {safeLatestPosts.map((post) => (
                    <BlogPostCard key={post.slug} post={post} />
                  ))}
                </div>
              </div>
            )}

            {/* Books */}
            {safeFeaturedBooks.length > 0 && (
              <div>
                <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500 dark:text-gray-400">
                      Books · In Development
                    </p>
                    <h2 className="mt-2 font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                      Long-form architecture.
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                      Manuscripts that gather the Canon, the case studies, and
                      the scars into volumes you can work through slowly — or
                      teach from.
                    </p>
                  </div>

                  <Link
                    href="/books"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-700 underline-offset-4 hover:underline dark:text-gray-100"
                  >
                    View all books →
                  </Link>
                </header>

                <div className="grid gap-6 sm:grid-cols-2">
                  {safeFeaturedBooks.map((book) => (
                    <BookCard key={book.slug} book={book} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ABOUT + MANDATE */}
      <section className="bg-gradient-to-b from-gray-900 via-black to-gray-950 py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
          <AboutSection />

          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-transparent to-emerald-500/10 p-6 sm:p-8">
            <MandateStatement />
          </div>
        </div>
      </section>

      {/* FINAL CTA – newsletter + inner circle */}
      <section className="border-t border-gray-800 bg-black py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[minmax(0,2fr)_minmax(0,1.5fr)] items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                Stay close to the work
              </p>
              <h2 className="mt-3 font-serif text-2xl font-semibold text-cream sm:text-3xl">
                For men who refuse to drift.
              </h2>
              <p className="mt-3 max-w-xl text-sm text-gray-300">
                Occasional dispatches, tools, and invitations — built for
                fathers, founders, and leaders who want to live with standards,
                not vibes. No spam. No fluff.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/newsletter"
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-amber-500 px-6 py-2.5 text-sm font-semibold text-black shadow-md shadow-amber-900/40 transition-transform hover:scale-105 active:scale-95"
                >
                  Join the newsletter
                  <span className="transition-transform group-hover:translate-x-1">
                    ↗
                  </span>
                </Link>
                <Link
                  href="/inner-circle"
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-500/60 px-6 py-2.5 text-sm font-semibold text-amber-100 transition-transform hover:scale-105 hover:bg-amber-500/5 active:scale-95"
                >
                  Inner Circle access
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-gray-200 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Professional Organisation
              </p>
              <p className="mt-3 text-sm text-gray-100">
                Behind the writing and the rooms is a working practice — advisory
                mandates, founder coaching, and board-level strategy work.
                Everything here is designed to be lived, implemented, and
                audited in the real world.
              </p>
              <p className="mt-3 text-xs text-gray-400">
                If you lead a business, a board, or a household and need
                structural thinking rather than motivational noise, you’re in
                the right place.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;