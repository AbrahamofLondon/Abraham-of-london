import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronRight, Shield, ScrollText, Briefcase, Layers } from "lucide-react";

import Layout from "@/components/Layout";
import { getAllFrameworks, LIBRARY_HREF, type Framework } from "@/lib/resources/strategic-frameworks";

interface PageProps {
  frameworks: Framework[];
}

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

const StrategicFrameworksLibraryPage: NextPage<PageProps> = ({ frameworks }) => {
  const reduceMotion = useReducedMotion();
  const canonical = `https://www.abrahamoflondon.org${LIBRARY_HREF}`;
  const motionProps = reduceMotion ? ({ initial: false } as const) : ({ initial: "hidden" as const } as const);

  return (
    <Layout title="Strategic Frameworks">
      <Head>
        <title>Strategic Frameworks | Abraham of London</title>
        <meta name="description" content="Board-grade strategic tools derived from Ancient Canon." />
        <link rel="canonical" href={canonical} />
      </Head>

      <div className="min-h-screen bg-black text-white">
        <section className="relative isolate overflow-hidden border-b border-white/8">
          <div className="absolute inset-0" aria-hidden="true">
            <div className="absolute inset-0 bg-[#06060b]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_55%)]" />
          </div>

          <div className="relative mx-auto max-w-6xl px-6 py-20">
            <motion.div variants={stagger} {...motionProps} animate="visible">
              <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
                  <ScrollText className="h-4 w-4 text-amber-200" aria-hidden="true" />
                  <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">Canon-derived dossiers</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href="/canon" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
                    Enter the Canon <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </motion.div>

              <motion.h1 variants={fadeUp} className="mt-8 max-w-4xl font-serif text-5xl font-bold leading-[1.05] text-white sm:text-6xl">
                Strategic Frameworks
              </motion.h1>

              <motion.p variants={fadeUp} className="mt-5 max-w-3xl text-lg text-white/80">
                Operational tools for Boards, Founders, and Households.
              </motion.p>
            </motion.div>
          </div>
        </section>

        <section className="bg-[#070710] py-16">
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {frameworks.map((f) => {
                const A = ACCENTS[f.accent];
                const labels = tierLabels(f);
                return (
                  <Link key={f.key} href={`${LIBRARY_HREF}/${f.slug}`} className={cx("group relative overflow-hidden rounded-3xl border bg-white/[0.05] p-6 backdrop-blur-md transition", A.border, "hover:-translate-y-0.5")}>
                    <div className={cx("absolute inset-0 opacity-80 bg-gradient-to-br", A.glow)} />
                    <div className="relative">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <span className={cx("inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.22em]", A.chip)}>{f.tag}</span>
                        <div className="flex flex-wrap justify-end gap-2">
                          {labels.slice(0, 2).map((x) => <TierBadge key={`${f.slug}-${x}`} label={x} />)}
                        </div>
                      </div>
                      <h3 className="font-serif text-xl font-semibold text-white">{f.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-white/72">{f.oneLiner}</p>
                      <div className={cx("mt-6 inline-flex items-center gap-2 text-sm font-semibold", A.link)}>
                        Open dossier <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  const frameworks = getAllFrameworks();
  return {
    props: { frameworks },
    revalidate: 3600,
  };
};

export default StrategicFrameworksLibraryPage;