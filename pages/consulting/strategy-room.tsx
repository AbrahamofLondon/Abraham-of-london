/* ============================================================================
   FILE: pages/consulting/strategy-room.tsx
   STRATEGY ROOM — Private Chamber (Earned Destination)
   Architecture: Diagnostics → Executive Reporting → Strategy Room
   This is the third layer, not the first.
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Shield,
  Crown,
  Gavel,
  CheckCircle2,
  Compass,
  Scale,
  Eye,
  Target,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";
import StrategyRoomIntake from "@/components/consulting/StrategyRoomIntake";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[12%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.04] blur-[140px]" />
      <div className="absolute right-[10%] top-[28%] h-[22rem] w-[22rem] rounded-full bg-white/[0.015] blur-[120px]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/8 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/8 to-transparent" />
    </div>
  );
}

const StrategyRoomPage: NextPage = () => {
  const reduceMotion = useReducedMotion();
  const [showIntake, setShowIntake] = React.useState(false);

  return (
    <Layout
      title="Strategy Room"
      description="Private strategy chamber for mandate-level decisions. By admission only."
      className="bg-black text-white"
    >
      <Head>
        <title>Strategy Room | Abraham of London</title>
        <meta
          name="description"
          content="A private strategy chamber for founders, boards, and institutional builders whose situation has moved beyond diagnostic clarity into mandate-level consequence."
        />
        <link rel="canonical" href={`${SITE}/consulting/strategy-room`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="relative min-h-screen bg-black text-white">
        <AmbientField />

        {/* Hero — the earned destination */}
        <section className="relative border-b border-white/5">
          <div className="mx-auto max-w-7xl px-6 py-32 lg:px-12 lg:py-40">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-3">
                  <span className="h-5 w-px bg-amber-400/30" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-amber-400/50">
                    Layer three — selective intervention
                  </span>
                </div>
              </motion.div>

              <motion.h1
                className="mt-8 font-serif text-5xl font-light leading-[1.05] tracking-[-0.02em] text-white md:text-6xl lg:text-7xl"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.08 }}
              >
                For decisions you
                <span className="block text-white/55">cannot afford to get wrong</span>
              </motion.h1>

              <motion.p
                className="mt-6 max-w-2xl text-base leading-relaxed text-white/50 sm:text-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.18 }}
              >
                A private chamber for founders, boards, and institutional builders
                whose situation has already moved beyond ordinary diagnostic clarity
                into mandate-level consequence, timing pressure, and decision exposure.
              </motion.p>

              <motion.div
                className="mt-10 flex flex-wrap gap-4"
                initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.28 }}
              >
                <Link
                  href="/diagnostics/executive-reporting"
                  className="group inline-flex items-center justify-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                >
                  <span>Review flagship product</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <button
                  type="button"
                  onClick={() => setShowIntake(true)}
                  className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  <span>Request admission</span>
                  <ChevronRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                </button>
              </motion.div>

              <motion.div
                className="mt-12 flex flex-wrap items-center gap-6 text-[10px] font-mono uppercase tracking-[0.2em] text-white/25"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.38 }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  <span>Diagnostics → identifies signal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-white/30" />
                  <span>Executive Reporting → interprets signal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-400/50" />
                  <span>Strategy Room → intervenes when justified</span>
                </div>
              </motion.div>

              <motion.div
                className="mt-12 h-px w-24 bg-gradient-to-r from-amber-400/25 to-transparent"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, delay: 0.45 }}
                style={{ transformOrigin: "left" }}
              />
            </div>
          </div>
        </section>

        {/* Intake Form — shown only when requested */}
        {showIntake && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="border-b border-white/5"
          >
            <div className="mx-auto max-w-3xl px-6 py-16 lg:px-12 lg:py-24">
              <div className="rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-sm lg:p-12">
                <div className="mb-8 flex items-center gap-3">
                  <div className="h-px w-6 bg-amber-400/30" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-400/50">
                    Confidential intake — layer three
                  </span>
                  <div className="h-px flex-1 bg-amber-400/10" />
                </div>
                <StrategyRoomIntake onComplete={() => setShowIntake(false)} />
              </div>
            </div>
          </motion.section>
        )}

        {/* When this room is appropriate — signals of mandate-level weight */}
        <section className="py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-6 lg:grid-cols-3">
              {[
                {
                  icon: Gavel,
                  title: "Irreversible decisions",
                  desc: "The wrong move will be expensive in credibility, cash, or timing.",
                },
                {
                  icon: Scale,
                  title: "Material consequence",
                  desc: "Your decision affects stakeholders, family systems, or institutional trust.",
                },
                {
                  icon: Target,
                  title: "Complexity under pressure",
                  desc: "Too many moving parts for instinct-only thinking to remain safe.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5"
                >
                  <item.icon className="h-5 w-5 text-amber-400/50" />
                  <h3 className="mt-5 font-serif text-xl text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/45">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What leaves the chamber */}
        <section className="border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-6 md:grid-cols-2">
              {[
                {
                  icon: Eye,
                  title: "Decision memo",
                  desc: "The issue reframed properly, with options, trade-offs, and a recommended line.",
                },
                {
                  icon: Scale,
                  title: "Trade-off map",
                  desc: "What each path costs, what it protects, and what it exposes.",
                },
                {
                  icon: Target,
                  title: "Execution cadence",
                  desc: "Next moves, control rhythm, owner map, and stabilising sequence.",
                },
                {
                  icon: Shield,
                  title: "Risk posture",
                  desc: "What must be contained first so the problem does not compound.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="border border-white/8 bg-white/3 p-6 transition hover:border-white/15 hover:bg-white/5"
                >
                  <item.icon className="h-5 w-5 text-amber-400/50" />
                  <h3 className="mt-5 font-serif text-xl text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/45">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Admission logic — what this chamber is / is not */}
        <section className="border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <h2 className="font-serif text-4xl text-white md:text-5xl">
                  What this chamber is not
                </h2>
                <div className="mt-10 space-y-6">
                  {[
                    {
                      title: "Not for vague curiosity",
                      desc: "It exists for live decisions with consequence, not for collecting interesting conversations.",
                    },
                    {
                      title: "Not every issue belongs here",
                      desc: "Some cases should begin with diagnostics or Executive Reporting. Strategy Room is for gravity, not just importance.",
                    },
                    {
                      title: "The value is in disciplined judgment",
                      desc: "You are paying for a stronger decision posture, not noise or brainstorming theatre.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="border-b border-white/6 pb-6 last:border-0">
                      <h3 className="font-serif text-xl text-white">{item.title}</h3>
                      <p className="mt-2 text-sm text-white/45">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="font-serif text-4xl text-white md:text-5xl">
                  By admission only
                </h2>
                <p className="mt-6 text-lg text-white/45">
                  The chamber is private. That asymmetry is deliberate.
                </p>

                <div className="mt-10 rounded-2xl border border-amber-400/15 bg-amber-400/3 p-6">
                  <div className="flex items-start gap-4">
                    <Lock className="mt-0.5 h-5 w-5 text-amber-400/40" />
                    <div>
                      <p className="text-sm font-medium text-white/70">
                        Every submission is evaluated
                      </p>
                      <p className="mt-2 text-sm text-white/40">
                        Not every request receives admission. The gate protects the room's integrity.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 rounded-2xl border border-white/8 bg-white/3 p-6">
                  <div className="flex items-start gap-4">
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-400/40" />
                    <div>
                      <p className="text-sm font-medium text-white/70">
                        Best use case
                      </p>
                      <p className="mt-2 text-sm text-white/40">
                        A live issue with timing pressure, real downside, and the need for disciplined judgment.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Bridge to lower layers — acknowledging the architecture */}
        <section className="border-t border-white/5 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <div className="mb-8 inline-flex items-center gap-3">
              <div className="h-px w-8 bg-amber-400/20" />
              <Compass className="h-4 w-4 text-amber-400/30" />
              <div className="h-px w-8 bg-amber-400/20" />
            </div>

            <h2 className="font-serif text-3xl text-white md:text-4xl">
              Not every situation belongs here
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-base text-white/45">
              Most strategic friction belongs in diagnostics or Executive Reporting first. 
              The room is for when the signal is already clear and the consequence is already material.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-6">
              <Link
                href="/diagnostics"
                className="group inline-flex items-center gap-2 border-b border-white/20 pb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/50 transition-all hover:border-white/40 hover:text-white/70"
              >
                <span>Enter diagnostics</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/diagnostics/executive-reporting"
                className="group inline-flex items-center gap-2 border-b border-white/20 pb-1 font-mono text-[10px] uppercase tracking-[0.24em] text-white/50 transition-all hover:border-white/40 hover:text-white/70"
              >
                <span>Review Executive Reporting</span>
                <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            <div className="mt-16 flex justify-center gap-2">
              <Crown className="h-3 w-3 text-amber-400/15" />
              <span className="font-mono text-[6px] uppercase tracking-[0.4em] text-white/10">
                Diagnostics → Executive Reporting → Strategy Room
              </span>
              <Crown className="h-3 w-3 text-amber-400/15" />
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

export default StrategyRoomPage;