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

// Homepage components (note the /homepage path for all)
import VenturesSection from "@/components/homepage/VenturesSection";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import MilestonesTimeline from "@/components/homepage/MilestonesTimeline";
import TestimonialsSection from "@/components/homepage/TestimonialsSection";
import StatsBar from "@/components/homepage/StatsBar";
import AboutSection from "@/components/homepage/AboutSection";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* LUXURY DESIGN COMPONENTS                                                   */
/* -------------------------------------------------------------------------- */

const PersianOrnament: React.FC<{
  type: "header" | "divider";
  color?: string;
}> = ({ type, color = LIBRARY_AESTHETICS.colors.primary.saffron }) => {
  if (type === "header") {
    return (
      <div className="absolute inset-x-0 top-0 h-1 overflow-hidden opacity-30">
        <div
          className="h-full w-full"
          style={{
            background: `repeating-linear-gradient(90deg, transparent, transparent 10px, ${color} 10px, ${color} 20px)`,
          }}
        />
      </div>
    );
  }

  return (
    <div className="my-12 flex items-center justify-center">
      <div className="h-px flex-1" style={{ backgroundColor: `${color}30` }} />
      <div className="mx-6 text-2xl opacity-50" style={{ color }}>
        𓆓
      </div>
      <div className="h-px flex-1" style={{ backgroundColor: `${color}30` }} />
    </div>
  );
};

