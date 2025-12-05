// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import dynamic from 'next/dynamic';

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import {
  CONTENT_CATEGORIES,
} from "@/lib/content";

// Dynamic imports for better performance
const VenturesSection = dynamic(() => import('@/components/homepage/VenturesSection'), {
  ssr: false,
  loading: () => (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70 mb-4">
            Ventures
          </p>
          <h2 className="font-serif text-3xl font-light tracking-tight text-cream sm:text-4xl mb-4">
            Where philosophy becomes operating system
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-cream/75">
            Alomarada, Endureluxe, and InnovateHub are not side projects.
          </p>
        </div>
        <div className="grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 rounded-2xl border border-white/10 bg-gradient-to-b from-slate-950/60 to-slate-900/40 animate-pulse"></div>
          ))}
        </div>
      </div>
    </section>
  ),
});

const StrategicFunnelStrip = dynamic(() => import('@/components/homepage/StrategicFunnelStrip'), {
  ssr: false,
  loading: () => <div className="py-20 h-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 animate-pulse"></div>,
});

const StatsBar = dynamic(() => import('@/components/homepage/StatsBar'), {
  ssr: false,
  loading: () => <div className="border-y border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900 h-24 animate-pulse"></div>,
});

const AboutSection = dynamic(() => import('@/components/homepage/AboutSection'), {
  ssr: false,
  loading: () => <div className="space-y-20"><div className="h-64 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 animate-pulse"></div></div>,
});

// Static imports for critical components
import ContentCard from "@/components/ContentCard";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* LUXURY DESIGN SYSTEM                                                       */
/* -------------------------------------------------------------------------- */

