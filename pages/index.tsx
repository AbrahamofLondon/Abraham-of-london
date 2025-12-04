import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import VenturesSection from "@/components/homepage/VenturesSection";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import StatsBar from "@/components/homepage/StatsBar";
import AboutSection from "@/components/homepage/AboutSection";

import {
  LIBRARY_AESTHETICS,
  SEASONAL_CURATIONS,
  CONTENT_CATEGORIES,
} from "@/lib/content";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* LUXURY SUB-COMPONENTS                                                      */
/* -------------------------------------------------------------------------- */

const GoldFoilAccent: React.FC<{ position: "top" | "bottom" }> = ({
  position,
}) => (
  <div
    className={`pointer-events-none absolute ${
      position === "top" ? "top-0" : "bottom-0"
    } left-0 right-0 h-px overflow-hidden`}
  >
    <div
      className="h-full w-full"
      style={{
        background: `repeating-linear-gradient(90deg, 
          transparent, 
          transparent 8px, 
          ${LIBRARY_AESTHETICS.colors.primary.saffron}40 8px, 
          ${LIBRARY_AESTHETICS.colors.primary.saffron}40 16px
        )`,
      }}
    />
  </div>
);

const SectionDivider: React.FC = () => (
  <div className="relative h-12">
    <div className="absolute inset-0 flex items-center justify-center">
      <div
        className="h-px w-32"
        style={{
          background: `linear-gradient(90deg, 
            transparent, 
            ${LIBRARY_AESTHETICS.colors.primary.saffron}40, 
            transparent
          )`,
        }}
      />
      <div
        className="mx-4 text-xl opacity-50"
        style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
      >
        𓆓
      </div>
      <div
        className="h-px w-32"
        style={{
          background: `linear-gradient(90deg, 
            transparent, 
            ${LIBRARY_AESTHETICS.colors.primary.saffron}40, 
            transparent
          )`,
        }}
      />
    </div>
  </div>
);