const GoldFoilAccent: React.FC<{
  position: "top" | "bottom" | "left" | "right";
}> = ({ position }) => {
  const positions: Record<string, string> = {
    top: "top-0 inset-x-0 h-px",
    bottom: "bottom-0 inset-x-0 h-px",
    left: "left-0 inset-y-0 w-px",
    right: "right-0 inset-y-0 w-px",
  };

  return (
    <div className={`absolute ${positions[position]} overflow-hidden`}>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(90deg, transparent, ${LIBRARY_AESTHETICS.colors.primary.saffron}, transparent)`,
        }}
      />
      <div
        className="absolute inset-0 animate-pulse"
        style={{
          background: `linear-gradient(90deg, transparent, ${LIBRARY_AESTHETICS.colors.primary.saffron}80, transparent)`,
          animationDuration: "3s",
        }}
      />
    </div>
  );
};

const CanonGlow: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden">
    <div
      className="absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-5 blur-3xl"
      style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron }}
    />
    <div
      className="absolute -left-20 -bottom-20 h-64 w-64 rounded-full opacity-5 blur-3xl"
      style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.lapis }}
    />
  </div>
);

/* -------------------------------------------------------------------------- */
/* CANON CARD - LUXURY EDITION                                                */
/* -------------------------------------------------------------------------- */

const CanonVolumeCard: React.FC = () => (
  <div className="relative mx-auto max-w-md">
    {/* Decorative corners */}
    <div className="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/50" />
    <div className="absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2 border-amber-400/50" />
    <div className="absolute -left-2 -bottom-2 h-4 w-4 border-l-2 border-b-2 border-amber-400/50" />
    <div className="absolute -right-2 -bottom-2 h-4 w-4 border-r-2 border-b-2 border-amber-400/50" />

    {/* Main card */}
    <div
      className="relative rounded-3xl border p-6 backdrop-blur-xl"
      style={{
        borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
        backgroundColor: "rgba(15,23,42,0.8)",
        backgroundImage: `
          radial-gradient(circle at 20% 80%, ${LIBRARY_AESTHETICS.colors.primary.saffron}15, transparent 50%),
          radial-gradient(circle at 80% 20%, ${LIBRARY_AESTHETICS.colors.primary.lapis}10, transparent 50%)
        `,
        boxShadow: `
          0 20px 80px rgba(0, 0, 0, 0.8),
          inset 0 1px 0 ${LIBRARY_AESTHETICS.colors.primary.saffron}20,
          inset 0 -1px 0 ${LIBRARY_AESTHETICS.colors.primary.saffron}20
        `,
      }}
    >
      {/* Volume seal */}
      <div
        className="absolute -right-3 -top-3 h-12 w-12 rotate-12 rounded-full border-2 opacity-60"
        style={{
          borderColor: LIBRARY_AESTHETICS.colors.primary.saffron,
          background: `radial-gradient(circle at 30% 30%, ${LIBRARY_AESTHETICS.colors.primary.saffron}20, transparent 70%)`,
        }}
      >
        <div className="flex h-full items-center justify-center">
          <span
            className="text-lg"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
          >
            I
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div
            className="rounded-xl p-2"
            style={{
              background: `linear-gradient(135deg, ${LIBRARY_AESTHETICS.colors.primary.saffron}20, ${LIBRARY_AESTHETICS.colors.primary.saffron}05)`,
              border: `1px solid ${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
            }}
          >
            <div
              className="text-xl"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              📜
            </div>
          </div>
          <span
            className="text-xs font-medium uppercase tracking-[0.3em]"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
          >
            Canon · Volume I
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border">
          <div
            className="relative aspect-[3/4] overflow-hidden rounded-xl border"
            style={{
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
              backgroundColor: "rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Cover image */}
            <Image
              src="/assets/images/books/the-architecture-of-human-purpose.jpg"
              alt="The Architecture of Human Purpose – Prelude Volume"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 320px, 100vw"
            />

            {/* Book spine effect */}
            <div
              className="absolute left-0 top-1/4 h-1/2 w-1"
              style={{
                background: `linear-gradient(to bottom, 
                  ${LIBRARY_AESTHETICS.colors.primary.saffron}00 0%, 
                  ${LIBRARY_AESTHETICS.colors.primary.saffron} 30%, 
                  ${LIBRARY_AESTHETICS.colors.primary.saffron}80 70%, 
                  ${LIBRARY_AESTHETICS.colors.primary.saffron}00 100%)`,
              }}
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-cream/70">
          <span className="font-semibold text-amber-200">
            The Architecture of Human Purpose
          </span>{" "}
          is the prelude to a multi-volume Canon — a structural map for those
          who know that human flourishing is not accidental but architectural.
        </p>

        {/* Gold foil texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 rounded-3xl opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>
    </div>
  </div>
);

/* -------------------------------------------------------------------------- */
/* LUXURY CONTENT CARDS                                                       */
/* -------------------------------------------------------------------------- */

const ContentCard: React.FC<{
  title: string;
  description: string;
  href: string;
  category: string;
  color: string;
  icon: string;
}> = ({ title, description, href, category, color, icon }) => (
  <Link href={href} className="group block">
    <div
      className="relative h-full overflow-hidden rounded-2xl border transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl"
      style={{
        borderColor: `${color}30`,
        backgroundColor: "rgba(15,23,42,0.6)",
        backgroundImage: `
          linear-gradient(135deg, ${color}08 0%, transparent 40%),
          radial-gradient(circle at 20% 80%, ${color}12 0%, transparent 50%)
        `,
      }}
    >
      <GoldFoilAccent position="left" />

      {/* Decorative glow */}
      <div
        className="absolute -right-4 -top-4 h-16 w-16 rounded-full opacity-0 blur-lg transition-opacity duration-500 group-hover:opacity-30"
        style={{ backgroundColor: color }}
      />

      <div className="relative p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rounded-lg p-2"
              style={{ backgroundColor: `${color}15` }}
            >
              <div className="text-xl" style={{ color }}>
                {icon}
              </div>
            </div>
            <span
              className="text-xs font-medium uppercase tracking-widest"
              style={{ color }}
            >
              {category}
            </span>
          </div>
          <div className="opacity-0 transition-opacity group-hover:opacity-100">
            <div
              className="h-2 w-2 rounded-full animate-ping"
              style={{ backgroundColor: color }}
            />
          </div>
        </div>

        <h3
          className="mb-3 font-serif text-xl font-medium"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {title}
        </h3>

        <p
          className="mb-6 text-sm leading-relaxed opacity-80"
          style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
        >
          {description}
        </p>

        <div
          className="flex items-center justify-between border-t pt-4"
          style={{ borderColor: `${color}20` }}
        >
          <span
            className="text-sm italic opacity-70"
            style={{ color: `${color}80` }}
          >
            Enter the archive
          </span>
          <div
            className="flex items-center gap-2 text-sm font-medium transition-all group-hover:gap-3"
            style={{ color }}
          >
            <span>Explore</span>
            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
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

      {/* LUXURY GLOBAL BACKDROP */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Primary gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />

        {/* Secondary glows */}
        <div
          className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.lapis }}
        />

        {/* Luxury grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(90deg, rgba(212,175,55,0.1) 1px, transparent 1px),
              linear-gradient(rgba(212,175,55,0.1) 1px, transparent 1px)
            `,
            backgroundSize: "120px 120px",
          }}
        />
      </div>

      {/* -------------------------------------------------------------------
       1. PRIMARY HERO – ABRAHAM OF LONDON
      -------------------------------------------------------------------- */}
      <section className="relative min-h-[90vh] overflow-hidden border-b border-white/10">
        <PersianOrnament type="header" />
        <CanonGlow />
        <GoldFoilAccent position="bottom" />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23D4AF37' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Season indicator */}
            <div
              className="mb-8 inline-flex items-center gap-3 rounded-full px-6 py-3"
              style={{
                backgroundColor: "rgba(234,179,8,0.08)",
                border: "1px solid rgba(234,179,8,0.35)",
              }}
            >
              <div className="text-2xl">𓆓</div>
              <span
                className="text-sm font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                {SEASONAL_CURATIONS.wisdomTheme}
              </span>
            </div>

            {/* Main title */}
            <h1 className="mb-6 font-serif text-5xl font-light tracking-tight sm:text-7xl">
              <span
                className="mb-4 block text-3xl sm:text-4xl"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                Abraham of London
              </span>
              Structural thinking for fathers,
              <br />
              <span className="text-cream/90">founders, and builders</span>
              <br />
              <span className="italic text-cream/80">of legacy.</span>
            </h1>

            {/* Divider */}
            <div className="mx-auto mb-8 flex max-w-md items-center justify-center">
              <div
                className="h-px flex-1"
                style={{
                  backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                }}
              />
              <div
                className="mx-4 text-2xl opacity-50"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                𓃭
              </div>
              <div
                className="h-px flex-1"
                style={{
                  backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                }}
              />
            </div>

            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-cream/80">
              Canon, ventures, and structural tools for fathers, founders, and
              builders of legacy. One standard, many expressions — but all
              anchored in consequence.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/content">
                <a className="inline-flex items-center rounded-full bg-cream px-8 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-black/40 transition hover:brightness-95">
                  Enter the work
                </a>
              </Link>
              <Link href="/books/the-architecture-of-human-purpose">
                <a className="inline-flex items-center rounded-full border border-amber-400/70 bg-black/40 px-7 py-3 text-sm font-semibold text-amber-100 backdrop-blur transition hover:bg-black/70">
                  Read the Canon Prelude
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
       2. CANON – IDEOLOGICAL ENGINE ROOM
      -------------------------------------------------------------------- */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black">
        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 lg:flex-row lg:items-center lg:px-8 lg:py-20">
          {/* Canon copy */}
          <div className="flex-1 space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">
              The Canon
            </p>
            <h2 className="font-serif text-3xl font-light tracking-tight text-cream sm:text-4xl lg:text-5xl">
              The ideological engine room
              <span className="mt-2 block text-sm font-sans text-amber-200/80">
                Law · Principles · Architecture of Human Purpose
              </span>
            </h2>

            <p className="max-w-xl text-sm leading-relaxed text-cream/80">
              The Canon is not a blog. It is the structural record of what we
              believe about purpose, civilisation, governance, and destiny. It
              sits above the ventures as the law that governs the engine room.
            </p>

            <p className="max-w-xl text-sm leading-relaxed text-cream/70">
              Every framework, workshop, and venture flows from this
              architecture: how men lead, how institutions are built, and how
              legacies are secured across generations.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link href="/canon">
                <a className="group inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-400/10 px-6 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20">
                  Enter the Canon
                  <span className="transition-transform group-hover:translate-x-1">
                    ↠
                  </span>
                </a>
              </Link>
              <Link href="/books/the-architecture-of-human-purpose">
                <a className="inline-flex items-center gap-2 rounded-full border border-cream/10 bg-cream/5 px-6 py-2 text-sm text-cream/80 hover:bg-cream/10">
                  Read the Prelude Volume
                </a>
              </Link>
            </div>
          </div>

          {/* Canon visual */}
          <div className="flex-1">
            <CanonVolumeCard />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
       3. VENTURES – EXECUTION ARMS OF THE CANON
      -------------------------------------------------------------------- */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col gap-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cream/60">
              Ventures
            </p>
            <h2 className="font-serif text-3xl font-light text-cream sm:text-4xl">
              Where philosophy becomes operating system
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-cream/75">
              Alomarada, EndureLuxe, and InnovateHub are not side projects.
              They are execution arms of the Canon—testing grounds for strategy,
              governance, and multi-generational design.
            </p>
          </div>

          <VenturesSection />
        </div>
      </section>

      {/* -------------------------------------------------------------------
       4. STRATEGIC FUNNEL – THREE DOORS INTO THE WORK
      -------------------------------------------------------------------- */}
      <section className="relative border-b border-white/5 bg-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* -------------------------------------------------------------------
       5. THE WORK – BOOKS · ESSAYS · TOOLS · EVENTS
      -------------------------------------------------------------------- */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black">
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col gap-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cream/60">
              The Works
            </p>
            <h2 className="font-serif text-3xl font-light text-cream sm:text-4xl">
              Books, essays, Canon notes, and tools
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-cream/75">
              Every piece of writing is a structural node in a larger system —
              from long-form Canon volumes to tactical downloads built for
              execution in the field.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <ContentCard
              title="Canon Volumes & Inner Papers"
              description="Structural essays and canonical treatises on purpose, governance, civilisation, and spiritual realism."
              href="/canon"
              category="Canon"
              color={CONTENT_CATEGORIES.CANON.color}
              icon="✧"
            />
            <ContentCard
              title="Fathering Without Fear & other volumes"
              description="Memoir, parable, and strategic narrative for men, fathers, and builders who refuse to disappear quietly."
              href="/books"
              category="Books"
              color={CONTENT_CATEGORIES.BOOKS.color}
              icon="📖"
            />
            <ContentCard
              title="Essays, tools & events"
              description="Strategic essays, execution toolkits, and live rooms where frameworks are tested in real time."
              href="/content"
              category="Field Work"
              color={CONTENT_CATEGORIES.POSTS.color}
              icon="⚙"
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
       6. MANDATE & ABOUT – THE MAN AND THE MISSION
      -------------------------------------------------------------------- */}
      <section className="relative border-b border-white/5 bg-black">
        <div className="relative mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-20">
          <MandateStatement />
          <div className="mt-12">
            <AboutSection />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
       7. ECOSYSTEM SNAPSHOT – STATS · MILESTONES · TESTIMONIALS
      -------------------------------------------------------------------- */}
      <section className="relative border-b border-white/5 bg-slate-950">
        <div className="relative mx-auto max-w-7xl space-y-16 px-4 py-16 lg:px-8 lg:py-20">
          <StatsBar />
          <MilestonesTimeline variant="dark" title="Milestones & forward path" />
          <TestimonialsSection
            variant="dark"
            title="What readers, fathers, and founders say"
            subtitle="Private rooms, hard conversations, and structural thinking that people actually act on."
          />
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;