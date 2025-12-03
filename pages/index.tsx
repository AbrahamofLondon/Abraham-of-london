// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { NextPage } from "next";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

// Homepage sectional components – loaded dynamically so we don't fight TS prop typing
const HeroBanner = dynamic(
  () => import("@/components/homepage/HeroBanner"),
  { ssr: true }
);
const VenturesSection = dynamic(
  () => import("@/components/homepage/VenturesSection"),
  { ssr: true }
);
const AboutSection = dynamic(
  () => import("@/components/homepage/AboutSection"),
  { ssr: true }
);
const StatsBar = dynamic(
  () => import("@/components/homepage/StatsBar"),
  { ssr: true }
);
const StrategicFunnelStrip = dynamic(
  () => import("@/components/homepage/StrategicFunnelStrip"),
  { ssr: true }
);
const MilestonesTimeline = dynamic(
  () => import("@/components/homepage/MilestonesTimeline"),
  { ssr: true }
);
const TestimonialsSection = dynamic(
  () => import("@/components/homepage/TestimonialsSection"),
  { ssr: true }
);

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

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
        <meta property="og:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} />
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

      {/* GLOBAL BACKDROP */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(212,175,55,0.12) 1px, transparent 1px), linear-gradient(rgba(212,175,55,0.12) 1px, transparent 1px)",
            backgroundSize: "80px 80px",
          }}
        />
      </div>

      {/* 1. PRIMARY HERO – LEGACY HERO BANNER */}
      <section className="relative border-b border-white/5 bg-black/60">
        {/* HeroBanner already carries the visual authority & banner asset */}
        <HeroBanner />
      </section>

      {/* 2. THE CANON – PHILOSOPHICAL ENGINE ROOM */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
          <div className="absolute left-1/2 top-10 h-40 w-px -translate-x-1/2 bg-gradient-to-b from-amber-400/40 to-transparent" />
        </div>

        <div className="relative mx-auto flex max-w-7xl flex-col gap-12 px-4 py-16 lg:flex-row lg:items-center lg:px-8 lg:py-20">
          {/* Canon Copy */}
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
              <Link
                href="/canon"
                className="group inline-flex items-center gap-2 rounded-full border border-amber-400/60 bg-amber-400/10 px-6 py-2 text-sm font-medium text-amber-200 transition hover:bg-amber-400/20"
              >
                Enter the Canon
                <span className="transition-transform group-hover:translate-x-1">
                  ↠
                </span>
              </Link>
              <Link
                href="/books/the-architecture-of-human-purpose"
                className="inline-flex items-center gap-2 rounded-full border border-cream/10 bg-cream/5 px-6 py-2 text-sm text-cream/80 hover:bg-cream/10"
              >
                Read the Prelude Volume
              </Link>
            </div>

            <div className="flex flex-wrap gap-4 pt-4 text-xs text-cream/60">
              <span className="rounded-full border border-amber-400/30 px-3 py-1">
                Purpose &amp; civilisation
              </span>
              <span className="rounded-full border border-amber-400/20 px-3 py-1">
                Governance &amp; institutional design
              </span>
              <span className="rounded-full border border-amber-400/20 px-3 py-1">
                Spiritual realism &amp; destiny
              </span>
            </div>
          </div>

          {/* Canon Visual */}
          <div className="flex-1">
            <div className="relative mx-auto max-w-md rounded-3xl border border-amber-400/30 bg-gradient-to-b from-slate-900 via-slate-950 to-black p-6 shadow-[0_0_120px_rgba(0,0,0,0.8)]">
              <div className="absolute -inset-0.5 rounded-3xl bg-gradient-to-br from-amber-400/20 via-transparent to-amber-500/10 opacity-70 blur-xl" />
              <div className="relative flex flex-col gap-4">
                <div className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
                  Canon · Volume I
                </div>
                <div className="overflow-hidden rounded-2xl border border-amber-200/40 bg-black/60">
                  <Image
                    src="/assets/images/books/the-architecture-of-human-purpose.jpg"
                    alt="The Architecture of Human Purpose cover"
                    width={640}
                    height={880}
                    className="h-auto w-full object-cover"
                  />
                </div>
                <p className="text-xs leading-relaxed text-cream/70">
                  <span className="font-semibold text-amber-200">
                    The Architecture of Human Purpose
                  </span>{" "}
                  is the prelude to a multi-volume Canon—a structural map for
                  people who know that human flourishing is not accidental but
                  architectural.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. VENTURES – EXECUTION ARMS OF THE CANON */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-black via-slate-950 to-black">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col gap-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cream/60">
              Ventures
            </p>
            <h2 className="font-serif text-3xl font-light text-cream sm:text-4xl">
              Where philosophy becomes operating system
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-cream/75">
              Alomarada, EndureLuxe, and InnovateHub are not side projects. They
              are execution arms of the Canon—testing ground for strategy,
              governance, and multi-generational design.
            </p>
          </div>

          {/* Your existing ventures grid / structure */}
          <VenturesSection />
        </div>
      </section>

      {/* 4. STRATEGIC FUNNEL / JOURNEY STRIP */}
      <section className="relative border-b border-white/5 bg-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 py-12 lg:px-8 lg:py-16">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* 5. WRITINGS & STRUCTURAL WORKS – SIGNAL LAYERS */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black">
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20">
          <div className="mb-10 flex flex-col gap-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cream/60">
              The Works
            </p>
            <h2 className="font-serif text-3xl font-light text-cream sm:text-4xl">
              Books, essays, canon notes, and tools
            </h2>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-cream/75">
              Every piece of writing is a structural node in a larger system—
              from long-form Canon volumes to tactical downloads built for
              execution in the field.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Canon / Deep Structure */}
            <Link href="/canon" className="group">
              <div className="flex h-full flex-col rounded-2xl border border-amber-400/35 bg-gradient-to-b from-black via-slate-950 to-black p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-amber-200/80">
                  Canon
                </div>
                <h3 className="mb-3 font-serif text-xl text-cream">
                  Canon Volumes &amp; Inner Papers
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-cream/75">
                  Structural essays and canonical treatises on purpose,
                  governance, civilisation, and spiritual realism.
                </p>
                <div className="mt-auto flex items-center justify-between text-sm text-amber-200">
                  <span>Enter the archive</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>

            {/* Books */}
            <Link href="/books" className="group">
              <div className="flex h-full flex-col rounded-2xl border border-cream/15 bg-gradient-to-b from-slate-950 via-slate-950 to-black p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-cream/70">
                  Books
                </div>
                <h3 className="mb-3 font-serif text-xl text-cream">
                  Fathering Without Fear &amp; other volumes
                </h3>
                <p className="mb-6 text-sm leading-relaxed text-cream/75">
                  Memoir, parable, and strategic narrative for men, fathers, and
                  builders who refuse to disappear quietly.
                </p>
                <div className="mt-auto flex items-center justify-between text-sm text-cream/80">
                  <span>Browse the bookshelf</span>
                  <span className="transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </div>
              </div>
            </Link>

            {/* Tools / Downloads / Events */}
            <div className="space-y-4">
              <Link href="/content" className="group block">
                <div className="rounded-2xl border border-cream/10 bg-slate-950/80 p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/60">
                    Essays
                  </p>
                  <h4 className="mt-2 text-sm font-medium text-cream">
                    Strategic essays &amp; field notes
                  </h4>
                  <p className="mt-2 text-xs text-cream/70">
                    Long-form thinking on crisis, leadership, and systems.
                  </p>
                </div>
              </Link>

              <Link href="/downloads" className="group block">
                <div className="rounded-2xl border border-cream/10 bg-slate-950/80 p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/60">
                    Tools
                  </p>
                  <h4 className="mt-2 text-sm font-medium text-cream">
                    Frameworks, checklists &amp; playbooks
                  </h4>
                  <p className="mt-2 text-xs text-cream/70">
                    Tactical PDFs and toolkits for execution.
                  </p>
                </div>
              </Link>

              <Link href="/events" className="group block">
                <div className="rounded-2xl border border-cream/10 bg-slate-950/80 p-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-2xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/60">
                    Events
                  </p>
                  <h4 className="mt-2 text-sm font-medium text-cream">
                    Workshops, salons &amp; convenings
                  </h4>
                  <p className="mt-2 text-xs text-cream/70">
                    Live rooms where frameworks are tested in real time.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. MANDATE & ABOUT – THE MAN AND THE MISSION */}
      <section className="relative border-b border-white/5 bg-black">
        <div className="relative mx-auto max-w-6xl px-4 py-16 lg:px-8 lg:py-20">
          <MandateStatement />
          <div className="mt-12">
            <AboutSection />
          </div>
        </div>
      </section>

      {/* 7. STATS / TIMELINE / TESTIMONIALS */}
      <section className="relative border-b border-white/5 bg-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-20 space-y-16">
          <StatsBar />
          <MilestonesTimeline />
          <TestimonialsSection />
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;