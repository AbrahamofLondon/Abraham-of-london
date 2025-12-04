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
/* ENHANCED CARDS                                                             */
/* -------------------------------------------------------------------------- */

const CanonVolumeCard: React.FC = () => (
  <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl transition-all duration-500 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
    <div className="absolute -inset-4 bg-gradient-to-br from-amber-500/5 via-emerald-500/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    
    <div className="relative p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-amber-600/10 p-3">
            <div className="text-xl text-amber-600 dark:text-amber-400">📜</div>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Canon · Volume I
            </span>
            <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">Prelude</div>
          </div>
        </div>
      </div>

      <div className="relative mb-6 aspect-[3/4] overflow-hidden rounded-lg bg-gradient-to-br from-gray-900 to-black shadow-inner">
        <Image
          src="/assets/images/books/the-architecture-of-human-purpose.jpg"
          alt="The Architecture of Human Purpose — Canon Volume I"
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width: 768px) 100vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      <h3 className="mb-3 font-serif text-xl font-bold text-gray-900 dark:text-white">
        The Architecture of Human Purpose
      </h3>

      <p className="mb-6 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
        The prelude to the Canon — a structural map for those who know that
        human flourishing is not accidental but architectural.
      </p>

      <div className="flex gap-3">
        <Link
          href="/books/the-architecture-of-human-purpose"
          className="flex-1 rounded-lg bg-gradient-to-r from-gray-900 to-black py-3 text-center text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-gray-900/30 dark:from-amber-600 dark:to-amber-700 dark:hover:shadow-amber-600/30"
        >
          Read Now
        </Link>
        <Link
          href="/canon"
          className="flex-1 rounded-lg border border-gray-300 bg-white py-3 text-center text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
        >
          All Volumes
        </Link>
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
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-current to-transparent opacity-30" style={{ color }} />
      
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

        <div
          className="flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-800"
        >
          <span className="font-medium opacity-70" style={{ color }}>
            Explore
          </span>
          <span className="font-medium transition-transform group-hover:translate-x-1" style={{ color }}>
            →
          </span>
        </div>
      </div>
    </article>
  </Link>
);

/* BOOK SPOTLIGHT – MEMOIR + FICTION */

