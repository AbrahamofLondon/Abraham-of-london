// pages/index.tsx – MASTER HOMEPAGE (Hero A, Ventures Narrative)

import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage, GetStaticProps } from "next";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
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
// Device detection hook (client-only)
// -----------------------------------------------------------------------------

const useDeviceType = () => {
  const [deviceType, setDeviceType] = React.useState<
    "mobile" | "tablet" | "desktop"
  >("desktop");

  React.useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      if (width < 768) setDeviceType("mobile");
      else if (width < 1024) setDeviceType("tablet");
      else setDeviceType("desktop");
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);
    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return deviceType;
};

// -----------------------------------------------------------------------------
// Dynamic homepage sections
// -----------------------------------------------------------------------------

const VenturesSection = dynamic(
  () => import("@/components/homepage/VenturesSection"),
  {
    ssr: false,
  },
);

const StrategicFunnelStrip = dynamic(
  () => import("@/components/homepage/StrategicFunnelStrip"),
  {
    ssr: false,
  },
);

const StatsBar = dynamic(() => import("@/components/homepage/StatsBar"), {
  ssr: false,
});

const AboutSection = dynamic(
  () => import("@/components/homepage/AboutSection"),
  {
    ssr: false,
  },
);

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

// -----------------------------------------------------------------------------
// Canon primary card
// -----------------------------------------------------------------------------

