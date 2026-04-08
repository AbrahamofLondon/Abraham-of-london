import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import type { NextPage } from "next";
import { motion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  Globe,
  Lock,
  Scale,
  ShieldCheck,
  TrendingUp,
  Building2,
  LineChart,
  Landmark,
} from "lucide-react";

import Layout from "@/components/Layout";

const signalCards = [
  {
    icon: TrendingUp,
    title: "Macro interpretation",
    body:
      "A governed reading of how trade friction, policy pressure, and capital selectivity are changing the operating environment.",
  },
  {
    icon: Globe,
    title: "Jurisdictional positioning",
    body:
      "A strategic surface across major economies, framed around resilience, credibility, and optionality rather than noise.",
  },
  {
    icon: Building2,
    title: "Board utility",
    body:
      "Built for executives, boards, allocators, and serious operators who need implication, not commentary.",
  },
];

const readingLayers = [
  {
    eyebrow: "Public Brief",
    title: "Global Market Outlook Q1 2026",
    body:
      "A refined public reading for serious readers who want the shape of the quarter without the full institutional edge.",
    href: "/artifacts/global-market-outlook-q1-2026-public",
    cta: "Read public brief",
    icon: FileText,
    accent:
      "bg-white text-black hover:opacity-95",
  },
  {
    eyebrow: "Institutional Edition",
    title: "Global Market Intelligence Report Q1 2026",
    body:
      "The full restricted briefing for strategic operators, with stronger framing, deeper implications, and higher decision utility.",
    href: "/artifacts/global-market-intelligence-report-q1-2026",
    cta: "Open institutional edition",
    icon: Lock,
    accent:
      "border border-[#C9A96A]/35 text-white hover:bg-white/[0.04]",
  },
  {
    eyebrow: "Boardroom PDF",
    title: "Portable executive copy",
    body:
      "A cleaner boardroom edition for premium portability, quick circulation, and leadership review.",
    href: "/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf",
    cta: "Open boardroom PDF",
    icon: Scale,
    accent:
      "border border-white/15 text-white hover:bg-white/[0.04]",
  },
];

const operatorPoints = [
  "Resilience is now competing directly with growth as a primary valuation variable.",
  "Policy has become an operating input, not background context.",
  "Supply-chain design now affects enterprise value and board judgment.",
  "Serious operators must separate signal from theatrical volatility.",
];

const utilityStrips = [
  {
    icon: Landmark,
    title: "For boards",
    body: "Use as a macro-political context pack for strategy, risk, and capital allocation review.",
  },
  {
    icon: LineChart,
    title: "For operators",
    body: "Use to reframe assumptions around pricing, flow, financing, and jurisdictional exposure.",
  },
  {
    icon: ShieldCheck,
    title: "For serious readers",
    body: "Use to orient thinking without wading through market theatre and disposable opinion.",
  },
];

const IntelligenceLandingPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>Global Market Intelligence Q1 2026 | Abraham of London</title>
        <meta
          name="description"
          content="A disciplined intelligence surface for the Q1 2026 market environment, with public, institutional, and boardroom reading layers."
        />
      </Head>

      <Layout>
        <main className="min-h-screen bg-[#08131F] text-white">
          <section className="relative overflow-hidden border-b border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(201,169,106,0.13),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.03),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent)]" />
            <div className="absolute inset-0 opacity-[0.05] aol-grain" />
            <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-24 md:px-8 md:pb-28 md:pt-32">
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55 }}
                className="max-w-5xl"
              >
                <div className="inline-flex items-center rounded-full border border-[#C9A96A]/30 bg-white/5 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
                  Market Intelligence · Q1 2026
                </div>

                <h1 className="mt-7 max-w-5xl font-serif text-4xl leading-tight text-white/95 md:text-6xl">
                  A disciplined reading of a harder market.
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-8 text-white/72 md:text-lg">
                  This is not built as campaign copy. It is a governed intelligence
                  surface for readers who value serious interpretation, strategic
                  texture, and signal over noise.
                </p>

                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href="/artifacts/global-market-outlook-q1-2026-public"
                    className="inline-flex items-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                  >
                    Read public brief
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>

                  <Link
                    href="/artifacts/global-market-intelligence-report-q1-2026"
                    className="inline-flex items-center rounded-2xl border border-[#C9A96A]/35 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
                  >
                    Institutional edition
                    <Lock className="ml-2 h-4 w-4 text-[#C9A96A]" />
                  </Link>

                  <Link
                    href="/api/artifacts/global-market-intelligence-q1-2026-boardroom-pdf"
                    className="inline-flex items-center rounded-2xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.04]"
                  >
                    Boardroom PDF
                    <Scale className="ml-2 h-4 w-4 text-[#C9A96A]" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {signalCards.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[28px] border border-white/10 bg-white/[0.035] p-7 shadow-[0_18px_50px_rgba(0,0,0,0.22)]"
                  >
                    <Icon className="h-6 w-6 text-[#C9A96A]" />
                    <h2 className="mt-5 text-xl font-semibold text-white/95">
                      {item.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-4 md:px-8 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[32px] border border-white/10 bg-white/[0.035] p-8 md:p-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
                  Product Surface
                </div>

                <h2 className="mt-4 max-w-3xl font-serif text-3xl leading-tight text-white/95 md:text-4xl">
                  Three reading layers. One standard of seriousness.
                </h2>

                <p className="mt-5 max-w-2xl text-sm leading-8 text-white/72 md:text-base">
                  The public edition exists to orient disciplined readers. The
                  institutional edition exists to support better review, sharper
                  framing, and stronger decision quality. The boardroom PDF exists
                  for cleaner portability where pace matters.
                </p>

                <div className="mt-8 grid gap-5">
                  {readingLayers.map((layer) => {
                    const Icon = layer.icon;
                    return (
                      <div
                        key={layer.title}
                        className="rounded-[26px] border border-white/10 bg-[#0B1623] p-6"
                      >
                        <div className="text-[11px] uppercase tracking-[0.22em] text-[#C9A96A]">
                          {layer.eyebrow}
                        </div>

                        <div className="mt-3 flex items-start justify-between gap-4">
                          <div className="max-w-2xl">
                            <h3 className="text-xl font-semibold text-white/95">
                              {layer.title}
                            </h3>
                            <p className="mt-3 text-sm leading-7 text-white/70">
                              {layer.body}
                            </p>
                          </div>
                          <Icon className="mt-1 h-5 w-5 shrink-0 text-[#C9A96A]" />
                        </div>

                        <div className="mt-6">
                          <Link
                            href={layer.href}
                            className={`inline-flex items-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${layer.accent}`}
                          >
                            {layer.cta}
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <aside className="rounded-[32px] border border-white/10 bg-white/[0.035] p-8 md:p-10">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
                  Operator Read
                </div>

                <h2 className="mt-4 font-serif text-2xl leading-tight text-white/95 md:text-3xl">
                  The quarter changed how serious readers should weight the variables.
                </h2>

                <div className="mt-8 space-y-4">
                  {operatorPoints.map((point) => (
                    <div
                      key={point}
                      className="rounded-2xl border border-white/10 bg-[#0B1623] px-4 py-4 text-sm leading-7 text-white/78"
                    >
                      {point}
                    </div>
                  ))}
                </div>

                <div className="mt-8 rounded-[24px] border border-[#C9A96A]/25 bg-[linear-gradient(180deg,rgba(201,169,106,0.08),rgba(255,255,255,0.02))] p-5">
                  <p className="text-sm leading-7 text-white/80">
                    The best intelligence product signals confidence by design, not
                    volume. This page is built to be found naturally, revisited
                    voluntarily, and trusted gradually.
                  </p>
                </div>
              </aside>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-6 py-16 md:px-8">
            <div className="mb-8">
              <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
                Quiet Utility
              </div>
              <h2 className="mt-3 font-serif text-3xl text-white/95 md:text-4xl">
                Built to support review, not theatre.
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {utilityStrips.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[28px] border border-white/10 bg-[#0B1623] p-7"
                  >
                    <Icon className="h-6 w-6 text-[#C9A96A]" />
                    <h3 className="mt-5 text-lg font-semibold text-white/95">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-white/70">
                      {item.body}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="border-t border-white/10">
            <div className="mx-auto max-w-7xl px-6 py-20 text-center md:px-8">
              <div className="mx-auto max-w-3xl">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-[#C9A96A]">
                  Closing Position
                </div>

                <h2 className="mt-5 font-serif text-3xl leading-tight text-white/95 md:text-5xl">
                  Serious readers do not need louder information. They need cleaner judgment.
                </h2>

                <p className="mt-6 text-base leading-8 text-white/68">
                  The public brief is open. The institutional edition is available.
                  The boardroom PDF exists for those who need sharper portability.
                  Choose the layer that fits the seriousness of the task.
                </p>

                <div className="mt-10 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/artifacts/global-market-outlook-q1-2026-public"
                    className="inline-flex items-center rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:opacity-95"
                  >
                    Public brief
                    <FileText className="ml-2 h-4 w-4" />
                  </Link>

                  <Link
                    href="/artifacts/global-market-intelligence-report-q1-2026"
                    className="inline-flex items-center rounded-2xl border border-[#C9A96A]/35 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.04]"
                  >
                    Institutional edition
                    <Lock className="ml-2 h-4 w-4 text-[#C9A96A]" />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </main>
      </Layout>
    </>
  );
};

export default IntelligenceLandingPage;