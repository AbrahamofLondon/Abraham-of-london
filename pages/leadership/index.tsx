/* ============================================================================
   FILE: pages/leadership/index.tsx
   LEADERSHIP FORMATION — ADULT / HOUSE-MATCHED / PAGES-ROUTER SAFE
============================================================================ */

import * as React from "react";
import type { NextPage } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileSpreadsheet,
  Target,
  Shield,
  Landmark,
  BookOpen,
  Hammer,
  Compass,
  Heart,
  Crown,
  Eye,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

type AccessStatus = "public" | "inner-circle";

type ProgressionStage = {
  stage: string;
  title: string;
  description: string;
  href: string;
  status: AccessStatus;
  icon: React.ComponentType<any>;
  outcome: string;
};

type LeadershipTool = {
  category: string;
  title: string;
  description: string;
  href: string;
  status: AccessStatus;
  icon: React.ComponentType<any>;
  useCase: string;
};

const leadershipProgression: ProgressionStage[] = [
  {
    stage: "01 · Self",
    title: "Ultimate Purpose of Man",
    description:
      "Understand human purpose across seven domains — the foundation of stewardship.",
    href: "/blog/ultimate-purpose-of-man",
    status: "public",
    icon: Compass,
    outcome: "Clarity on why you lead",
  },
  {
    stage: "02 · Purpose",
    title: "Builder's Catechism",
    description:
      "Authoritative question-set for founder legitimacy and execution discipline.",
    href: "/canon/builders-catechism",
    status: "inner-circle",
    icon: Hammer,
    outcome: "Execution clarity",
  },
  {
    stage: "03 · Vision",
    title: "The Canon",
    description:
      "Complete doctrinal architecture for institutional leadership and legacy.",
    href: "/canon",
    status: "inner-circle",
    icon: BookOpen,
    outcome: "Intellectual foundation",
  },
  {
    stage: "04 · Mission",
    title: "Strategic Frameworks",
    description:
      "Board-ready tooling for turning vision into documented operational reality.",
    href: "/resources/strategic-frameworks",
    status: "public",
    icon: Target,
    outcome: "Operational tooling",
  },
];

const leadershipTools: LeadershipTool[] = [
  {
    category: "Governance",
    title: "Board Decision Log",
    description:
      "Institutional template for documented decisions and accountability matrices.",
    href: "/resources/board-decision-log-template",
    status: "public",
    icon: FileSpreadsheet,
    useCase: "Decision hygiene",
  },
  {
    category: "Development",
    title: "Leadership Standards",
    description:
      "Framework for defining and measuring high-stakes leadership performance.",
    href: "/resources/leadership-standards-blueprint",
    status: "public",
    icon: Target,
    useCase: "Formation",
  },
  {
    category: "Stewardship",
    title: "Legacy Ledger",
    description:
      "Multi-generational mapping for financial and intellectual capital.",
    href: "/resources/multi-generational-legacy-ledger",
    status: "inner-circle",
    icon: Landmark,
    useCase: "Legacy planning",
  },
];

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-400/30" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/65">
        {children}
      </span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="my-20 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-amber-400/10 blur-md" />
        <Crown className="relative h-4 w-4 text-amber-300/50" />
      </div>
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
    </div>
  );
}

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-amber-500/[0.05] blur-[140px]" />
      <div className="absolute right-[10%] top-[20%] h-[20rem] w-[20rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_48%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-20 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-20 h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
    </div>
  );
}

function statusTone(status: AccessStatus) {
  return status === "public"
    ? "border-emerald-500/20 bg-emerald-500/8 text-emerald-300/80"
    : "border-amber-400/20 bg-amber-400/8 text-amber-200/82";
}

function statusLabel(status: AccessStatus) {
  return status === "public" ? "Public" : "Inner Circle";
}

