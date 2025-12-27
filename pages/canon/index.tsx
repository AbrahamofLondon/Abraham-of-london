// pages/index.tsx - FINAL INTEGRATED HOMEPAGE
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import StatsBar from "@/components/homepage/StatsBar";
import VenturesSection from "@/components/homepage/VenturesSection";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import { LinkItemWithIcon, LinkItemWithBadge } from "@/components/Cards/partials";
import { Calendar, Compass, Users, Sparkles, BookOpen } from "lucide-react";

import {
  getPublishedShorts,
  getRecentShorts,
  getDocHref,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

// -----------------------------------------------------------------------------
// BOOKS IN DEVELOPMENT
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
      "A covert retelling of a story too real for the courtroom - where truth hides in fiction and fiction cuts deeper than fact.",
    cover: "/assets/images/books/the-fiction-adaptation.jpg",
  },
] as const;

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string;
  slug?: string;
  _type?: string;
  draft?: boolean;
  published?: boolean;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

type HomePageProps = {
  featuredShorts: LooseShort[];
};

// -----------------------------------------------------------------------------
// SECTION DIVIDER
// -----------------------------------------------------------------------------

const SectionDivider: React.FC = () => (
  <div className="relative h-16 overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent dark:via-amber-500/30" />
      <div className="mx-6 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <div className="h-1 w-1 rounded-full bg-amber-400/60" />
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
      </div>
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent dark:via-amber-500/30" />
    </div>
  </div>
);

// -----------------------------------------------------------------------------
// SHORTS STRIP
// -----------------------------------------------------------------------------

