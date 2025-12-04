// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import {
  CONTENT_CATEGORIES,
} from "@/lib/content";

import VenturesSection from "@/components/homepage/VenturesSection";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import StatsBar from "@/components/homepage/StatsBar";
import AboutSection from "@/components/homepage/AboutSection";
import { 
  getAllPostsMeta,
  getAllBooksMeta,
  getAllDownloadsMeta,
  getAllContent 
} from "@/lib/mdx";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* DATA TYPES & SAFE FETCHING                                                 */
/* -------------------------------------------------------------------------- */

type ContentKind = "blog" | "book" | "download" | "event" | "print" | "resource";

interface RawContentItem {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: (string | number)[];
  featured?: boolean;
  readTime?: string | number;
  _raw?: { flattenedPath?: string };
  eventDate?: string;
  fileSize?: string;
}

// ---------------------------------------------------------------------------
// Safe Data Fetching Helper
// ---------------------------------------------------------------------------

const safeGetData = async (
  dataFetcher:
    | (() => Promise<RawContentItem[] | undefined> | RawContentItem[] | undefined)
    | undefined,
  dataName: string
): Promise<RawContentItem[]> => {
  try {
    if (!dataFetcher || typeof dataFetcher !== "function") {
      console.warn(`[homepage] ${dataName} fetcher unavailable`);
      return [];
    }
    const result = await dataFetcher();
    if (Array.isArray(result)) return result;
    console.warn(`[homepage] ${dataName} returned non-array, skipping`);
    return [];
  } catch (error) {
    console.error(`[homepage] Error fetching ${dataName}:`, error);
    return [];
  }
};

/* -------------------------------------------------------------------------- */
/* PREMIUM UI COMPONENTS                                                      */
/* -------------------------------------------------------------------------- */

const GlassCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}> = ({ children, className = "", hoverEffect = true }) => (
  <div
    className={`
      relative overflow-hidden rounded-3xl 
      bg-white/[0.04] backdrop-blur-3xl
      border border-white/10
      shadow-2xl shadow-black/40
      ${hoverEffect ? "transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl hover:shadow-black/60" : ""}
      ${className}
    `}
  >
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

const SectionDivider: React.FC<{ variant?: "simple" | "ornate" }> = ({ variant = "simple" }) => {
  if (variant === "ornate") {
    return (
      <div className="relative h-32 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="mx-8 flex items-center gap-3">
            <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse" />
            <div className="h-2 w-2 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 animate-pulse" />
            <div className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 animate-pulse" />
          </div>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-24 overflow-hidden">
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
};

/* -------------------------------------------------------------------------- */
/* ENHANCED CONTENT CARD                                                      */
/* -------------------------------------------------------------------------- */

const ContentCard: React.FC<{
  title: string;
  description: string;
  href: string;
  category: string;
  color: string;
  icon: string;
  kind?: ContentKind;
}> = ({ title, description, href, category, color, icon, kind = "resource" }) => {
  const getKindGradient = (kind: ContentKind): string => {
    const gradients: Record<ContentKind, string> = {
      blog: "bg-gradient-to-br from-emerald-500/20 via-teal-500/10 to-cyan-500/20",
      book: "bg-gradient-to-br from-violet-500/20 via-purple-500/10 to-fuchsia-500/20",
      download: "bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-red-500/20",
      event: "bg-gradient-to-br from-rose-500/20 via-pink-500/10 to-red-500/20",
      print: "bg-gradient-to-br from-indigo-500/20 via-blue-500/10 to-cyan-500/20",
      resource: "bg-gradient-to-br from-cyan-500/20 via-sky-500/10 to-blue-500/20",
    };
    return gradients[kind] ?? "bg-gradient-to-br from-gray-500/20 via-gray-400/10 to-gray-600/20";
  };

  return (
    <Link href={href} className="group block h-full">
      <GlassCard className="h-full">
        <div className="flex h-full flex-col p-6">
          <div className="mb-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${getKindGradient(kind)}`}>
                <div className="text-xl" style={{ color }}>
                  {icon}
                </div>
              </div>
              <span
                className="text-xs font-semibold uppercase tracking-wider"
                style={{ color }}
              >
                {category}
              </span>
            </div>
          </div>

          <h3 className="mb-3 font-serif text-lg font-bold text-gray-900 dark:text-white">
            {title}
          </h3>

          <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
            {description}
          </p>

          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium opacity-70" style={{ color }}>
                Explore
              </span>
              <span className="font-medium transition-transform group-hover:translate-x-2" style={{ color }}>
                →
              </span>
            </div>
          </div>
        </div>
      </GlassCard>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* CANON SPOTLIGHT - ENHANCED VERSION                                         */
/* -------------------------------------------------------------------------- */

const CanonPrimaryCard: React.FC = () => (
  <Link href="/books/the-architecture-of-human-purpose" className="group block h-full">
    <GlassCard className="h-full border-2 border-amber-500/20 hover:border-amber-500/40">
      <div className="relative">
        {/* Premium Badge */}
        <div className="absolute left-4 top-4 z-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg">
            ⭐ Limited Release
          </span>
        </div>
        
        {/* Image Container with Fixed Size */}
        <div className="relative h-72 w-full overflow-hidden rounded-t-3xl">
          <Image
            src="/assets/images/books/the-architecture-of-human-purpose.jpg"
            alt="The Architecture of Human Purpose — Prelude MiniBook"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="mb-4">
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
              Prelude MiniBook · Volume I
            </span>
          </div>
          
          <h3 className="mb-3 font-serif text-2xl font-bold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
            The Architecture of Human Purpose
          </h3>
          
          <p className="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            A distilled, high-level prelude to the Canon — for men who know that
            human flourishing is not accidental, but architectural. Foundation for all subsequent work.
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-amber-100 dark:border-amber-900/30">
            <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
              Enter the Prelude
            </span>
            <span className="text-lg transition-transform group-hover:translate-x-2 group-hover:scale-110">
              ↠
            </span>
          </div>
        </div>
      </div>
    </GlassCard>
  </Link>
);

type CanonEntryProps = {
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  category: string;
  color: string;
};

const CanonEntryCard: React.FC<CanonEntryProps> = ({
  title,
  subtitle,
  href,
  imageSrc,
  category,
  color,
}) => (
  <Link href={href} className="group block">
    <GlassCard className="h-full">
      <div className="flex h-full flex-col p-5">
        <div className="flex items-start gap-4 mb-4">
          <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded-lg">
            <Image
              src={imageSrc}
              alt={title}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="mb-2">
              <span 
                className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
                style={{ 
                  backgroundColor: `${color}20`,
                  color: color 
                }}
              >
                {category}
              </span>
            </div>
            <h4 className="font-serif text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h4>
          </div>
        </div>
        
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
          {subtitle}
        </p>
        
        <div className="mt-auto pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.15em]" style={{ color }}>
            <span>Open Entry</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </GlassCard>
  </Link>
);

/* -------------------------------------------------------------------------- */
/* RECENT CONTENT SECTION WITH REAL DATA FETCHING                             */
/* -------------------------------------------------------------------------- */

interface RecentContentSectionProps {
  recentPosts: RawContentItem[];
  recentBooks: RawContentItem[];
}

const RecentContentSection: React.FC<RecentContentSectionProps> = ({ recentPosts, recentBooks }) => {
  const getHref = (kind: ContentKind, slug: string): string => {
    if (kind === "blog") return `/blog/${slug}`;
    return `/${kind}s/${slug}`;
  };

  const processRecentItem = (item: RawContentItem, kind: ContentKind) => {
    const slug = item.slug || item._raw?.flattenedPath?.split('/').pop() || '';
    return {
      title: item.title || "Untitled",
      href: getHref(kind, slug),
      date: item.date ? new Date(item.date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }) : "",
      excerpt: item.excerpt || item.description || "",
      kind,
    };
  };

  if (recentPosts.length === 0 && recentBooks.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
            <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
              Latest Additions
            </span>
          </div>
          <h2 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
            Recently Published
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
            Fresh perspectives and newly released materials from the ongoing work.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Recent Essays */}
          {recentPosts.length > 0 && (
            <div>
              <h3 className="mb-6 font-serif text-2xl font-bold text-gray-900 dark:text-white">
                Recent Essays
              </h3>
              <div className="space-y-4">
                {recentPosts.slice(0, 3).map((post, index) => {
                  const item = processRecentItem(post, "blog");
                  return (
                    <Link key={index} href={item.href} className="group block">
                      <GlassCard className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-serif text-lg font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                              {item.title}
                            </h4>
                            {item.excerpt && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {item.excerpt}
                              </p>
                            )}
                          </div>
                          <span className="text-amber-600 opacity-70 transition-transform group-hover:translate-x-1 dark:text-amber-400">
                            →
                          </span>
                        </div>
                        {item.date && (
                          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500">
                            Published {item.date}
                          </div>
                        )}
                      </GlassCard>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Books */}
          {recentBooks.length > 0 && (
            <div>
              <h3 className="mb-6 font-serif text-2xl font-bold text-gray-900 dark:text-white">
                Recent Volumes
              </h3>
              <div className="space-y-4">
                {recentBooks.slice(0, 3).map((book, index) => {
                  const item = processRecentItem(book, "book");
                  return (
                    <Link key={index} href={item.href} className="group block">
                      <GlassCard className="p-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-serif text-lg font-semibold text-gray-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                              {item.title}
                            </h4>
                            {item.excerpt && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                                {item.excerpt}
                              </p>
                            )}
                          </div>
                          <span className="text-violet-600 opacity-70 transition-transform group-hover:translate-x-1 dark:text-violet-400">
                            →
                          </span>
                        </div>
                        {item.date && (
                          <div className="mt-4 pt-3 border-t border-white/10 text-xs text-gray-500">
                            Released {item.date}
                          </div>
                        )}
                      </GlassCard>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE WITH ENHANCED DATA FETCHING                                      */
/* -------------------------------------------------------------------------- */

interface HomePageProps {
  recentPosts: RawContentItem[];
  recentBooks: RawContentItem[];
  featuredDownloads: RawContentItem[];
}

const HomePage: NextPage<HomePageProps> = ({ 
  recentPosts, 
  recentBooks, 
  featuredDownloads 
}) => {
  const siteTitle = "Abraham of London";
  const siteTagline =
    "Canon, ventures, and structural tools for fathers, founders, and builders of legacy.";

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Layout title={siteTitle}>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-lg text-amber-400">Loading...</div>
        </div>
      </Layout>
    );
  }

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
        <meta name="theme-color" content="#ffffff" />
      </Head>

      {/* -------------------------------------------------------------------
       1. PRIMARY HERO
      -------------------------------------------------------------------- */}
      <section className="relative min-h-[95vh] overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-16 lg:grid-cols-5">
            {/* Left – copy */}
            <div className="lg:col-span-2 max-w-xl">
              <div className="mb-8">
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <div className="text-lg text-amber-600 dark:text-amber-400">
                    𓆓
                  </div>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                    Library of Applied Wisdom
                  </span>
                </div>

                <h1 className="mb-6 font-serif text-4xl font-bold leading-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                  Abraham of London
                  <span className="mt-4 block text-2xl font-normal text-gray-600 dark:text-gray-300 sm:text-3xl lg:text-4xl">
                    Structural thinking for fathers, founders,
                    <br className="hidden sm:block" />
                    and builders of legacy.
                  </span>
                </h1>

                <p className="mb-10 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  If you carry responsibility for a family, a company, or a
                  community, this is the room where faith, history, strategy,
                  and markets get put to work — not just discussed.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/canon"
                  className="group inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-gray-900 to-black px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-gray-900/30 dark:from-amber-600 dark:to-amber-700 dark:hover:shadow-amber-600/30"
                >
                  <span>Enter the Canon</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    ↠
                  </span>
                </Link>
                <Link
                  href="/consulting"
                  className="group inline-flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  <span>Work with Abraham</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Right – hero image */}
            <div className="lg:col-span-3 relative">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-2xl dark:border-gray-800">
                <div className="relative aspect-[16/9] w-full">
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London — Canon, ventures, and structural tools for builders of legacy"
                    width={1600}
                    height={900}
                    priority
                    className="h-full w-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                </div>
                <div className="border-t border-gray-100 bg-gradient-to-r from-white to-gray-50 p-5 text-center dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Built for men who refuse to outsource responsibility — to the
                    state, the culture, or the algorithm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR */}
      <section className="border-y border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider variant="ornate" />

      {/* 3. CANON SPOTLIGHT - ENHANCED */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                Entry into the Canon
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              Begin with the Prelude & Entry Pieces
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              The Canon opens through a limited-release Prelude and three
              foundational entry pieces that frame the journey.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-4">
            {/* Primary Spotlight Card */}
            <div className="lg:col-span-2">
              <CanonPrimaryCard />
            </div>

            {/* Three Canon Entry Cards */}
            <div className="lg:col-span-2 space-y-4">
              <CanonEntryCard
                title="Builder's Catechism"
                subtitle="Essential questions and answers for men building families, ventures, and enduring institutions."
                href="/canon/builders-catechism"
                imageSrc="/assets/images/canon/builders-catechism-cover.jpg"
                category="Catechism"
                color="#3B82F6" // Blue
              />
              <CanonEntryCard
                title="Canon Campaign"
                subtitle="The strategic invitation and long-game architecture behind the multi-volume Canon project."
                href="/canon/canon-campaign"
                imageSrc="/assets/images/canon/canon-campaign-cover.jpg"
                category="Campaign"
                color="#10B981" // Emerald
              />
              <CanonEntryCard
                title="Letter from the Author"
                subtitle="A direct, unvarnished conversation about why this Canon exists and who it is for."
                href="/canon/canon-introduction-letter"
                imageSrc="/assets/images/canon/canon-intro-letter-cover.jpg"
                category="Invitation"
                color="#8B5CF6" // Violet
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. RECENT CONTENT WITH REAL DATA */}
      <RecentContentSection 
        recentPosts={recentPosts.slice(0, 5)}
        recentBooks={recentBooks.slice(0, 5)}
      />

      <SectionDivider />

      {/* 5. SUPPORTING WORKS & RESOURCES */}
      <section className="bg-gradient-to-b from-white to-gray-50 pb-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h3 className="mb-6 font-serif text-2xl font-bold text-gray-900 dark:text-white">
              Supporting Works & Resources
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <ContentCard
                title="Strategic Essays"
                description="Applying first principles to culture, policy, and markets with ruthless pragmatism."
                href="/blog"
                category="Essays"
                color={CONTENT_CATEGORIES.POSTS.color}
                icon="✒"
                kind="blog"
              />
              <ContentCard
                title="Execution Tools"
                description="Playbooks, templates, and frameworks for turning wisdom into action."
                href="/downloads"
                category="Resources"
                color={CONTENT_CATEGORIES.RESOURCES.color}
                icon="⚙"
                kind="download"
              />
              <ContentCard
                title="Applied Narratives"
                description="Memoir, parable, and strategic narrative for men, fathers, and builders."
                href="/books"
                category="Books"
                color={CONTENT_CATEGORIES.BOOKS.color}
                icon="📚"
                kind="book"
              />
              <ContentCard
                title="Strategic Gatherings"
                description="Workshops, salons, and covenants where decisions — not opinions — are the output."
                href="/events"
                category="Events"
                color={CONTENT_CATEGORIES.EVENTS.color}
                icon="🕯"
                kind="event"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 6. COMPACT BOOKS SPOTLIGHT */}
      <section className="border-y border-gray-200 bg-gray-50 py-12 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6 text-center">
            <h3 className="font-serif text-xl font-semibold text-gray-700 dark:text-gray-300">
              Current Projects & Drafts
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Works in progress and narrative experiments currently in
              development
            </p>
          </div>

          <div className="mx-auto grid max-w-2xl gap-3">
            <Link href="/books/fathering-without-fear" className="group block">
              <GlassCard className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src="/assets/images/books/fathering-without-fear.jpg"
                      alt="Fathering Without Fear"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-serif text-sm font-semibold text-gray-900 dark:text-white">
                        Fathering Without Fear
                      </h3>
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        Memoir Draft
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Memoir and strategic narrative for fathers.
                    </p>
                  </div>
                  <div className="text-amber-600 opacity-70 transition-transform group-hover:translate-x-1 dark:text-amber-400">
                    →
                  </div>
                </div>
              </GlassCard>
            </Link>

            <Link href="/books/the-fiction-adaptation" className="group block">
              <GlassCard className="p-4">
                <div className="flex items-start gap-4">
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded-md">
                    <Image
                      src="/assets/images/books/the-fiction-adaptation.jpg"
                      alt="The Fiction Adaptation"
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="font-serif text-sm font-semibold text-gray-900 dark:text-white">
                        The Fiction Adaptation
                      </h3>
                      <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                        Fiction Draft
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      When fiction tells what truth cannot.
                    </p>
                  </div>
                  <div className="text-violet-600 opacity-70 transition-transform group-hover:translate-x-1 dark:text-violet-400">
                    →
                  </div>
                </div>
              </GlassCard>
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider variant="ornate" />

      {/* 7. STRATEGIC FUNNEL */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* 8. VENTURES */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                Execution Arms
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              The Operating Arms
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Alomarada, EndureLuxe, and InnovateHub are the execution arms of
              the Canon — testing grounds for strategy, governance, and
              multi-generational design.
            </p>
          </div>

          <VenturesSection />
        </div>
      </section>

      <SectionDivider />

      {/* 9. MANDATE & ABOUT */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                Philosophy & Background
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              The Mandate & The Man
            </h2>
          </div>

          <div className="space-y-20">
            <MandateStatement />
            <AboutSection />
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-black py-24">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-12">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-200/20 bg-amber-500/10 px-4 py-2">
              <span className="text-sm font-semibold text-amber-300">
                Start Building
              </span>
            </div>
            <h2 className="mb-6 font-serif text-4xl font-bold text-white sm:text-5xl">
              Begin with Volume 1
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
              The Canon begins with architectural first principles. Volume 1
              provides the foundation upon which all subsequent wisdom is built
              — start here.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/books/the-architecture-of-human-purpose"
              className="group inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/30"
            >
              <span>Read Volume 1</span>
              <span className="transition-transform group-hover:translate-x-1">
                ↠
              </span>
            </Link>
            <Link
              href="/content"
              className="group inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-10 py-4 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-gray-800 hover:shadow-lg"
            >
              <span>Browse All Content</span>
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>

          <div className="mx-auto mt-16 max-w-xs border-t border-gray-800 pt-8">
            <Link
              href="/content"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Or browse all content →
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA LOADING WITH SAFE FETCHING                                            */
/* -------------------------------------------------------------------------- */

export const getStaticProps = async () => {
  console.log("[homepage] Building homepage with real data...");

  try {
    // Fetch all data using safeGetData pattern
    const [postsData, booksData, downloadsData] = await Promise.all([
      safeGetData(getAllPostsMeta, "blog posts"),
      safeGetData(getAllBooksMeta, "books"),
      safeGetData(getAllDownloadsMeta, "downloads"),
    ]);

    // Sort by date (newest first)
    const sortByDate = (items: RawContentItem[]) => {
      return items.sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
    };

    // Get recent content (last 10 items)
    const recentPosts = sortByDate(postsData).slice(0, 10);
    const recentBooks = sortByDate(booksData).slice(0, 10);
    const featuredDownloads = downloadsData.filter(item => item.featured).slice(0, 5);

    console.log("[homepage] Data loaded:", {
      posts: recentPosts.length,
      books: recentBooks.length,
      downloads: featuredDownloads.length,
    });

    return {
      props: {
        recentPosts: JSON.parse(JSON.stringify(recentPosts)),
        recentBooks: JSON.parse(JSON.stringify(recentBooks)),
        featuredDownloads: JSON.parse(JSON.stringify(featuredDownloads)),
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error("[homepage] Critical build error:", error);
    return {
      props: {
        recentPosts: [],
        recentBooks: [],
        featuredDownloads: [],
      },
      revalidate: 3600,
    };
  }
};

export default HomePage;