/* pages/consulting/strategy-room.tsx — PRODUCTION STABLE (PAGES ROUTER SAFE) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import { hasInnerCircleAccess } from "@/lib/inner-circle/access.client";

// ------------------------------
// Client-only Motion wrappers
// (no framer-motion hard dependency on SSR path)
// ------------------------------
const MotionSection = dynamic(
  () =>
    import("framer-motion").then((m: any) => ({
      default: m?.motion?.section ?? "section",
    })),
  { ssr: false }
);

const MotionDiv = dynamic(
  () =>
    import("framer-motion").then((m: any) => ({
      default: m?.motion?.div ?? "div",
    })),
  { ssr: false }
);

// ------------------------------
// Icons — keep it boring and reliable
// Avoid dynamic-per-icon patterns; just import what you need.
// ------------------------------
import { ArrowRight, BookOpen, Lock, Sparkles, Users } from "lucide-react";

// ------------------------------
// Client-only components
// ------------------------------
const StrategyRoomForm = dynamic(() => import("@/components/strategy-room/Form"), {
  ssr: false,
  loading: () => <div className="p-8 text-center text-gray-400">Loading form…</div>,
});

const ArtifactGrid = dynamic(() => import("@/components/strategy-room/ArtifactGrid"), {
  ssr: false,
  loading: () => <div className="p-4 text-gray-400">Loading artifacts…</div>,
});

type Props = {};

// ------------------------------
// Page
// ------------------------------
const StrategyRoomPage: NextPage<Props> = () => {
  const [mounted, setMounted] = React.useState(false);
  const [icAccess, setIcAccess] = React.useState(false);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    try {
      setIcAccess(hasInnerCircleAccess());
    } catch {
      setIcAccess(false);
    }
  }, []);

  // SSR-safe skeleton (prevents hydration weirdness)
  if (!mounted) {
    return (
      <>
        <Head>
          <title>Strategy Room | Abraham of London</title>
          <meta name="description" content="Board-grade decision environment" />
        </Head>
        <div className="min-h-screen bg-black text-cream flex items-center justify-center">
          <div className="text-gold text-sm font-bold uppercase tracking-widest">Loading Strategy Room…</div>
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
          content="Board-grade decision environment powered by the Canon, Strategic Frameworks, and the Ultimate Purpose of Man."
        />
        <link rel="canonical" href="https://www.abrahamoflondon.org/consulting/strategy-room" />
      </Head>

      <main className="min-h-screen bg-black text-cream">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden border-b border-gold/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="absolute inset-0 bg-[url('/assets/images/texture-grain.png')] opacity-20 mix-blend-overlay" />

          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-gold">
                Board-Grade Decision Environment
              </p>

              <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Strategy Room
              </h1>

              <p className="mt-8 text-lg leading-relaxed text-gray-400 sm:text-xl">
                A structured environment for leaders facing irreversible decisions.
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="group inline-flex items-center justify-center gap-3 rounded-xl bg-gold px-8 py-4 text-sm font-bold uppercase tracking-widest text-black transition-all hover:bg-gold/80"
                >
                  Begin Intake Process
                  <ArrowRight className="h-4 w-4" />
                </button>

                <Link
                  href="/resources/strategic-frameworks"
                  className="inline-flex items-center justify-center gap-3 rounded-xl border border-gold/30 bg-gold/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-gold transition-colors hover:bg-gold/15"
                >
                  View Strategic Frameworks
                  <BookOpen className="h-4 w-4" />
                </Link>
              </div>

              {icAccess ? (
                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-900/20 px-4 py-2 text-sm text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Inner Circle Member — Full Artifact Access
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* DYNAMIC CONTENT (client-only components inside) */}
        {showForm ? (
          <section className="py-10">
            <div className="mx-auto max-w-4xl px-4">
              <StrategyRoomForm />
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
        <section className="bg-zinc-950 py-20 lg:py-28">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-gold/20 bg-gold/5 p-8 lg:p-10">
              <div className="grid gap-8 lg:grid-cols-2">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">Access the Materials</h3>
                  <p className="mt-4 text-sm leading-relaxed text-gray-400">
                    The Strategy Room draws from the complete Canon. Inner Circle members receive full artifact access.
                  </p>

                  <div className="mt-8 space-y-4">
                    <Link
                      href="/inner-circle"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gold px-6 py-4 text-xs font-bold uppercase tracking-widest text-black transition hover:bg-gold/80"
                    >
                      Unlock Inner Circle Access
                      <Lock className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <div>
                  <h3 className="font-serif text-2xl font-semibold text-white">What Happens Next</h3>
                  <div className="mt-6 space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                        1
                      </div>
                      <div>
                        <p className="font-semibold text-white">Intake Review</p>
                        <p className="mt-1 text-sm text-gray-400">48-hour review of your submission.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                        2
                      </div>
                      <div>
                        <p className="font-semibold text-white">Decision Call</p>
                        <p className="mt-1 text-sm text-gray-400">A structured call focused on options, risk, and next moves.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/20 bg-gold/10 font-mono text-sm font-bold text-gold">
                        3
                      </div>
                      <div>
                        <p className="font-semibold text-white">Artifacts Delivered</p>
                        <p className="mt-1 text-sm text-gray-400">Board-grade outputs: memos, matrices, and operating plans.</p>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                      <div className="flex items-center gap-3 text-sm text-gray-300">
                        <Users className="h-4 w-4 text-gold" />
                        <span>Designed for founders, executives, and institutional builders.</span>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-sm text-gray-300">
                        <Sparkles className="h-4 w-4 text-gold" />
                        <span>High-trust, high-clarity decision support.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional motion flourish (client-only). If framer-motion is missing, page still builds. */}
              <MotionSection className="mt-10 hidden lg:block">
                <MotionDiv className="h-px w-full bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
              </MotionSection>
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