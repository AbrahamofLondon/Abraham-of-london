/* ============================================================================
   FILE: pages/diagnostics/index.tsx
   DIAGNOSTICS — CLARITY ARCHITECTURE (SYSTEM-INTEGRATED / UPGRADED)
============================================================================ */

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ScanSearch,
  Scale,
  CheckCircle2,
  Radar,
  Activity,
  FileSearch,
  Users,
  Building2,
  Shield,
  Layers,
  Crown,
  FileText,
  Fingerprint,
  Lock,
  Briefcase,
  ChevronRight,
  Sparkles,
  Target,
  BarChart3,
} from "lucide-react";

import Layout from "@/components/Layout";
import AnonymisedCaseProof from "@/components/diagnostics/AnonymisedCaseProof";
import TrustFAQ from "@/components/diagnostics/TrustFAQ";
import SeriousBuyerGate from "@/components/diagnostics/SeriousBuyerGate";

import { readAccessCookie } from "@/lib/server/auth/cookies";
import { getSessionContext, tierAtLeast } from "@/lib/server/auth/tokenStore.postgres";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

type Props = {
  access: {
    authenticated: boolean;
    tier: string;
    name: string | null;
    dashboardHref: string | null;
  };
};

type Instrument = {
  title: string;
  href: string;
  label: string;
  desc: string;
  icon: React.ComponentType<any>;
  bullets: string[];
  tension: string;
  next: string;
};

type Signal = {
  title: string;
  body: string;
  icon: React.ComponentType<any>;
};

type LadderStep = {
  step: string;
  title: string;
  body: string;
  icon: React.ComponentType<any>;
  href: string;
};

const SIGNALS: Signal[] = [
  {
    title: "Narrative clarity",
    body: "A disciplined reading of what is actually happening beneath surface explanations, ego protection, and emotional noise.",
    icon: FileSearch,
  },
  {
    title: "Pattern visibility",
    body: "Drift, inconsistency, weak governance, and structural softness surfaced before they harden into cost and consequence.",
    icon: Radar,
  },
  {
    title: "Decision fit",
    body: "Clarifies whether the right next move is correction, intervention, escalation, or restraint — instead of action for action’s sake.",
    icon: Scale,
  },
];

const INSTRUMENTS: Instrument[] = [
  {
    title: "Directional Integrity",
    href: "/diagnostics/directional-integrity?source=diagnostics&entry=individual&intent=directional-integrity",
    label: "Individual",
    desc: "A structured instrument for mandate clarity, behavioural alignment, emotional order, and legacy posture.",
    icon: ScanSearch,
    bullets: [
      "Mandate and identity signal",
      "Operational drift detection",
      "Report-ready personal diagnostic",
    ],
    tension: "Useful when the problem still appears personal, internal, or behavioural.",
    next: "Often leads into Team Alignment when the issue has already started affecting execution around the person.",
  },
  {
    title: "Team Alignment",
    href: "/diagnostics/team-alignment?source=diagnostics&entry=team&intent=team-alignment",
    label: "Team",
    desc: "A sharper reading of team coherence, communication drag, and execution softness before problems harden.",
    icon: Users,
    bullets: [
      "Inter-team drift detection",
      "Execution and communication signal",
      "Correction themes by domain",
    ],
    tension: "Useful when several people are now part of the problem, not just one person’s private confusion.",
    next: "Often leads into Enterprise Diagnostic when authority, governance, or institutional consequence becomes visible.",
  },
  {
    title: "Enterprise Diagnostic",
    href: "/diagnostics/enterprise?source=diagnostics&entry=enterprise&intent=enterprise-diagnostic",
    label: "Enterprise",
    desc: "A deeper organisational reading where leadership gap, team variance, and structural fragility matter.",
    icon: Building2,
    bullets: [
      "Leadership perception gap",
      "Institutional fragility signal",
      "Decision-grade organisational reading",
    ],
    tension: "Useful when consequence is now institutional, reputational, operational, or political.",
    next: "Where the matter is commercially serious enough, this leads naturally into Executive Reporting or Strategy Room.",
  },
];

