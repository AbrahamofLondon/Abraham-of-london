/* ============================================================================
   FILE: pages/diagnostics/index.tsx
   DIAGNOSTIC ARCHITECTURE — COMMERCIAL GATEWAY
   Purpose:
   - establish the 3-layer system (Diagnose → Report → Intervene)
   - qualify buyer intent
   - elevate Executive Reporting as flagship bridge
   - make clear this is a gateway, not a product page in disguise
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Activity,
  FileText,
  Crown,
  Scale,
  ChevronRight,
  Target,
} from "lucide-react";

import Layout from "@/components/Layout";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

const DiagnosticsPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="Diagnostics"
      description="A structured diagnostic gateway that moves from signal detection to disciplined interpretation to selective intervention."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* HERO — gateway positioning */}
        <section className="relative border-b border-white/5">
          <div className="mx-auto max-w-7xl px-6 pt-36 pb-24 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <div className="inline-flex items-center gap-3">
                <span className="h-5 w-px bg-amber-400/30" />
                <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/50">
                  Commercial gateway
                </span>
              </div>

              <h1 className="mt-6 max-w-[14ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.02em] text-white md:text-7xl">
                Clarity before
                <span className="block text-white/55">intervention</span>
              </h1>

              <p className="mt-8 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg">
                Most decisions fail before they begin — not because of execution,
                but because the problem was never properly read. Diagnostics is
                the gateway, not the final offer.
              </p>
            </motion.div>
          </div>
        </section>

        {/* CHANGE 1 — Architecture section (after hero, before ladder) */}
        <section className="relative border-t border-white/5 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="border border-amber-500/16 bg-amber-500/[0.03] p-8 md:p-10">
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/78">
                Commercial architecture
              </div>
              <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl">
                Diagnostics is the gateway, not the final offer.
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/56">
                This page exists to sort signal from noise, weak cases from serious cases,
                and curiosity from consequence. The diagnostic ladder establishes fit.
                Executive Reporting becomes the flagship product when the situation requires
                disciplined interpretation. Strategy Room becomes relevant when the cost of
                delay or misjudgment is already material.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <div className="border border-white/8 bg-black/20 p-4">
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                    Stage 01
                  </div>
                  <div className="mt-2 font-serif text-xl text-white">Diagnose</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/48">
                    Surface the true signal.
                  </p>
                </div>

                <div className="border border-white/8 bg-black/20 p-4">
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                    Stage 02
                  </div>
                  <div className="mt-2 font-serif text-xl text-white">Report</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/48">
                    Interpret the signal properly.
                  </p>
                </div>

                <div className="border border-white/8 bg-black/20 p-4">
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                    Stage 03
                  </div>
                  <div className="mt-2 font-serif text-xl text-white">Intervene</div>
                  <p className="mt-2 text-sm leading-relaxed text-white/48">
                    Escalate only where mandate is justified.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SYSTEM LADDER — quick overview of all three layers */}
        <section className="py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12">
              <div className="inline-flex items-center gap-3">
                <span className="h-6 w-px bg-amber-500/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
                  The ladder
                </span>
              </div>
              <h2 className="mt-6 font-serif text-4xl text-white md:text-5xl">
                A structured path from signal to decision
              </h2>
              <p className="mt-4 max-w-3xl text-lg text-white/45">
                Each layer has a distinct role. Move up when the signal justifies it.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {/* Diagnostic Entry */}
              <div className="border border-white/8 bg-white/3 p-6">
                <Activity className="h-6 w-6 text-amber-400/60" />
                <h3 className="mt-5 font-serif text-xl text-white">Diagnostics</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/45">
                  Signal detection. Structural reading. Identifies where the real problem actually sits.
                </p>
                <Link
                  href="/diagnostics/start"
                  className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/60 hover:text-amber-300"
                >
                  Enter gateway
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Executive Reporting — Flagship */}
              <div className="border border-amber-500/20 bg-amber-500/5 p-6">
                <FileText className="h-6 w-6 text-amber-400/80" />
                <h3 className="mt-5 font-serif text-xl text-white">Executive Reporting</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/45">
                  Decision-grade interpretation. Narrative, exposure, and correction logic in one disciplined artifact.
                </p>
                <Link
                  href="/diagnostics/executive-reporting"
                  className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/60 hover:text-amber-300"
                >
                  Open flagship
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Strategy Room */}
              <div className="border border-white/8 bg-white/3 p-6">
                <Crown className="h-6 w-6 text-white/40" />
                <h3 className="mt-5 font-serif text-xl text-white">Strategy Room</h3>
                <p className="mt-3 text-sm leading-relaxed text-white/45">
                  Private intervention. For situations where consequence is already material.
                </p>
                <Link
                  href="/strategy-room"
                  className="mt-6 inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/40 hover:text-white/60"
                >
                  Inspect chamber
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CHANGE 2 — Flagship product section (replaces old push section) */}
        <section className="relative py-16 border-t border-white/5">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="border border-amber-500/16 bg-amber-500/[0.03] p-8 md:p-10"
            >
              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/78">
                Flagship bridge product
              </div>
              <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl">
                Executive Reporting
              </h2>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/56">
                This is the premium middle layer between raw diagnostic signal and full
                advisory mandate. It is designed for founders, boards, leadership teams,
                and institutions that need a disciplined reading before intervention.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  "Narrative + matrix + exposure in one disciplined artifact",
                  "Useful before advisory, during instability, and during corrective action",
                  "Makes Strategy Room feel earned rather than prematurely pushed",
                ].map((point) => (
                  <div
                    key={point}
                    className="border border-white/8 bg-black/20 p-4 text-sm leading-relaxed text-white/54"
                  >
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/diagnostics/executive-reporting"
                  className="inline-flex items-center gap-2 bg-amber-500 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                >
                  <span>Open flagship product</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  href="/strategy-room"
                  className="inline-flex items-center gap-2 border border-white/10 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  <span>Inspect Strategy Room</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* POSITIONING — why diagnostics exists */}
        <section className="border-t border-white/5 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5">
              <Target className="h-3 w-3 text-amber-400/60" />
              <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
                Commercial honesty
              </span>
            </div>

            <h2 className="mt-6 font-serif text-3xl text-white md:text-4xl">
              Not every problem deserves advisory
            </h2>

            <p className="mt-4 max-w-2xl mx-auto text-base leading-relaxed text-white/50">
              The strongest operators do not rush into intervention.  
              They establish a disciplined reading first. Diagnostics is where
              that reading begins — not where it ends.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-6">
              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-2 border-b border-white/20 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white/70"
              >
                Learn about Executive Reporting
                <ChevronRight className="h-3 w-3" />
              </Link>
              <Link
                href="/strategy-room"
                className="inline-flex items-center gap-2 border-b border-white/20 pb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50 hover:text-white/70"
              >
                Understand Strategy Room access
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </section>

        {/* FINAL CTA — gateway action */}
        <section className="border-t border-white/5 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-12">
            <h2 className="font-serif text-3xl text-white md:text-4xl">
              Start where your situation actually is
            </h2>

            <p className="mx-auto mt-4 max-w-md text-sm text-white/45">
              Not sure which layer fits? Begin with diagnostics. The signal will
              determine the route.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/diagnostics/start"
                className="inline-flex items-center gap-2 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
              >
                Begin diagnostics
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-2 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/70 transition-colors hover:border-white/20 hover:bg-white/5"
              >
                Review Executive Reporting
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-12 flex justify-center gap-2">
              <span className="font-mono text-[6px] uppercase tracking-[0.4em] text-white/15">
                Diagnose → Report → Intervene
              </span>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  return { props: {}, revalidate: 3600 };
};

export default DiagnosticsPage;