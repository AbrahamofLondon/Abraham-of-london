// pages/index.tsx – MASTER HOMEPAGE WITH SHORTS & BOOKS

import * as React from "react";
import type { NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import StatsBar from "@/components/homepage/StatsBar";
import VenturesSection from "@/components/homepage/VenturesSection";
import { Calendar, Compass, Users, Sparkles } from "lucide-react";
import { getPublishedShorts } from "@/lib/contentlayer-helper";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";
import type { Short } from "contentlayer/generated";

// -----------------------------------------------------------------------------
// BOOKS IN DEVELOPMENT – update covers & slugs
// -----------------------------------------------------------------------------

const BOOKS_IN_DEV = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    tag: "Fatherhood · Household",
    blurb:
      "Standards, rituals, and household architecture for men building families that outlast culture wars.",
    cover: "/assets/images/books/fathering-without-fear.jpg",
  },
  {
    slug: "the-fiction-adaptation",
    title: "The Fiction Adaptation",
    tag: "Fiction · Drama",
    blurb:
      "A covert retelling of a story too real for the courtroom — where truth hides in fiction and fiction cuts deeper than fact.",
    cover: "/assets/images/books/the-fiction-adaptation.jpg",
  },
];

// -----------------------------------------------------------------------------
// SHORTS – pull a few at build time
// -----------------------------------------------------------------------------

const featuredShorts: Short[] = (getPublishedShorts?.() ?? []).slice(0, 3);

// Safely derive the URL for a Short document
const getShortUrl = (short: Short): string => {
  const rawPath = (short as any)._raw?.flattenedPath as string | undefined;

  if (rawPath && typeof rawPath === "string") {
    // e.g. "shorts/when-you-feel-too-busy-to-care" -> "/shorts/when-you-feel-too-busy-to-care"
    return `/${rawPath.replace(/^\/+/, "")}`;
  }

  // Fallback if _raw is missing for some reason
  return `/shorts/${short.slug}`;
};

// -----------------------------------------------------------------------------
// Simple visual divider
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
// SHORTS STRIP – homepage spotlight (now links to actual shorts)
// -----------------------------------------------------------------------------

