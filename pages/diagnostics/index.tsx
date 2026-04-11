// pages/diagnostics/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Crown,
  Radar,
  ShieldCheck,
  Zap,
} from "lucide-react";

import Layout from "@/components/Layout";
import AssessmentSuiteLadder from "@/components/assessments/AssessmentSuiteLadder";

// ── DESIGN SYSTEM ─────────────────────────────────────────────────────────────

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Rule({ soft = true }: { soft?: boolean }) {
  return (
    <div
      className={cn(
        "h-px w-full",
        soft
          ? "bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
          : "bg-gradient-to-r from-transparent via-amber-500/25 to-transparent",
      )}
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-5 w-px bg-amber-500/40" />
      <span className="font-mono text-[9px] uppercase tracking-[0.36em] text-amber-400/75">
        {children}
      </span>
    </div>
  );
}

// ── AMBIENT ATMOSPHERE ────────────────────────────────────────────────────────

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Primary amber bloom — top left */}
      <div className="absolute -left-[10%] top-0 h-[50rem] w-[50rem] rounded-full bg-amber-500/[0.035] blur-[180px]" />
      {/* Secondary cool bloom — right */}
      <div className="absolute right-[-5%] top-[15%] h-[38rem] w-[38rem] rounded-full bg-white/[0.012] blur-[150px]" />
      {/* Bottom fill */}
      <div className="absolute bottom-0 left-1/2 h-[20rem] w-[60rem] -translate-x-1/2 rounded-full bg-amber-500/[0.025] blur-[140px]" />
      {/* Noise grain */}
      <div
        className="absolute inset-0 opacity-[0.028]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />
    </div>
  );
}

// ── ARCHITECTURE STAT ─────────────────────────────────────────────────────────

function ArchStat({
  value,
  label,
  delay = 0,
}: {
  value: string;
  label: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay }}
      className="border-l border-white/[0.08] pl-5"
    >
      <div className="font-serif text-3xl text-white/90 md:text-4xl">{value}</div>
      <div className="mt-1.5 font-mono text-[8px] uppercase tracking-[0.24em] text-white/28">
        {label}
      </div>
    </motion.div>
  );
}

// ── PRINCIPLE STRIP ───────────────────────────────────────────────────────────