const CanonVolumeCard: React.FC = () => (
  <div className="relative group">
    {/* Glow frame */}
    <div
      className="pointer-events-none absolute -inset-4 rounded-3xl opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-20"
      style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron }}
    />

    <div
      className="relative overflow-hidden rounded-2xl border backdrop-blur-xl"
      style={{
        borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9)",
      }}
    >
      {/* Spine accent */}
      <div
        className="pointer-events-none absolute left-0 top-1/4 bottom-1/4 w-1"
        style={{
          background: `linear-gradient(to bottom, 
            transparent 0%, 
            ${LIBRARY_AESTHETICS.colors.primary.saffron} 30%, 
            ${LIBRARY_AESTHETICS.colors.primary.saffron} 70%, 
            transparent 100%
          )`,
        }}
      />

      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="rounded-lg p-2"
              style={{
                backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15`,
              }}
            >
              <span
                className="text-lg"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                ⚖
              </span>
            </div>
            <span
              className="text-xs font-medium uppercase tracking-[0.22em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              Canon · Volume I
            </span>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs"
            style={{
              backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}18`,
              color: LIBRARY_AESTHETICS.colors.primary.saffron,
            }}
          >
            Prelude Minibook
          </div>
        </div>

        <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-black">
          <Image
            src="/assets/images/books/the-architecture-of-human-purpose.jpg"
            alt="The Architecture of Human Purpose — Canon Prelude"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 320px"
          />
        </div>

        <h3
          className="mb-2 font-serif text-lg font-medium"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          The Architecture of Human Purpose
        </h3>
        <p
          className="mb-4 text-xs leading-relaxed"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          A high-level prelude to the ten-volume Canon — mapping the structural
          logic of purpose, civilisation, governance, and destiny.
        </p>

        <div className="flex gap-2">
          <Link
            href="/books/the-architecture-of-human-purpose"
            className="flex-1 rounded-lg py-2 text-center text-sm font-medium transition-all hover:scale-105"
            style={{
              backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron,
              color: "#0f172a",
            }}
          >
            Open Prelude
          </Link>
          <Link
            href="/canon"
            className="flex-1 rounded-lg border py-2 text-center text-sm font-medium transition-all hover:scale-105"
            style={{
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
              color: LIBRARY_AESTHETICS.colors.primary.saffron,
            }}
          >
            View Canon
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const FeaturedBookCard: React.FC<{
  title: string;
  subtitle: string;
  href: string;
  coverSrc: string;
  tag: string;
  line: string;
}> = ({ title, subtitle, href, coverSrc, tag, line }) => (
  <Link href={href} className="group block h-full">
    <div
      className="relative flex h-full flex-col gap-4 rounded-2xl border p-4 sm:flex-row"
      style={{
        borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
        background:
          "radial-gradient(circle at top left, rgba(248, 250, 252, 0.04), rgba(15,23,42,0.96))",
      }}
    >
      <div className="relative w-full sm:w-40 md:w-44 lg:w-48">
        <div className="relative aspect-[3/4] overflow-hidden rounded-xl">
          <Image
            src={coverSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 768px) 40vw, 200px"
          />
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div>
          <p
            className="mb-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
          >
            {tag}
          </p>
          <h3
            className="font-serif text-xl font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            {title}
          </h3>
          <p
            className="mt-1 text-sm"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            {subtitle}
          </p>
        </div>
        <div className="mt-3 space-y-2">
          <p
            className="text-xs leading-relaxed opacity-80"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            {line}
          </p>
          <div className="flex items-center justify-between text-xs">
            <span
              className="font-medium uppercase tracking-[0.18em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              Open book
            </span>
            <span
              className="text-sm transition-transform group-hover:translate-x-0.5"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              ↗
            </span>
          </div>
        </div>
      </div>
    </div>
  </Link>
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
    <div
      className="relative h-full rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: `${color}30`,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
      }}
    >
      <div
        className="pointer-events-none absolute left-0 top-0 bottom-0 w-1"
        style={{
          background: `linear-gradient(to bottom, 
            ${color}00, 
            ${color}, 
            ${color}00
          )`,
        }}
      />
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg opacity-70" style={{ color }}>
              {icon}
            </span>
            <span
              className="text-xs font-medium uppercase tracking-wider"
              style={{ color }}
            >
              {category}
            </span>
          </div>
        </div>
        <h3
          className="mb-2 font-serif text-lg font-medium"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {title}
        </h3>
        <p
          className="mb-4 text-sm leading-relaxed opacity-90"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {description}
        </p>
        <div
          className="flex items-center justify-between border-t pt-3"
          style={{ borderColor: `${color}20` }}
        >
          <span className="text-xs opacity-80" style={{ color }}>
            Explore
          </span>
          <span className="text-sm font-medium" style={{ color }}>
            →
          </span>
        </div>
      </div>
    </div>
  </Link>
);

/* -------------------------------------------------------------------------- */
/* MAIN PAGE                                                                  */
/* -------------------------------------------------------------------------- */

