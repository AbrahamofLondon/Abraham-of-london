/* ============================================================================
   FILE: pages/diagnostics/index.tsx
   DIAGNOSTICS — Institutional Clarity Layer (OGR Integrated)
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ScanSearch,
  Scale,
  Crown,
  CheckCircle2,
  Radar,
  Activity,
  FileSearch,
  Users,
  Building2,
  Shield,
  Briefcase,
  Layers,
  Terminal,
  Zap,
} from "lucide-react";

import Layout from "@/components/Layout";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

type Props = {};

type Instrument = {
  title: string;
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  bullets: string[];
  isLive?: boolean;
};

type Signal = {
  title: string;
  body: string;
  icon: React.ComponentType<any>;
};

const SIGNALS: Signal[] = [
  {
    title: "Narrative clarity",
    body: "A disciplined reading of the real situation beneath surface explanations.",
    icon: FileSearch,
  },
  {
    title: "Pattern visibility",
    body: "Drift, inconsistency, and structural weakness surfaced before they become expensive.",
    icon: Radar,
  },
  {
    title: "Decision fit",
    body: "Clarifies whether the right next move is correction, intervention, or escalation.",
    icon: Scale,
  },
];

const INSTRUMENTS: Instrument[] = [
  {
    title: "Institutional OGR",
    href: "/dashboard/live",
    label: "Strategic Live",
    isLive: true,
    desc: "A high-fidelity operational diagnostic using the OGR engine to simulate institutional friction and outcome certainty.",
    icon: Terminal,
    bullets: [
      "Live friction simulation",
      "Operational resonance signal",
      "Decision-grade outcome modeling",
    ],
  },
  {
    title: "Quick Diagnostic",
    href: "/purpose-alignment",
    label: "Individual",
    desc: "A fast structured reading for personal clarity, directional drift, and behavioural alignment.",
    icon: ScanSearch,
    bullets: [
      "Personal alignment signal",
      "Low-friction entry point",
      "Immediate correction priority",
    ],
  },
  {
    title: "Team Alignment",
    href: "/diagnostics/team-alignment",
    label: "Team",
    desc: "A sharper reading of team coherence, operating softness, and execution friction before problems harden.",
    icon: Users,
    bullets: [
      "Inter-team drift detection",
      "Execution and communication signal",
      "Correction themes by domain",
    ],
  },
  {
    title: "Enterprise Diagnostic",
    href: "/diagnostics/enterprise",
    label: "Enterprise",
    desc: "A deeper organisational reading where leadership gap, team variance, and structural fragility matter.",
    icon: Building2,
    bullets: [
      "Leadership perception gap",
      "Institutional fragility signal",
      "Decision-grade organisational reading",
    ],
  },
];

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-amber-500/[0.05] blur-[130px]" />
      <div className="absolute right-[12%] top-[20%] h-[20rem] w-[20rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.015)_48%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
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

function RailDivider() {
  return (
    <div className="my-20 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      <Layers className="h-3.5 w-3.5 text-amber-500/36" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
    </div>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-l border-white/6 pl-4 first:border-l-0 first:pl-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
        {label}
      </div>
      <div className="mt-2 font-serif text-lg text-white/84">{value}</div>
    </div>
  );
}

const DiagnosticsPage: NextPage<Props> = () => {
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="Diagnostics"
      description="Structured instruments for reading pressure, drift, and misalignment before decisions are made and consequences compound."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <RailLabel>Diagnostics</RailLabel>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[10ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.4rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  Clarity before
                  <span className="mt-3 block text-white/58">commitment</span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.15rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  Structured instruments for reading pressure, drift, and
                  misalignment before decisions are made and consequences
                  compound.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.26 }}
                >
                  <Link
                    href="/dashboard/live"
                    className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                  >
                    <span>Enter OGR Terminal</span>
                    <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
                  </Link>

                  <Link
                    href="/purpose-alignment"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Quick Diagnostic</span>
                    <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div
                  className="mt-12 h-px w-40 bg-gradient-to-r from-amber-500/30 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 1.1, delay: 0.42 }}
                  style={{ transformOrigin: "left" }}
                />
              </div>

              <motion.div
                className="relative self-end"
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.18 }}
              >
                <div className="border border-white/[0.07] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                        Diagnostic posture
                      </span>
                      <Terminal className="h-4 w-4 text-amber-500/40" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                      <MetricTile label="Mode" value="Real-time" />
                      <MetricTile label="Bias" value="Friction" />
                      <MetricTile label="Output" value="Simulation" />
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        "Institutional friction simulation",
                        "Decision-grade resonance mapping",
                        "Structural reading before escalation",
                        "Clearer pathway into private mandate",
                      ].map((line) => (
                        <div key={line} className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-amber-400/70" />
                          <span className="text-sm text-white/58">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-12 lg:grid-cols-[0.98fr_1.02fr]">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <RailLabel>Why diagnostics exist</RailLabel>
                <h2 className="mt-7 max-w-[11ch] font-serif text-4xl leading-[0.95] text-white md:text-6xl">
                  Clearer reading. Better judgement. Stronger next move.
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/52">
                  Diagnostics reduce ambiguity before action. They clarify what is
                  actually happening, where pressure is accumulating, and what kind
                  of response the situation truly requires.
                </p>

                <div className="mt-10 space-y-8">
                  {SIGNALS.map((item, index) => {
                    const Icon = item.icon;

                    return (
                      <motion.div
                        key={item.title}
                        className="flex gap-5 border-b border-white/6 pb-7 last:border-b-0"
                        initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.55 }}
                        viewport={{ once: true }}
                      >
                        <div className="mt-1 flex h-11 w-11 items-center justify-center border border-white/[0.08] bg-white/[0.02]">
                          <Icon className="h-5 w-5 text-amber-400/60" />
                        </div>
                        <div>
                          <h3 className="font-serif text-2xl text-white">
                            {item.title}
                          </h3>
                          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/48">
                            {item.body}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65, delay: 0.08 }}
              >
                <div className="border border-white/[0.08] bg-white/[0.015] p-8 md:p-10">
                  <Shield className="h-8 w-8 text-white/90" />
                  <h3 className="mt-8 font-serif text-3xl text-white md:text-4xl">
                    Why diagnostics come before escalation
                  </h3>

                  <div className="mt-8 space-y-5">
                    {[
                      "Establishes a disciplined reading before action.",
                      "Improves fit between the problem and the response.",
                      "Protects judgement from haste, emotion, and vagueness.",
                    ].map((line) => (
                      <div key={line} className="flex items-start gap-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white/90" />
                        <span className="text-lg leading-relaxed text-white/72">
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/consulting"
                    className="group mt-12 flex items-center justify-between border border-amber-500/18 px-8 py-6 transition-colors hover:border-amber-500/35 hover:bg-amber-500/[0.03]"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-300/78">
                      View advisory pathways
                    </span>
                    <ArrowRight className="h-5 w-5 text-amber-300/78 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <p className="mt-6 text-center font-mono text-[8px] uppercase tracking-[0.26em] text-white/28">
                    Structured diagnosis • better fit • cleaner escalation
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <RailDivider />
        </div>

        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Instruments</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                The Diagnostic Arsenal
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/48">
                Four levels of diagnostic depth, from personal alignment to live institutional simulation.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              {INSTRUMENTS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={`${item.title}-${item.href}-${index}`}
                    className={`group relative overflow-hidden border transition-all duration-500 p-8 
                      ${item.isLive 
                        ? "border-amber-500/20 bg-amber-500/[0.02] hover:border-amber-500/40 hover:bg-amber-500/[0.04]" 
                        : "border-white/[0.06] bg-white/[0.015] hover:border-white/[0.12] hover:bg-white/[0.025]"
                      }`}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.65 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative">
                      <div className="mb-8 flex items-start justify-between gap-4">
                        <Icon className={`h-7 w-7 transition-colors duration-300 
                          ${item.isLive ? "text-amber-400" : "text-amber-400/60 group-hover:text-amber-300"}`} 
                        />
                        <div className="flex flex-col items-end gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white/58">
                            {item.label}
                          </span>
                          {item.isLive && (
                            <span className="flex items-center gap-1.5 font-mono text-[7px] uppercase tracking-widest text-amber-500 animate-pulse">
                              <span className="h-1 w-1 rounded-full bg-amber-500" />
                              Live Terminal
                            </span>
                          )}
                        </div>
                      </div>

                      <h3 className="font-serif text-2xl text-white transition-colors duration-300 group-hover:text-amber-50">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-white/48">
                        {item.desc}
                      </p>

                      <ul className="mt-7 space-y-3">
                        {item.bullets.map((bullet) => (
                          <li
                            key={`${item.title}-${bullet}`}
                            className="flex items-start gap-3 text-sm text-white/42"
                          >
                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/40" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 flex items-center justify-between border-t border-white/6 pt-6">
                        <Link
                          href={item.href}
                          className="group/link inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/68 transition-colors hover:text-amber-300"
                        >
                          <span>{item.isLive ? "Enter Terminal" : "Open instrument"}</span>
                          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                        </Link>

                        <span className="font-mono text-[8px] text-white/12">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <RailLabel>Escalation logic</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Not every situation needs advisory. Every serious situation needs clarity.
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/48">
                  Diagnostics exist to create cleaner fit. Some situations need
                  correction. Some need intervention. Some justify private mandate work.
                </p>

                <div className="mt-10 space-y-5">
                  {[
                    "Use diagnostics when the problem still needs reading",
                    "Use advisory when the decision already carries consequence",
                    "Use both when clarity and execution need to meet",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle2 className="h-4 w-4 text-amber-400/72" />
                      <span className="text-white/66">{item}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <div className="border border-amber-500/16 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-8">
                  <Crown className="mb-6 h-9 w-9 text-amber-400/55" />
                  <h3 className="font-serif text-2xl text-white">
                    Advisory pathway
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/44">
                    Private work remains selective. Diagnostics help determine
                    whether the matter should remain at the level of correction
                    or move into structured counsel.
                  </p>

                  <div className="mt-8 space-y-4">
                    {[
                      "Structured decision environments",
                      "Board and founder counsel",
                      "Documented trade-offs and next-step logic",
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-3">
                        <Briefcase className="h-4 w-4 text-amber-400/60" />
                        <span className="text-sm text-white/62">{line}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/consulting"
                    className="group mt-8 inline-flex w-full items-center justify-center gap-3 border border-amber-500/25 bg-amber-500/[0.05] px-6 py-4 transition-colors hover:border-amber-500/55 hover:bg-amber-500/[0.08]"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/82">
                      View advisory
                    </span>
                    <ArrowRight className="h-4 w-4 text-amber-400/48 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.04),transparent_70%)]" />

          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Activity className="mx-auto mb-6 h-6 w-6 text-amber-500/30" />

              <h2 className="font-serif text-4xl text-white md:text-5xl">
                Start with a disciplined reading
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50">
                Use diagnostics to reduce ambiguity before the next move is made.
              </p>

              <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/dashboard/live"
                  className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                >
                  <span>Enter OGR Terminal</span>
                  <Zap className="h-4 w-4 transition-transform group-hover:scale-110" />
                </Link>

                <Link
                  href="/consulting"
                  className="group inline-flex items-center justify-center gap-3 border border-white/10 px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  <span>View advisory</span>
                  <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              </div>

              <div className="mt-16 flex justify-center">
                <div className="h-12 w-px bg-gradient-to-b from-transparent via-amber-500/30 to-transparent" />
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  return { props: {}, revalidate: 3600 };
};

export default DiagnosticsPage;