const ShortsStrip: React.FC = () => {
  if (!featuredShorts || featuredShorts.length === 0) {
    return null;
  }

  return (
    <section className="bg-gradient-to-b from-gray-950 via-black to-gray-950 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400/80">
              Shorts · Field signals
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-cream sm:text-4xl">
              Quick hits for men who don&apos;t scroll all day
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/80">
              Concise field notes on work, fatherhood, and building under
              pressure — designed to be read between meetings, not instead of
              them.
            </p>
          </div>
          <Link
            href="/shorts"
            className="inline-flex items-center rounded-full border border-amber-400/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200"
          >
            View all shorts
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredShorts.map((short) => (
            <Link
              key={short._id}
              href={getShortUrl(short)}
              className="group flex h-full flex-col rounded-2xl border border-white/10 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-5 shadow-lg transition hover:-translate-y-1 hover:border-amber-400/70 hover:shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-300">
                  <Sparkles className="h-3 w-3" />
                  Short
                </span>
                {short.readTime && (
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-cream/60">
                    {short.readTime}
                  </span>
                )}
              </div>

              <h3 className="mb-2 line-clamp-2 font-serif text-lg font-semibold text-cream">
                {short.title}
              </h3>

              {short.excerpt || (short as any).description ? (
                <p className="mb-4 flex-1 text-sm leading-relaxed text-cream/75">
                  {short.excerpt ?? (short as any).description}
                </p>
              ) : null}

              <div className="mt-auto flex items-center justify-between pt-3">
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-cream/60">
                  Field note
                </span>
                <span className="inline-flex items-center text-xs font-semibold text-amber-300 transition group-hover:text-amber-200">
                  Read inside
                  <span className="ml-1 transition-transform group-hover:translate-x-1">
                    ↠
                  </span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// BOOKS IN DEVELOPMENT – medium-sized cards with covers
// -----------------------------------------------------------------------------

const BooksInDevelopment: React.FC = () => (
  <section className="bg-gradient-to-b from-[#F9F5EC] via-white to-gray-50 py-16 dark:from-[#050608] dark:via-[#050608] dark:to-[#050608]">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600/85 dark:text-amber-300/90">
            Books in development
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-cream sm:text-4xl">
            Long-form work that underwrites everything else
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-800 dark:text-cream/85">
            These projects sit behind the posts, shorts, and rooms — slow-cooked
            work that outlives algorithms and platform cycles.
          </p>
        </div>
        <Link
          href="/books"
          className="inline-flex items-center rounded-full border border-amber-400/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200"
        >
          View all books
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {BOOKS_IN_DEV.map((book) => (
          <Link
            key={book.slug}
            href={`/books/${book.slug}`}
            className="group block"
          >
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-black/5 bg-white/95 shadow-md transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-gray-900/95">
              <div className="grid gap-0 md:grid-cols-[auto,1fr]">
                <div className="relative aspect-[3/4] w-full max-w-[8rem] flex-shrink-0 md:max-w-[9rem]">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 35vw, 20vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between p-5 md:p-6">
                  <div>
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-700 dark:text-amber-300">
                      In development
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-semibold text-slate-900 dark:text-cream">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-cream/70">
                      {book.tag}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-800 dark:text-cream/85">
                      {book.blurb}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-2">
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-slate-600 dark:text-cream/70">
                      Canon bookshelf
                    </span>
                    <span className="text-xs font-semibold text-amber-700 transition group-hover:translate-x-1 group-hover:text-amber-500 dark:text-amber-300">
                      View project ↠
                    </span>
                  </div>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

// -----------------------------------------------------------------------------
// STRATEGIC SESSIONS – dark-mode readability
// -----------------------------------------------------------------------------

const StrategicSessions: React.FC = () => (
  <section className="bg-gradient-to-b from-gray-950 via-black to-gray-950 py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400/90">
            Strategic sessions
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-cream sm:text-4xl">
            Where we do the work in the room
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cream/80">
            Not inspirational talks. Working sessions built for people carrying
            real responsibility — for a boardroom, a founding team, or a
            household.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/consulting"
            className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-md shadow-amber-900/40 transition hover:scale-105"
          >
            Book a strategic conversation
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center rounded-full border border-amber-200/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-100"
          >
            Upcoming rooms
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* 1. Board / founders */}
        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/15 text-amber-400">
            <Compass className="h-5 w-5" />
          </div>
          <h3 className="mb-2 font-serif text-lg font-semibold text-cream">
            Strategy rooms for founders & boards
          </h3>
          <p className="mb-3 text-sm leading-relaxed text-cream/80">
            Clarify mandate, markets, and operating rhythm so your decisions
            stop fighting your design.
          </p>
          <p className="mt-auto text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-cream/60">
            Alomarada · InfraNova Africa · Governance diagnostics
          </p>
        </article>

        {/* 2. Fathers / households */}
        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
            <Users className="h-5 w-5" />
          </div>
          <h3 className="mb-2 font-serif text-lg font-semibold text-cream">
            Fatherhood & household architecture
          </h3>
          <p className="mb-3 text-sm leading-relaxed text-cream/80">
            Standards, rituals, and structures that let men show up for their
            sons without outsourcing conviction to the culture.
          </p>
          <p className="mt-auto text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-cream/60">
            Fathering Without Fear · Canon household tools
          </p>
        </article>

        {/* 3. Inner-circle / leaders */}
        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-lg transition hover:-translate-y-1 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300">
            <Calendar className="h-5 w-5" />
          </div>
          <h3 className="mb-2 font-serif text-lg font-semibold text-cream">
            Leadership salons & inner-circle work
          </h3>
          <p className="mb-3 text-sm leading-relaxed text-cream/80">
            Small, closed rooms where we test ideas, frameworks, and Canon tools
            against real lives and real P&Ls.
          </p>
          <p className="mt-auto text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-cream/60">
            Chatham rooms · Inner Circle · Builders&apos; tables
          </p>
        </article>
      </div>
    </div>
  </section>
);

// -----------------------------------------------------------------------------
// PAGE
// -----------------------------------------------------------------------------

const HomePage: NextPage = () => {
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
        url:
          process.env.NEXT_PUBLIC_SITE_URL ??
          "https://www.abrahamoflondon.org",
        publisher: {
          "@type": "Person",
          name: "Abraham of London",
        },
      }}
    >
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
                    Canon · Ventures · Field tools
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
                Canon · Essays · Field letters · Tools · Inner circle
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
      <section className="bg-gradient-to-b from-white to-gray-50 py-12 dark:from-black dark:via-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-500/80">
                Canon · Foundations
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-gray-900 dark:text-cream sm:text-4xl">
                The philosophical spine
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                The Canon is the long-term work: purpose, governance,
                civilisation, and destiny — written from a father&apos;s
                vantage point, not an academic desk.
              </p>
            </div>
            <Link
              href="/canon"
              className="inline-flex items-center rounded-full border border-amber-400/70 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-200"
            >
              Browse Canon entries
            </Link>
          </div>

          {/* Updated CanonPrimaryCard – new component, no props */}
          <CanonPrimaryCard />
        </div>
      </section>

      {/* SHORTS STRIP */}
      <ShortsStrip />

      <SectionDivider />

      {/* VENTURES – working arms */}
      <section className="bg-gradient-to-b from-gray-950 via-black to-gray-950 py-16">
        <VenturesSection />
      </section>

      <SectionDivider />

      {/* BOOKS IN DEVELOPMENT */}
      <BooksInDevelopment />

      <SectionDivider />

      {/* STRATEGIC SESSIONS */}
      <StrategicSessions />
    </Layout>
  );
};

export default HomePage;