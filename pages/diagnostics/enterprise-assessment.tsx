// pages/diagnostics/enterprise-assessment.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  Crown,
  Globe,
  LayoutGrid,
  Scale,
} from "lucide-react";

import Layout from "@/components/Layout";
import EnterpriseAssessmentSuite from "@/components/assessments/EnterpriseAssessmentSuite";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Rule({ soft = true }: { soft?: boolean }) {
  return (
    <div
      className={cn(
        "h-px w-full",
        soft
          ? "bg-gradient-to-r from-transparent via-white/[0.07] to-transparent"
          : "bg-gradient-to-r from-transparent via-amber-500/22 to-transparent",
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

function Atmosphere() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-0 h-[42rem] w-[42rem] rounded-full bg-amber-500/[0.028] blur-[170px]" />
      <div className="absolute right-[-5%] top-[15%] h-[28rem] w-[28rem] rounded-full bg-white/[0.01] blur-[120px]" />
    </div>
  );
}

function ContextCard({
  icon: Icon,
  title,
  body,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="rounded-[18px] border border-white/[0.07] bg-white/[0.02] p-5"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-white/[0.07] bg-white/[0.03]">
        <Icon className="h-4 w-4 text-amber-400/60" />
      </div>
      <h3 className="mt-4 font-serif text-base text-white/85">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-white/38">{body}</p>
    </motion.div>
  );
}

export default function EnterpriseAssessmentPage() {
  return (
    <Layout
      title="Enterprise Assessment"
      description="Institution-wide diagnostic mapping for authority, governance, trust, and execution."
      className="bg-[#060609] text-white"
    >
      <Head>
        <title>Enterprise Assessment | Abraham of London</title>
        <meta
          name="description"
          content="Institution-wide diagnostic mapping. Maps authority, governance, clarity, execution, trust, and exposure across all major domains."
        />
      </Head>

      <main className="min-h-screen bg-[#060609] text-white">

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          <Atmosphere />
          <div className="absolute inset-x-0 top-0"><Rule soft={false} /></div>

          <div className="relative mx-auto max-w-7xl px-6 pb-20 pt-40 lg:px-12 lg:pb-28 lg:pt-48">

            {/* Breadcrumb */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-10 flex items-center gap-2"
            >
              <Link
                href="/diagnostics"
                className="inline-flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.26em] text-white/25 transition hover:text-white/50"
              >
                <ArrowLeft className="h-3 w-3" />
                Diagnostics
              </Link>
              <ChevronRight className="h-3 w-3 text-white/15" />
              <span className="font-mono text-[8px] uppercase tracking-[0.26em] text-amber-400/60">
                Enterprise Assessment
              </span>
            </motion.div>

            <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7 }}
                >
                  <Eyebrow>Layer 03 — Enterprise</Eyebrow>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.07 }}
                  className="mt-6 font-serif text-5xl font-light leading-[0.92] tracking-[-0.03em] text-white md:text-6xl lg:text-[4.8rem]"
                >
                  Institution-wide
                  <br />
                  <em className="not-italic text-white/38">authority,</em>
                  <br />
                  <span className="text-amber-300/90">mapped.</span>
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.16 }}
                  className="mt-7 max-w-lg text-lg leading-relaxed text-white/42"
                >
                  Some problems are not team-sized. This layer maps where authority,
                  trust, governance, and execution are failing across the full
                  institutional architecture.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: 0.22 }}
                  className="mt-8 flex flex-wrap gap-3"
                >
                  <Link
                    href="#suite"
                    className="group inline-flex items-center gap-2 rounded-[12px] bg-amber-500 px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition hover:bg-amber-400"
                  >
                    Begin assessment
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/diagnostics"
                    className="inline-flex items-center gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.02] px-6 py-3.5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/45 transition hover:border-white/[0.12] hover:text-white/65"
                  >
                    View all layers
                  </Link>
                </motion.div>
              </div>

              {/* Right — position + six dimensions */}
              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.12 }}
                className="space-y-4"
              >
                {/* Ladder position */}
                <div className="rounded-[20px] border border-white/[0.07] bg-white/[0.02] p-5">
                  <div className="font-mono text-[7.5px] uppercase tracking-[0.26em] text-white/25">
                    Position in ladder
                  </div>
                  <div className="mt-4 space-y-2">
                    {[
                      { label: "01 Constitutional", active: false, done: true },
                      { label: "02 Team", active: false, done: true },
                      { label: "03 Enterprise", active: true, done: false },
                      { label: "04 Executive Reporting", active: false, done: false },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={cn(
                          "flex items-center gap-3 rounded-[10px] px-3 py-2.5 font-mono text-[9px] uppercase tracking-[0.18em]",
                          item.active
                            ? "border border-amber-500/20 bg-amber-500/[0.07] text-amber-300/80"
                            : item.done
                              ? "text-white/28 line-through decoration-white/15"
                              : "text-white/22",
                        )}
                      >
                        {item.active && <div className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />}
                        {item.label}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Six dimensions */}
                <div className="rounded-[18px] border border-white/[0.06] bg-white/[0.015] p-4">
                  <div className="font-mono text-[7px] uppercase tracking-[0.24em] text-white/22 mb-3">
                    Six dimensions mapped
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {["Authority", "Governance", "Clarity", "Execution", "Trust", "Exposure"].map((d) => (
                      <div
                        key={d}
                        className="rounded-[8px] border border-white/[0.06] bg-white/[0.02] py-1.5 text-center font-mono text-[7px] uppercase tracking-[0.14em] text-white/30"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-0"><Rule /></div>
        </section>

        {/* ── CONTEXT ───────────────────────────────────────────────────────── */}
        <section className="border-b border-white/[0.05]">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8"
            >
              <Eyebrow>What this layer maps</Eyebrow>
            </motion.div>
            <div className="grid gap-4 sm:grid-cols-3">
              <ContextCard
                icon={Building2}
                title="Cross-domain authority"
                body="Where decision rights are diffuse, contested, or delegated without clarity — producing compounding misalignment."
                delay={0.28}
              />
              <ContextCard
                icon={Scale}
                title="Governance integrity"
                body="Whether the governing architecture of the institution is structurally sound or operating on legacy assumptions no longer fit for purpose."
                delay={0.34}
              />
              <ContextCard
                icon={Globe}
                title="Exposure by domain"
                body="Where material risk is concentrated and which domains carry consequences that require executive-level attention."
                delay={0.40}
              />
            </div>
          </div>
        </section>

        {/* ── SUITE ─────────────────────────────────────────────────────────── */}
        <section id="suite" className="relative scroll-mt-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.028),transparent_55%)]" />
          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.65, delay: 0.1 }}
              className="mb-12"
            >
              <Eyebrow>Live assessment</Eyebrow>
              <h2 className="mt-4 font-serif text-4xl text-white">
                Map your institution's architecture
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-white/38">
                Click any domain to expand and set its scores. The heat map
                updates in real time — showing exactly where the institution
                is ordered, drifting, or misaligned.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18 }}
            >
              <EnterpriseAssessmentSuite />
            </motion.div>
          </div>
        </section>

        {/* ── ESCALATION CLOSE ──────────────────────────────────────────────── */}
        <section className="border-t border-white/[0.05]">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12">
            <div className="relative overflow-hidden rounded-[24px] border border-amber-500/12 bg-amber-500/[0.03] p-7 md:p-10">
              <div className="pointer-events-none absolute right-0 top-0 h-56 w-56 rounded-full bg-amber-500/[0.05] blur-[90px]" />
              <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/18 bg-amber-500/[0.06] px-3 py-1.5 font-mono text-[7.5px] uppercase tracking-[0.26em] text-amber-300/75">
                    <Crown className="h-3 w-3" />
                    Final layer
                  </div>
                  <h2 className="font-serif text-2xl text-white md:text-3xl">
                    When enterprise mapping reveals material consequence, the
                    next move is Executive Reporting.
                  </h2>
                  <p className="max-w-xl text-sm leading-relaxed text-white/38">
                    Executive Reporting turns diagnostic signal into a board-grade
                    governed output: posture, priority stack, and escalation judgment.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
                  <Link
                    href="/diagnostics/executive-reporting"
                    className="group inline-flex items-center gap-2 rounded-[12px] border border-amber-500/20 bg-amber-500/[0.08] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.20em] text-amber-300 transition hover:border-amber-500/35 hover:bg-amber-500/12 whitespace-nowrap"
                  >
                    Executive Reporting
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/strategy-room"
                    className="inline-flex items-center gap-2 rounded-[12px] border border-white/[0.07] bg-white/[0.02] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.20em] text-white/40 transition hover:border-white/[0.12] hover:text-white/60 whitespace-nowrap"
                  >
                    <Crown className="h-3.5 w-3.5 text-amber-400/40" />
                    Strategy Room
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </Layout>
  );
}