// pages/index.tsx - MODERNIZED RESPONSIVE VERSION
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

// Device detection hook for responsive design
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

const VenturesSection = dynamic(
  () => import("@/components/homepage/VenturesSection"),
  {
    ssr: false,
    loading: () => (
      <section className="py-12 md:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 md:mb-12 text-center">
            <p className="mb-3 md:mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
              Ventures
            </p>
            <h2 className="mb-3 md:mb-4 font-serif text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 dark:text-white">
              Where philosophy becomes operating system
            </h2>
            <p className="mx-auto max-w-2xl text-base md:text-lg text-gray-600 dark:text-gray-300">
              Alomarada, Endureluxe, and InnovateHub are not side projects.
              They are infrastructure.
            </p>
          </div>
          <div className="grid gap-6 md:gap-8 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 md:h-64 rounded-xl md:rounded-2xl border border-gray-200 dark:border-gray-700 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    ),
  },
);

const StrategicFunnelStrip = dynamic(
  () => import("@/components/homepage/StrategicFunnelStrip"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 md:h-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 animate-pulse" />
    ),
  },
);

const StatsBar = dynamic(() => import("@/components/homepage/StatsBar"), {
  ssr: false,
  loading: () => (
    <div className="h-16 md:h-24 border-y border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 animate-pulse" />
  ),
});

const AboutSection = dynamic(
  () => import("@/components/homepage/AboutSection"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 md:h-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 animate-pulse" />
    ),
  },
);

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* SECTION DIVIDER                                                            */
/* -------------------------------------------------------------------------- */