const LeadershipPage: NextPage = () => {
  return (
    <Layout
      title="Decision Authority Formation"
      description="Decision authority architecture for executives who must make non-delegable decisions under structural ambiguity."
      className="bg-black text-white"
      fullWidth
    >
      <main className="relative min-h-screen bg-black text-white">
        <AmbientField />

        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/8">
          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
              <div className="max-w-4xl">
                <RailLabel>Decision · Authority · Architecture</RailLabel>

                <h1 className="mt-8 font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.7rem]">
                  Decide under
                  <span className="mt-3 block text-white/58">ambiguity</span>
                </h1>

                <p className="mt-8 max-w-2xl text-xl font-light leading-relaxed text-white/56">
                  Decision authority architecture for executives who must
                  identify contradictions their team cannot dismiss, price what
                  ignoring them costs, and sequence decisions that survive
                  scrutiny.
                </p>

                <div className="mt-12 flex flex-wrap gap-4">
                  <Link
                    href="#progression"
                    className="group inline-flex items-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-all duration-500 hover:bg-amber-50"
                  >
                    <span>Enter the system</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/resources/board-decision-log-template"
                    className="group inline-flex items-center gap-3 border border-white/12 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-all duration-500 hover:border-white/22 hover:bg-white/[0.04]"
                  >
                    <span>Governance Tool</span>
                    <FileSpreadsheet className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                  </Link>
                </div>

                <div className="mt-12 flex items-center gap-4">
                  <div className="h-px w-12 bg-gradient-to-r from-amber-400/28 to-transparent" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
                    This is not leadership development
                  </span>
                </div>
              </div>

              <div className="self-end lg:justify-self-end">
                <div className="border border-white/[0.08] bg-white/[0.02] p-6 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div className="grid grid-cols-2 gap-px border border-white/8 bg-white/8">
                    {[
                      { icon: Compass, label: "Self" },
                      { icon: Hammer, label: "Purpose" },
                      { icon: BookOpen, label: "Vision" },
                      { icon: Target, label: "Mission" },
                    ].map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.label}
                          className="bg-black/70 p-6 text-center"
                        >
                          <Icon className="mx-auto h-5 w-5 text-amber-400/72" />
                          <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.22em] text-white/48">
                            {item.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 border border-white/10 bg-black/45 p-5">
                    <p className="font-serif text-lg text-white">
                      Decision architecture
                    </p>
                    <p className="mt-2 text-sm text-white/60">
                      Contradiction detection. Consequence pricing. Execution enforcement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* MANDATE */}
        <section className="relative py-14">
          <div className="mx-auto max-w-6xl px-6 lg:px-8">
            <MandateStatement />
          </div>
        </section>

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        {/* PROGRESSION */}
        <section id="progression" className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-16">
              <RailLabel>Decision Authority Progression</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                The authority sequence
              </h2>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/48">
                Decision authority develops in sequence. Start with the
                contradiction, then the consequence, then the execution
                architecture, then the verification.
              </p>
            </div>

            <div className="grid gap-6">
              {leadershipProgression.map((stage) => {
                const Icon = stage.icon;

                return (
                  <div
                    key={stage.title}
                    className="group rounded-none border border-white/[0.08] bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/[0.14] hover:bg-white/[0.03]"
                  >
                    <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex items-start gap-6">
                        <div className="shrink-0 border border-amber-400/16 bg-amber-400/[0.08] p-4">
                          <Icon className="h-6 w-6 text-amber-400/72" />
                        </div>

                        <div>
                          <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.28em] text-white/30">
                            {stage.stage}
                          </span>

                          <h3 className="font-serif text-2xl text-white transition-colors group-hover:text-amber-50">
                            {stage.title}
                          </h3>

                          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/48">
                            {stage.description}
                          </p>
                        </div>
                      </div>

                      <div className="min-w-[220px] text-left lg:text-right">
                        <div
                          className={`inline-flex items-center gap-2 border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] ${statusTone(
                            stage.status
                          )}`}
                        >
                          <span>{statusLabel(stage.status)}</span>
                        </div>

                        <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-white/34">
                          Outcome: {stage.outcome}
                        </p>

                        <Link
                          href={stage.href}
                          className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/72 transition-colors hover:text-amber-200"
                        >
                          <span>{stage.status === "public" ? "Access" : "Preview"}</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* TOOLS */}
        <section className="relative border-t border-white/6 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.03] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-16">
              <RailLabel>Institutional Tooling</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Tools for execution
              </h2>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {leadershipTools.map((tool) => {
                const Icon = tool.icon;

                return (
                  <div
                    key={tool.title}
                    className="group flex h-full flex-col border border-white/[0.08] bg-white/[0.02] p-8 transition-all duration-500 hover:border-white/[0.14] hover:bg-white/[0.03]"
                  >
                    <div className="mb-6 flex items-center justify-between">
                      <Icon className="h-7 w-7 text-amber-400/62" />
                      <span
                        className={`border px-3 py-2 font-mono text-[9px] uppercase tracking-[0.22em] ${statusTone(
                          tool.status
                        )}`}
                      >
                        {statusLabel(tool.status)}
                      </span>
                    </div>

                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/28">
                      {tool.category}
                    </p>

                    <h3 className="mt-3 font-serif text-2xl text-white">
                      {tool.title}
                    </h3>

                    <p className="mt-4 flex-grow text-sm leading-relaxed text-white/46">
                      {tool.description}
                    </p>

                    <div className="mt-6 border-t border-white/8 pt-5">
                      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/28">
                        Use case: {tool.useCase}
                      </p>

                      <Link
                        href={tool.href}
                        className="mt-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/72 transition-colors hover:text-amber-200"
                      >
                        <span>{tool.status === "public" ? "Download" : "Access"}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* NON-NEGOTIABLES */}
        <section className="relative border-t border-white/6 py-24">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <RailLabel>Leadership Standard</RailLabel>

            <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
              What formation must produce
            </h2>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Shield, text: "Integrity under pressure" },
                { icon: Eye, text: "Judgment with consequence in view" },
                { icon: Landmark, text: "Institutional rather than personal thinking" },
                { icon: Heart, text: "Stewardship beyond self-interest" },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.text}
                    className="border border-white/[0.08] bg-white/[0.02] p-6 text-left"
                  >
                    <Icon className="mb-4 h-5 w-5 text-amber-400/70" />
                    <p className="font-serif text-lg text-white">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative border-t border-white/6 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.05),transparent_70%)]" />
          <div className="relative mx-auto max-w-4xl px-6 text-center">
            <h3 className="font-serif text-4xl text-white md:text-5xl">
              Begin leadership formation
            </h3>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-white/52">
              Start with the foundation essay, then move into structure, doctrine,
              and tools.
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link
                href="/blog/ultimate-purpose-of-man"
                className="group inline-flex items-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-all duration-500 hover:bg-amber-50"
              >
                <span>Read Foundation Essay</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/inner-circle?source=leadership"
                className="group inline-flex items-center gap-3 border border-white/12 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-all duration-500 hover:border-white/22 hover:bg-white/[0.04]"
              >
                <span>Join Inner Circle</span>
                <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default LeadershipPage;