function PrincipleStrip() {
  const principles = [
    {
      icon: Radar,
      title: "Signal before solution",
      body: "Each layer establishes what is actually happening before forcing a move.",
    },
    {
      icon: Activity,
      title: "Escalation is earned",
      body: "The ladder routes by evidence. Strategy Room is not the default — it is the conclusion.",
    },
    {
      icon: ShieldCheck,
      title: "Output, not noise",
      body: "Every diagnostic produces a governed artefact: posture, route, and correction priority.",
    },
    {
      icon: Crown,
      title: "Consequence-aware",
      body: "The system is designed for decisions that matter — not ambient reflection.",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {principles.map((p, i) => (
        <motion.div
          key={p.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.35 + i * 0.08 }}
          className="group rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-white/[0.12] hover:bg-white/[0.035]"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] border border-white/[0.07] bg-white/[0.03] transition group-hover:border-white/[0.12]">
            <p.icon className="h-4 w-4 text-amber-400/60" />
          </div>
          <h3 className="mt-4 font-serif text-base text-white/85">{p.title}</h3>
          <p className="mt-2.5 text-xs leading-relaxed text-white/38">{p.body}</p>
        </motion.div>
      ))}
    </div>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────

export default function DiagnosticsIndexPage() {
  return (
    <Layout
      title="Diagnostics"
      description="Full diagnostic ladder: constitutional, team, enterprise, and executive reporting."
      className="bg-[#060609] text-white"
    >
      <Head>
        <title>Diagnostics | Abraham of London</title>
        <meta
          name="description"
          content="A full diagnostic ladder for leaders, operators, and institutions. Constitutional, team, enterprise, and executive reporting — each layer with a distinct job."
        />
      </Head>

      <main className="min-h-screen bg-[#060609] text-white">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <Atmosphere />

          {/* top rule */}
          <div className="absolute inset-x-0 top-0">
            <Rule soft={false} />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-40 lg:px-12 lg:pb-32 lg:pt-52">
            <div className="grid gap-16 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">

              {/* Left — headline */}
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75 }}
                >
                  <Eyebrow>Diagnostics</Eyebrow>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.07 }}
                  className="mt-6 font-serif text-5xl font-light leading-[0.92] tracking-[-0.03em] text-white md:text-6xl lg:text-[5.5rem]"
                >
                  Before strategy,
                  <br />
                  <span className="text-white/40">before intervention,</span>
                  <br />
                  <em className="not-italic text-amber-300/90">signal.</em>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.18 }}
                  className="mt-8 max-w-xl text-lg leading-relaxed text-white/45"
                >
                  Four layers. Each with a distinct job. None exists to decorate
                  the others. The ladder routes by evidence — not by preference or
                  proximity to a sale.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.26 }}
                  className="mt-10 flex flex-wrap gap-3"
                >
                  <Link
                    href="#ladder"
                    className="group inline-flex items-center gap-2.5 rounded-[12px] bg-amber-500 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition hover:bg-amber-400"
                  >
                    View the ladder
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/diagnostics/executive-reporting"
                    className="inline-flex items-center gap-2.5 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/60 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white/80"
                  >
                    Executive Reporting
                  </Link>
                </motion.div>
              </div>

              {/* Right — architecture stats */}
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.85, delay: 0.12 }}
                className="space-y-8"
              >
                <div className="rounded-[24px] border border-white/[0.07] bg-white/[0.02] p-7">
                  <div className="font-mono text-[8px] uppercase tracking-[0.30em] text-white/25">
                    Platform architecture
                  </div>
                  <div className="mt-6 grid grid-cols-2 gap-x-8 gap-y-6">
                    <ArchStat value="4" label="Diagnostic layers" delay={0.28} />
                    <ArchStat value="3" label="Escalation routes" delay={0.34} />
                    <ArchStat value="10" label="Constitutional questions" delay={0.40} />
                    <ArchStat value="1" label="Governing output" delay={0.46} />
                  </div>

                  <div className="mt-6">
                    <Rule />
                  </div>

                  {/* Route flow */}
                  <div className="mt-5 flex items-center gap-0 divide-x divide-white/[0.06] overflow-hidden rounded-full border border-white/[0.06]">
                    {[
                      { label: "Constitutional", accent: false },
                      { label: "Executive Report", accent: false },
                      { label: "Strategy Room", accent: true },
                    ].map((r) => (
                      <div
                        key={r.label}
                        className={cn(
                          "flex-1 py-2 text-center font-mono text-[7px] uppercase tracking-[0.18em]",
                          r.accent
                            ? "bg-amber-500/[0.07] text-amber-300/70"
                            : "text-white/25",
                        )}
                      >
                        {r.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick start CTA */}
                <Link
                  href="/diagnostics/constitutional"
                  className="group flex items-center justify-between rounded-[20px] border border-amber-500/20 bg-amber-500/[0.05] px-6 py-5 transition hover:border-amber-500/35 hover:bg-amber-500/[0.08]"
                >
                  <div className="space-y-1">
                    <div className="font-mono text-[8px] uppercase tracking-[0.26em] text-amber-400/60">
                      Start here
                    </div>
                    <div className="font-serif text-lg text-white/85">
                      Constitutional Diagnostic
                    </div>
                    <div className="text-xs text-white/38">
                      10 questions · live route · no login
                    </div>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/10 transition group-hover:border-amber-500/35">
                    <Zap className="h-4 w-4 text-amber-400/70" />
                  </div>
                </Link>
              </motion.div>

            </div>
          </div>

          {/* bottom rule */}
          <div className="absolute inset-x-0 bottom-0">
            <Rule />
          </div>
        </section>

        {/* ── PRINCIPLES ────────────────────────────────────────────────────── */}
        <section className="relative border-b border-white/[0.05]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="mb-10"
            >
              <Eyebrow>Design principles</Eyebrow>
              <h2 className="mt-4 font-serif text-3xl text-white md:text-4xl">
                How this architecture thinks
              </h2>
            </motion.div>
            <PrincipleStrip />
          </div>
        </section>

        {/* ── LADDER ────────────────────────────────────────────────────────── */}
        <section id="ladder" className="relative scroll-mt-12">
          {/* Subtle surface gradient behind the ladder */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.035),transparent_60%)]" />

          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-12 lg:py-28">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="mb-14"
            >
              <Eyebrow>The full ladder</Eyebrow>
              <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <h2 className="font-serif text-4xl text-white md:text-5xl">
                  Full assessment suite
                </h2>
                <p className="max-w-lg text-base leading-relaxed text-white/38 md:text-right">
                  Select the layer that matches your situation.
                  The system will route you forward from there.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.18 }}
            >
              <AssessmentSuiteLadder />
            </motion.div>
          </div>
        </section>

        {/* ── ESCALATION CLOSE ──────────────────────────────────────────────── */}
        <section className="relative border-t border-white/[0.05]">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-[28px] border border-amber-500/15 bg-amber-500/[0.04] p-8 md:p-12"
            >
              {/* Ambient */}
              <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-amber-500/[0.06] blur-[100px]" />

              <div className="relative grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.07] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.28em] text-amber-300/80">
                    <Crown className="h-3 w-3" />
                    Escalation threshold
                  </div>
                  <h2 className="font-serif text-3xl text-white md:text-4xl">
                    When the diagnostic reveals material consequence,
                    the next move is Strategy Room.
                  </h2>
                  <p className="max-w-2xl text-base leading-relaxed text-white/42">
                    The ladder does not force escalation. It shows when escalation
                    is the responsible next step — and when it is not.
                  </p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <Link
                    href="/strategy-room"
                    className="group inline-flex items-center gap-2.5 rounded-[12px] border border-amber-500/25 bg-amber-500/10 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300 transition hover:border-amber-500/40 hover:bg-amber-500/15 whitespace-nowrap"
                  >
                    <Crown className="h-3.5 w-3.5" />
                    Enter Strategy Room
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/diagnostics/executive-reporting"
                    className="inline-flex items-center gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/50 transition hover:border-white/[0.14] hover:bg-white/[0.05] hover:text-white/70 whitespace-nowrap"
                  >
                    Executive Reporting
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
    </Layout>
  );
}