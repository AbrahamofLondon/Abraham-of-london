/* ============================================================================
   FILE: pages/diagnostics/executive-reporting.tsx
   PRODUCT PAGE — EXECUTIVE REPORTING SYSTEM
   Architecture: Diagnostics → Executive Reporting → Strategy Room
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Crown,
  Lock,
  Eye,
  Target,
} from "lucide-react";

import Layout from "@/components/Layout";
import ExecutiveReportingFlagship from "@/components/homepage/ExecutiveReportingFlagship";
import ExecutiveReportSamplePreview from "@/components/diagnostics/ExecutiveReportSamplePreview";
import ExecutiveOfferLadder from "@/components/diagnostics/ExecutiveOfferLadder";
import ExecutiveBuyerVariants from "@/components/diagnostics/ExecutiveBuyerVariants";
import ExecutiveDemoScenarios from "@/components/diagnostics/ExecutiveDemoScenarios";
import ExecutivePricingGrid from "@/components/diagnostics/ExecutivePricingGrid";
import SalesObjectionGrid from "@/components/diagnostics/SalesObjectionGrid";
import PricingLanguageStrip from "@/components/diagnostics/PricingLanguageStrip";
import BuyerCTACluster from "@/components/diagnostics/BuyerCTACluster";
import ExecutiveReportSampleDownload from "@/components/diagnostics/ExecutiveReportSampleDownload";
import AnonymisedCaseProof from "@/components/diagnostics/AnonymisedCaseProof";
import TrustFAQ from "@/components/diagnostics/TrustFAQ";
import SeriousBuyerGate from "@/components/diagnostics/SeriousBuyerGate";
import { EXECUTIVE_PROOF_BLOCKS } from "@/lib/diagnostics/executive-reporting-market-proof";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

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

type Props = {
  latestReport: QuarterlyReport | null;
};

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[10%] top-[8%] h-[24rem] w-[24rem] rounded-full bg-amber-500/[0.045] blur-[130px]" />
      <div className="absolute right-[12%] top-[18%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_50%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
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

const ExecutiveReportingPage: NextPage<Props> = ({ latestReport }) => {
  const reduceMotion = useReducedMotion();
  const [unlocked, setUnlocked] = React.useState(false);

  return (
    <Layout
      title="Executive Reporting"
      description="A premium executive reporting system for boards, founders, and institutions that require disciplined interpretation before action."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics/executive-reporting`} />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <RailLabel>Executive Reporting System</RailLabel>
                </motion.div>

                <motion.div
                  className="mt-6 inline-flex items-center gap-3 border border-amber-500/18 bg-amber-500/[0.05] px-4 py-2"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.06 }}
                >
                  <ShieldCheck className="h-4 w-4 text-amber-400/70" />
                  <span className="font-mono text-[9px] uppercase tracking-[0.28em] text-amber-300/78">
                    Premium interpretation product
                  </span>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[12ch] font-serif text-5xl font-light leading-[0.94] tracking-[-0.03em] text-white md:text-7xl lg:text-[5.1rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.1 }}
                >
                  Reports for people
                  <span className="mt-2 block text-white/56">
                    carrying consequence
                  </span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  The premium bridge between raw diagnostic signal and full
                  advisory mandate. For operators who need a disciplined reading
                  before intervention.
                </motion.p>

                <motion.div
                  className="mt-10 flex flex-col gap-4 sm:flex-row"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.28 }}
                >
                  <Link
                    href="#sample-report"
                    className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                  >
                    <span>View sample output</span>
                    <FileText className="h-4 w-4 transition-transform group-hover:scale-105" />
                  </Link>

                  <Link
                    href="/diagnostics"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Begin with diagnostics</span>
                    <ArrowRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div
                  className="mt-10 border border-white/[0.08] bg-white/[0.015] p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.35 }}
                >
                  <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                    Position in the system
                  </div>
                  <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/56">
                    Diagnostics identifies the signal. Executive Reporting interprets
                    it. Strategy Room intervenes when the report reveals material
                    consequence and mandate-level need.
                  </p>
                </motion.div>

                <motion.div
                  className="mt-10 grid gap-4 sm:grid-cols-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.4 }}
                >
                  {[
                    { label: "Output", value: "Executive PDF" },
                    { label: "Bias", value: "Correction" },
                    { label: "Use", value: "Decision Fit" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="border border-white/[0.08] bg-white/[0.015] p-4"
                    >
                      <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
                        {item.label}
                      </div>
                      <div className="mt-2 font-serif text-lg text-white/88">
                        {item.value}
                      </div>
                    </div>
                  ))}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.16 }}
              >
                <Surface className="h-full p-8 md:p-10">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                      Product role
                    </span>
                    <Crown className="h-4 w-4 text-amber-500/50" />
                  </div>

                  <h2 className="font-serif text-3xl text-white md:text-4xl">
                    Not consultancy theatre.
                    <span className="mt-2 block text-white/55">
                      A premium middle with teeth.
                    </span>
                  </h2>

                  <div className="mt-8 space-y-4">
                    {[
                      "Built for decisions that need disciplined interpretation",
                      "Stronger than a dashboard, narrower than a retainer",
                      "Readable by founders, boards, leadership teams, and operators",
                      "Designed to make mandate escalation feel earned, not pushed",
                    ].map((line) => (
                      <div key={line} className="flex items-start gap-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 text-amber-400/70" />
                        <span className="text-sm leading-relaxed text-white/58">
                          {line}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 border-t border-white/6 pt-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                          Buyer
                        </div>
                        <div className="mt-2 text-sm text-white/76">
                          Founder / Board / COO / Leadership Team
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                          Trigger
                        </div>
                        <div className="mt-2 text-sm text-white/76">
                          Friction, drift, distrust, exposure
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 rounded-2xl border border-amber-500/16 bg-amber-500/[0.04] p-4">
                      <div className="flex items-start gap-3">
                        <Eye className="mt-0.5 h-4 w-4 text-amber-400/70" />
                        <div>
                          <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber-300/72">
                            Structured interpretation
                          </div>
                          <p className="mt-2 text-sm leading-relaxed text-white/56">
                            A disciplined reading before escalation. Not advisory.
                            Not a dashboard. A bridge.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Surface>
              </motion.div>
            </div>
          </div>
        </section>

        <ExecutiveReportingFlagship latestReport={latestReport} />

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>How it works</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Three layers. One path.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Start where you are. Move when the signal justifies it.
              </p>
            </div>

            <ExecutiveOfferLadder />
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Who it serves</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                One engine. Different languages.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                The structure remains stable. The framing changes based on who carries
                the consequence.
              </p>
            </div>

            <ExecutiveBuyerVariants />
          </div>
        </section>

        <section id="sample-report" className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <RailLabel>Sample output</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  What you actually receive
                </h2>
                <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                  Not a summary. A structured executive artifact: headline,
                  systemic reading, domain matrix, financial exposure, priority
                  stack, and decision mandate.
                </p>
              </div>

              <Link
                href="/diagnostics"
                className="group inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.24em] text-amber-400/66 transition-colors hover:text-amber-300"
              >
                <span>Begin with diagnostics</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {!unlocked ? (
              <div className="border border-white/10 bg-white/[0.02] p-10 text-center">
                <p className="mb-6 text-white/60">
                  Reserved for serious buyers. Quality without exposure.
                </p>
                <button
                  onClick={() => setUnlocked(true)}
                  className="inline-flex items-center justify-center gap-2 border border-amber-500/30 bg-amber-500/10 px-6 py-3 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400 transition-colors hover:bg-amber-500/20"
                >
                  <Lock className="h-3.5 w-3.5" />
                  Unlock sample preview
                </button>
              </div>
            ) : (
              <ExecutiveReportSamplePreview />
            )}
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>When to use it</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Where this product earns its keep
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Executive Reporting is a commercial instrument. Here is when it fits.
              </p>
            </div>

            <ExecutiveDemoScenarios />
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Investment</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Clarity before commitment
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Entry signal. Flagship report. Private mandate.
              </p>
            </div>

            <ExecutivePricingGrid />

            <div className="mt-12 grid gap-6 lg:grid-cols-3">
              {EXECUTIVE_PROOF_BLOCKS.map((item) => (
                <div
                  key={item.title}
                  className="border border-white/[0.08] bg-white/[0.02] p-6"
                >
                  <h3 className="font-serif text-2xl text-white">{item.title}</h3>
                  <p className="mt-4 text-sm leading-relaxed text-white/48">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <ExecutiveReportSampleDownload />
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Patterns we have surfaced</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Real friction. Anonymised.
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Not testimonials. Actual structural patterns the system has identified.
              </p>
            </div>

            <AnonymisedCaseProof />
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Questions</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                What serious buyers ask
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Direct answers. No deflection.
              </p>
            </div>

            <SalesObjectionGrid />
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Reliability</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Boardroom-level clarity
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                No generic answers. Just precision.
              </p>
            </div>

            <TrustFAQ />
          </div>
        </section>

        <section className="relative border-t border-white/5 py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <PricingLanguageStrip />
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(245,158,11,0.04),transparent_70%)]" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12 text-center">
              <h2 className="font-serif text-4xl text-white md:text-5xl">
                The report is not the final room.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-lg text-white/50">
                It is the disciplined bridge. When the signal is serious enough,
                the next right move is Strategy Room.
              </p>
            </div>

            <BuyerCTACluster />

            <div className="mt-12 rounded-3xl border border-amber-500/16 bg-amber-500/[0.04] p-8 text-center">
              <div className="mx-auto max-w-3xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/[0.06] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/78">
                  <Target className="h-3.5 w-3.5" />
                  Escalation
                </div>

                <h3 className="mt-6 font-serif text-3xl text-white md:text-4xl">
                  When the report exposes material risk, escalation is no longer a
                  branding move. It becomes the responsible next step.
                </h3>

                <p className="mt-5 text-base leading-relaxed text-white/58">
                  Not to replace advisory. To qualify it properly.
                </p>

                <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                  <Link
                    href="/consulting/strategy-room"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/80 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Enter Strategy Room</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/diagnostics"
                    className="group inline-flex items-center justify-center gap-3 bg-amber-500 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-400"
                  >
                    <span>Begin with diagnostics</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <SeriousBuyerGate />
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  let latestReport: QuarterlyReport | null = null;

  try {
    const fs = await import("fs");
    const path = await import("path");
    const artifactsDir = path.join(process.cwd(), "content/artifacts");

    if (fs.existsSync(artifactsDir)) {
      const files = fs.readdirSync(artifactsDir);
      const mdxFiles = files.filter(
        (f) => f.endsWith(".mdx") && !f.includes(".backup"),
      );

      const quarterlyReports: QuarterlyReport[] = [];

      for (const file of mdxFiles) {
        if (
          !file.includes("global-market-intelligence-report") &&
          !file.includes("global-market-intelligence-q")
        ) {
          continue;
        }

        const filePath = path.join(artifactsDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const frontmatter = parseFrontmatter(content);

        let quarter = String(frontmatter.quarter || "").trim();
        let year = Number(frontmatter.year || 0);

        if (!quarter) {
          if (file.toLowerCase().includes("q1")) quarter = "Q1";
          if (file.toLowerCase().includes("q2")) quarter = "Q2";
          if (file.toLowerCase().includes("q3")) quarter = "Q3";
          if (file.toLowerCase().includes("q4")) quarter = "Q4";
        }

        if (!year) {
          const yearMatch = file.match(/20\d{2}/);
          year = yearMatch ? Number(yearMatch[0]) : 2026;
        }

        quarterlyReports.push({
          id: file.replace(".mdx", ""),
          slug: file.replace(".mdx", ""),
          title: String(frontmatter.title || "Global Market Intelligence Report"),
          description: String(
            frontmatter.description ||
              "Executive analysis of market conditions, strategic risks, and institutional opportunities.",
          ),
          publishedAt: String(frontmatter.date || new Date().toISOString()),
          quarter: quarter || "Q1",
          year: year || 2026,
          readingTime: Number(frontmatter.readingTime || 25),
          pdfUrl:
            typeof frontmatter.pdfUrl === "string" ? frontmatter.pdfUrl : null,
          keyFindings: Array.isArray(frontmatter.keyFindings)
            ? frontmatter.keyFindings.map((x) => String(x))
            : [
                "Markets are increasingly pricing resilience, policy credibility, and strategic positioning.",
                "Capital allocation patterns are becoming more selective under pressure.",
                "Serious boards now need structured interpretation, not ambient commentary.",
              ],
        });
      }

      const quarterOrder: Record<string, number> = {
        Q1: 1,
        Q2: 2,
        Q3: 3,
        Q4: 4,
      };

      quarterlyReports.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (quarterOrder[b.quarter] || 0) - (quarterOrder[a.quarter] || 0);
      });

      latestReport = quarterlyReports[0] || null;
    }
  } catch (err) {
    console.error("Failed to load quarterly report:", err);
    latestReport = null;
  }

  return {
    props: {
      latestReport,
    },
    revalidate: 3600,
  };
};

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const lines = match[1].split("\n");
  const result: Record<string, any> = {};
  let currentArrayKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r/g, "");

    if (!line.trim()) continue;

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      if (!Array.isArray(result[currentArrayKey])) {
        result[currentArrayKey] = [];
      }
      result[currentArrayKey].push(
        arrayItemMatch[1].trim().replace(/^['"]|['"]$/g, ""),
      );
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) {
      currentArrayKey = null;
      continue;
    }

    const [, key, rawValue] = keyMatch;
    const value = rawValue.trim();

    if (!value) {
      currentArrayKey = key;
      if (!(key in result)) result[key] = [];
      continue;
    }

    currentArrayKey = null;

    if (value.startsWith("[") && value.endsWith("]")) {
      result[key] = value
        .slice(1, -1)
        .split(",")
        .map((v) => v.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      continue;
    }

    if (/^\d+$/.test(value)) {
      result[key] = Number(value);
      continue;
    }

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      result[key] = value.slice(1, -1);
      continue;
    }

    result[key] = value;
  }

  return result;
}

export default ExecutiveReportingPage;