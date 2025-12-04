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

const GoldFoilAccent: React.FC<{ position: "top" | "bottom" }> = ({
  position,
}) => (
  <div
    className={`absolute ${
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
    {/* Decorative frame */}
    <div
      className="absolute -inset-4 rounded-3xl opacity-0 transition-opacity duration-500 blur-xl group-hover:opacity-20"
      style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron }}
    />

    <div
      className="relative overflow-hidden rounded-2xl border backdrop-blur-xl"
      style={{
        borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
      }}
    >
      {/* Book spine effect */}
      <div
        className="absolute left-0 top-1/4 bottom-1/4 w-1"
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
              <div
                className="text-lg"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                📜
              </div>
            </div>
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              Canon · Volume I
            </span>
          </div>
          <div
            className="rounded-full px-3 py-1 text-xs"
            style={{
              backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15`,
              color: LIBRARY_AESTHETICS.colors.primary.saffron,
            }}
          >
            Prelude
          </div>
        </div>

        <div className="relative mb-4 aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-slate-900 to-black">
          <Image
            src="/assets/images/books/the-architecture-of-human-purpose.jpg"
            alt="The Architecture of Human Purpose — Canon Volume I Prelude"
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
          The prelude to the Canon — a structural map for those who know that
          human flourishing is not accidental but architectural.
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
            Read Now
          </Link>
          <Link
            href="/canon"
            className="flex-1 rounded-lg border py-2 text-center text-sm font-medium transition-all hover:scale-105"
            style={{
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
              color: LIBRARY_AESTHETICS.colors.primary.saffron,
            }}
          >
            All Volumes
          </Link>
        </div>
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
    <div
      className="group relative h-full rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: `${color}30`,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
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
            <div className="text-lg opacity-70" style={{ color }}>
              {icon}
            </div>
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
          className="mb-4 text-sm leading-relaxed opacity-80"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {description}
        </p>

        <div
          className="flex items-center justify-between border-t pt-3"
          style={{ borderColor: `${color}20` }}
        >
          <span className="text-xs opacity-70" style={{ color }}>
            Explore
          </span>
          <div className="text-sm font-medium" style={{ color }}>
            →
          </div>
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
        <meta name="theme-color" content="#050509" />
      </Head>

      {/* Clean Global Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950" />
      </div>

      {/* -------------------------------------------------------------------
       1. PRIMARY HERO
      -------------------------------------------------------------------- */}
      <section className="relative min-h-[90vh] overflow-hidden">
        <GoldFoilAccent position="top" />

        {/* Clean background gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, 
              rgba(15, 23, 42, 0.98) 0%, 
              rgba(2, 6, 23, 0.95) 50%, 
              rgba(15, 23, 42, 0.98) 100%
            )`,
          }}
        />

        {/* Subtle texture */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            {/* Content - Left Side */}
            <div>
              <div className="mb-6">
                <div
                  className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
                  style={{
                    backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15`,
                    border: `1px solid ${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                  }}
                >
                  <div
                    className="text-lg"
                    style={{
                      color: LIBRARY_AESTHETICS.colors.primary.saffron,
                    }}
                  >
                    𓆓
                  </div>
                  <span
                    className="text-xs font-medium uppercase tracking-widest"
                    style={{
                      color: LIBRARY_AESTHETICS.colors.primary.saffron,
                    }}
                  >
                    {SEASONAL_CURATIONS.wisdomTheme}
                  </span>
                </div>

                <h1
                  className="mb-4 font-serif text-4xl font-light sm:text-5xl lg:text-6xl"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  Abraham of London
                  <span className="mt-2 block text-2xl font-normal sm:text-3xl lg:text-4xl">
                    Structural thinking for fathers, founders,
                    <br />
                    and builders of legacy.
                  </span>
                </h1>

                <p
                  className="mb-8 text-lg leading-relaxed"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  If you carry responsibility for a family, a company, or a
                  community, this is the room where faith, history, strategy,
                  and markets get put to work — not just discussed.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron,
                    color: "#0f172a",
                  }}
                >
                  Enter the Canon
                  <span>↠</span>
                </Link>
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  Work with Abraham
                  <span>→</span>
                </Link>
              </div>
            </div>

            {/* Hero Image - Right Side */}
            <div className="relative">
              <div
                className="relative overflow-hidden rounded-2xl border shadow-2xl"
                style={{
                  borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                }}
              >
                <div className="relative aspect-[4/5]">
                  <Image
                    src="/assets/images/abraham-of-london-banner-2056.webp"
                    alt="Abraham of London — Canon, ventures, and structural tools for builders of legacy"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div
                  className="border-t p-4"
                  style={{
                    borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                    backgroundColor: "rgba(15, 23, 42, 0.8)",
                  }}
                >
                  <p
                    className="text-center text-xs"
                    style={{
                      color: LIBRARY_AESTHETICS.colors.primary.parchment,
                    }}
                  >
                    Built for men who refuse to outsource responsibility — to
                    the state, the culture, or the algorithm.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <GoldFoilAccent position="bottom" />
      </section>

      {/* -------------------------------------------------------------------
       2. SOCIAL PROOF / STATS BAR
      -------------------------------------------------------------------- */}
      <section className="py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       3. CANON & CONTENT HUB
      -------------------------------------------------------------------- */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              The Canon &amp; The Works
            </h2>
            <p
              className="mx-auto max-w-2xl text-lg"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Not a blog. A structured record of purpose, civilisation,
              governance, and destiny — the intellectual infrastructure
              underneath everything.
            </p>
          </div>

          <div className="mb-12 grid gap-12 lg:grid-cols-2">
            {/* Left Column - Canon Content */}
            <div>
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-2">
                  <div
                    className="rounded-lg p-2"
                    style={{
                      backgroundColor: `${CONTENT_CATEGORIES.CANON.color}15`,
                    }}
                  >
                    <div
                      className="text-lg"
                      style={{ color: CONTENT_CATEGORIES.CANON.color }}
                    >
                      ⚖
                    </div>
                  </div>
                  <h3
                    className="font-serif text-2xl font-medium"
                    style={{
                      color: LIBRARY_AESTHETICS.colors.primary.parchment,
                    }}
                  >
                    The Canon
                  </h3>
                </div>
                <p
                  className="mb-6 text-lg"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  The ideological engine room — first principles, structural
                  laws, and multi-volume architecture for purpose, institutions,
                  and human destiny.
                </p>
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-full border px-5 py-2 text-sm font-medium"
                  style={{
                    borderColor: `${CONTENT_CATEGORIES.CANON.color}40`,
                    color: CONTENT_CATEGORIES.CANON.color,
                  }}
                >
                  Explore all volumes
                  <span>→</span>
                </Link>
              </div>

              {/* Content Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <ContentCard
                  title="Essays & Posts"
                  description="Strategic essays applying first principles to culture, policy, and markets."
                  href="/blog"
                  category="Essays"
                  color={CONTENT_CATEGORIES.POSTS.color}
                  icon="✒"
                />
                <ContentCard
                  title="Tools & Downloads"
                  description="Playbooks, templates, and structural tools for execution in the real world."
                  href="/downloads"
                  category="Resources"
                  color={CONTENT_CATEGORIES.RESOURCES.color}
                  icon="⚙"
                />
              </div>
            </div>

            {/* Right Column - Canon Volume */}
            <div>
              <CanonVolumeCard />
            </div>
          </div>

          {/* Bottom Content Cards */}
          <div className="grid gap-4 sm:grid-cols-2">
            <ContentCard
              title="Bookshelf"
              description="Memoir, parable, and strategic narrative for men, fathers, and builders."
              href="/books"
              category="Books"
              color={CONTENT_CATEGORIES.BOOKS.color}
              icon="📚"
            />
            <ContentCard
              title="Gatherings & Rooms"
              description="Workshops, salons, and covenants where decisions, not opinions, are the output."
              href="/events"
              category="Events"
              color={CONTENT_CATEGORIES.EVENTS.color}
              icon="🕯"
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       4. STRATEGIC FUNNEL
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* -------------------------------------------------------------------
       5. VENTURES
      -------------------------------------------------------------------- */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              The Operating Arms
            </h2>
            <p
              className="mx-auto max-w-2xl text-lg"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Alomarada, EndureLuxe, and InnovateHub are execution arms of the
              Canon — testing grounds for strategy, governance, and
              multi-generational design.
            </p>
          </div>

          <VenturesSection />
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       6. MANDATE & ABOUT
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-slate-950 to-black py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              The Mandate &amp; The Man
            </h2>
          </div>

          <div className="space-y-16">
            <MandateStatement />
            <AboutSection />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       6.5 MEMOIR SPOTLIGHT – FATHERING WITHOUT FEAR
      -------------------------------------------------------------------- */}
      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            {/* Book cover */}
            <div className="relative">
              <div
                className="relative overflow-hidden rounded-2xl border shadow-2xl"
                style={{
                  borderColor: `${CONTENT_CATEGORIES.BOOKS.color}40`,
                  backgroundColor: "rgba(15,23,42,0.9)",
                }}
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src="/assets/images/books/fathering-without-fear.jpg"
                    alt="Fathering Without Fear — The Story They Thought They Knew"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 320px"
                  />
                </div>
              </div>
            </div>

            {/* Copy */}
            <div>
              <p
                className="mb-3 text-xs font-semibold uppercase tracking-[0.25em]"
                style={{ color: CONTENT_CATEGORIES.BOOKS.color }}
              >
                Memoir · Fatherhood · Justice
              </p>
              <h2
                className="mb-4 font-serif text-3xl font-light sm:text-4xl"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                Fathering Without Fear
                <span className="mt-2 block text-base font-normal sm:text-lg">
                  The story of a father who refused to disappear.
                </span>
              </h2>
              <p
                className="mb-4 text-sm sm:text-base leading-relaxed"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                Not a parenting manual. A battlefield record. Faith tested,
                legacy defined, history reclaimed — written for men who have
                been misread, underestimated, or written off, yet refuse to
                surrender their assignment.
              </p>
              <p
                className="mb-8 text-sm sm:text-base leading-relaxed opacity-80"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
              >
                The memoir undergirding the movement: Fathering Without Fear.
                This is the personal spine beneath the Canon — the lived story
                behind the frameworks.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/books/fathering-without-fear"
                  className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    backgroundColor: CONTENT_CATEGORIES.BOOKS.color,
                    color: "#020617",
                  }}
                >
                  Open the memoir
                  <span>↠</span>
                </Link>
                <Link
                  href="/brands/fathering-without-fear"
                  className="inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-all hover:scale-105"
                  style={{
                    borderColor: `${CONTENT_CATEGORIES.BOOKS.color}40`,
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  Explore the movement
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
       7. FINAL CTA
      -------------------------------------------------------------------- */}
      <section className="relative overflow-hidden py-20">
        {/* Clean background */}
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg, 
              rgba(15, 23, 42, 0.98) 0%, 
              rgba(2, 6, 23, 1) 50%, 
              rgba(15, 23, 42, 0.98) 100%
            )`,
          }}
        />

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-8">
            <h2
              className="mb-4 font-serif text-3xl font-light sm:text-4xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Fatherhood, leadership, and legacy — without flinching.
            </h2>
            <p
              className="mx-auto mb-8 max-w-2xl text-lg"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              Start with the Canon, step into a room, then build structures that
              will still be standing when the headlines have moved on.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/canon"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-medium transition-all hover:scale-105"
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
              className="inline-flex items-center gap-2 rounded-full border px-8 py-3 text-sm font-medium transition-all hover:scale-105"
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
            className="mx-auto mt-12 max-w-xs border-t pt-8"
            style={{
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
            }}
          >
            <Link
              href="/content"
              className="text-sm"
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