const CanonPrimaryCard: React.FC = () => {
  const deviceType = useDeviceType();

  return (
    <Link
      href="/books/the-architecture-of-human-purpose"
      className="group block h-full"
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-amber-200/80 bg-gradient-to-br from-white via-[#FDF9F1] to-gray-50 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl dark:border-amber-900/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="p-4 md:p-6 lg:p-8">
          {deviceType === "mobile" ? (
            // Mobile layout – vertical
            <div className="space-y-4">
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
          ) : (
            // Desktop / tablet layout – horizontal
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
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
                  A distilled, high-level prelude to the Canon — written for men
                  who understand that history, family, and institutions are
                  shaped by design, not by accident. This is the reference point
                  for everything else on the site.
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
          )}
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
  const publishedPosts = getPublishedPosts();
  const allBooks = getAllBooks().filter((b) => !(b as any).draft);
  const publishedShorts = getPublishedShorts();

  return {
    props: {
      latestPosts: publishedPosts.slice(0, 3),
      featuredBooks: allBooks.slice(0, 2), // medium footprint
      latestShorts: publishedShorts.slice(0, 3),
    },
    revalidate: 3600,
  };
};

// -----------------------------------------------------------------------------
// Page component
// -----------------------------------------------------------------------------

const HomePage: NextPage<HomePageProps> = ({
  latestPosts,
  featuredBooks,
  latestShorts,
}) => {
  const siteTitle = "Abraham of London";
  const siteTagline =
    "Canon, ventures, and structural tools for fathers, founders, and builders of legacy.";

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
        <title>{siteTitle} | Structural Thinking for Builders of Legacy</title>
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

      {/* HERO – Cinematic, banner on right */}
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
                    Structural thinking for fathers, founders, and
                    builders of legacy.
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

            {/* Right – banner image */}
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

      {/* STATS BAR – quiet authority */}
      <section className="border-y border-gray-200/60 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* CANON SPOTLIGHT */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-12 dark:from-gray-900 dark:to-gray-950 md:py-16 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center md:mb-12">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-amber-300/70 bg-amber-50 px-3 py-1.5 dark:border-amber-900/60 dark:bg-amber-900/10 md:px-4 md:py-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-300">
                Entry into the Canon
              </span>
            </div>
            <h2 className="mb-3 font-serif text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl lg:text-4xl xl:text-5xl">
              Start with the Prelude and the three doorways
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-gray-700 dark:text-gray-300 md:text-base">
              The Canon opens through a limited-release Prelude and three entry
              pieces. Together they frame purpose, destiny, and resilience the
              way serious men actually live them.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.3fr)]">
            <CanonPrimaryCard />

            <div className="space-y-3 md:space-y-4">
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

      {/* SHORTS STRIP – outer court */}
      <section className="bg-gray-50 py-10 dark:bg-gray-900 md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 space-y-4 md:mb-8">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                Shorts · Outer Court
              </p>
              <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl lg:text-4xl">
                For the days you&apos;re too tired for long form
              </h2>
              <p className="mt-2 max-w-xl text-sm text-gray-700 dark:text-gray-300 md:text-base">
                High-protein reflections for the honest skeptic, the overloaded
                professional, and the over-churched believer who still wants
                something real — in under five minutes.
              </p>
            </div>

            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <Link
                href="/shorts"
                className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-amber-300 md:text-base"
              >
                Browse all Shorts
                <span className="transition-transform hover:translate-x-1">
                  ↠
                </span>
              </Link>
              <p className="max-w-xs text-xs text-gray-500 dark:text-gray-400 md:text-sm">
                Think of this as the outer court: safe, accessible, and still
                anchored in the same standards as the Canon.
              </p>
            </div>
          </div>

          {latestShorts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Shorts are being prepared. Once live, this will be the easiest
              place to start when you&apos;re exhausted but still hungry.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-3">
              {latestShorts.map((short) => (
                <ShortCard key={short._id} short={short} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* LATEST ESSAYS – Canon in motion */}
      <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 md:mb-10">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                Latest Essays
              </p>
              <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl lg:text-4xl">
                From the Canon in motion
              </h2>
              <p className="mt-2 max-w-xl text-sm text-gray-700 dark:text-gray-300 md:text-base">
                Long-form essays for fathers, founders, and builders who prefer
                structure over hype and diagnosis over clickbait.
              </p>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-amber-300 md:text-base"
            >
              View all essays
              <span className="transition-transform hover:translate-x-1">
                ↠
              </span>
            </Link>
          </div>

          {latestPosts.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No essays are published yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <BlogPostCard key={post._id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* BOOKS – under development, medium footprint */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-12 dark:from-gray-950 dark:to-gray-900 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 space-y-4 md:mb-10">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                Canon &amp; Narrative
              </p>
              <h2 className="font-serif text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl lg:text-4xl">
                Books in active development
              </h2>
              <p className="mt-2 max-w-xl text-sm text-gray-700 dark:text-gray-300 md:text-base">
                The Canon volumes and memoir projects that will anchor this
                ecosystem — theology, strategy, and story in one spine. Still in
                development, but already shaping the work.
              </p>
            </div>
            <Link
              href="/books"
              className="inline-flex items-center gap-1 text-sm font-semibold text-gray-900 underline-offset-4 hover:underline dark:text-amber-300 md:text-base"
            >
              View all books
              <span className="transition-transform hover:translate-x-1">
                ↠
              </span>
            </Link>
          </div>

          {featuredBooks.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No books are registered yet.
            </p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book._id} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SectionDivider />

      {/* STRATEGIC SESSIONS / ENGAGEMENT STRIP */}
      <section className="bg-black py-10 text-white md:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] md:items-center">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
                Strategic Sessions
              </p>
              <h2 className="font-serif text-2xl font-semibold md:text-3xl lg:text-4xl">
                From frameworks to rooms where decisions get made
              </h2>
              <p className="mt-3 max-w-xl text-sm text-gray-200 md:text-base">
                Private strategy sessions, founder roundtables, and leadership
                workshops that translate Canon-level thinking into concrete
                decisions about capital, people, governance, and risk.
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/consulting"
                className="group inline-flex w-full items-center justify-between gap-2 rounded-lg border border-amber-400/60 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-100 transition-all hover:bg-amber-500/20"
              >
                <span>Consulting &amp; advisory mandates</span>
                <span className="text-lg transition-transform group-hover:translate-x-1">
                  ↠
                </span>
              </Link>
              <Link
                href="/events"
                className="group inline-flex w-full items-center justify-between gap-2 rounded-lg border border-gray-700 bg-gray-900/70 px-4 py-3 text-sm font-semibold text-gray-100 transition-all hover:bg-gray-800"
              >
                <span>Workshops, salons, and leadership rooms</span>
                <span className="text-lg transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* MANDATE / ABOUT / VENTURES */}
      <section className="bg-white py-12 dark:bg-gray-950 md:py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <MandateStatement />
        </div>
      </section>

      <SectionDivider />

      {/* Ventures (working arm) */}
      <VenturesSection />

      {/* Funnel strip – pathway into ecosystem */}
      <StrategicFunnelStrip />

      {/* About Abraham / ecosystem */}
      <AboutSection />

      {/* Global tweaks for mobile & clamping */}
      <style jsx global>{`
        @media (max-width: 768px) {
          input,
          textarea,
          select {
            font-size: 16px !important;
          }

          a[role='button'],
          button,
          .touch-target {
            min-height: 44px;
            min-width: 44px;
          }

          img {
            content-visibility: auto;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
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

        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        html {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </Layout>
  );
};

export default HomePage;