const HomePage: NextPage = () => {
  const siteTitle = "Abraham of London";
  const siteTagline =
    "Canon, books, and structural tools for fathers, founders, and builders of legacy.";

  const seasonalLabel =
    SEASONAL_CURATIONS?.wisdomTheme ??
    "Canon · Fatherhood · Governance · Legacy";

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
        <meta name="theme-color" content="#050509" />
      </Head>

      {/* Global background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      </div>

      {/* -------------------------------------------------------------------
       1. CATHEDRAL HERO
      -------------------------------------------------------------------- */}
      <section className="relative overflow-hidden">
        <GoldFoilAccent position="top" />

        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at top, rgba(248, 250, 252, 0.06), transparent 55%),
              linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,1) 55%, rgba(15,23,42,0.98) 100%)`,
          }}
        />

        <div
          className="pointer-events-none absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='140' height='140' viewBox='0 0 140 140' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h100v100H20z' fill='none' stroke='%23ffffff' stroke-opacity='0.06' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1.2fr,1fr]">
            {/* Left – Identity & Claim */}
            <div>
              <div className="mb-6">
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
                  style={{
                    backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15`,
                    border: `1px solid ${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                  }}
                >
                  <span
                    className="text-lg"
                    style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
                  >
                    𓆓
                  </span>
                  <span
                    className="text-xs font-medium uppercase tracking-[0.22em]"
                    style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
                  >
                    {seasonalLabel}
                  </span>
                </div>

                <h1
                  className="mb-4 font-serif text-4xl font-light sm:text-5xl lg:text-6xl"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                >
                  Abraham of London
                  <span className="mt-2 block text-2xl font-normal sm:text-3xl lg:text-4xl">
                    Fatherhood, governance, and legacy —  
                    for men who refuse to drift.
                  </span>
                </h1>

                <p
                  className="mb-6 max-w-xl text-base leading-relaxed sm:text-lg"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
                >
                  Canon. Books. Rooms. Ventures.  
                  One architecture for men who carry weight — for families, for
                  companies, for nations — and intend to outlive the headlines.
                </p>
              </div>

              <div className="mb-6 flex flex-wrap gap-4">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-all hover:scale-105"
                  style={{
                    backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron,
                    color: "#0f172a",
                  }}
                >
                  Enter the Canon
                  <span>↠</span>
                </Link>
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center gap-2 rounded-full border px-7 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-all hover:scale-105"
                  style={{
                    borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  Inner Circle access
                  <span>🕯</span>
                </Link>
              </div>

              <p
                className="text-xs uppercase tracking-[0.22em]"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                Not content. Infrastructure for a life that carries weight.
              </p>
            </div>

            {/* Right – Portrait Banner */}
            <div className="relative">
              <div
                className="relative overflow-hidden rounded-3xl border shadow-[0_20px_60px_rgba(0,0,0,0.9)]"
                style={{
                  borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}35`,
                  background:
                    "radial-gradient(circle at top, rgba(248,250,252,0.06), rgba(15,23,42,0.98))",
                }}
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src="/assets/images/abraham-of-london-banner.webp"
                    alt="Abraham of London — portrait and brand banner"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  {/* Overlay corner label */}
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent">
                    <div className="px-4 pb-4 pt-10">
                      <p
                        className="text-[0.65rem] font-semibold uppercase tracking-[0.25em]"
                        style={{
                          color: LIBRARY_AESTHETICS.colors.primary.saffron,
                        }}
                      >
                        Canon · Rooms · Ventures
                      </p>
                      <p
                        className="mt-1 text-xs opacity-90"
                        style={{
                          color: LIBRARY_AESTHETICS.colors.primary.parchment,
                        }}
                      >
                        A steward of men, institutions, and multi-generational
                        design — under God, not under trend.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <GoldFoilAccent position="bottom" />
      </section>

      {/* -------------------------------------------------------------------
       2. STATS / SOCIAL PROOF
      -------------------------------------------------------------------- */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       3. THE CANON – ENGINE ROOM
      -------------------------------------------------------------------- */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 grid gap-10 lg:grid-cols-[1.1fr,0.9fr]">
            <div>
              <p
                className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                The Canon
              </p>
              <h2
                className="mb-4 font-serif text-3xl font-light sm:text-4xl"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                The civilisational operating system underneath everything.
              </h2>
              <p
                className="mb-6 max-w-xl text-base leading-relaxed sm:text-lg"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                Ten volumes on purpose, identity, governance, family,
                institutions, nations, and destiny. Not commentary. Architecture.
                Written for men who intend to carry responsibility across
                generations.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{
                    borderColor: `${CONTENT_CATEGORIES.CANON.color}40`,
                    color: CONTENT_CATEGORIES.CANON.color,
                  }}
                >
                  Explore Canon overview
                  <span>→</span>
                </Link>
                <Link
                  href="/posts/canon-introduction-letter"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em]"
                  style={{
                    backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}10`,
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  Read letter from the author
                  <span>↗</span>
                </Link>
              </div>
            </div>

            <CanonVolumeCard />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ContentCard
              title="Essays & Posts"
              description="Strategic essays applying first principles of the Canon to culture, markets, and power."
              href="/blog"
              category="Essays"
              color={CONTENT_CATEGORIES.POSTS.color}
              icon="✒"
            />
            <ContentCard
              title="Tools & Downloads"
              description="Frameworks, playbooks, and structural tools to move from conviction to execution."
              href="/downloads"
              category="Resources"
              color={CONTENT_CATEGORIES.RESOURCES.color}
              icon="⚙"
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       4. THE BOOKS – NARRATIVE SPINE
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-950 to-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              The Bookshelf
            </p>
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Where the theory bleeds into story.
            </h2>
            <p
              className="mx-auto max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Memoir, parable, and strategic narrative — for men who need more
              than inspiration: they need context for their scars.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <FeaturedBookCard
              title="Fathering Without Fear"
              subtitle="The untold memoir of a father who refused to disappear — faith tested, legacy defined, history reclaimed."
              href="/books/fathering-without-fear"
              coverSrc="/assets/images/books/fathering-without-fear.jpg"
              tag="Memoir · Legacy"
              line="A battlefield record of fatherhood under pressure — systems, courts, accusations, and the quiet decisions that build or break a man."
            />
            <FeaturedBookCard
              title="The Fiction Adaptation"
              subtitle="A covert retelling of a story too real for the courtroom — where truth hides in fiction and fiction cuts deeper than fact."
              href="/books/the-fiction-adaptation"
              coverSrc="/assets/images/books/fathering-without-fear.jpg"
              tag="Fiction · Drama"
              line="When the names change but the spiritual warfare does not. A narrative space to say what cannot yet be said in legal prose."
            />
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Browse full bookshelf
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       5. ROOMS & FLOW – STRATEGIC FUNNEL + EVENTS
      -------------------------------------------------------------------- */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              Rooms & Rhythm
            </p>
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              From reading to rooms to responsibility.
            </h2>
            <p
              className="mx-auto max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Three doors into the work: the Canon, the gatherings, and the
              strategic advisory table — for men who are done with theory alone.
            </p>
          </div>

          {/* Strategic funnel strip (your existing three doors) */}
          <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4 sm:p-6">
            <StrategicFunnelStrip />
          </div>

          {/* Events & gatherings */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ContentCard
              title="Gatherings & Rooms"
              description="Workshops, salons, and covenant spaces where decisions — not opinions — are the output."
              href="/events"
              category="Events"
              color={CONTENT_CATEGORIES.EVENTS.color}
              icon="🕯"
            />
            <ContentCard
              title="All Content"
              description="A single index of essays, Canon pieces, books, downloads, and events — one map for everything."
              href="/content"
              category="Library"
              color={LIBRARY_AESTHETICS.colors.primary.saffron}
              icon="📖"
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       6. VENTURES – EXECUTION ARMS
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-950 to-black py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              The Operating Arms
            </p>
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Where frameworks get tested in the wild.
            </h2>
            <p
              className="mx-auto max-w-2xl text-base leading-relaxed sm:text-lg"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Alomarada, EndureLuxe, InnovateHub — ventures that carry the same
              architecture into markets, operations, and founders’ lives.
            </p>
          </div>

          <VenturesSection />
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       7. THE MANDATE & THE MAN
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-black via-slate-950 to-black py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center">
            <p
              className="mb-2 text-xs font-semibold uppercase tracking-[0.24em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              Mandate & Man
            </p>
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              The why behind the work — and the scars behind the voice.
            </h2>
          </div>

          <MandateStatement />
          <AboutSection />
        </div>
      </section>

      {/* -------------------------------------------------------------------
       8. FINAL CHARGE
      -------------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-20">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at top, rgba(248,250,252,0.05), transparent 60%),
              linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(2,6,23,1) 55%, rgba(15,23,42,0.98) 100%)`,
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2
            className="mb-4 font-serif text-3xl font-light sm:text-4xl"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            Build a life your sons won&apos;t have to recover from.
          </h2>
          <p
            className="mx-auto mb-8 max-w-2xl text-base leading-relaxed sm:text-lg"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            Start with the Canon. Step into a room. Then build structures —
            in your home, your work, your city — that will still be standing
            when the feeds have forgotten your name.
          </p>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/canon"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-all hover:scale-105"
              style={{
                backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron,
                color: "#0f172a",
              }}
            >
              Start with the Canon
              <span>↠</span>
            </Link>
            <Link
              href="/consulting"
              className="inline-flex items-center gap-2 rounded-full border px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] transition-all hover:scale-105"
              style={{
                borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
                color: LIBRARY_AESTHETICS.colors.primary.parchment,
              }}
            >
              Book a strategy call
              <span>→</span>
            </Link>
          </div>

          <div
            className="mx-auto mt-10 max-w-xs border-t pt-6"
            style={{
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
            }}
          >
            <Link
              href="/content"
              className="text-xs font-semibold uppercase tracking-[0.2em]"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
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