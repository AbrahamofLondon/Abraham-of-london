/* ============================================================================
   FILE: pages/diagnostics/executive-reporting.tsx
   PRODUCT PAGE — EXECUTIVE REPORTING SYSTEM
   Purpose:
   - package the reporting product for market
   - position it as a premium niche solution
   - connect assessment -> report -> advisory
   - bridge cleanly into Strategy Room
   CRITICAL FIXES APPLIED:
   1. Hero CTA hierarchy — flagship product sells itself first
   2. Architecture block added under hero metrics
   3. Inevitability language sharpened in final section
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Scale,
  Crown,
  Lock,
  CheckCircle2,
  Eye,
  Target,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";
import ExecutiveReportSamplePreview from "@/components/diagnostics/ExecutiveReportSamplePreview";
import ExecutiveOfferLadder from "@/components/diagnostics/ExecutiveOfferLadder";
import ExecutiveBuyerVariants from "@/components/diagnostics/ExecutiveBuyerVariants";
import ExecutiveDemoScenarios from "@/components/diagnostics/ExecutiveDemoScenarios";
import ExecutivePricingGrid from "@/components/diagnostics/ExecutivePricingGrid";
import SalesObjectionGrid from "@/components/diagnostics/SalesObjectionGrid";
import PricingLanguageStrip from "@/components/diagnostics/PricingLanguageStrip";
import BuyerCTACluster from "@/components/diagnostics/BuyerCTACluster";
import ExecutiveReportSampleDownload from "@/components/diagnostics/ExecutiveReportSampleDownload";
import AnonymisedCaseProof from "@/components/diagnostics/AnonymisedCaseProof";
import TrustFAQ from "@/components/diagnostics/TrustFAQ";
import SeriousBuyerGate from "@/components/diagnostics/SeriousBuyerGate";
import { EXECUTIVE_PROOF_BLOCKS } from "@/lib/diagnostics/executive-reporting-market-proof";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

type Props = {};

type Pillar = {
  title: string;
  body: string;
  icon: React.ComponentType<any>;
};

const PILLARS: Pillar[] = [
  {
    title: "Readable under pressure",
    body: "Designed for leadership environments where politics, drag, ego, and ambiguity corrupt surface-level interpretation.",
    icon: Eye,
  },
  {
    title: "Decision-grade output",
    body: "Not a decorative dashboard. Not a vague scorecard. A report that clarifies friction, exposure, correction priority, and execution authority.",
    icon: Scale,
  },
  {
    title: "Commercially selective",
    body: "Built for serious operators, boards, founders, and institutions where the cost of error justifies disciplined reading before action.",
    icon: Crown,
  },
];

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-amber-500/[0.045] blur-[130px]" />
      <div className="absolute right-[12%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_50%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-500/30" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
        {children}
      </span>
    </div>
  );
}

function Surface({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={[
        "border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm",
        "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

const ExecutiveReportingPage: NextPage<Props> = () => {
  const reduceMotion = useReducedMotion();
  const [unlocked, setUnlocked] = React.useState(false);

  return (
    <Layout
      title="Executive Reporting"
      description="A premium executive reporting system for boards, founders, and institutions that require disciplined interpretation before action."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics/executive-reporting`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* ------------------------------------------------------------------ */}
        {/* HERO                                                               */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <RailLabel>Executive Reporting System</RailLabel>
                </motion.div>

                <motion.div
                  className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.06 }}
                >
                  <ShieldCheck className="h-4 w-4 text-amber-400/70" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                    Flagship bridge product
                  </span>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[12ch] font-serif text-5xl font-light leading-[0.94] tracking-[-0.03em] text-white md:text-7xl lg:text-[5.1rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.1 }}
                >
                  Reports for people
                  <span className="mt-2 block text-white/56">
                    carrying consequence
                  </span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  This is the premium bridge between raw diagnostic signal and
                  full advisory mandate. It exists for operators who need a
                  disciplined reading before intervention, but are not yet
                  casually handing over the matter to private chamber work.
                </motion.p>

                {/* CHANGE A — Hero CTA order flipped */}
                <motion.div
                  className="mt-10 flex flex-col gap-4 sm:flex-row"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.28 }}
                >
                  <Link
                    href="#sample-report"
                    className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                  >
                    <span>View sample output</span>
                    <FileText className="h-4 w-4 transition-transform group-hover:scale-105" />
                  </Link>

                  <Link
                    href="/strategy-room"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Enter Strategy Room</span>
                    <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                {/* CHANGE B — Architecture block under hero metrics */}
                <motion.div
                  className="mt-10 border border-white/[0.08] bg-white/[0.015] p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.4 }}
                >
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                    Position in the system
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/56">
                    Diagnostics identifies the signal. Executive Reporting interprets it.
                    Strategy Room intervenes when the report makes mandate-level action feel
                    justified rather than prematurely sold.
                  </p>
                </motion.div>

                <motion.div
                  className="mt-10 grid gap-4 sm:grid-cols-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.45 }}
                >
                  {[
                    { label: "Output", value: "Executive PDF" },
                    { label: "Bias", value: "Correction" },
                    { label: "Use", value: "Decision Fit" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border border-white/[0.08] bg-white/[0.015] p-4"
                    >
                      <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
                        {item.label}
                      </div>
                      <div className="mt-2 font-serif text-lg text-white/88">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.16 }}
              >
                <Surface className="h-full p-8 md:p-10">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                      Strategic role
                    </span>
                    <Crown className="h-4 w-4 text-amber-500/50" />
                  </div>

                  <h2 className="font-serif text-3xl text-white md:text-4xl">
                    Not consultancy theatre.
                    <span className="mt-2 block text-white/55">
                      A premium middle with teeth.
                    </span>
                  </h2>

                  <div className="mt-8 space-y-4">
                    {[
                      "Narrative + matrix + exposure in one disciplined artifact",
                      "Useful before advisory, during intervention, and after instability",
                      "Readable by founders, boards, leadership teams, and operators",
                      "Strong enough to make Strategy Room feel deserved rather than pushed",
                    ].map((line) => (
                      <div key={line} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-amber-400/70" />
                        <span className="text-sm leading-relaxed text-white/58">
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 border-t border-white/6 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                          Buyer
                        </div>
                        <div className="mt-2 text-sm text-white/76">
                          Founder / Board / COO / Leadership Team
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                          Trigger
                        </div>
                        <div className="mt-2 text-sm text-white/76">
                          Friction, drift, distrust, exposure
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-4">
                      <div className="flex items-start gap-3">
                        <Lock className="mt-0.5 h-4 w-4 text-amber-400/70" />
                        <div>
                          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
                            Commercial discipline
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-white/56">
                            This page should make the buyer feel: “These people do not force me into mandate work too early, which makes me trust their mandate work more.”
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Surface>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* THREE PILLARS — What makes this different                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Structure</RailLabel>
              <h2 className="mt-7 max-w-4xl font-serif text-4xl text-white md:text-5xl">
                A category between soft diagnostics and full advisory.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Most firms either sell vague diagnostics or jump too quickly into
                advisory. Executive Reporting occupies the high-value middle:
                premium enough to matter, disciplined enough to stand alone.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {PILLARS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.08 }}
                  >
                    <Surface className="h-full p-8">
                      <Icon className="h-6 w-6 text-amber-400/68" />
                      <h3 className="mt-6 font-serif text-2xl text-white">
                        {item.title}
                      </h3>
                      <p className="mt-4 text-sm leading-relaxed text-white/48">
                        {item.body}
                      </p>
                    </Surface>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* OFFER LADDER — Demonstrated, not announced                         */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>How it works</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Three layers. One path.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Start where you are. Move when the signal justifies it.
              </p>
            </div>

            <ExecutiveOfferLadder />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {/* Diagnostic Entry */}
              <Surface className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
                      Entry
                    </div>
                    <h3 className="mt-3 font-serif text-2xl text-white">Diagnostic</h3>
                  </div>
                  <div className="text-sm text-amber-300">Paid</div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/48">
                  A structured first-layer reading for leaders who need clarity before escalation.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Signal reading</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Initial structural interpretation</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Suitable before mandate work</span>
                  </li>
                </ul>
                <Link
                  href="/diagnostics"
                  className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/68 transition-colors hover:text-amber-300"
                >
                  <span>Start here</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Surface>

              {/* Executive Report — Flagship */}
              <Surface className="border-amber-500/20 bg-amber-500/[0.03] p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
                      Flagship
                    </div>
                    <h3 className="mt-3 font-serif text-2xl text-white">Executive Report</h3>
                  </div>
                  <div className="text-sm text-amber-300">Premium</div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/48">
                  The core reporting product for institutions needing a disciplined narrative, quantified friction, and correction architecture.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Executive diagnostic report</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Narrative + matrix + exposure model</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>PDF + structured export surface</span>
                  </li>
                </ul>
                <Link
                  href="/diagnostics/executive-reporting"
                  className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/68 transition-colors hover:text-amber-300"
                >
                  <span>Current page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Surface>

              {/* Advisory Escalation */}
              <Surface className="p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
                      Selective
                    </div>
                    <h3 className="mt-3 font-serif text-2xl text-white">Strategy Room</h3>
                  </div>
                  <div className="text-sm text-amber-300">Mandate</div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-white/48">
                  For matters where the cost of mis-execution is already material and structured intervention is justified.
                </p>
                <ul className="mt-6 space-y-3">
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Private advisory path</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Correction environment design</span>
                  </li>
                  <li className="flex items-start gap-3 text-sm text-white/56">
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>Decision architecture under pressure</span>
                  </li>
                </ul>
                <Link
                  href="/strategy-room"
                  className="mt-8 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/68 transition-colors hover:text-amber-300"
                >
                  <span>Learn when</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Surface>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* BUYER VARIANTS                                                     */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Who it serves</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                One engine. Different languages.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                The structure remains stable. The framing changes based on who carries the consequence.
              </p>
            </div>

            <ExecutiveBuyerVariants />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SAMPLE REPORT PREVIEW                                              */}
        {/* ------------------------------------------------------------------ */}
        <section id="sample-report" className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <RailLabel>Sample output</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  What you actually receive
                </h2>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                  Not a summary. A structured executive artifact: headline, systemic reading, domain matrix, financial exposure, priority stack, and decision mandate.
                </p>
              </div>

              <Link
                href="/diagnostics"
                className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-400/66 transition-colors hover:text-amber-300"
              >
                <span>Begin with diagnostics</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {!unlocked ? (
              <div className="border border-white/10 bg-white/[0.02] p-10 text-center">
                <p className="mb-6 text-white/60">
                  Reserved for serious buyers. Quality without exposure.
                </p>
                <button
                  onClick={() => setUnlocked(true)}
                  className="inline-flex items-center justify-center gap-2 border border-amber-500/30 bg-amber-500/10 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Unlock sample preview
                </button>
              </div>
            ) : (
              <ExecutiveReportSamplePreview />
            )}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* USE CASES                                                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>When to use it</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Where this product earns its keep
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Executive Reporting is a commercial instrument. Here's when it fits.
              </p>
            </div>

            <ExecutiveDemoScenarios />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PRICING — Clean, no commentary                                     */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Investment</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Clarity before commitment
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Entry signal. Flagship report. Private mandate.
              </p>
            </div>

            <ExecutivePricingGrid />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {EXECUTIVE_PROOF_BLOCKS.map((item) => (
                <div
                  key={item.title}
                  className="border border-white/[0.08] bg-white/[0.02] p-6"
                >
                  <h3 className="font-serif text-2xl text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/48">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SAMPLE DOWNLOAD                                                    */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <ExecutiveReportSampleDownload />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* MARKET PROOF — Anonymised patterns                                 */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Patterns we've surfaced</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Real friction. Anonymised.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Not testimonials. Actual structural patterns the system has identified.
              </p>
            </div>

            <AnonymisedCaseProof />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* OBJECTION HANDLING                                                 */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Questions</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                What serious buyers ask
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Direct answers. No deflection.
              </p>
            </div>

            <SalesObjectionGrid />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* TRUST FAQ                                                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Reliability</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Boardroom-level clarity
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                No generic answers. Just precision.
              </p>
            </div>

            <TrustFAQ />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* PRICING LANGUAGE STRIP                                             */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <PricingLanguageStrip />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FINAL BRIDGE — CHANGE C applied                                    */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.04),transparent_70%)]" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-4xl text-white md:text-5xl">
                The report is not the final room.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-white/50">
                It is the disciplined bridge. Where the signal is serious enough,
                the next right move is Strategy Room.
              </p>
            </div>

            <BuyerCTACluster />

            <div className="mt-12 rounded-3xl border border-amber-500/16 bg-amber-500/[0.04] p-8 text-center">
              <div className="mx-auto max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/78">
                  <Target className="h-3.5 w-3.5" />
                  When to escalate
                </div>

                {/* CHANGE C — Sharpened inevitability language */}
                <h3 className="mt-6 font-serif text-3xl text-white md:text-4xl">
                  When the report exposes material risk, escalation is no longer a branding move. It becomes the responsible next step.
                </h3>

                <p className="mt-5 text-base leading-relaxed text-white/58">
                  That is the point of this page. Not to replace advisory. To qualify it properly.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href="/strategy-room"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Enter Strategy Room</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/diagnostics"
                    className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                  >
                    <span>Begin with diagnostics</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* SERIOUS BUYER GATE                                                 */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <SeriousBuyerGate />
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return {
    props: {},
    revalidate: 3600,
  };
};

export default ExecutiveReportingPage;