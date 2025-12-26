// pages/resources/strategic-frameworks/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight, Shield, ScrollText, Briefcase, Layers } from "lucide-react";

import Layout from "@/components/Layout";
import { FRAMEWORKS, LIBRARY_HREF, type Framework } from "@/lib/resources/strategic-frameworks";

const easeSettle: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeSettle } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const ACCENTS = {
  gold: {
    border: "border-amber-400/20 hover:border-amber-400/35",
    glow: "from-amber-500/18 via-amber-500/6 to-transparent",
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    link: "text-amber-200 hover:text-amber-100",
  },
  emerald: {
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    glow: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    link: "text-emerald-200 hover:text-emerald-100",
  },
  blue: {
    border: "border-sky-400/20 hover:border-sky-400/35",
    glow: "from-sky-500/16 via-sky-500/6 to-transparent",
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    link: "text-sky-200 hover:text-sky-100",
  },
  rose: {
    border: "border-rose-400/20 hover:border-rose-400/35",
    glow: "from-rose-500/16 via-rose-500/6 to-transparent",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    link: "text-rose-200 hover:text-rose-100",
  },
  indigo: {
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    glow: "from-indigo-500/16 via-indigo-500/6 to-transparent",
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    link: "text-indigo-200 hover:text-indigo-100",
  },
} as const;

function TierBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[11px] font-semibold text-white/80">
      {label}
    </span>
  );
}

function tierLabels(f: Framework): string[] {
  const labels: string[] = [];
  if (f.tier.includes("Board")) labels.push("Board-grade");
  if (f.tier.includes("Founder")) labels.push("Founder execution");
  if (f.tier.includes("Household")) labels.push("Household formation");
  return labels;
}

const StrategicFrameworksLibraryPage: NextPage = () => {
  const reduceMotion = useReducedMotion();
  const canonical = `https://www.abrahamoflondon.org${LIBRARY_HREF}`;

  // Ensure vars are actually used (prevents lint “assigned never used” if you change motion usage later)
  const motionProps = reduceMotion ? ({ initial: false } as const) : ({ initial: "hidden" as const } as const);

  return (
    <Layout title="Strategic Frameworks">
      <Head>
        <title>Strategic Frameworks | Abraham of London</title>
        <meta
          name="description"
          content="Board-grade dossiers that distil ancient principles into field-ready strategic tools: governance, decisions, crisis, legacy, and household formation."
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Strategic Frameworks" />
        <meta
          property="og:description"
          content="Canon-derived strategic tools and dossiers for boards, founders, and households."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta name="theme-color" content="#0b0b10" />
      </Head>

      <div className="min-h-screen bg-black text-white">
        {/* HERO */}
        <section className="relative isolate overflow-hidden border-b border-white/8">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[#06060b]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(59,130,246,0.09),transparent_55%)]" />
            <div className="absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-black/75 via-black/30 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 py-20">
            <motion.div variants={stagger} {...motionProps} animate="visible">
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
                  <ScrollText className="h-4 w-4 text-amber-200" aria-hidden="true" />
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                    Canon-derived dossiers
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Link
                    href="/canon"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                  >
                    Enter the Canon <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/inner-circle"
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                  >
                    Inner Circle <Shield className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} className="mt-8 max-w-4xl font-serif text-5xl font-bold leading-[1.05] text-white sm:text-6xl">
                Strategic Frameworks
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 max-w-3xl text-lg text-white/80 sm:text-xl">
                This is where the Canon becomes operational: principles distilled into tools you can deploy.
                Boards get governance artifacts. Founders get execution systems. Households get formation rhythms.
              </motion.p>

              <motion.div variants={fadeUp} className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  {
                    title: "Boards",
                    body: "Mandate clarity, governance ladders, decision hygiene, cadence and controls.",
                    icon: Briefcase,
                  },
                  {
                    title: "Founders",
                    body: "Execution reliability under constraint: prioritisation, crisis protocol, operating rhythm.",
                    icon: Layers,
                  },
                  {
                    title: "Households",
                    body: "Formation-grade governance: rhythms, boundaries, responsibility, review cadence.",
                    icon: Shield,
                  },
                ].map((c) => {
                  const Icon = c.icon;
                  return (
                    <div
                      key={c.title}
                      className="rounded-3xl border border-white/10 bg-white/[0.05] p-6 backdrop-blur-md"
                    >
                      <div className="mb-3 inline-flex items-center gap-2 rounded-2xl bg-white/7 p-3 ring-1 ring-white/10">
                        <Icon className="h-5 w-5 text-amber-200" aria-hidden="true" />
                      </div>
                      <p className="font-semibold text-white">{c.title}</p>
                      <p className="mt-2 text-sm leading-relaxed text-white/72">{c.body}</p>
                    </div>
                  );
                })}
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* GRID */}
        <section className="bg-[#070710] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-white/55">Library</p>
                <h2 className="mt-2 font-serif text-3xl font-bold text-white sm:text-4xl">
                  Dossiers &amp; Tools
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
                  Each dossier includes a public prelude. The full depth is designed for Inner Circle access:
                  operating logic, playbook, metrics, failure modes, and board questions.
                </p>
              </div>

              <Link
                href="/consulting"
                className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-200"
              >
                Request a Strategy Room <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {FRAMEWORKS.map((f) => {
                const A = ACCENTS[f.accent];
                const labels = tierLabels(f);

                return (
                  <Link
                    key={f.key}
                    href={`${LIBRARY_HREF}/${f.slug}`}
                    className={cx(
                      "group relative overflow-hidden rounded-3xl border bg-white/[0.05] p-6 backdrop-blur-md transition",
                      A.border,
                      "hover:-translate-y-0.5",
                    )}
                  >
                    <div className={cx("absolute inset-0 opacity-80 bg-gradient-to-br", A.glow)} aria-hidden="true" />
                    <div className="relative">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span
                          className={cx(
                            "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]",
                            A.chip,
                          )}
                        >
                          {f.tag}
                        </span>

                        <div className="flex flex-wrap justify-end gap-2">
                          {labels.slice(0, 2).map((x) => (
                            <TierBadge key={`${f.slug}-${x}`} label={x} />
                          ))}
                        </div>
                      </div>

                      <h3 className="font-serif text-xl font-semibold text-white">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/72">{f.oneLiner}</p>

                      <div className="mt-5 space-y-2 text-sm text-white/70">
                        {f.executiveSummary.slice(0, 2).map((x) => (
                          <div key={x} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/55" />
                            <span>{x}</span>
                          </div>
                        ))}
                      </div>

                      <div className={cx("mt-6 inline-flex items-center gap-2 text-sm font-semibold", A.link)}>
                        Open dossier{" "}
                        <ChevronRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA STRIP */}
        <section className="border-t border-white/10 bg-[#06060c] py-14">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/[0.05] p-8 backdrop-blur-md lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Inner Circle</p>
                <h3 className="mt-2 font-serif text-3xl font-bold text-white">
                  Full dossiers. Higher signal. Real accountability.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/70">
                  The prelude orients you. The full dossier is built for execution: playbooks, artifacts, review cadence,
                  board questions, and failure-mode containment.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/inner-circle"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-300 px-6 py-3 text-sm font-semibold text-black transition hover:bg-amber-200"
                >
                  Enter Inner Circle <Shield className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/consulting"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/7 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/22 hover:bg-white/10"
                >
                  Strategy Room <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <p className="text-xs text-white/55">
                  For boards: request a pack. For founders: request an operating sprint. For households: request a formation plan.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default StrategicFrameworksLibraryPage;