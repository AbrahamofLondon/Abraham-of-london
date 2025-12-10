// pages/index.tsx – MASTER HOMEPAGE (PAGES ROUTER)

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
// Small shared bits
// -----------------------------------------------------------------------------

const SectionDivider: React.FC = () => (
  <div className="relative h-10 overflow-hidden md:h-14">
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

// Canon entry mini-cards
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
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 60px, 80px"
            className="object-cover object-center"
          />
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

// Canon primary spotlight card
const CanonPrimaryCard: React.FC = () => (
  <Link
    href="/books/the-architecture-of-human-purpose"
    className="group block h-full"
  >
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-[#FDF9F1] to-gray-50 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-amber-900/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="p-4 md:p-6 lg:p-8">
        <div className="grid gap-6 md:grid-cols-2">
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

          <div className="flex flex-col justify-center space-y-4 md:space-y-5">
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
              A distilled, high-level prelude to the Canon — for men who know
              that history, family, and institutions are shaped on purpose, not
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
      revalidate: 300,
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
  const safeFeaturedBooks = Array.isArray(featuredBooks) ? featuredBooks : [];
  const safeLatestShorts = Array.isArray(latestShorts) ? latestShorts : [];

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
      fullWidth
      className="bg-gradient-to-b from-[#050608] via-[#050608] to-[#0b0c10]"
    >
      <Head>
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
      </Head>

      {/* HERO: Canon spine + ventures narrative */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#050608] via-[#0B0C10] to-[#050608]">
        <div className="absolute inset-0">
          <div className="pointer-events-none absolute -top-40 -right-32 h-64 w-64 rounded-full bg-amber-500/15 blur-3xl sm:h-80 sm:w-80" />
          <div className="pointer-events-none absolute -bottom-40 -left-32 h-64 w-64 rounded-full bg-emerald-500/12 blur-3xl sm:h-80 sm:w-80" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-18">
          <div className="grid items-center gap-10 lg:grid-cols-5 lg:gap-16">
            {/* Left – philosophy & CTAs */}
            <div className="max-w-xl lg:col-span-3 xl:col-span-2">
              <div className="mb-7">
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 sm:px-4 sm:py-2">
                  <span className="text-base text-amber-400">𓆓</span>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-200">
                    Canon · Ventures · Structural Tools
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
                  Not lifestyle content. Operating systems. For men who carry
                  responsibility for a family, a company, or a community — where
                  theology, history, and execution sit at the same table.
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
                  href="/ventures"
                  className="group inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amber-400/50 bg-transparent px-6 py-2.5 text-sm font-semibold text-amber-100 transition-all hover:scale-105 hover:bg-amber-500/10 active:scale-95"
                >
                  <span>Explore the working arms</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              <p className="mt-5 text-[0.7rem] uppercase tracking-[0.22em] text-gray-400">
                Essays · Strategic playbooks · Sessions · Inner Circle
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

      {/* STATS BAR */}
      <section className="border-y border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* CANON vs VENTURES – STRUCTURAL FRAME */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-10 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 sm:px-6 lg:flex-row lg:px-8">
          <div className="flex-1 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
              Philosophical Spine
            </p>
            <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              The Canon: why we believe what we build.
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
              The Canon is a long-term project: multi-volume, unapologetically
              theological, fiercely practical. It frames purpose, civilisation,
              governance, and fatherhood in language a serious man can stake his
              life on.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Foundations of human purpose and destiny.</li>
              <li>• How families, companies, and nations are architected.</li>
              <li>• Standards that refuse to bend with headlines.</li>
            </ul>
            <Link
              href="/canon"
              className="mt-4 inline-flex items-center text-sm font-semibold text-amber-700 underline-offset-4 hover:text-amber-900 hover:underline dark:text-amber-300"
            >
              Browse Canon volumes and field notes ↗
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-600 dark:text-emerald-300">
              Working Arms
            </p>
            <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
              Ventures: where conviction goes to work.
            </h2>
            <p className="text-sm leading-relaxed text-gray-700 dark:text-gray-300 sm:text-base">
              Around that spine are ventures and initiatives that carry the
              weight in the real world — advisory work, founder platforms, and
              fatherhood architecture.
            </p>
            <ul className="mt-3 space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li>• Alomarada: Africa-facing strategy and execution.</li>
              <li>• InfraNova: data infrastructure for a new economy.</li>
              <li>• Fathering Without Fear & Canon Inner Circle.</li>
            </ul>
            <Link
              href="/ventures"
              className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 underline-offset-4 hover:text-emerald-900 hover:underline dark:text-emerald-300"
            >
              See the ventures and working arms ↗
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* CANON SPOTLIGHT */}
      <section className="bg-gradient-to-b from-white to-gray-50 pb-12 pt-4 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-300">
                Canon · Volume I · Prelude
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-gray-900 dark:text-white sm:text-3xl">
                Start where the architecture is drawn.
              </h2>
            </div>
            <Link
              href="/books"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 underline-offset-4 hover:text-amber-700 hover:underline dark:text-gray-300"
            >
              View all works in development ↗
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CanonPrimaryCard />
            </div>
            <div className="space-y-3">
              <CanonEntryCard
                type="catechism"
                title="The Builders’ Catechism"
                subtitle="A Q&A framework for men responsible for more than themselves."
                href="/books/the-builders-catechism"
                imageSrc="/assets/images/books/the-builders-catechism.jpg"
              />
              <CanonEntryCard
                type="campaign"
                title="Canon Volume V · Governance Diagnostic Toolkit"
                subtitle="A field tool for boards, elders, and leadership teams who want more than slogans."
                href="/downloads/canon-volume-v-governance-diagnostic-toolkit"
                imageSrc="/assets/images/downloads/canon-volume-v-governance-diagnostic-toolkit.jpg"
              />
              <CanonEntryCard
                type="letter"
                title="Volume X · The Arc of Future Civilisation"
                subtitle="A long-range letter about where history is going — and how to prepare your household."
                href="/canon/volume-x-the-arc-of-future-civilisation"
                imageSrc="/assets/images/canon/volume-x-the-arc-of-future-civilisation.jpg"
              />
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* VENTURES SECTION */}
      <section className="bg-gradient-to-b from-[#050608] via-[#050608] to-[#090a0f] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <VenturesSection />
        </div>
      </section>

      {/* STRATEGIC SESSIONS & FUNNEL STRIP */}
      <section className="bg-gradient-to-b from-[#090a0f] via-[#050608] to-black py-12">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
                Strategic Sessions
              </p>
              <h2 className="font-serif text-2xl font-semibold text-cream sm:text-3xl">
                Boardroom-grade thinking, applied to fathers and founders.
              </h2>
              <p className="text-sm leading-relaxed text-gray-200 sm:text-base">
                Some work happens on the page. Some requires a closed room, a
                whiteboard, and people who understand what is really at stake:
                governance, succession, and the weight of being responsible for
                others.
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-200">
                <li>• Private strategy intensives for founders and investors.</li>
                <li>• Fatherhood architecture and household standards.</li>
                <li>• Chatham-style rooms for high-trust, high-consequence work.</li>
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/consulting"
                  className="inline-flex items-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black shadow-md shadow-amber-900/40 transition hover:scale-105 hover:bg-amber-400 active:scale-95"
                >
                  Book a strategic session
                </Link>
                <Link
                  href="/chatham-rooms"
                  className="inline-flex items-center rounded-lg border border-amber-400/60 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/10"
                >
                  Explore Chatham Rooms
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-amber-500/10 p-4 sm:p-5">
              <StrategicFunnelStrip />
            </div>
          </div>
        </div>
      </section>

      {/* LATEST WORK – POSTS / SHORTS / BOOKS */}
      <section className="bg-gradient-to-b from-black to-gray-950 py-12">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-400">
                Latest field notes
              </p>
              <h2 className="mt-2 font-serif text-2xl font-semibold text-cream sm:text-3xl">
                What we’re working through in public.
              </h2>
            </div>
            <Link
              href="/content"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300 underline-offset-4 hover:text-amber-300 hover:underline"
            >
              View full content archive ↗
            </Link>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Insights */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                Insights & Essays
              </h3>
              <div className="space-y-4">
                {safeLatestPosts.length === 0 && (
                  <p className="text-sm text-gray-400">
                    Essays are being prepared for release.
                  </p>
                )}
                {safeLatestPosts.map((post) => (
                  <BlogPostCard key={post.slug} post={post} compact />
                ))}
              </div>
            </div>

            {/* Short signals */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                Short Signals
              </h3>
              <div className="space-y-4">
                {safeLatestShorts.length === 0 && (
                  <p className="text-sm text-gray-400">
                    Short reflections will appear here shortly.
                  </p>
                )}
                {safeLatestShorts.map((shortDoc) => (
                  <ShortCard key={shortDoc.slug} shortDoc={shortDoc} />
                ))}
              </div>
            </div>

            {/* Books in development */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-300">
                Books in development
              </h3>
              <div className="space-y-4">
                {safeFeaturedBooks.length === 0 && (
                  <p className="text-sm text-gray-400">
                    The manuscripts are in the furnace. First releases are
                    scheduled soon.
                  </p>
                )}
                {safeFeaturedBooks.map((book) => (
                  <BookCard key={book.slug} book={book} compact />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT / MANDATE */}
      <section className="bg-gradient-to-b from-gray-950 via-gray-950 to-black pb-14 pt-10">
        <div className="mx-auto max-w-7xl space-y-10 px-4 sm:px-6 lg:px-8">
          <AboutSection />

          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <MandateStatement />
            </div>

            <div className="space-y-4 rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-amber-500/10 p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                Inner Circle · Canon Council
              </p>
              <h3 className="font-serif text-xl font-semibold text-cream">
                For men who prefer covenants to follower counts.
              </h3>
              <p className="text-sm leading-relaxed text-gray-200">
                A private space for those who want to build household standards,
                founder operating systems, and generational charters — slowly,
                ruthlessly, and with accountability.
              </p>
              <ul className="mt-2 space-y-2 text-sm text-gray-200">
                <li>• Closed-door sessions and working groups.</li>
                <li>• Tools, diagnostics, and charters ahead of public release.</li>
                <li>• A table of men who carry similar weight.</li>
              </ul>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-black shadow-md shadow-amber-900/40 transition hover:scale-105 hover:bg-amber-400 active:scale-95"
                >
                  Request Inner Circle access
                </Link>
                <Link
                  href="/newsletter"
                  className="inline-flex items-center rounded-lg border border-amber-400/60 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/10"
                >
                  Join the long-game newsletter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;