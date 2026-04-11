"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  FileText,
  ShieldCheck,
  Building2,
  Crown,
  CheckCircle2,
  Scale,
  Eye,
  Landmark,
  Calendar,
  Clock,
  Download,
  TrendingUp,
  Lock,
} from "lucide-react";

function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
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
      className={cn(
        "border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm",
        "shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
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

type BuyerFitItem = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
};

const BUYER_FIT: BuyerFitItem[] = [
  {
    icon: Building2,
    title: "Founders and leadership teams",
    body: "For situations where execution continues, but trust, clarity, and decision quality are beginning to erode.",
  },
  {
    icon: ShieldCheck,
    title: "Boards and senior operators",
    body: "For environments that need disciplined interpretation before escalation, correction, or mandate work.",
  },
  {
    icon: Landmark,
    title: "Institutions under exposure",
    body: "For cases where the cost of misreading the situation is already operational, reputational, or political.",
  },
];

const CORE_PROOFS = [
  "Narrative, matrix, exposure, and correction priority in one disciplined artifact",
  "Built to convert raw signal into readable executive judgment",
  "Useful before advisory, during instability, and under live pressure",
  "Strong enough to make Strategy Room feel earned rather than prematurely sold",
];

type QuarterlyReport = {
  id: string;
  title: string;
  slug: string;
  description: string;
  publishedAt: string;
  quarter: string;
  year: number;
  readingTime: number;
  pdfUrl?: string | null;
  keyFindings?: string[];
};

interface ExecutiveReportingFlagshipProps {
  latestReport?: QuarterlyReport | null;
  compact?: boolean;
}

export default function ExecutiveReportingFlagship({
  latestReport,
  compact = false,
}: ExecutiveReportingFlagshipProps) {
  const reduceMotion = useReducedMotion();

  const getQuarterDisplay = () => {
    if (!latestReport) return null;
    return `${String(latestReport.quarter).toUpperCase()} ${latestReport.year}`;
  };

  if (compact) {
    return (
      <section className="relative border-t border-white/5 bg-[#070707] py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_12%,rgba(245,158,11,0.05),transparent_42%),radial-gradient(ellipse_at_82%_36%,rgba(255,255,255,0.03),transparent_55%)]" />
        <div className="absolute inset-0 aol-grain opacity-[0.04]" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
            >
              <RailLabel>Flagship interpretation layer</RailLabel>

              <div className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2">
                <Crown className="h-4 w-4 text-amber-400/70" />
                <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                  Executive Reporting
                </span>
              </div>

              <h2 className="mt-8 max-w-[14ch] font-serif text-4xl font-light leading-[0.98] tracking-[-0.03em] text-white md:text-5xl">
                A disciplined middle
                <span className="mt-2 block text-white/56">
                  between signal and mandate
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/56">
                Executive Reporting sits between raw diagnostics and private intervention.
                It is built for buyers who need a sharper reading before they commit to
                heavier action.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  "Decision-grade executive output",
                  "Readable by boards and operators",
                  "Stronger than a dashboard",
                  "More disciplined than ambient commentary",
                ].map((line) => (
                  <div
                    key={line}
                    className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                    <span className="text-sm leading-relaxed text-white/56">
                      {line}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  href="/diagnostics/executive-reporting"
                  className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                >
                  <span>Open executive reporting</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>

                <Link
                  href="/diagnostics"
                  className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                >
                  <span>Begin with diagnostics</span>
                  <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, delay: 0.08 }}
            >
              <Surface className="h-full p-8 md:p-10">
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                    Current relevance
                  </span>
                  <Scale className="h-4 w-4 text-amber-500/50" />
                </div>

                {latestReport ? (
                  <>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-amber-400/70" />
                      <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/52">
                        Latest intelligence release
                      </span>
                    </div>

                    <h3 className="mt-5 font-serif text-2xl text-white">
                      {latestReport.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-white/50">
                      {latestReport.description}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-4 text-[10px] font-mono text-white/35">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        <span>{getQuarterDisplay()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        <span>{latestReport.readingTime} min read</span>
                      </div>
                    </div>

                    <div className="mt-6 space-y-3">
                      {(latestReport.keyFindings || [])
                        .slice(0, 3)
                        .map((finding, idx) => (
                          <div
                            key={`${finding}-${idx}`}
                            className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
                          >
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/60" />
                            <span className="text-sm leading-relaxed text-white/56">
                              {finding}
                            </span>
                          </div>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/artifacts/${latestReport.slug}`}
                        className="inline-flex items-center justify-center gap-2 border border-amber-500/30 bg-amber-500/[0.08] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-500/[0.14]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Open report
                      </Link>

                      {latestReport.pdfUrl ? (
                        <a
                          href={latestReport.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 border border-white/12 bg-white/[0.05] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/[0.08]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          PDF
                        </a>
                      ) : null}
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-serif text-2xl text-white">
                      A cleaner product layer for serious buyers
                    </h3>
                    <p className="mt-4 text-sm leading-relaxed text-white/56">
                      Executive Reporting strengthens the buyer journey by creating
                      a serious interpretive layer before private escalation.
                    </p>

                    <div className="mt-8 rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-5">
                      <div className="flex items-start gap-3">
                        <Lock className="mt-0.5 h-4 w-4 text-amber-400/68" />
                        <div>
                          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
                            Commercial role
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-white/56">
                            Premium enough to matter. Restrained enough to build trust.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Surface>
            </motion.div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative border-t border-white/5 bg-[#070707] py-24">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_12%,rgba(245,158,11,0.06),transparent_42%),radial-gradient(ellipse_at_82%_36%,rgba(255,255,255,0.04),transparent_55%)]" />
      <div className="absolute inset-0 aol-grain opacity-[0.04]" />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65 }}
            className="max-w-4xl"
          >
            <RailLabel>Flagship bridge product</RailLabel>

            <div className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2">
              <Crown className="h-4 w-4 text-amber-400/70" />
              <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                Executive Reporting
              </span>
            </div>

            <h2 className="mt-8 max-w-[13ch] font-serif text-4xl font-light leading-[0.96] tracking-[-0.03em] text-white md:text-5xl lg:text-[4.1rem]">
              The disciplined bridge between
              <span className="mt-2 block text-white/58">
                signal and intervention
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/56 md:text-lg">
              Executive Reporting is the premium bridge between raw diagnostic
              signal and full advisory mandate. It exists for founders, boards,
              leadership teams, and institutions that need disciplined
              interpretation before escalation.
            </p>

            {latestReport && (
              <div className="mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-6">
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-400/70" />
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-amber-400/50">
                    Latest quarterly release
                  </span>
                </div>

                <h3 className="font-serif text-xl text-white">
                  {latestReport.title}
                </h3>

                <p className="mt-2 text-sm leading-relaxed text-white/50">
                  {latestReport.description}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-[10px] font-mono text-white/35">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    <span>{getQuarterDisplay()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{latestReport.readingTime} min read</span>
                  </div>
                </div>

                {(latestReport.keyFindings || []).length > 0 ? (
                  <div className="mt-4 space-y-2">
                    <p className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/30">
                      Key findings
                    </p>
                    <ul className="space-y-2">
                      {latestReport.keyFindings!.slice(0, 2).map((finding, idx) => (
                        <li
                          key={`${finding}-${idx}`}
                          className="flex items-start gap-2 text-[11px] leading-relaxed text-white/45"
                        >
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/50" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/artifacts/${latestReport.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-4 py-2 text-[9px] font-mono uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-500/18"
                  >
                    <Eye className="h-3 w-3" />
                    Open report
                  </Link>

                  {latestReport.pdfUrl ? (
                    <a
                      href={latestReport.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-2 text-[9px] font-mono uppercase tracking-[0.2em] text-white/70 transition hover:bg-white/[0.08]"
                    >
                      <Download className="h-3 w-3" />
                      Download PDF
                    </a>
                  ) : null}
                </div>
              </div>
            )}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {CORE_PROOFS.map((line) => (
                <div
                  key={line}
                  className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-black/20 px-4 py-4"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400/70" />
                  <span className="text-sm leading-relaxed text-white/54">
                    {line}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 border border-white/[0.08] bg-white/[0.015] p-6">
              <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                Position in the system
              </div>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/56">
                Diagnostics identifies the signal. Executive Reporting interprets
                it properly. Strategy Room intervenes when the report reveals
                material consequence, genuine mandate fit, and the need for
                governed action.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 border-y border-white/6 py-6">
              <MetricTile label="Role" value="Interpret" />
              <MetricTile label="Output" value="Executive PDF" />
              <MetricTile label="Bias" value="Decision Fit" />
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/diagnostics/executive-reporting"
                className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
              >
                <span>View flagship product</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>

              <Link
                href="/diagnostics"
                className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
              >
                <span>Begin with diagnostics</span>
                <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, delay: 0.08 }}
          >
            <Surface className="h-full p-8 md:p-10">
              <div className="flex items-center justify-between gap-4">
                <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                  Buyer fit
                </div>
                <FileText className="h-4 w-4 text-amber-500/50" />
              </div>

              <h3 className="mt-7 font-serif text-3xl text-white md:text-4xl">
                Serious enough to matter.
                <span className="mt-2 block text-white/55">
                  Structured enough to stand alone.
                </span>
              </h3>

              <div className="mt-8 space-y-6">
                {BUYER_FIT.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="border-b border-white/6 pb-6 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start gap-4">
                        <Icon className="mt-0.5 h-5 w-5 text-amber-400/65" />
                        <div>
                          <div className="text-base font-semibold text-white/88">
                            {item.title}
                          </div>
                          <div className="mt-2 text-sm leading-relaxed text-white/48">
                            {item.body}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-5">
                <div className="flex items-start gap-3">
                  <Eye className="mt-0.5 h-4 w-4 text-amber-400/68" />
                  <div>
                    <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
                      Commercial logic
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-white/56">
                      The buyer should feel restraint before pressure. That
                      restraint is part of what makes the advisory path more credible.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/6 pt-6">
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                  Positioning
                </div>
                <p className="mt-3 text-sm leading-relaxed text-white/58">
                  A defensible premium niche between shallow diagnostics and full
                  advisory retainers.
                </p>
              </div>
            </Surface>
          </motion.div>
        </div>
      </div>
    </section>
  );
}