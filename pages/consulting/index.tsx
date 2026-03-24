/* ============================================================================
   FILE: pages/consulting/index.tsx
   CONSULTING — Advisory & Strategy
============================================================================ */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  ShieldCheck,
  Users as UsersIcon,
  Target as TargetIcon,
  Globe,
  Workflow,
  Mic2,
  Award,
  Compass,
  Scale,
  Key,
  Eye,
  Crown,
  Building2,
  Activity,
  Briefcase,
  FileText,
  Gavel,
  Radar,
  Layers,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";

type Pill = { icon: React.ComponentType<any>; title: string; desc: string };
type Deliverable = { title: string; icon: React.ComponentType<any> };
type Step = { step: string; desc: string };

type Engagement = {
  label: "Engagement";
  title: string;
  desc: string;
  href: string;
  tier: "diagnostic" | "private" | "public";
  icon: React.ComponentType<any>;
  bullets: string[];
};

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

const DOMAINS: Pill[] = [
  {
    icon: UsersIcon,
    title: "Board strategy",
    desc: "Governance, operating cadence, decision hygiene, and legitimacy under scrutiny.",
  },
  {
    icon: TargetIcon,
    title: "Founder advisory",
    desc: "Confidential counsel for scale, inflection points, and high-stakes trade-offs.",
  },
  {
    icon: Globe,
    title: "Frontier markets",
    desc: "Execution strategy for operators engaging African growth markets with real constraints.",
  },
];

const DELIVERABLES: Deliverable[] = [
  { title: "Clearer decision pathways", icon: Gavel },
  { title: "Documented strategic logic", icon: FileText },
  { title: "Reduced execution drift", icon: Radar },
  { title: "Governance and cadence", icon: Workflow },
  { title: "Leadership alignment", icon: Scale },
  { title: "Next-step architecture", icon: Briefcase },
];

const HOW: Step[] = [
  {
    step: "Diagnostic",
    desc: "Where appropriate, the work begins with a structured reading of the real problem before counsel is applied.",
  },
  {
    step: "Decision environment",
    desc: "Context, trade-offs, decision owners, and execution realities are brought into one disciplined frame.",
  },
  {
    step: "Documented output",
    desc: "The engagement produces clear recommendations, explicit logic, and next-step control points.",
  },
];

const ENGAGEMENTS: Engagement[] = [
  {
    label: "Engagement",
    title: "Diagnostics First",
    desc: "A structured reading before advisory begins, where clarity is still more valuable than speed.",
    href: "/diagnostics",
    tier: "diagnostic",
    icon: Activity,
    bullets: [
      "Pressure, drift, and misalignment surfaced",
      "Fit established before escalation",
      "Correction priority clarified",
    ],
  },
  {
    label: "Engagement",
    title: "Strategy Room",
    desc: "A controlled decision environment for founders, boards, and institutions facing high-consequence choices.",
    href: "/consulting/strategy-room",
    tier: "private",
    icon: ShieldCheck,
    bullets: [
      "Constraint-aware options + explicit trade-offs",
      "Artifacts: memo, matrix, cadence, controls",
      "Designed for irreversible decisions",
    ],
  },
  {
    label: "Engagement",
    title: "Private Advisory",
    desc: "Ongoing strategic counsel for leaders operating under sustained complexity, scrutiny, or consequence.",
    href: "/contact?source=consulting&intent=consultation",
    tier: "private",
    icon: Crown,
    bullets: [
      "Governance and operating cadence",
      "Founder counsel under pressure",
      "Strategic oversight and alignment",
    ],
  },
];

function tierBadge(tier: Engagement["tier"]) {
  if (tier === "diagnostic") {
    return {
      label: "Diagnostic",
      className:
        "border-emerald-500/20 bg-emerald-500/[0.06] text-emerald-200/80",
    };
  }

  if (tier === "public") {
    return {
      label: "Public",
      className:
        "border-slate-500/20 bg-slate-500/[0.06] text-slate-200/80",
    };
  }

  return {
    label: "Private",
    className: "border-amber-500/25 bg-amber-500/[0.07] text-amber-200/80",
  };
}

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[12%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.05] blur-[140px]" />
      <div className="absolute right-[10%] top-[28%] h-[24rem] w-[24rem] rounded-full bg-white/[0.02] blur-[120px]" />
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
      <Compass className="h-3.5 w-3.5 text-amber-500/36" />
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

const ConsultingPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="Advisory & Strategy"
      description="Strategic counsel for leaders under consequence."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/consulting`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* HERO */}
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
                  <RailLabel>Advisory</RailLabel>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[10ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.7rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  Strategic counsel
                  <span className="mt-3 block text-white/56">
                    for leaders under consequence
                  </span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.18rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  For founders, boards, and institutions facing decisions that
                  carry operational, financial, and reputational weight.
                </motion.p>

                <motion.p
                  className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-white/44"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.24 }}
                >
                  This is not general advice. It is structured thinking applied to
                  real situations, with documented reasoning, trade-offs, and
                  execution pathways.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.3 }}
                >
                  <Link
                    href="/consulting/strategy-room"
                    className="group inline-flex items-center justify-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                  >
                    <span>Enter strategy room</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/diagnostics"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Start with diagnostics</span>
                    <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div
                  className="mt-12 flex flex-wrap items-center gap-5"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.38 }}
                >
                  <div className="inline-flex items-center gap-2">
                    <Key className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Limited mandates
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="inline-flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Strict confidence
                    </span>
                  </div>
                </motion.div>

                <motion.div
                  className="mt-12 h-px w-40 bg-gradient-to-r from-amber-500/30 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 1.1, delay: 0.46 }}
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
                        Advisory profile
                      </span>
                      <Building2 className="h-4 w-4 text-amber-500/40" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                      <MetricTile label="Mode" value="Private" />
                      <MetricTile label="Bias" value="Structured" />
                      <MetricTile label="Output" value="Documented" />
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        "Clearer decision pathways",
                        "Documented strategic logic",
                        "Reduced execution drift",
                        "Governance and cadence under pressure",
                      ].map((line) => (
                        <div key={line} className="flex items-center gap-3">
                          <CheckCircle className="h-4 w-4 text-amber-400/70" />
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

        {/* MANDATE */}
        <section className="relative py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.035] to-transparent" />
          <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
            <MandateStatement />
          </div>
          <div className="relative mt-16">
            <StrategicFunnelStrip />
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <RailDivider />
        </div>

        {/* ENGAGEMENTS */}
        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Engagement</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Three engagement paths. Clear scope. Documented outputs.
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/48">
                The work is structured to establish fit before pressure, complexity,
                and consequence are mishandled.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {ENGAGEMENTS.map((e, index) => {
                const badge = tierBadge(e.tier);
                const Icon = e.icon;

                return (
                  <motion.article
                    key={e.title}
                    className="group relative overflow-hidden border border-white/[0.06] bg-white/[0.015] p-8 transition-all duration-500 hover:border-white/[0.12] hover:bg-white/[0.025]"
                    initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.08, duration: 0.65 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative">
                      <div className="mb-8 flex items-start justify-between gap-4">
                        <Icon className="h-7 w-7 text-amber-400/60 transition-colors duration-300 group-hover:text-amber-300" />
                        <span
                          className={`rounded-full border px-3 py-1 text-[8px] font-mono uppercase tracking-[0.2em] ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <h3 className="font-serif text-2xl text-white transition-colors duration-300 group-hover:text-amber-50">
                        {e.title}
                      </h3>

                      <p className="mt-3 text-sm leading-relaxed text-white/48">
                        {e.desc}
                      </p>

                      <ul className="mt-7 space-y-3">
                        {e.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-3 text-sm text-white/42"
                          >
                            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500/40" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="mt-8 flex items-center justify-between border-t border-white/6 pt-6">
                        <Link
                          href={e.href}
                          className="group/link inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/68 transition-colors hover:text-amber-300"
                        >
                          <span>Open pathway</span>
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

        {/* DOMAINS + DELIVERABLES */}
        <section className="border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2">
              <div>
                <RailLabel>Domains</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Engagement domains
                </h2>

                <div className="mt-10 space-y-8">
                  {DOMAINS.map((p, index) => {
                    const Icon = p.icon;
                    return (
                      <motion.div
                        key={p.title}
                        className="flex gap-5 border-b border-white/6 pb-7 last:border-b-0"
                        initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.08, duration: 0.6 }}
                        viewport={{ once: true }}
                      >
                        <div className="mt-1 flex h-11 w-11 items-center justify-center border border-white/[0.08] bg-white/[0.02]">
                          <Icon className="h-5 w-5 text-amber-400/55" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg text-white">
                            {p.title}
                          </h3>
                          <p className="mt-2 text-sm leading-relaxed text-white/42">
                            {p.desc}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              <div>
                <RailLabel>Outputs</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  What the work produces
                </h2>

                <div className="mt-10 grid grid-cols-2 gap-4">
                  {DELIVERABLES.map((o, index) => {
                    const Icon = o.icon;
                    return (
                      <motion.div
                        key={o.title}
                        className="border border-white/[0.06] bg-white/[0.02] p-5 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]"
                        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.06, duration: 0.55 }}
                        viewport={{ once: true }}
                      >
                        <Icon className="mb-3 h-5 w-5 text-amber-400/50" />
                        <h3 className="font-serif text-sm text-white/88">
                          {o.title}
                        </h3>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <RailDivider />
        </div>

        {/* SPEAKING */}
        <section id="speaking" className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2 lg:gap-24">
              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <RailLabel>Speaking</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Speaking & discourse
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/48">
                  Governance, frontier market architecture, and principle under
                  pressure — designed to move decisions, not generate applause.
                </p>

                <div className="mt-10 space-y-5">
                  {[
                    "Keynote addresses for boards and leadership forums",
                    "Private executive retreat facilitation",
                    "Strategic roundtables and panel discourse",
                    "Institutional guest lectures",
                  ].map((item, index) => (
                    <motion.div
                      key={item}
                      className="flex items-center gap-4"
                      initial={{ opacity: 0, x: reduceMotion ? 0 : -8 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.08, duration: 0.5 }}
                      viewport={{ once: true }}
                    >
                      <CheckCircle className="h-4 w-4 text-amber-400/72" />
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
                <div className="border border-white/[0.06] bg-white/[0.02] p-8 shadow-[0_18px_70px_-50px_rgba(0,0,0,0.8)]">
                  <Mic2 className="mb-6 h-9 w-9 text-amber-400/55" />
                  <h3 className="font-serif text-2xl text-white">
                    Engage for speaking
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/44">
                    The objective is not noise. It is clearer thinking, sharper language,
                    and stronger institutional judgement.
                  </p>

                  <Link
                    href="/contact?intent=speaking-engagement"
                    className="group mt-8 inline-flex w-full items-center justify-center gap-3 border border-white/10 bg-white/[0.02] px-6 py-4 transition-colors hover:border-amber-500/30 hover:bg-amber-500/[0.04]"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/72 group-hover:text-amber-300">
                      Submit speaking enquiry
                    </span>
                    <ArrowRight className="h-4 w-4 text-amber-400/40 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* HOW I WORK + FIT */}
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
                <RailLabel>Method</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  How the work proceeds
                </h2>
                <p className="mt-4 text-lg text-white/48">
                  Structured, documented, accountable.
                </p>

                <div className="mt-10 space-y-10">
                  {HOW.map((s, i) => (
                    <motion.div
                      key={s.step}
                      className="flex gap-5"
                      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.55 }}
                      viewport={{ once: true }}
                    >
                      <div className="flex h-10 w-10 items-center justify-center border border-amber-500/25 font-mono text-sm text-amber-400">
                        {i + 1}
                      </div>
                      <div>
                        <h4 className="font-serif text-lg text-white">
                          {s.step}
                        </h4>
                        <p className="mt-2 text-sm text-white/42">{s.desc}</p>
                      </div>
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
                  <Compass className="mb-6 h-9 w-9 text-amber-400/55" />
                  <h3 className="font-serif text-2xl text-white">
                    Who this is for
                  </h3>

                  <ul className="mt-8 space-y-5">
                    {[
                      "Founders carrying responsibility for people, capital, and direction",
                      "Boards requiring structure stronger than personality",
                      "Leadership teams needing clearer judgement under pressure",
                    ].map((line) => (
                      <li key={line} className="flex items-center gap-4">
                        <CheckCircle className="h-4 w-4 text-amber-400/72" />
                        <span className="text-sm text-white/68">{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10">
                    <Link
                      href="/contact?source=consulting&intent=context-note"
                      className="group block border border-amber-500/25 bg-amber-500/[0.05] px-6 py-5 transition-colors hover:border-amber-500/55 hover:bg-amber-500/[0.08]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/82">
                          Share context note
                        </span>
                        <ArrowRight className="h-4 w-4 text-amber-400/48 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
                      </div>
                    </Link>

                    <p className="mt-4 text-center font-mono text-[8px] uppercase tracking-[0.2em] text-white/18">
                      Strictly confidential · Limited mandates
                    </p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
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
                When the decision matters, structure matters
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50">
                Engage for diagnostic clarity, a structured decision environment,
                or ongoing strategic counsel.
              </p>

              <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/diagnostics"
                  className="group inline-flex items-center justify-center gap-3 border border-white/10 px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  <span>Start with diagnostics</span>
                  <ArrowRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>

                <Link
                  href="/consulting/strategy-room"
                  className="group inline-flex items-center justify-center gap-3 bg-white px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                >
                  <span>Enter strategy room</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

export default ConsultingPage;