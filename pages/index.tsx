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

import HeroBanner from "@/components/homepage/HeroBanner";
import VenturesSection from "@/components/homepage/VenturesSection";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import StatsBar from "@/components/homepage/StatsBar";
import AboutSection from "@/components/homepage/AboutSection";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";

/* -------------------------------------------------------------------------- */
/* LUXURY DESIGN HELPERS                                                      */
/* -------------------------------------------------------------------------- */

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

const CanonVolumeCard: React.FC = () => (
  <div className="relative mx-auto max-w-md">
    {/* Decorative corners */}
    <div className="absolute -left-2 -top-2 h-4 w-4 border-l-2 border-t-2 border-amber-400/50" />
    <div className="absolute -right-2 -top-2 h-4 w-4 border-r-2 border-t-2 border-amber-400/50" />
    <div className="absolute -left-2 -bottom-2 h-4 w-4 border-l-2 border-b-2 border-amber-400/50" />
    <div className="absolute -right-2 -bottom-2 h-4 w-4 border-r-2 border-b-2 border-amber-400/50" />

    <div
      className="relative rounded-3xl border p-6 backdrop-blur-xl"
      style={{
        borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
        backgroundColor: "rgba(15,23,42,0.85)",
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
        <div className="overflow-hidden rounded-2xl border border-amber-400/40">
          <div className="relative aspect-[4/5]">
            <Image
              src="/assets/images/abraham-of-london-banner-2056.webp"
              alt="The Architecture of Human Purpose – Canon Prelude"
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 320px, 100vw"
            />
          </div>
        </div>

        <p className="text-xs leading-relaxed text-cream/80">
          <span className="font-semibold text-amber-200">
            The Architecture of Human Purpose
          </span>{" "}
          is the prelude to the Canon — a structural map for men who know
          that human flourishing is not accidental but architectural.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/canon/the-architecture-of-human-purpose"
            className="inline-flex items-center rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-black shadow hover:bg-amber-300"
          >
            Read the Prelude
            <span className="ml-1">↗</span>
          </Link>
          <Link
            href="/canon"
            className="inline-flex items-center rounded-full border border-amber-200/60 px-4 py-2 text-xs font-medium text-amber-100 hover:bg-amber-200/10"
          >
            Explore all volumes
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
/* PAGE                                                                       */
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

      {/* GLOBAL BACKDROP */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-slate-950 to-black" />
        <div
          className="absolute left-1/4 top-1/4 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.saffron }}
        />
        <div
          className="absolute right-1/4 bottom-1/4 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full opacity-10 blur-3xl"
          style={{ backgroundColor: LIBRARY_AESTHETICS.colors.primary.lapis }}
        />
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

      {/* 1. HERO – primary conversion CTAs */}
      <section className="relative min-h-[90vh] overflow-hidden border-b border-white/10">
        <GoldFoilAccent position="bottom" />

        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23D4AF37' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative mx-auto flex h-full max-w-7xl flex-col gap-12 px-4 py-24 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          {/* Copy */}
          <div className="max-w-2xl text-center lg:text-left">
            <div
              className="mb-6 inline-flex items-center gap-3 rounded-full px-5 py-2"
              style={{
                backgroundColor: "rgba(234,179,8,0.08)",
                border: "1px solid rgba(234,179,8,0.35)",
              }}
            >
              <div className="text-2xl">𓆓</div>
              <span
                className="text-xs font-medium tracking-[0.2em]"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                {SEASONAL_CURATIONS.wisdomTheme}
              </span>
            </div>

            <h1 className="mb-6 font-serif text-4xl font-light tracking-tight text-cream sm:text-5xl lg:text-6xl">
              <span
                className="mb-3 block text-2xl sm:text-3xl"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
              >
                Abraham of London
              </span>
              Structural thinking for fathers, founders,
              <br />
              and builders of legacy.
            </h1>

            <p className="mb-8 text-sm leading-relaxed text-cream/80 sm:text-base">
              If you carry responsibility for a family, a company, or a
              community, this is the room where faith, history, strategy, and
              markets get put to work — not just discussed.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link
                href="/canon"
                className="inline-flex items-center rounded-full bg-amber-400 px-6 py-2 text-sm font-semibold text-black shadow-lg hover:bg-amber-300"
              >
                Enter the Canon
                <span className="ml-2">↠</span>
              </Link>
              <Link
                href="/consulting"
                className="inline-flex items-center rounded-full border border-cream/30 bg-cream/5 px-6 py-2 text-sm text-cream/85 hover:bg-cream/10"
              >
                Work with Abraham
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="relative overflow-hidden rounded-3xl border border-amber-400/40 bg-black/60 shadow-2xl">
              <div className="relative aspect-[4/5]">
                <Image
                  src="/assets/images/abraham-of-london-banner-2056.webp"
                  alt="Abraham of London – structural work"
                  fill
                  priority
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 420px"
                />
              </div>
              <div className="border-t border-amber-400/30 px-5 py-3 text-xs text-amber-100/80">
                Built for men who refuse to outsource responsibility — to the
                state, the culture, or the algorithm.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SOCIAL PROOF / NUMBERS */}
      <section className="border-b border-white/5 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
          <StatsBar />
        </div>
      </section>

      {/* 3. CANON & CONTENT HUB – intellectual engine */}
      <section className="relative border-b border-white/5 bg-gradient-to-b from-slate-950 via-slate-950 to-black py-16">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300/70">
                The Canon
              </p>
              <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-cream sm:text-4xl lg:text-5xl">
                The ideological engine room.
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/80">
                Not a blog. A structured record of purpose, civilisation,
                governance, and destiny — the intellectual infrastructure
                underneath the advisory, the rooms, and the ventures.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <ContentCard
                  title="Canon Volumes"
                  description="Multi-volume architecture for purpose, institutions, and human destiny."
                  href="/canon"
                  category="Canon"
                  color={CONTENT_CATEGORIES.CANON.color}
                  icon="📚"
                />
                <ContentCard
                  title="Essays & Posts"
                  description="Strategic essays applying first principles to culture, policy, and markets."
                  href="/blog"
                  category="Essays"
                  color={CONTENT_CATEGORIES.POSTS.color}
                  icon="✒"
                />
              </div>
            </div>

            <CanonVolumeCard />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <ContentCard
              title="Tools & Downloads"
              description="Playbooks, templates, and structural tools for execution in the real world."
              href="/downloads"
              category="Resources"
              color={CONTENT_CATEGORIES.RESOURCES.color}
              icon="⚙"
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

      {/* 4. STRATEGIC FUNNEL – three doors */}
      <StrategicFunnelStrip />

      {/* 5. VENTURES – operating arms */}
      <VenturesSection />

      {/* 6. MANDATE + ABOUT – authority & story */}
      <section className="border-t border-b border-white/5 bg-black">
        <div className="mx-auto max-w-6xl space-y-12 px-4 py-16 lg:px-8 lg:py-20">
          <MandateStatement />
          <AboutSection />
        </div>
      </section>

      {/* 7. FINAL CTA – lighter HeroBanner for contrast */}
      <section className="bg-warmWhite">
        <HeroBanner
          title="Fatherhood, leadership, and legacy — without flinching."
          subtitle="Start with the Canon, step into a room, then build structures that will still be standing when the headlines have moved on."
          ctaLabel="Start with the Canon"
          ctaHref="/canon"
          secondaryCtaLabel="Book a strategy call"
          secondaryCtaHref="/consulting"
          imageSrc="/assets/images/abraham-of-london-banner-2056.webp"
        />
      </section>
    </Layout>
  );
};

export default HomePage;