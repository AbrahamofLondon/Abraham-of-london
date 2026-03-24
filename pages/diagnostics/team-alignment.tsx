/* ============================================================================
   FILE: pages/diagnostics/team-alignment.tsx
   TEAM ALIGNMENT DIAGNOSTIC — Commercial / Mid-Layer Entry
============================================================================ */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Users,
  ShieldCheck,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Workflow,
  Building2,
  Activity,
  FileText,
  ChevronRight,
  BadgeCheck,
  ScanSearch,
  Target,
  Briefcase,
  Layers,
  Lock,
} from "lucide-react";

import Layout from "@/components/Layout";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

type SignalCard = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

type OutcomeCard = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

const SIGNALS: SignalCard[] = [
  {
    icon: AlertTriangle,
    title: "Execution looks busy but weak",
    desc:
      "There is visible motion, but not enough coherence, ownership, or strategic consistency behind it.",
  },
  {
    icon: Users,
    title: "Leadership says one thing, teams experience another",
    desc:
      "Direction may sound clear at the top but degrades as it moves through the operating structure.",
  },
  {
    icon: Workflow,
    title: "Meetings exist, but alignment does not",
    desc:
      "Cadence is present, but decision rights, follow-through, and operating trust remain unstable.",
  },
];

const OUTCOMES: OutcomeCard[] = [
  {
    icon: FileText,
    title: "Team alignment reading",
    desc:
      "A structured interpretation of drift, coherence, accountability gaps, and misalignment across the unit.",
  },
  {
    icon: Scale,
    title: "Pressure-tested next-step logic",
    desc:
      "Clarity on whether the issue is behavioural, managerial, governance-related, or requires private intervention.",
  },
  {
    icon: Target,
    title: "Commercially useful clarity",
    desc:
      "Enough signal to support internal correction, workshop design, or escalation into Strategy Room.",
  },
];

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[10%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-amber-500/[0.05] blur-[140px]" />
      <div className="absolute right-[10%] top-[28%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_48%,transparent_100%)]" />
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

function SectionDivider() {
  return (
    <div className="my-20 flex items-center gap-3" aria-hidden="true">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-500/20 to-transparent" />
      <Crown className="h-3.5 w-3.5 text-amber-500/36" />
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

function Card({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
}) {
  return (
    <article className="border border-white/[0.06] bg-white/[0.015] p-8 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.025]">
      <Icon className="h-6 w-6 text-amber-300/65" />
      <h3 className="mt-6 font-serif text-2xl text-white">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-white/46">{desc}</p>
    </article>
  );
}

const TeamAlignmentDiagnosticPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  const fadeIn = {
    initial: { opacity: 0, y: reduceMotion ? 0 : 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }
  };

  return (
    <Layout
      title="Team Alignment Diagnostic"
      description="A structured diagnostic for leadership teams and operating units experiencing drift, inconsistency, or execution misalignment."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics/team-alignment`} />
      </Head>

      <main className="min-h-screen bg-black text-white selection:bg-amber-500/30">
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-4xl">
                <motion.div {...fadeIn}>
                  <RailLabel>Team diagnostic</RailLabel>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[12ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.7rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  When the team
                  <span className="mt-3 block text-white/56">is no longer moving as one</span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.18rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  A diagnostic for leadership teams, departments, and operating
                  groups where execution is weakening, drift is visible, or internal
                  coherence has started to soften.
                </motion.p>

                <motion.p
                  className="mt-5 max-w-2xl text-base leading-relaxed text-white/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.24 }}
                >
                  This instrument separates communication issues from deeper
                  structural faults before resources are wasted on the
                  wrong intervention.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.26 }}
                >
                  <Link
                    href="/contact?intent=team-alignment-diagnostic"
                    className="group inline-flex items-center justify-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                  >
                    <span>Request team diagnostic</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/consulting/strategy-room"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Private chamber</span>
                    <ChevronRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div
                  className="mt-12 flex flex-wrap items-center gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.34 }}
                >
                  <div className="inline-flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Team-level signal
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="inline-flex items-center gap-2">
                    <Scale className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Intervention filter
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="inline-flex items-center gap-2">
                    <BadgeCheck className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Commercial-grade
                    </span>
                  </div>
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
                        Commercial role
                      </span>
                      <Briefcase className="h-4 w-4 text-amber-500/40" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                      <MetricTile label="Layer" value="Mid" />
                      <MetricTile label="Use" value="Filter" />
                      <MetricTile label="Bias" value="Actionable" />
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        "Clarifies whether a workshop is enough",
                        "Exposes whether governance is the real issue",
                        "Sharpens fit before private advisory",
                        "Turns vague friction into usable signal",
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
            <div className="mb-14">
              <RailLabel>Typical signals</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                What usually brings teams here
              </h2>
              <p className="mt-4 max-w-3xl text-lg text-white/48">
                The team is not collapsing. That is precisely the danger.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {SIGNALS.map((item) => (
                <Card key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        <section className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" aria-hidden="true" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <RailLabel>What the buyer gets</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  A serious reading, not a workshop brochure
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/48">
                  The buyer is purchasing clarity on team condition, intervention
                  fit, and next-step seriousness.
                </p>

                <div className="mt-10 grid gap-6">
                  {OUTCOMES.map((item) => (
                    <Card key={item.title} {...item} />
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <div className="border border-amber-500/16 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-8 sticky top-24">
                  <ScanSearch className="mb-6 h-9 w-9 text-amber-400/55" />
                  <h3 className="font-serif text-2xl text-white">
                    Best position in the commercial stack
                  </h3>

                  <ul className="mt-8 space-y-5">
                    {[
                      "Above personal diagnostics",
                      "Below private chamber work",
                      "Ideal where several people are part of the problem",
                    ].map((line) => (
                      <li key={line} className="flex items-center gap-4">
                        <CheckCircle2 className="h-4 w-4 text-amber-400/72" />
                        <span className="text-sm text-white/68">{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 rounded-2xl border border-white/8 bg-black/20 p-5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/56">
                      Advisory logic
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/46">
                      If the reading exposes authority breakdown, structural drift,
                      or rising consequence, the correct next move is likely Strategy Room.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/contact?intent=team-alignment-diagnostic"
                      className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 transition-all hover:bg-amber-500/18"
                    >
                      Request diagnostic <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/diagnostics"
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/72 transition-all hover:bg-white/[0.04]"
                    >
                      All diagnostics <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/5 py-32">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Activity className="mx-auto mb-6 h-6 w-6 text-amber-500/30" />

              <h2 className="font-serif text-4xl text-white md:text-5xl">
                Diagnose the team before forcing the intervention.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50">
                When several people are involved, guessing is expensive.
              </p>

              <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact?intent=team-alignment-diagnostic"
                  className="group inline-flex items-center justify-center gap-3 bg-white px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                >
                  <span>Request diagnostic</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/consulting/strategy-room"
                  className="group inline-flex items-center justify-center gap-3 border border-white/10 px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  <span>Private chamber</span>
                  <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default TeamAlignmentDiagnosticPage;