const SectionDivider: React.FC = () => (
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

/* -------------------------------------------------------------------------- */
/* CANON SPOTLIGHT - COLOR-CODED BY VOLUME TYPE                              */
/* -------------------------------------------------------------------------- */

const CanonPrimaryCard: React.FC = () => (
  <Link href="/books/the-architecture-of-human-purpose" className="group block h-full">
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-amber-200/30 bg-gradient-to-br from-amber-50 to-white shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl dark:border-amber-800/30 dark:from-gray-900 dark:to-gray-950">
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/20 dark:to-gray-900">
        <div className="relative h-full w-full">
          <Image
            src="/assets/images/books/the-architecture-of-human-purpose.jpg"
            alt="The Architecture of Human Purpose — Prelude MiniBook"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain object-center p-6"
            priority
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-black/10 to-transparent" />
        <div className="absolute left-4 bottom-4">
          <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg">
            Volume I · Prelude MiniBook
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <span className="text-lg text-amber-600 dark:text-amber-400">⚖</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
            Canon · Foundation Volume
          </span>
        </div>
        <h3 className="mb-2 font-serif text-2xl font-bold text-gray-900 dark:text-white">
          The Architecture of Human Purpose
        </h3>
        <p className="mb-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300">
          A distilled, high-level prelude to the Canon — for men who know that
          human flourishing is not accidental, but architectural.
        </p>
        <div className="mt-auto flex items-center justify-between pt-4 text-sm font-semibold text-amber-600 dark:text-amber-400">
          <span>Enter through the Prelude</span>
          <span className="transition-transform group-hover:translate-x-2">↠</span>
        </div>
      </div>
    </article>
  </Link>
);

// Canon entry types with color coding
type CanonEntryType = "catechism" | "campaign" | "letter";

const canonEntryColors: Record<CanonEntryType, { bg: string; text: string; border: string; accent: string }> = {
  catechism: {
    bg: "bg-blue-50 dark:bg-blue-900/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800/30",
    accent: "bg-gradient-to-r from-blue-500 to-blue-600"
  },
  campaign: {
    bg: "bg-emerald-50 dark:bg-emerald-900/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800/30",
    accent: "bg-gradient-to-r from-emerald-500 to-emerald-600"
  },
  letter: {
    bg: "bg-purple-50 dark:bg-purple-900/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800/30",
    accent: "bg-gradient-to-r from-purple-500 to-purple-600"
  }
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
      <article className={`flex items-center gap-4 rounded-2xl border-2 ${colors.border} ${colors.bg} p-4 transition-all hover:-translate-y-0.5 hover:shadow-xl`}>
        <div className="relative h-20 w-14 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
          <Image
            src={imageSrc}
            alt={title}
            fill
            sizes="80px"
            className="object-cover object-center"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
          />
        </div>
        <div className="flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h4 className="font-serif text-sm font-semibold text-gray-900 dark:text-white">
              {title}
            </h4>
            <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${colors.text}`}>
              {type === "catechism" ? "Q&A" : type === "campaign" ? "Strategy" : "Personal"}
            </span>
          </div>
          <p className="mb-2 text-xs text-gray-600 dark:text-gray-400">
            {subtitle}
          </p>
          <div className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-white ${colors.accent}`}>
            Canon Entry
          </div>
        </div>
        <div className={colors.text + " opacity-70 transition-transform group-hover:translate-x-2"}>
          →
        </div>
      </article>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* CANON SPOTLIGHT - BUILD-SAFE PREMIUM DESIGN                               */
/* -------------------------------------------------------------------------- */

const CanonPrimaryCard: React.FC = () => (
  <Link href="/books/the-architecture-of-human-purpose" className="group block h-full">
    <article className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-gray-200/10 bg-black shadow-2xl transition-all duration-500 hover:-translate-y-1 hover:shadow-3xl dark:border-gray-800/20">
      {/* Full-bleed image */}
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src="/assets/images/books/the-architecture-of-human-purpose.jpg"
          alt="The Architecture of Human Purpose — Prelude MiniBook"
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        
        <div className="absolute left-6 bottom-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-2 text-sm font-bold uppercase tracking-[0.2em] text-white">
              Volume I · Prelude
            </span>
            <span className="rounded-full border border-amber-400/40 bg-black/60 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
              Limited Release
            </span>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex flex-1 flex-col p-6 bg-gradient-to-b from-gray-900 to-black">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-amber-500/10 p-2">
            <span className="text-lg text-amber-500">𓆓</span>
          </div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            Canon · Foundation Volume
          </span>
        </div>
        
        <h3 className="mb-3 font-serif text-2xl font-bold text-white">
          The Architecture of Human Purpose
        </h3>
        
        <p className="mb-6 text-sm leading-relaxed text-gray-300">
          A distilled, high-level prelude to the Canon — for men who know that
          human flourishing is not accidental, but architectural.
        </p>
        
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-800/50">
          <span className="text-sm font-medium text-gray-400">Foundational Text</span>
          <div className="flex items-center gap-2 text-amber-400 group-hover:text-amber-300 transition-colors">
            <span className="text-sm font-semibold">Enter Volume</span>
            <span className="text-xl transition-transform duration-300 group-hover:translate-x-2">↠</span>
          </div>
        </div>
      </div>
    </article>
  </Link>
);

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

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
                    style={{ objectFit: 'cover', objectPosition: 'center' }}
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

      <SectionDivider />

      {/* 3. CANON SPOTLIGHT - COLOR-CODED */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                Entry into the Canon
              </div>
            </div>
            <h2 className="mb-4 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              Begin with the Prelude & Entry Pieces
            </h2>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              The Canon opens through a limited-release Prelude and three
              entry pieces that frame the journey — each with distinct purpose.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <CanonPrimaryCard />
            </div>
            <div className="space-y-4">
              <CanonEntryCard
                title="Builder's Catechism"
                subtitle="Core questions and answers for men who build — families, ventures, and institutions."
                href="/canon/builders-catechism"
                imageSrc="/assets/images/canon/builders-catechism-cover.jpg"
                type="catechism"
              />
              <CanonEntryCard
                title="Canon Campaign"
                subtitle="The strategic invitation and long-game architecture behind the Canon project."
                href="/canon/canon-campaign"
                imageSrc="/assets/images/canon/canon-campaign-cover.jpg"
                type="campaign"
              />
              <CanonEntryCard
                title="Letter from the Author"
                subtitle="A direct, unvarnished conversation about why this Canon exists and who it is for."
                href="/canon/canon-introduction-letter"
                imageSrc="/assets/images/canon/canon-intro-letter-cover.jpg"
                type="letter"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Supporting works & resources - COLOR-CODED BY CATEGORY */}
      <section className="bg-gradient-to-b from-white to-gray-50 pb-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-600 dark:text-gray-400">
                Supporting Works & Resources
              </div>
            </div>
            <h3 className="mb-6 font-serif text-3xl font-bold text-gray-900 dark:text-white">
              Applied Wisdom Across Mediums
            </h3>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <ContentCard
              title="Strategic Essays"
              description="Applying first principles to culture, policy, and markets with ruthless pragmatism."
              href="/blog"
              category="Essays"
              color={CONTENT_CATEGORIES.POSTS.color}
              icon="✒"
            />
            <ContentCard
              title="Execution Tools"
              description="Playbooks, templates, and frameworks for turning wisdom into action."
              href="/downloads"
              category="Resources"
              color={CONTENT_CATEGORIES.RESOURCES.color}
              icon="⚙"
            />
            <ContentCard
              title="Applied Narratives"
              description="Memoir, parable, and strategic narrative for men, fathers, and builders."
              href="/books"
              category="Books"
              color={CONTENT_CATEGORIES.BOOKS.color}
              icon="📚"
            />
            <ContentCard
              title="Strategic Gatherings"
              description="Workshops, salons, and covenants where decisions — not opinions — are the output."
              href="/events"
              category="Events"
              color={CONTENT_CATEGORIES.EVENTS.color}
              icon="🕯"
            />
          </div>
        </div>
      </section>

      {/* 4. COMPACT BOOKS SPOTLIGHT - COLOR-CODED */}
      <section className="border-y border-gray-200 bg-gradient-to-b from-gray-50 to-white py-24 dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                In Development
              </div>
            </div>
            <h3 className="mb-4 font-serif text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              Current Projects & Drafts
            </h3>
            <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Works in progress and narrative experiments currently shaping the edges
              of the Canon.
            </p>
          </div>

          <div className="mx-auto grid max-w-4xl gap-8 sm:grid-cols-2">
            <CompactBookCard
              title="Fathering Without Fear"
              subtitle="Memoir and strategic narrative for fathers navigating leadership in an age of uncertainty."
              href="/books/fathering-without-fear"
              type="memoir"
              imageSrc="/assets/images/books/fathering-without-fear.jpg"
              status="Early Draft"
              progress={65}
            />
            <CompactBookCard
              title="The Fiction Adaptation"
              subtitle="When fiction tells what truth cannot — a narrative exploration of strategic faith in hostile times."
              href="/books/the-fiction-adaptation"
              type="fiction"
              imageSrc="/assets/images/books/the-fiction-adaptation.jpg"
              status="Research Phase"
              progress={35}
            />
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/works-in-progress"
              className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <span>View all projects in development</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* 5. STRATEGIC FUNNEL */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* 6. VENTURES - DYNAMICALLY LOADED */}
      <VenturesSection />

      <SectionDivider />

      {/* 7. MANDATE & ABOUT */}
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

      {/* 8. FINAL CTA */}
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
              href="/canon"
              className="group inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-10 py-4 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-gray-800 hover:shadow-lg"
            >
              <span>Explore All Volumes</span>
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

export default HomePage;