/* ============================================================================
   FILE: pages/diagnostics/enterprise.tsx
   ENTERPRISE DIAGNOSTIC — Board / Institution Layer
============================================================================ */

import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Crown,
  ShieldCheck,
  ChevronRight,
  CheckCircle2,
  Activity,
  FileText,
  Scale,
  BarChart3,
  Radar,
  AlertTriangle,
  Users,
  Gavel,
  Layers,
  ScanSearch,
} from "lucide-react";

import Layout from "@/components/Layout";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

type BoardSignal = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

type EnterpriseOutput = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

const SIGNALS: BoardSignal[] = [
  {
    icon: AlertTriangle,
    title: "The institution looks stable, but confidence is thinning",
    desc:
      "This is the zone where surface order can mask leadership gap, variance, and structural fragility.",
  },
  {
    icon: Users,
    title: "Executives and teams may be reading different realities",
    desc:
      "Perception divergence is often one of the clearest warnings that governance or culture is weakening.",
  },
  {
    icon: Gavel,
    title: "Delay now carries strategic cost",
    desc:
      "When hesitation increases operational, reputational, or leadership risk, a serious reading becomes commercially rational.",
  },
];

const OUTPUTS: EnterpriseOutput[] = [
  {
    icon: BarChart3,
    title: "Organisation snapshot",
    desc:
      "A top-line structural reading across key enterprise alignment domains.",
  },
  {
    icon: Radar,
    title: "Team variance and fragility signal",
    desc:
      "A reading of divergence, internal inconsistency, and where operating coherence is thinning.",
  },
  {
    icon: Scale,
    title: "Leadership gap interpretation",
    desc:
      "A focused reading of executive versus non-executive perception across the institution.",
  },
  {
    icon: FileText,
    title: "Board-useful reporting posture",
    desc:
      "Structured outputs strong enough to support escalation, intervention, or private strategic follow-through.",
  },
];

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.05] blur-[140px]" />
      <div className="absolute right-[10%] top-[28%] h-[24rem] w-[24rem] rounded-full bg-white/[0.02] blur-[120px]" />
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
    <div className="my-20 flex items-center gap-3">
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

const EnterpriseDiagnosticPage: NextPage = () => {
  const reduceMotion = useReducedMotion();

  return (
    <Layout
      title="Enterprise Alignment Diagnostic"
      description="A board-grade enterprise diagnostic for organisational fragility, leadership gap, team variance, and institutional alignment."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics/enterprise`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        {/* HERO SECTION */}
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
                  <RailLabel>Enterprise diagnostic</RailLabel>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[10ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.7rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  When the institution
                  <span className="mt-3 block text-white/56">needs a serious reading</span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.18rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  A board-grade diagnostic for organisations facing fragility,
                  perception gap, team divergence, or rising institutional risk.
                </motion.p>

                <motion.p
                  className="mt-5 max-w-2xl text-base leading-relaxed text-white/40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.24 }}
                >
                  This is not a survey product with expensive typography. It is a
                  structured enterprise reading designed to clarify whether the
                  institution requires monitoring, correction, or private intervention.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.26 }}
                >
                  <Link
                    href="/contact?intent=enterprise-alignment-diagnostic"
                    className="group inline-flex items-center justify-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                  >
                    <span>Request enterprise diagnostic</span>
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
                    <Building2 className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Institution-scale signal
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Board-grade posture
                    </span>
                  </div>
                  <div className="h-3 w-px bg-white/10" />
                  <div className="inline-flex items-center gap-2">
                    <Layers className="h-3.5 w-3.5 text-amber-500/38" />
                    <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
                      Advisory-linked
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

              {/* SIDEBAR WIDGET */}
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
                      <Crown className="h-4 w-4 text-amber-500/40" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                      <MetricTile label="Tier" value="Board" />
                      <MetricTile label="Use" value="Signal" />
                      <MetricTile label="Bias" value="Serious" />
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        "Clarifies institutional condition before mandate escalation",
                        "Exposes leadership perception gap",
                        "Surfaces variance and fragility risk",
                        "Supports board-level next-step logic",
                      ].map((line, idx) => (
                        <div key={`hero-feature-${idx}`} className="flex items-center gap-3">
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

        {/* TYPICAL TRIGGERS SECTION */}
        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Typical triggers</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Why institutions usually enter here
              </h2>
              <p className="mt-4 max-w-3xl text-lg text-white/48">
                Not because collapse has happened. Because consequence is becoming visible.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {SIGNALS.map((item, idx) => (
                <Card key={`trigger-signal-${idx}`} {...item} />
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        {/* OUTPUTS SECTION */}
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
                <RailLabel>Enterprise outputs</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  The institution gets more than a score
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/48">
                  The buyer is purchasing a governed reading of organisational condition.
                </p>

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {OUTPUTS.map((item, idx) => (
                    <Card key={`output-card-${idx}`} {...item} />
                  ))}
                </div>
              </motion.div>

              {/* ESCALATION SIDEBAR */}
              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <div className="border border-amber-500/16 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-8">
                  <ScanSearch className="mb-6 h-9 w-9 text-amber-400/55" />
                  <h3 className="font-serif text-2xl text-white">
                    This is the last serious stop before private chamber work
                  </h3>

                  <ul className="mt-8 space-y-5">
                    {[
                      "Appropriate when multiple teams and perceptions are involved",
                      "Useful when leadership needs clearer signal before intervention",
                      "Strong enough to justify escalation into private advisory",
                    ].map((line, idx) => (
                      <li key={`escalation-reason-${idx}`} className="flex items-center gap-4">
                        <CheckCircle2 className="h-4 w-4 text-amber-400/72" />
                        <span className="text-sm text-white/68">{line}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-10 rounded-2xl border border-white/8 bg-black/20 p-5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/56">
                      Escalation principle
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-white/46">
                      If the diagnostic reveals leadership gap, high variance, and a
                      rising fragility signal, delay becomes a strategic error.
                    </p>
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link
                      href="/contact?intent=enterprise-alignment-diagnostic"
                      className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
                    >
                      Request enterprise diagnostic <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/consulting/strategy-room"
                      className="inline-flex items-center gap-2 rounded-full border border-white/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-white/72 hover:bg-white/[0.04]"
                    >
                      Strategy Room <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* FINAL CALL TO ACTION */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <Activity className="mx-auto mb-6 h-6 w-6 text-amber-500/30" />

              <h2 className="font-serif text-4xl text-white md:text-5xl">
                Read the institution before the institution pays for delay.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-lg text-white/50">
                Strong institutions do not fear diagnosis. Weak ones postpone it.
              </p>

              <div className="mt-12 flex flex-col justify-center gap-4 sm:flex-row">
                <Link
                  href="/contact?intent=enterprise-alignment-diagnostic"
                  className="group inline-flex items-center justify-center gap-3 bg-white px-10 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                >
                  <span>Request enterprise diagnostic</span>
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

export default EnterpriseDiagnosticPage;