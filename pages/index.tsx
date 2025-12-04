// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import {
  LIBRARY_AESTHETICS,
  SEASONAL_CURATIONS,
  CONTENT_CATEGORIES,
} from "@/lib/content";

import VenturesSection from "@/components/homepage/VenturesSection";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import StatsBar from "@/components/homepage/StatsBar";
import AboutSection from "@/components/homepage/AboutSection";

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
/* EXPANDED CANON SECTION - Multiple Volumes                                 */
/* -------------------------------------------------------------------------- */

const CanonVolumeCard: React.FC<{
  volume: number;
  title: string;
  subtitle: string;
  description: string;
  status: "available" | "forthcoming" | "in-progress";
  color: string;
  href?: string;
}> = ({ volume, title, subtitle, description, status, color, href }) => (
  <div
    className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 ${
      status === "available" ? "cursor-pointer" : "cursor-default"
    }`}
  >
    <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/5 via-emerald-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

    <div className="relative p-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-2">
            <div className="text-lg text-amber-600 dark:text-amber-400">
              📜
            </div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Canon · Volume {volume}
            </span>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {status === "available"
                ? "Available Now"
                : status === "forthcoming"
                ? "Coming Soon"
                : "In Progress"}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mb-2 text-4xl text-gray-300 dark:text-gray-700">
              📚
            </div>
            <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
              Volume {volume}
            </div>
          </div>
        </div>
      </div>

      <h3 className="mb-2 font-serif text-lg font-bold text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
        {subtitle}
      </p>

      <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        {description}
      </p>

      <div className="mt-auto">
        {status === "available" && href ? (
          <Link
            href={href}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gray-900 to-black py-2.5 text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-gray-900/30 dark:from-amber-600 dark:to-amber-700 dark:hover:shadow-amber-600/30"
          >
            Explore Volume {volume}
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            {status === "forthcoming" ? "Coming Soon" : "In Development"}
          </div>
        )}
      </div>
    </div>
  </div>
);

const ContentCard: React.FC<{
  title: string;
  description: string;
  href: string;
  category: string;
  color: string;
  icon: string;
}> = ({ title, description, href, category, color, icon }) => (
  <Link href={href} className="group block h-full">
    <article className="relative h-full overflow-hidden rounded-xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div
        className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-30"
        style={{ color }}
      />

      <div className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-xl" style={{ color }}>
              {icon}
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

        <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
          <span className="font-medium opacity-70" style={{ color }}>
            Explore
          </span>
          <span
            className="font-medium transition-transform group-hover:translate-x-1"
            style={{ color }}
          >
            →
          </span>
        </div>
      </div>
    </article>
  </Link>
);

/* -------------------------------------------------------------------------- */
/* COMPACT BOOKS SPOTLIGHT                                                   */
/* -------------------------------------------------------------------------- */

const CompactBookCard: React.FC<{
  title: string;
  subtitle: string;
  href: string;
  tag: string;
}> = ({ title, subtitle, href, tag }) => (
  <Link href={href} className="group block">
    <article className="flex items-start gap-4 rounded-lg border border-gray-200 bg-white p-4 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10">
        <div className="text-lg text-amber-600 dark:text-amber-400">📖</div>
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center gap-2">
          <h3 className="font-serif text-sm font-semibold text-gray-900 dark:text-white">
            {title}
          </h3>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wider text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            {tag}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p>
      </div>
      <div className="text-amber-600 opacity-70 transition-transform group-hover:translate-x-1 dark:text-amber-400">
        →
      </div>
    </article>
  </Link>
);

/* -------------------------------------------------------------------------- */
/* CANON ONBOARDING CARDS (MINIBOOK + 3 ENTRIES)                              */
/* -------------------------------------------------------------------------- */

const CanonOnboardingCard: React.FC<{
  title: string;
  subtitle: string;
  href: string;
  coverImage: string;
  badge: string;
}> = ({ title, subtitle, href, coverImage, badge }) => (
  <Link href={href} className="group block h-full">
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={coverImage}
          alt={title}
          fill
          className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-amber-200">
          {badge}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 font-serif text-sm font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          {subtitle}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-[0.75rem] font-semibold text-gray-700 dark:border-gray-800 dark:text-gray-300">
          <span>Open</span>
          <span className="transition-transform group-hover:translate-x-1">
            ↗
          </span>
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
            {/* Left copy */}
            <div className="max-w-xl lg:col-span-2">
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
                  Enter the Canon
                  <span className="transition-transform group-hover:translate-x-1">
                    ↠
                  </span>
                </Link>
                <Link
                  href="/consulting"
                  className="group inline-flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Work with Abraham
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>

            {/* Right hero image */}
            <div className="relative lg:col-span-3">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-2xl dark:border-gray-800">
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London — Canon, ventures, and structural tools for builders of legacy"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 75vw"
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

      {/* -------------------------------------------------------------------
       3. CANON SECTION
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                The Architectural Framework
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              The Canon: Structural Wisdom in Multiple Volumes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              A multi-volume architecture for purpose, institutions, and human
              destiny — not theoretical musings but structural blueprints for
              execution.
            </p>
          </div>

          {/* Multi-volume grid */}
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <CanonVolumeCard
                volume={1}
                title="The Architecture of Human Purpose"
                subtitle="Foundations for Flourishing"
                description="The prelude to the Canon — a structural map for those who know that human flourishing is not accidental but architectural."
                status="available"
                color="amber"
                href="/books/the-architecture-of-human-purpose"
              />
            </div>

            <CanonVolumeCard
              volume={2}
              title="The Institutions of Legacy"
              subtitle="Building Structures That Endure"
              description="Governance, succession, and institutional design for multi-generational impact beyond individual lifespan."
              status="forthcoming"
              color="emerald"
            />

            <CanonVolumeCard
              volume={3}
              title="The Markets of Meaning"
              subtitle="Economics with a Human Face"
              description="Reclaiming markets from abstraction — wealth creation as moral act, trade as civilizational vehicle."
              status="in-progress"
              color="blue"
            />
          </div>

          {/* Supporting works */}
          <div className="mb-10">
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

          {/* Canon entry route – minibook + 3 key pieces */}
          <div className="mb-10">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
              <h3 className="font-serif text-xl font-semibold text-gray-900 dark:text-white">
                Your First Steps into the Canon
              </h3>
              <p className="max-w-xl text-xs text-gray-600 dark:text-gray-400">
                Start with the Prelude MiniBook, then move through the
                Builder&apos;s Catechism, the Canon Campaign, and the
                Introduction Letter. Together they frame the entire project —
                theology, strategy, and mandate.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <CanonOnboardingCard
                title="Prelude MiniBook — Limited Release Edition"
                subtitle="A distilled, high-level preview of the full Canon: purpose, civilisation, governance, spiritual alignment, and human destiny."
                href="/books/the-architecture-of-human-purpose"
                coverImage="/assets/images/books/the-architecture-of-human-purpose.jpg"
                badge="Prelude Minibook"
              />

              <CanonOnboardingCard
                title="Builder's Catechism"
                subtitle="Forty-nine questions and answers that give language to what it means to build with God, history, and heirs in view."
                href="/canon/builders-catechism"
                coverImage="/assets/images/canon/builders-catechism-cover.jpg"
                badge="Catechism"
              />

              <CanonOnboardingCard
                title="Canon Campaign"
                subtitle="The strategic brief for the Canon — what it is, why it exists, and the kind of men it is summoning."
                href="/canon/canon-campaign"
                coverImage="/assets/images/canon/canon-campaign-cover.jpg"
                badge="Campaign"
              />

              <CanonOnboardingCard
                title="Canon Introduction Letter"
                subtitle="A personal letter from the author, setting expectations for how to read, wrestle with, and apply the Canon."
                href="/canon/canon-introduction-letter"
                coverImage="/assets/images/canon/canon-intro-letter-cover.jpg"
                badge="Author’s Letter"
              />
            </div>
          </div>

          {/* Canon description */}
          <div className="rounded-xl border border-gray-200 bg-gradient-to-r from-white to-gray-50 p-6 dark:border-gray-800 dark:from-gray-900 dark:to-gray-950">
            <div className="flex items-start gap-4">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10">
                <div className="text-xl text-amber-600 dark:text-amber-400">
                  ⚖
                </div>
              </div>
              <div>
                <h3 className="mb-3 font-serif text-xl font-bold text-gray-900 dark:text-white">
                  Why The Canon Matters
                </h3>
                <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  The Canon is not merely a collection of ideas but an
                  architectural system. Each volume builds upon the last,
                  creating a comprehensive framework for understanding and
                  shaping human destiny. It is designed for builders who
                  recognise that lasting impact requires structural thinking,
                  not just inspirational content. Volume 1 lays the foundation,
                  while the Prelude, Catechism, Campaign, and Introduction
                  Letter help you approach the work with clarity and resolve.
                </p>
                <Link
                  href="/canon"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                >
                  Explore the complete Canon structure
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BOOKS SPOTLIGHT (unchanged structurally) */}
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
            <CompactBookCard
              title="Fathering Without Fear"
              subtitle="Memoir and strategic narrative for fathers"
              href="/books/fathering-without-fear"
              tag="Memoir Draft"
            />
            <CompactBookCard
              title="The Fiction Adaptation"
              subtitle="When fiction tells what truth cannot"
              href="/books/the-fiction-adaptation"
              tag="Fiction Draft"
            />
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

      {/* 6. VENTURES */}
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
              className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/30"
            >
              Read Volume 1
              <span className="transition-transform group-hover:translate-x-1">
                ↠
              </span>
            </Link>
            <Link
              href="/canon"
              className="inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-10 py-4 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-gray-800 hover:shadow-lg"
            >
              Explore All Volumes
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