const BookSpotlightCard: React.FC<{
  title: string;
  subtitle: string;
  href: string;
  image: string;
  tag: string;
  blurb: string;
}> = ({ title, subtitle, href, image, tag, blurb }) => (
  <Link href={href} className="group block">
    <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          sizes="(max-width:768px) 100vw, 320px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        <div className="absolute left-4 top-4 rounded-full bg-black/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white">
          {tag}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="mb-2 font-serif text-xl font-bold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {subtitle}
        </p>
        <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
          {blurb}
        </p>
        <div className="mt-auto flex items-center justify-between text-sm">
          <span className="font-medium text-amber-600 dark:text-amber-400">
            Open book
          </span>
          <span className="text-sm text-amber-600 transition-transform group-hover:translate-x-1 dark:text-amber-400">
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
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            {/* Left – copy */}
            <div className="max-w-xl">
              <div className="mb-8">
                <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900/30 dark:bg-amber-900/10">
                  <div className="text-lg text-amber-600 dark:text-amber-400">
                    𓆓
                  </div>
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.22em] text-amber-600 dark:text-amber-400">
                    {SEASONAL_CURATIONS.wisdomTheme}
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
                  className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-gray-900 to-black px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-gray-900/30 dark:from-amber-600 dark:to-amber-700 dark:hover:shadow-amber-600/30"
                >
                  Enter the Canon
                  <span className="transition-transform group-hover:translate-x-1">↠</span>
                </Link>
                <Link
                  href="/consulting"
                  className="inline-flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-8 py-3 text-sm font-semibold text-gray-900 transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Work with Abraham
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>
            </div>

            {/* Right – hero banner image */}
            <div className="relative">
              <div className="relative overflow-hidden rounded-2xl border border-gray-200 shadow-2xl dark:border-gray-800">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src="/assets/images/abraham-of-london-banner-2056.webp"
                    alt="Abraham of London — Canon, ventures, and structural tools for builders of legacy"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
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

      {/* -------------------------------------------------------------------
       2. STATS BAR
      -------------------------------------------------------------------- */}
      <section className="border-y border-gray-200 bg-white py-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       3. CANON & CONTENT HUB
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                Intellectual Infrastructure
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              The Canon & The Works
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Not a blog. A structured record of purpose, civilisation,
              governance, and destiny — the intellectual infrastructure
              underneath everything else.
            </p>
          </div>

          <div className="mb-16 grid gap-12 lg:grid-cols-2">
            {/* Left – Canon description + entry cards */}
            <div className="space-y-8">
              <div>
                <div className="mb-6 flex items-center gap-4">
                  <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/10 p-3">
                    <div className="text-xl text-blue-600 dark:text-blue-400">⚖</div>
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                    The Canon
                  </h3>
                </div>
                <p className="mb-8 text-lg leading-relaxed text-gray-700 dark:text-gray-300">
                  The ideological engine room — first principles, structural
                  laws, and multi-volume architecture for purpose,
                  institutions, and human destiny.
                </p>
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all hover:bg-gray-50 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                >
                  Explore all volumes
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </div>

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

            {/* Right – Canon Volume I */}
            <div>
              <CanonVolumeCard />
            </div>
          </div>

          {/* Bottom content cards */}
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
              description="Workshops, salons, and covenants where decisions — not opinions — are the output."
              href="/events"
              category="Events"
              color={CONTENT_CATEGORIES.EVENTS.color}
              icon="🕯"
            />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------------------
       3b. FEATURED BOOKS – MEMOIR + FICTION
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                Signature Works
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              Fathering Without Fear — In Two Keys
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              One story told twice: first as an unflinching memoir, then as a
              fictionalised drama that says what the courtroom could not.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <BookSpotlightCard
              title="Fathering Without Fear"
              subtitle="The Story They Thought They Knew"
              href="/books/fathering-without-fear"
              image="/assets/images/books/fathering-without-fear.jpg"
              tag="Memoir"
              blurb="A father refuses to disappear — faith tested, legacy defined, history reclaimed. This is not a parenting guide; it is a battlefield record."
            />
            <BookSpotlightCard
              title="The Fiction Adaptation"
              subtitle="When Fiction Tells What Truth Cannot"
              href="/books/the-fiction-adaptation"
              image="/assets/images/books/the-fiction-adaptation.jpg"
              tag="Fiction Adaptation"
              blurb="A covert retelling of a story too real for the courtroom — where truth hides in fiction and fiction cuts deeper than fact."
            />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* -------------------------------------------------------------------
       4. STRATEGIC FUNNEL
      -------------------------------------------------------------------- */}
      <section className="bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StrategicFunnelStrip />
        </div>
      </section>

      {/* -------------------------------------------------------------------
       5. VENTURES
      -------------------------------------------------------------------- */}
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

      {/* -------------------------------------------------------------------
       6. MANDATE & ABOUT
      -------------------------------------------------------------------- */}
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

      {/* -------------------------------------------------------------------
       7. FINAL CTA
      -------------------------------------------------------------------- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-black py-24">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <div className="mb-12">
            <h2 className="mb-6 font-serif text-4xl font-bold text-white sm:text-5xl">
              Fatherhood, leadership, and legacy — without flinching.
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
              Start with the Canon, step into a room, then build structures
              that will still be standing when the headlines have moved on.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/canon"
              className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/30"
            >
              Start with the Canon
              <span className="transition-transform group-hover:translate-x-1">↠</span>
            </Link>
            <Link
              href="/consulting"
              className="inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-10 py-4 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-gray-800 hover:shadow-lg"
            >
              Book a strategy call
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <div className="mx-auto mt-16 max-w-xs border-t border-gray-800 pt-8">
            <Link href="/content" className="text-sm font-medium text-gray-400 transition-colors hover:text-white">
              Or browse all content →
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;