/* ============================================================================
   FILE: pages/consulting/strategy-room.tsx
   STRATEGY ROOM — Pages Router Safe, Client Components Isolated
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, BookOpen, Lock, Sparkles, Users } from "lucide-react";

import Layout from "@/components/Layout";
import { checkAccess } from "@/lib/inner-circle/access.client";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

// Client-only components
const StrategyRoomForm = dynamic(() => import("@/components/strategy-room/Form"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-400">Loading form…</div>,
});

const ArtifactGrid = dynamic(() => import("@/components/strategy-room/ArtifactGrid"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-400">Loading artifacts…</div>,
});

type Props = {};

const StrategyRoomPage: NextPage<Props> = () => {
  const reduceMotion = useReducedMotion();

  const [mounted, setMounted] = React.useState(false);
  const [icAccess, setIcAccess] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    let alive = true;
    (async () => {
      try {
        const access = await checkAccess();
        if (alive) setIcAccess(Boolean(access?.hasAccess));
      } catch {
        if (alive) setIcAccess(false);
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Hard SSR-safe skeleton
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Strategy Room | Abraham of London</title>
          <meta name="description" content="Board-grade decision environment" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="min-h-screen bg-black text-cream flex items-center justify-center">
          <div className="text-amber-500 text-sm font-bold uppercase tracking-widest">Loading Strategy Room…</div>
        </div>
      </>
    );
  }

  return (
    <Layout title="Strategy Room" description="Board-grade decision environment powered by the Canon.">
      <Head>
        <title>Strategy Room | Abraham of London</title>
        <meta
          name="description"
          content="Board-grade decision environment powered by the Canon, Strategic Frameworks, and institutional decision discipline."
        />
        <link rel="canonical" href={`${SITE}/consulting/strategy-room`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen bg-black text-cream">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-amber-500/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div aria-hidden className="absolute inset-0 aol-grain opacity-[0.10]" />
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(245,158,11,0.14),transparent_55%)]"
          />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? { duration: 0.01 } : { duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-3xl"
            >
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-500">
                Board-Grade Decision Environment
              </p>

              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Strategy Room
              </h1>

              <p className="mt-8 text-lg leading-relaxed text-white/45 sm:text-xl">
                A structured environment for leaders facing irreversible decisions. Intake-first. Artifacts delivered.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="group inline-flex items-center justify-center gap-3 rounded-xl bg-amber-500 px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-amber-400"
                >
                  Begin Intake Process
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>

                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-center gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-amber-200 transition-colors hover:bg-amber-500/15"
                >
                  View Strategic Frameworks
                  <BookOpen className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-6">
                {checking ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/55">
                    <span className="h-1.5 w-1.5 rounded-full bg-white/40 animate-pulse" />
                    Verifying access…
                  </div>
                ) : icAccess ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-900/20 px-4 py-2 text-sm text-amber-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                    Inner Circle Member — Full Artifact Access
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/55">
                    <Lock className="h-4 w-4 text-amber-300/80" />
                    Artifacts restricted to Inner Circle.
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* INTAKE FORM */}
        {showForm ? (
          <section className="py-10">
            <div className="mx-auto max-w-4xl px-4">
              <div className="rounded-3xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
                <StrategyRoomForm />
              </div>
            </div>
          </section>
        ) : null}

        {/* ARTIFACTS */}
        <section className="py-10">
          <div className="mx-auto max-w-6xl px-4">
            <ArtifactGrid hasAccess={icAccess} />
          </div>
        </section>

        {/* ACCESS & NEXT STEPS */}
        <section className="bg-zinc-950 py-20 lg:py-28 border-t border-white/8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">Access the Materials</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/45">
                    The Strategy Room draws from the Canon and the Strategic Frameworks library. Inner Circle members
                    receive full artifact access.
                  </p>

                  <div className="mt-8 space-y-4">
                    <Link
                      href="/inner-circle"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-amber-400"
                    >
                      Unlock Inner Circle Access
                      <Lock className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">What Happens Next</h3>
                  <div className="mt-6 space-y-6">
                    {[
                      { n: 1, t: "Intake Review", d: "48-hour review of your submission." },
                      { n: 2, t: "Decision Call", d: "Structured call: options, risk, trade-offs, next moves." },
                      { n: 3, t: "Artifacts Delivered", d: "Board-grade outputs: memo, matrix, cadence, controls." },
                    ].map((x) => (
                      <div key={x.n} className="flex items-start gap-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 font-mono text-sm font-bold text-amber-200">
                          {x.n}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{x.t}</p>
                          <p className="mt-1 text-sm text-white/45">{x.d}</p>
                        </div>
                      </div>
                    ))}

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <div className="flex items-center gap-3 text-sm text-white/70">
                        <Users className="h-4 w-4 text-amber-400" />
                        <span>Designed for founders, executives, and institutional builders.</span>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-white/70">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>High-trust, high-clarity decision support.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div aria-hidden className="mt-10 hidden lg:block">
                <div className="h-px w-full bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: {}, revalidate: 3600 };
};

export default StrategyRoomPage;