const ShortsStrip: React.FC<{ shorts: LooseShort[] }> = ({ shorts }) => {
  if (!shorts || shorts.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Shorts · Field signals
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
              Quick hits for women and men who don&apos;t scroll all day
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-300">
              Concise field notes on work, livelihood, and building under
              pressure - designed to be read between meetings, not instead of
              them.
            </p>
          </div>

          <Link
            href="/shorts"
            className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-400/10 hover:border-amber-300"
          >
            View all shorts
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {shorts.map((short) => {
            const href = getDocHref(short);
            const title = String(short.title || "Short").trim();
            const readTime = String(short.readTime || "Quick read").trim();
            const excerpt = String(short.excerpt || short.description || "").trim();

            // Stable key: prefer href, then slug, then raw filename, then title
            const key =
              href ||
              short.slug ||
              short._raw?.sourceFileName ||
              normalizeSlug(short) ||
              title;

            return (
              <Link
                key={key}
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/50 hover:bg-slate-800/80 hover:shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    Short
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                    {readTime}
                  </span>
                </div>

                <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold text-white">
                  {title}
                </h3>

                {excerpt ? (
                  <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-300">
                    {excerpt}
                  </p>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                    Field note
                  </span>
                  <span className="inline-flex items-center text-sm font-semibold text-amber-300 transition-all group-hover:gap-2 group-hover:text-amber-200">
                    Read
                    <span className="ml-1 transition-transform group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* INTEGRATED: LinkItemWithIcon and LinkItemWithBadge */}
        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <LinkItemWithIcon
            href="/inner-circle"
            icon={<Users className="h-5 w-5" />}
            title="Join Inner Circle"
            description="Access premium content and exclusive community"
            iconColor="amber"
          />
          <LinkItemWithBadge
            href="/canon"
            title="Explore The Canon"
            badge="New"
            description="Foundational principles and long-term thinking"
            badgeColor="amber"
            badgeVariant="filled"
          />
          <LinkItemWithIcon
            href="/books"
            icon={<BookOpen className="h-5 w-5" />}
            title="Browse Books"
            description="Complete collection of published works"
            iconColor="blue"
          />
          <LinkItemWithBadge
            href="/downloads"
            title="Strategic Resources"
            badge="Premium"
            description="Tools, frameworks, and downloadable assets"
            badgeColor="green"
            badgeVariant="outline"
          />
        </div>
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// BOOKS IN DEVELOPMENT
// -----------------------------------------------------------------------------

const BooksInDevelopment: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Books in development
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Long-form work that underwrites everything else
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-gray-300">
            These sit behind the posts, shorts, and rooms - slow-cooked work that
            outlives algorithms and platform cycles.
          </p>
        </div>
        <Link
          href="/books"
          className="inline-flex items-center rounded-full border border-amber-500/60 bg-amber-500/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition-all hover:bg-amber-500/10 hover:border-amber-500 dark:text-amber-300"
        >
          View all books
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {BOOKS_IN_DEV.map((book) => (
          <Link key={book.slug} href={`/books/${book.slug}`} className="group block">
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-0 md:grid-cols-[auto,1fr]">
                <div className="relative aspect-[3/4] w-full max-w-[9rem] flex-shrink-0">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 35vw, 20vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col justify-between p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                      In development
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-semibold text-slate-900 dark:text-white">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-600 dark:text-gray-400">
                      {book.tag}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                      {book.blurb}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-gray-500">
                      Canon bookshelf
                    </span>
                    <span className="text-sm font-semibold text-amber-600 transition-transform group-hover:translate-x-1 dark:text-amber-400">
                      View project →
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
// STRATEGIC SESSIONS
// -----------------------------------------------------------------------------

const StrategicSessions: React.FC = () => (
  <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            Strategic sessions
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
            Where we do the work in the room
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-300">
            Not inspirational talks. Working sessions built for people carrying
            real responsibility - for a boardroom, a founding team, or a household.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/consulting"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl"
          >
            Book a conversation
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-400/10 hover:border-amber-300"
          >
            Upcoming rooms
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/30 hover:bg-slate-800/80 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-white">
            Strategy rooms for founders & boards
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Clarify mandate, markets, and operating rhythm so your decisions stop
            fighting your design.
          </p>
          <p className="mt-auto text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
            Alomarada · InfraNova Africa · Governance diagnostics
          </p>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-slate-800/80 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-white">
            Fatherhood & household architecture
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Standards, rituals, and structures that let men show up for their sons
            without outsourcing conviction to the culture.
          </p>
          <p className="mt-auto text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
            Fathering Without Fear · Canon household tools
          </p>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-800/80 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-white">
            Leadership salons & inner-circle work
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Small, closed rooms where we test ideas, frameworks, and Canon tools
            against real lives and real P&amp;Ls.
          </p>
          <p className="mt-auto text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
            Chatham rooms · Inner Circle · Builders&apos; tables
          </p>
        </article>
      </div>
    </div>
  </section>
);

// -----------------------------------------------------------------------------
// PAGE COMPONENT
// -----------------------------------------------------------------------------

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
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
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
        publisher: { "@type": "Person", name: "Abraham of London" },
      }}
    >
      {/* HERO - Canon spine + ventures narrative */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="absolute inset-0">
          <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">
            {/* Left - Philosophy & CTAs */}
            <div className="max-w-xl lg:col-span-3 xl:col-span-2">
              <div className="mb-8">
                <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-amber-400/50 bg-amber-500/10 px-4 py-2">
                  <span className="text-lg text-amber-400">𓆓</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    Canon · Ventures · Field tools
                  </span>
                </div>

                <h1 className="mb-5 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                  Abraham of London
                  <span className="mt-4 block text-xl font-normal text-amber-100 sm:text-2xl lg:text-3xl">
                    Structural thinking for fathers, founders, and builders of
                    legacy.
                  </span>
                </h1>

                <p className="mb-8 text-base leading-relaxed text-gray-300 sm:text-lg">
                  For men who carry responsibility for a family, a company, or a
                  community - this is where faith, history, and strategy are
                  turned into operating systems, not slogans.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/canon"
                  className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl"
                >
                  <span>Enter the Canon</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/consulting"
                  className="group inline-flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400/5 px-7 py-3.5 text-sm font-semibold text-amber-100 transition-all hover:scale-105 hover:bg-amber-500/10"
                >
                  <span>Work with Abraham</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>

              <p className="mt-6 text-xs uppercase tracking-[0.2em] text-gray-500">
                Canon · Essays · Field letters · Tools · Inner circle
              </p>
            </div>

            {/* Right - Hero Banner */}
            <div className="relative lg:col-span-2 xl:col-span-3">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm">
                <div className="relative aspect-video w-full">
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London - Canon, ventures, and structural tools for builders of legacy"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                </div>
                <div className="border-t border-white/10 bg-slate-900/90 px-5 py-4 backdrop-blur-sm">
                  <p className="text-sm font-medium leading-relaxed text-gray-200">
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
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* CANON SPOTLIGHT */}
      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
                Canon · Foundations
              </p>
              <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                The philosophical spine
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-gray-300">
                The Canon is the long-term work: purpose, governance, civilisation,
                and destiny - written from a father&apos;s vantage point, not an academic desk.
              </p>
            </div>
            <Link
              href="/canon"
              className="inline-flex items-center rounded-full border border-amber-500/60 bg-amber-500/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition-all hover:bg-amber-500/10 hover:border-amber-500 dark:text-amber-300"
            >
              Browse Canon entries
            </Link>
          </div>

          {/* FIXED: CanonPrimaryCard with required props and adjusted image */}
          <CanonPrimaryCard
            title="The Architecture of Human Purpose"
            href="/canon/the-architecture-of-human-purpose"
            excerpt="The foundational volume: a framework for discerning and deploying purpose across a lifetime. How to build systems, structures, and legacies that outlast you."
            volumeNumber={1}
            // Adjusted image path - using a realistic fallback
            image="/assets/images/canon/architecture-of-human-purpose-cover.jpg"
            className="max-w-2xl mx-auto"
          />
        </div>
      </section>

      <SectionDivider />

      {/* STRATEGIC FUNNEL STRIP */}
      <StrategicFunnelStrip />

      <SectionDivider />

      {/* SHORTS STRIP */}
      {featuredShorts.length > 0 ? (
        <>
          <ShortsStrip shorts={featuredShorts} />
          <SectionDivider />
        </>
      ) : null}

      {/* VENTURES */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
        <VenturesSection />
      </section>

      <SectionDivider />

      {/* BOOKS */}
      <BooksInDevelopment />

      <SectionDivider />

      {/* SESSIONS */}
      <StrategicSessions />
    </Layout>
  );
};

export default HomePage;

// -----------------------------------------------------------------------------
// BUILD-TIME DATA (robust + typed)
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Custom isPublished check for LooseShort type
  const isLooseShortPublished = (s: LooseShort): boolean => {
    // Check for explicit published flag
    if (s.published === true) return true;
    if (s.published === false) return false;
    
    // Check for draft flag
    if (s.draft === true) return false;
    
    // Check if it has a title and slug (basic published check)
    if (s.title && s.slug) return true;
    
    return false;
  };

  const getFeaturedShortsSafely = (): LooseShort[] => {
    try {
      const recent = getRecentShorts(3) as unknown as LooseShort[];
      const cleanedRecent = Array.isArray(recent) ? recent : [];

      if (cleanedRecent.length > 0) return cleanedRecent;

      const all = getPublishedShorts() as unknown as LooseShort[];
      const cleanedAll = Array.isArray(all) ? all : [];

      return cleanedAll.slice(0, 3);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[home] Error loading shorts:", err);
      return [];
    }
  };

  const featuredShorts = getFeaturedShortsSafely().filter(isLooseShortPublished);

  return {
    props: {
      featuredShorts,
    },
    revalidate: 3600, // Revalidate every hour
  };
};