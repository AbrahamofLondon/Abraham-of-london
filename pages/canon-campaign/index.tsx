// pages/canon-campaign/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, BookOpen, Calendar, Crown } from "lucide-react";

import Layout from "@/components/Layout";

const CanonCampaignPage: NextPage = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

  return (
    <Layout
      title="Canon Campaign"
      description="A long-term project to build a Canon of applied wisdom for fathers, founders, and leaders."
    >
      <Head>
        <title>Canon Campaign | Abraham of London</title>
        <meta
          name="description"
          content="A long-term project to build a Canon of applied wisdom for fathers, founders, and leaders."
        />
        <link rel="canonical" href={`${siteUrl}/canon-campaign`} />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 -top-28 h-56 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_62%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />
          </div>

          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                  Canon · Campaign
                </span>
              </div>

              <h1 className="font-serif text-3xl font-semibold text-white sm:text-4xl lg:text-5xl">
                The Canon Campaign
              </h1>

              <p className="max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base">
                The Canon is a long-horizon build - not &quot;content&quot;, not dopamine,
                not noise. It&apos;s an architecture of applied wisdom for men who
                carry responsibility over time: fathers, founders, leaders.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-amber-400" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                      Volumes
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Long-form arguments. Properly built. No shortcuts.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-amber-400" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                      Rooms
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Workshops, salons, and private sessions for builders.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-400" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-300">
                      Tools
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Frameworks and assets designed for deployment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Body */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="grid gap-10 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-4 font-serif text-2xl font-semibold text-white">
                Where the Canon lives right now
              </h2>

              <p className="mb-6 text-sm leading-relaxed text-gray-300 sm:text-base">
                At this stage, the Canon is visible through a few public doors.
                Everything else is being drafted, tested, and catalogued - slowly,
                properly, without compromise.
              </p>

              <ul className="space-y-3">
                <li>
                  <Link
                    href="/books/the-architecture-of-human-purpose"
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-200 hover:border-amber-500/40 hover:bg-white/8"
                  >
                    <span className="flex items-center gap-3">
                      <BookOpen className="h-4 w-4 text-amber-400" />
                      The Architecture of Human Purpose · Prelude
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-amber-300" />
                  </Link>
                </li>

                <li>
                  <Link
                    href="/canon"
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-200 hover:border-amber-500/40 hover:bg-white/8"
                  >
                    <span className="flex items-center gap-3">
                      <Crown className="h-4 w-4 text-amber-400" />
                      Canon Library
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-amber-300" />
                  </Link>
                </li>

                <li>
                  <Link
                    href="/events"
                    className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-gray-200 hover:border-amber-500/40 hover:bg-white/8"
                  >
                    <span className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      Live Rooms &amp; Workshops
                    </span>
                    <ArrowRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1 group-hover:text-amber-300" />
                  </Link>
                </li>
              </ul>

              <p className="mt-8 text-sm leading-relaxed text-gray-400">
                As the Canon expands, this page will track campaigns, releases, and
                engagement paths - including fatherhood tracks and leadership cohorts.
              </p>
            </div>

            {/* Sidebar CTA */}
            <aside className="rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent p-6">
              <h3 className="font-serif text-xl font-semibold text-white">
                Inner Circle access
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">
                Some material won&apos;t be public. Not because it&apos;s &quot;exclusive&quot; -
                because serious work needs a serious room.
              </p>

              <div className="mt-6 flex flex-col gap-3">
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-amber-400"
                >
                  Join Inner Circle
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/content"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/8"
                >
                  Browse the Vault
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CanonCampaignPage;