const LADDER: LadderStep[] = [
  {
    step: "01",
    title: "Initial personal signal",
    body: "Directional Integrity determines whether the issue is still private, behavioural, or mandate-based.",
    icon: ScanSearch,
    href: "/diagnostics/directional-integrity?source=diagnostics&entry=individual&intent=directional-integrity",
  },
  {
    step: "02",
    title: "Operating-team signal",
    body: "Team Alignment determines whether the issue has already spread into execution, trust, and communication.",
    icon: Users,
    href: "/diagnostics/team-alignment?source=diagnostics&entry=team&intent=team-alignment",
  },
  {
    step: "03",
    title: "Institutional signal",
    body: "Enterprise Diagnostic determines whether the problem now belongs in governance, leadership, and enterprise consequence.",
    icon: Building2,
    href: "/diagnostics/enterprise?source=diagnostics&entry=enterprise&intent=enterprise-diagnostic",
  },
  {
    step: "04",
    title: "Private mandate path",
    body: "Executive Reporting and Strategy Room handle matters where the cost of misreading is already material.",
    icon: Crown,
    href: "/diagnostics/executive-reporting",
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

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/6 pl-4 first:border-l-0 first:pl-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
        {label}
      </div>
      <div className="mt-2 font-serif text-lg text-white/84">{value}</div>
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

const DiagnosticsPage: NextPage<Props> = ({ access }) => {
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
        {/* ------------------------------------------------------------------ */}
        {/* HERO                                                               */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[0.98fr_1.02fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <RailLabel>Diagnostics</RailLabel>
                </motion.div>

                <motion.div
                  className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.06 }}
                >
                  <Fingerprint className="h-4 w-4 text-amber-400/70" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                    System-integrated diagnostic layer
                  </span>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[10ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.2rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  Read pressure
                  <span className="mt-3 block text-white/58">before action</span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.15rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  This is not a menu of random assessments. It is a governed
                  diagnostic ladder designed to sort weak signal from serious signal,
                  and serious signal from private mandate work.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.26 }}
                >
                  <Link
                    href="#pathways"
                    className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                  >
                    <span>Explore pathways</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/diagnostics/executive-reporting"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>View flagship product</span>
                    <FileText className="h-4 w-4 opacity-60 transition-transform group-hover:scale-105" />
                  </Link>

                  {access.dashboardHref ? (
                    <Link
                      href={access.dashboardHref}
                      className="group inline-flex items-center justify-center gap-3 border border-amber-500/18 bg-amber-500/[0.04] px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300 transition-colors hover:border-amber-500/28 hover:bg-amber-500/[0.07]"
                    >
                      <span>Continue to dashboard</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Link>
                  ) : null}
                </motion.div>
              </div>

              <motion.div
                className="relative self-end"
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.18 }}
              >
                <Surface className="p-8">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                      Diagnostic posture
                    </span>
                    <Shield className="h-4 w-4 text-amber-500/40" />
                  </div>

                  <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                    <MetricTile label="Mode" value="Disciplined" />
                    <MetricTile label="Bias" value="Clarity" />
                    <MetricTile label="Output" value="Fit" />
                  </div>

                  <div className="mt-8 space-y-4">
                    {[
                      "Traceable diagnostics",
                      "Reusable data",
                      "Report-ready structure",
                      "CRM-forwardable reference layer",
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-amber-400/70" />
                        <span className="text-sm text-white/58">{line}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 border-t border-white/6 pt-6">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="h-4 w-4 text-amber-400/60" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/70">
                        Diagnostic identity layer active
                      </span>
                    </div>
                    {access.authenticated ? (
                      <div className="mt-3 text-sm text-white/65">
                        Session recognised for {access.name || "authenticated operator"}.
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-white/45">
                        Anonymous entry permitted. Serious escalation comes later.
                      </div>
                    )}
                  </div>
                </Surface>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* DIAGNOSTIC LADDER                                                  */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Escalation ladder</RailLabel>
              <h2 className="mt-7 max-w-4xl font-serif text-4xl text-white md:text-5xl">
                This is a sequence, not a shopping aisle.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                The system is designed to move a serious buyer from personal signal,
                to team signal, to enterprise consequence, and finally into private
                mandate work where justified.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              {LADDER.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.step}
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.06 }}
                  >
                    <Surface className="h-full p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Icon className="h-5 w-5 text-amber-400/70" />
                        <span className="font-mono text-[10px] text-white/20">{item.step}</span>
                      </div>
                      <h3 className="mt-5 font-serif text-2xl text-white">{item.title}</h3>
                      <p className="mt-4 text-sm leading-relaxed text-white/48">{item.body}</p>
                      <Link
                        href={item.href}
                        className="mt-6 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/68 transition-colors hover:text-amber-300"
                      >
                        <span>Open step</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Surface>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* FLAGSHIP PRODUCT LEAD                                              */}
        {/* ------------------------------------------------------------------ */}
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
                Flagship product
              </div>
              <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl">
                Executive Reporting
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/52">
                The premium middle layer between raw diagnostic signal and full
                advisory mandate. Built for boards, founders, leadership teams,
                and institutions that need disciplined interpretation before intervention.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/diagnostics/executive-reporting"
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/72 transition-colors hover:text-amber-300 group"
                >
                  <span>Open flagship product</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/strategy-room"
                  className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-white/56 transition-colors hover:text-white"
                >
                  <span>Inspect Strategy Room</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* WHY DIAGNOSTICS EXIST                                              */}
        {/* ------------------------------------------------------------------ */}
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
                          <h3 className="font-serif text-2xl text-white">{item.title}</h3>
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
                <Surface className="p-8 md:p-10">
                  <Shield className="h-8 w-8 text-white/90" />
                  <h3 className="mt-8 font-serif text-3xl text-white md:text-4xl">
                    Why diagnostics come before escalation
                  </h3>

                  <div className="mt-8 space-y-5">
                    {[
                      "Establishes a disciplined reading before action.",
                      "Improves fit between the problem and the response.",
                      "Protects judgement from haste, ego, and vagueness.",
                      "Stops weak cases from entering private advisory too early.",
                    ].map((line) => (
                      <div key={line} className="flex items-start gap-4">
                        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-white/90" />
                        <span className="text-lg leading-relaxed text-white/72">{line}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 border-t border-white/6 pt-6">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-amber-400/60" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/72">
                        Commercial logic
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/52">
                      The system should never feel like a desperate funnel. It should feel like disciplined sorting.
                    </p>
                  </div>
                </Surface>
              </motion.div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <RailDivider />
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* DIAGNOSTIC PATHWAYS                                                */}
        {/* ------------------------------------------------------------------ */}
        <section id="pathways" className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Pathways</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Diagnostic pathways
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/48">
                Three levels of diagnostic depth, then a premium bridge into private mandate work.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {INSTRUMENTS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={`${item.title}-${item.href}-${index}`}
                    className="group relative overflow-hidden border border-white/[0.06] bg-white/[0.015] p-8 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.025]"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.65 }}
                    viewport={{ once: true }}
                  >
                    <div className="mb-8 flex items-start justify-between gap-4">
                      <Icon className="h-7 w-7 text-amber-400/60 transition-colors duration-300 group-hover:text-amber-300" />
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[8px] font-mono uppercase tracking-[0.2em] text-white/58">
                        {item.label}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl text-white transition-colors duration-300 group-hover:text-amber-50">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-white/48">{item.desc}</p>

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

                    <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-4">
                      <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/26">
                        When it is useful
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-white/50">{item.tension}</p>
                      <p className="mt-3 text-sm leading-relaxed text-white/38">{item.next}</p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-white/6 pt-6">
                      <Link
                        href={item.href}
                        className="group/link inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/68 transition-colors hover:text-amber-300"
                      >
                        <span>Open pathway</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
                      </Link>

                      <span className="font-mono text-[8px] text-white/12">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* MARKET PROOF                                                       */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Market proof</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Real patterns, anonymised
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Not testimonials. Real-world friction patterns surfaced by the diagnostic architecture.
              </p>
            </div>

            <AnonymisedCaseProof />
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* TRUST FAQ                                                          */}
        {/* ------------------------------------------------------------------ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Trust & reliability</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Questions from people who carry consequence
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                No generic answers. This is boardroom-level clarity.
              </p>
            </div>

            <TrustFAQ />
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

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  try {
    const sessionId = readAccessCookie(context.req as any);

    if (!sessionId) {
      return {
        props: {
          access: {
            authenticated: false,
            tier: "public",
            name: null,
            dashboardHref: null,
          },
        },
      };
    }

    const ctx = await getSessionContext(sessionId);

    if (!ctx?.ok || !ctx?.valid) {
      return {
        props: {
          access: {
            authenticated: false,
            tier: "public",
            name: null,
            dashboardHref: null,
          },
        },
      };
    }

    const tier = String(ctx.tier || "public");

    return {
      props: {
        access: {
          authenticated: true,
          tier,
          name: ctx.name || "Member",
          dashboardHref: tierAtLeast(tier, "inner-circle")
            ? "/inner-circle/dashboard?tab=diagnostics"
            : "/dashboard?tab=diagnostics",
        },
      },
    };
  } catch {
    return {
      props: {
        access: {
          authenticated: false,
          tier: "public",
          name: null,
          dashboardHref: null,
        },
      },
    };
  }
};

export default DiagnosticsPage;