const SectionDivider: React.FC = () => {
  const deviceType = useDeviceType();

  return (
    <div
      className={`relative overflow-hidden ${
        deviceType === "mobile" ? "h-12" : "h-16"
      }`}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
        <div className="mx-3 md:mx-6 flex items-center gap-2">
          <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
          <div className="h-1 w-1 rounded-full bg-gradient-to-r from-amber-300 to-amber-500" />
          <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-gradient-to-r from-amber-400 to-amber-600" />
        </div>
        <div className="h-px w-16 md:w-32 bg-gradient-to-r from-transparent via-gray-300 to-transparent dark:via-gray-700" />
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CANON ENTRY CARDS                                                          */
/* -------------------------------------------------------------------------- */

type CanonEntryType = "catechism" | "campaign" | "letter";

const canonEntryColors: Record<
  CanonEntryType,
  { bg: string; text: string; border: string; accent: string }
> = {
  catechism: {
    bg: "bg-blue-50 dark:bg-blue-900/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/30",
    accent: "bg-gradient-to-r from-blue-500 to-blue-600",
  },
  campaign: {
    bg: "bg-emerald-50 dark:bg-emerald-900/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/30",
    accent: "bg-gradient-to-r from-emerald-500 to-emerald-600",
  },
  letter: {
    bg: "bg-purple-50 dark:bg-purple-900/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800/30",
    accent: "bg-gradient-to-r from-purple-500 to-purple-600",
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
        className={`flex items-center gap-3 md:gap-4 rounded-xl md:rounded-2xl border ${colors.border} ${colors.bg} p-3 md:p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95`}
      >
        <div className="relative h-16 w-12 md:h-20 md:w-14 overflow-hidden rounded border border-gray-200 dark:border-gray-700">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="(max-width: 768px) 60px, 80px"
            className="object-cover object-center"
            style={{ objectFit: "cover", objectPosition: "center" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1 flex items-center gap-1 md:gap-2">
            <h4 className="font-serif text-sm md:text-sm font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h4>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[0.6rem] md:text-[0.65rem] font-bold uppercase tracking-wider ${colors.text} whitespace-nowrap`}
            >
              {type === "catechism"
                ? "Q&A"
                : type === "campaign"
                ? "Strategy"
                : "Personal"}
            </span>
          </div>
          <p className="mb-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
            {subtitle}
          </p>
          <div
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 md:px-3 md:py-1 text-[0.65rem] md:text-[0.7rem] font-semibold uppercase tracking-[0.15em] md:tracking-[0.18em] text-white ${colors.accent} whitespace-nowrap`}
          >
            Canon Entry
          </div>
        </div>
        <div
          className={`${colors.text} opacity-70 transition-transform group-hover:translate-x-1 md:group-hover:translate-x-2 flex-shrink-0`}
        >
          →
        </div>
      </article>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* CANON PRIMARY CARD                                                         */
/* -------------------------------------------------------------------------- */

const CanonPrimaryCard: React.FC = () => {
  const deviceType = useDeviceType();

  return (
    <Link
      href="/books/the-architecture-of-human-purpose"
      className="group block h-full"
    >
      <article className="relative flex h-full flex-col overflow-hidden rounded-2xl md:rounded-3xl border border-amber-200 dark:border-amber-800/30 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 shadow-lg md:shadow-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl md:hover:shadow-3xl">
        <div className="p-4 md:p-6 lg:p-8">
          {deviceType === "mobile" ? (
            // Mobile layout
            <div className="space-y-4">
              <div className="flex items-center justify-center">
                <div className="relative aspect-[3/4] w-48 rounded-xl bg-gradient-to-br from-amber-500/10 via-transparent to-gray-200 dark:from-amber-500/5 dark:to-gray-800">
                  <div className="absolute inset-[3%] overflow-hidden rounded-lg border border-amber-200 dark:border-amber-800/30">
                    <Image
                      src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                      alt="The Architecture of Human Purpose — Prelude MiniBook"
                      fill
                      sizes="(max-width: 768px) 90vw"
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                    Entry into the Canon
                  </span>
                  <span className="rounded-full border border-amber-300 dark:border-amber-800/30 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600/80 dark:text-amber-400/80">
                    Volume I · Prelude
                  </span>
                </div>

                <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">
                  The Architecture of Human Purpose
                </h3>

                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-600/80 dark:text-amber-400/80">
                  Canon · Foundations of Purpose
                </p>

                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  A distilled prelude to the Canon — for men who know that human
                  flourishing is designed, not accidental.
                </p>

                <div className="flex items-center justify-between border-t border-amber-200 dark:border-amber-800/20 pt-3">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    Foundational Text
                  </span>
                  <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 transition-colors group-hover:text-amber-500">
                    <span className="text-sm font-semibold">Open</span>
                    <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Desktop/Tablet layout
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
              <div className="relative flex items-center justify-center">
                <div className="relative aspect-[3/4] w-full max-w-sm rounded-xl md:rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-gray-200 dark:from-amber-500/5 dark:to-gray-800">
                  <div className="absolute inset-[3%] md:inset-[6%] overflow-hidden rounded-lg md:rounded-xl border border-amber-200 dark:border-amber-800/30">
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
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                    Entry into the Canon
                  </span>
                  <span className="rounded-full border border-amber-300 dark:border-amber-800/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-600/80 dark:text-amber-400/80">
                    Volume I · Prelude
                  </span>
                </div>

                <h3 className="font-serif text-xl md:text-2xl lg:text-3xl font-light text-gray-900 dark:text-white">
                  The Architecture of Human Purpose
                </h3>

                <p className="text-xs md:text-sm font-semibold uppercase tracking-[0.18em] text-amber-600/80 dark:text-amber-400/80">
                  Canon · Foundations of Purpose
                </p>

                <p className="text-sm md:text-base leading-relaxed text-gray-600 dark:text-gray-300">
                  A distilled, high-level prelude to the Canon — written for men who
                  know that human flourishing is not accidental but designed. This is
                  the reference point for everything else on the site.
                </p>

                <div className="flex items-center justify-between border-t border-amber-200 dark:border-amber-800/20 pt-4">
                  <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    Foundational Text · Limited Release
                  </span>
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 transition-colors group-hover:text-amber-500">
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

/* -------------------------------------------------------------------------- */
/* TYPES & DATA FETCHING                                                      */
/* -------------------------------------------------------------------------- */

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
      featuredBooks: allBooks.slice(0, 2),
      latestShorts: publishedShorts.slice(0, 3),
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/* HOME PAGE                                                                  */
/* -------------------------------------------------------------------------- */

const HomePage: NextPage<HomePageProps> = ({
  latestPosts,
  featuredBooks,
  latestShorts,
}) => {
  const deviceType = useDeviceType();
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
        <meta name="theme-color" content="#ffffff" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
      </Head>

      {/* HERO */}
      {/* ... rest of your JSX stays exactly as in your current file ... */}
      {/* I’ve left everything below unchanged, since the build issue was purely data access. */}
      {/* START of your existing JSX sections */}
      {/* HERO */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
        {/* [UNCHANGED CONTENT FROM YOUR FILE DOWN TO THE END] */}
      </section>

      {/* STATS */}
      {/* ... KEEP all remaining sections as in your current file ... */}

      {/* I’m not expanding the rest just to avoid flooding you – you can paste
          all your existing sections (Stats, Canon Spotlight, Shorts, Essays,
          Books, Mandate, Ventures, Strip, About, global <style jsx> etc.)
          under this comment block unchanged. */}
    </Layout>
  );
};

export default HomePage;