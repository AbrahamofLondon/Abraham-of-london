// pages/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Download, Shield, Users, BookOpen } from "lucide-react";

import Layout from "@/components/Layout";

const siteUrl = "https://www.abrahamoflondon.org";
const siteTitle = "Abraham of London";
const siteTagline = "Faith-rooted strategy, fatherhood, and legacy for serious men and builders.";

const HomePage: NextPage = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteTitle,
    url: siteUrl,
    description:
      "Abraham of London – where faith, strategy, fatherhood, and legacy intersect. A hub for men and builders who refuse to drift.",
    creator: {
      "@type": "Person",
      name: "Abraham of London",
    },
  };

  return (
    <Layout title="Home">
      <Head>
        <title>{siteTitle}</title>
        <meta name="description" content={siteTagline} />
        <meta property="og:title" content={siteTitle} />
        <meta property="og:description" content={siteTagline} />
        <meta property="og:url" content={siteUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={siteTitle} />
        <meta property="twitter:card" content="summary_large_image" />
        <script
          type="application/ld+json"
          // Safe: static stringified object
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-black text-white">
        {/* Subtle radial glow in the background */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60"
        >
          <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-forest/30 blur-3xl" />
          <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-softGold/25 blur-3xl" />
        </div>

        {/* CONTENT WRAPPER */}
        <div className="relative mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-20 pt-16 md:pt-20 lg:pt-24">
          {/* HERO SECTION */}
          <section className="grid gap-12 md:grid-cols-[3fr,2fr] md:items-center">
            <div>
              <p className="mb-4 text-xs font-semibold tracking-[0.22em] text-softGold/80 uppercase">
                ABRAHAM OF LONDON
              </p>

              <h1 className="mb-4 text-4xl font-serif font-semibold leading-tight text-softGold md:text-5xl lg:text-6xl">
                Building fathers, founders
                <span className="text-white"> and faithful leaders.</span>
              </h1>

              <p className="mb-6 max-w-xl text-base md:text-lg text-slate-200/90 leading-relaxed">
                You carry responsibility – for a home, a team, a business, a calling.
                This platform exists to give you language, structure, and tools
                to build with clarity, courage, and conviction.
              </p>

              {/* HERO CTAs */}
              <div className="mb-4 flex flex-wrap gap-4">
                <Link
                  href="/downloads"
                  className="inline-flex items-center gap-2 rounded-full bg-forest px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-forest/40 transition hover:bg-forest/90"
                >
                  <Download className="h-4 w-4" />
                  Strategic downloads
                </Link>

                <Link
                  href="/strategy/sample-strategy"
                  className="inline-flex items-center gap-2 rounded-full border border-softGold/70 bg-transparent px-6 py-3 text-sm font-semibold text-softGold transition hover:bg-softGold/10"
                >
                  Strategy sample
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <p className="text-xs text-slate-300/80">
                Built on conservative Christian conviction and disciplined strategy. No fluff,
                no performance – just tools to help you stand, build, and finish well.
              </p>
            </div>

            {/* HERO IMAGE PANEL */}
            <div className="relative">
              <div className="relative h-[260px] w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 shadow-2xl shadow-black/60 backdrop-blur">
                <Image
                  src="/assets/images/abraham-of-london-banner.webp"
                  alt="Abraham of London"
                  fill
                  priority
                  className="object-cover object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs md:text-sm text-slate-100/90">
                  <div>
                    <p className="font-semibold tracking-wide text-softGold">
                      Fathering Without Fear
                    </p>
                    <p className="text-slate-200/80">
                      A movement for men who refuse to drift.
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-600/80 bg-black/40 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-slate-200/80">
                    LIVE BUILD
                  </span>
                </div>
              </div>

              {/* Floating stats card */}
              <div className="absolute -bottom-6 left-6 hidden w-64 rounded-2xl border border-slate-700/80 bg-slate-900/90 p-4 text-xs text-slate-100/90 shadow-xl shadow-black/60 md:block">
                <p className="mb-2 text-[0.65rem] font-semibold tracking-[0.2em] text-softGold/80 uppercase">
                  CORE PILLARS
                </p>
                <div className="space-y-1.5">
                  <p>• Fatherhood & legacy building</p>
                  <p>• Strategy, systems & execution</p>
                  <p>• Brotherhood & accountability</p>
                </div>
              </div>
            </div>
          </section>

          {/* THREE PILLARS SECTION */}
          <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif font-semibold text-white">
                  The work this platform is here to do.
                </h2>
                <p className="max-w-2xl text-sm md:text-base text-slate-200/85 mt-2">
                  Everything sits under three pillars. If it doesn&apos;t serve one of these,
                  it doesn&apos;t belong here. Simple.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Fatherhood */}
              <div className="group flex flex-col rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-5 shadow-lg shadow-black/50 transition hover:border-softGold/50 hover:shadow-softGold/30">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-softGold/15 text-softGold">
                  <Shield className="h-4 w-4" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Fatherhood & Legacy
                </h3>
                <p className="mb-4 text-sm text-slate-200/90">
                  Tools, language, and frameworks for men raising sons and daughters
                  in a world that punishes conviction.
                </p>
                <Link
                  href="/downloads/principles-for-my-son-cue-card"
                  className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-softGold/90 hover:text-softGold"
                >
                  View “Principles for My Son”
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Brotherhood */}
              <div className="group flex flex-col rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-5 shadow-lg shadow-black/50 transition hover:border-softGold/50 hover:shadow-softGold/30">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-forest/15 text-forest">
                  <Users className="h-4 w-4" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Brotherhood & Accountability
                </h3>
                <p className="mb-4 text-sm text-slate-200/90">
                  Covenants, cues, and rhythms for building circles of men who
                  sharpen each other instead of draining each other.
                </p>
                <Link
                  href="/resources/brotherhood-starter-kit"
                  className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-softGold/90 hover:text-softGold"
                >
                  Open Brotherhood Starter Kit
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Strategy */}
              <div className="group flex flex-col rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900/80 to-slate-950/90 p-5 shadow-lg shadow-black/50 transition hover:border-softGold/50 hover:shadow-softGold/30">
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-forest/15 text-forest">
                  <BookOpen className="h-4 w-4" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  Strategy & Execution
                </h3>
                <p className="mb-4 text-sm text-slate-200/90">
                  One-pagers, operating rhythms, and decision frameworks for
                  founders, executives, and builders who think long-term.
                </p>
                <Link
                  href="/downloads/board-investor-onepager"
                  className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-softGold/90 hover:text-softGold"
                >
                  View Board / Investor One-Pager
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </section>

          {/* FEATURED DOWNLOADS */}
          <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <h2 className="text-2xl md:text-3xl font-serif font-semibold text-white">
                Featured strategic downloads
              </h2>
              <Link
                href="/downloads"
                className="inline-flex items-center gap-2 text-sm font-semibold text-softGold/90 hover:text-softGold"
              >
                View all downloads
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              {/* Card 1 */}
              <Link
                href="/downloads/entrepreneur-survival-checklist"
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-left shadow-lg shadow-black/50 transition hover:border-softGold/60 hover:bg-slate-900/90"
              >
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-forest/80">
                  ENTREPRENEUR
                </p>
                <h3 className="mb-2 text-base font-semibold text-white">
                  Entrepreneur Survival Checklist
                </h3>
                <p className="mb-4 text-xs text-slate-200/90">
                  A ruthless, practical grid for staying alive – financially,
                  emotionally, and spiritually – while you build.
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[0.75rem] font-semibold text-softGold/90">
                  Open checklist
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              {/* Card 2 */}
              <Link
                href="/downloads/family-altar-liturgy"
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-left shadow-lg shadow-black/50 transition hover:border-softGold/60 hover:bg-slate-900/90"
              >
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-softGold/80">
                  FAMILY
                </p>
                <h3 className="mb-2 text-base font-semibold text-white">
                  Family Altar Liturgy
                </h3>
                <p className="mb-4 text-xs text-slate-200/90">
                  A simple, repeatable pattern for building Scripture, prayer,
                  and gratitude into the actual rhythm of your home.
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[0.75rem] font-semibold text-softGold/90">
                  View liturgy
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>

              {/* Card 3 */}
              <Link
                href="/downloads/brotherhood-covenant"
                className="group flex flex-col rounded-2xl border border-slate-800 bg-slate-950/80 p-5 text-left shadow-lg shadow-black/50 transition hover:border-softGold/60 hover:bg-slate-900/90"
              >
                <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-forest/80">
                  BROTHERHOOD
                </p>
                <h3 className="mb-2 text-base font-semibold text-white">
                  Brotherhood Covenant
                </h3>
                <p className="mb-4 text-xs text-slate-200/90">
                  A clear, unapologetic covenant for men who want more than
                  banter – they want sharpening, truth, and tested loyalty.
                </p>
                <span className="mt-auto inline-flex items-center gap-1 text-[0.75rem] font-semibold text-softGold/90">
                  Read covenant
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            </div>
          </section>

          {/* FINAL CALLOUT */}
          <section className="mt-4 rounded-3xl border border-softGold/40 bg-gradient-to-r from-forest/90 via-forest to-softGold/80 px-6 py-8 text-center shadow-2xl shadow-black/60 md:px-10 md:py-10">
            <h2 className="mb-3 text-2xl md:text-3xl font-serif font-semibold text-slate-950">
              You&apos;re not here by accident.
            </h2>
            <p className="mx-auto mb-6 max-w-3xl text-sm md:text-base text-slate-950/90">
              If your life is in a storm, or you&apos;re quietly rebuilding from the ground up,
              you are exactly who this work is for. Take one tool, one principle, one
              download, and actually use it. Then take the next step.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/downloads/entrepreneur-operating-pack"
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-6 py-3 text-sm font-semibold text-softGold shadow-lg shadow-black/50 transition hover:bg-black"
              >
                Open Entrepreneur Operating Pack
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-slate-950/70 bg-transparent px-6 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-950 hover:text-softGold"
              >
                Talk about a project
              </Link>
            </div>
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default HomePage;