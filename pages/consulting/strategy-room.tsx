/* ============================================================================
   FILE: pages/consulting/strategy-room.tsx
   STRATEGY ROOM — Institutional Private Chamber
   Brand: Harrods refinement × BlackRock institutional discipline
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Lock,
  Users,
  Shield,
  Target,
  FileText,
  Eye,
  Key,
  Crown,
  Feather,
  Gavel,
  Activity,
  CheckCircle2,
  ScrollText,
  Briefcase,
  ScanSearch,
  Scale,
  AlertTriangle,
  ChevronRight,
  Building2,
  Workflow,
  BadgeCheck,
  Compass,
  Sparkles,
} from "lucide-react";

import Layout from "@/components/Layout";
import { checkAccess } from "@/lib/inner-circle/access.client";
import StrategyRoomEntryRouter from "@/components/consulting/StrategyRoomEntryRouter";
import SeriousBuyerGate from "@/components/diagnostics/SeriousBuyerGate";
import TrustFAQ from "@/components/diagnostics/TrustFAQ";

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

// Dynamic imports with proper error handling
const ArtifactGrid = dynamic(
  () => import("@/components/strategy-room/ArtifactGrid").catch(() => {
    console.warn("ArtifactGrid failed to load");
    return () => (
      <div className="border border-white/[0.08] bg-white/[0.02] p-12 text-center">
        <div className="inline-flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/58">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400/50" />
          Artifacts available to qualified members
        </div>
      </div>
    );
  }),
  { ssr: false }
);

// Enhanced intake form with institutional tone
function InstitutionalIntakeForm() {
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    revenue: "",
    problem: "",
    urgency: "",
    authority: "",
  });

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [evaluation, setEvaluation] = React.useState<{
    confidence?: number;
    classification?: string;
    summary?: string;
    tier?: string;
  } | null>(null);

  function update(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (evaluation) setEvaluation(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setEvaluation(null);

    try {
      const res = await fetch("/api/deal-flow/qualify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!data.ok) throw new Error(data.message || "Submission failed");

      // Store evaluation for display (rebranded from "AI" to "institutional assessment")
      if (data.ai) {
        setEvaluation({
          confidence: data.ai.confidence,
          classification: data.ai.intent,
          summary: data.ai.summary,
          tier: data.ai.dealQuality,
        });
      }

      // Redirect based on route after showing evaluation
      if (data.route === "STRATEGY") {
        setTimeout(() => {
          window.location.href = `/strategy-room/confirmed?id=${data.submissionId}`;
        }, 2000);
      } else if (data.route === "DIAGNOSTIC") {
        setTimeout(() => {
          window.location.href = "/diagnostic";
        }, 2000);
      } else {
        setTimeout(() => {
          window.location.href = "/vault";
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Submission failed");
      setLoading(false);
    }
  }

  // Institutional classification display (refined, not "AI")
  const renderClassification = (classification?: string) => {
    if (!classification) return null;
    
    const config: Record<string, { label: string; description: string }> = {
      STRATEGY: { label: "Chamber Priority", description: "Immediate engagement indicated" },
      DIAGNOSTIC: { label: "Structured Review", description: "Diagnostic pathway recommended" },
      NURTURE: { label: "Observational Track", description: "Extended evaluation period" },
      REJECT: { label: "Not Aligned", description: "Current mandate mismatch" },
    };
    
    const match = Object.keys(config).find(k => classification.toUpperCase().includes(k));
    const { label, description } = config[match || "NURTURE"];
    
    return (
      <div className="border-l-2 border-amber-500/40 pl-4">
        <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-400/60">
          {label}
        </div>
        <div className="text-[11px] text-white/40 mt-1">{description}</div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <form onSubmit={submit} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <input
            name="name"
            placeholder="Full Name"
            onChange={update}
            value={form.name}
            required
            className="w-full p-4 bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors"
          />
          
          <input
            name="email"
            type="email"
            placeholder="Email Address"
            onChange={update}
            value={form.email}
            required
            className="w-full p-4 bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors"
          />
        </div>

        <input
          name="revenue"
          type="number"
          placeholder="Annual Revenue (£)"
          onChange={update}
          value={form.revenue}
          required
          className="w-full p-4 bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors"
        />

        <textarea
          name="problem"
          placeholder="Describe the situation requiring strategic counsel"
          onChange={update}
          value={form.problem}
          required
          rows={4}
          className="w-full p-4 bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors"
        />

        <div className="grid gap-6 md:grid-cols-2">
          <input
            name="urgency"
            placeholder="Required timeline"
            onChange={update}
            value={form.urgency}
            required
            className="w-full p-4 bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors"
          />

          <input
            name="authority"
            placeholder="Decision authority (Yes/No)"
            onChange={update}
            value={form.authority}
            required
            className="w-full p-4 bg-white/5 border border-white/10 focus:border-amber-500/50 focus:outline-none transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-400">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-5 bg-white text-black hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-semibold transition-colors"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin h-4 w-4 border-2 border-black border-t-transparent rounded-full" />
              Processing assessment
            </span>
          ) : (
            "Submit for institutional review"
          )}
        </button>
      </form>

      {/* Institutional Assessment Display */}
      {evaluation && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-6 border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.03] to-transparent"
        >
          <div className="flex items-center gap-2 mb-4">
            <Compass className="h-4 w-4 text-amber-500/60" />
            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-amber-500/60">
              Institutional Assessment
            </span>
          </div>
          
          <p className="text-sm text-white/70 leading-relaxed mb-4">
            {evaluation.summary}
          </p>
          
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
            {renderClassification(evaluation.classification)}
            
            {evaluation.tier && (
              <div className="text-right">
                <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-white/30">
                  Engagement Tier
                </div>
                <div className={`text-sm font-serif ${
                  evaluation.tier === "ELITE" ? "text-amber-400" :
                  evaluation.tier === "HIGH" ? "text-white/80" :
                  "text-white/50"
                }`}>
                  {evaluation.tier === "ELITE" ? "Priority" :
                   evaluation.tier === "HIGH" ? "Qualified" :
                   "Standard"}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 text-[9px] font-mono text-white/20 text-center">
            Redirecting to appropriate chamber in 2 seconds
          </div>
        </motion.div>
      )}
    </div>
  );
}

type Props = {};

type PressureSignal = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

type Deliverable = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

type AdmissionRule = {
  title: string;
  desc: string;
};

const PRESSURE_SIGNALS: PressureSignal[] = [
  {
    icon: Gavel,
    title: "Irreversible decisions",
    desc: "The wrong move will be expensive in credibility, cash, authority, or timing.",
  },
  {
    icon: Users,
    title: "Human consequence",
    desc: "Your decision affects staff, stakeholders, family systems, or institutional trust.",
  },
  {
    icon: AlertTriangle,
    title: "Complexity under pressure",
    desc: "There are too many moving parts for instinct-only thinking to remain safe.",
  },
];

const DELIVERABLES: Deliverable[] = [
  {
    icon: FileText,
    title: "Decision memo",
    desc: "The issue reframed properly, with options, trade-offs, and a recommended line.",
  },
  {
    icon: Scale,
    title: "Trade-off map",
    desc: "What each path costs, what it protects, and what it exposes.",
  },
  {
    icon: Workflow,
    title: "Execution cadence",
    desc: "Next moves, control rhythm, owner map, and stabilising sequence.",
  },
  {
    icon: Shield,
    title: "Risk posture",
    desc: "What must be contained first so the problem does not compound.",
  },
];

const ADMISSION_RULES: AdmissionRule[] = [
  {
    title: "This room is not for vague curiosity.",
    desc: "It exists for live decisions with consequence, not for collecting interesting conversations.",
  },
  {
    title: "Not every issue belongs here.",
    desc: "Some cases should begin with diagnostics. Strategy Room is for gravity, not just importance.",
  },
  {
    title: "The value is in disciplined judgment.",
    desc: "You are not paying for noise, performance, or brainstorming theatre. You are paying for a stronger decision posture.",
  },
];

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[12%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.05] blur-[140px]" />
      <div className="absolute right-[10%] top-[28%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.012)_48%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-400/10 to-transparent" />
    </div>
  );
}

function RailLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-6 w-px bg-amber-400/28" />
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-300/62">
        {children}
      </span>
    </div>
  );
}

function SectionDivider() {
  return (
    <div className="my-20 flex items-center gap-3">
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
      <Lock className="h-3.5 w-3.5 text-amber-400/36" />
      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-amber-400/18 to-transparent" />
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

function PressureCard({ icon: Icon, title, desc }: PressureSignal) {
  return (
    <article className="border border-white/[0.06] bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]">
      <Icon className="h-5 w-5 text-amber-300/65" />
      <h3 className="mt-5 font-serif text-xl text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/46">{desc}</p>
    </article>
  );
}

function DeliverableCard({ icon: Icon, title, desc }: Deliverable) {
  return (
    <article className="border border-white/[0.06] bg-white/[0.02] p-6 transition-colors duration-300 hover:border-white/[0.12] hover:bg-white/[0.03]">
      <Icon className="h-5 w-5 text-amber-300/65" />
      <h3 className="mt-5 font-serif text-xl text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/46">{desc}</p>
    </article>
  );
}

function AdmissionCard({ title, desc }: AdmissionRule) {
  return (
    <div className="border-b border-white/6 pb-6 last:border-b-0 last:pb-0">
      <h3 className="font-serif text-xl text-white">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-white/46">{desc}</p>
    </div>
  );
}

const StrategyRoomPage: NextPage<Props> = () => {
  const reduceMotion = useReducedMotion();

  const [mounted, setMounted] = React.useState(false);
  const [icAccess, setIcAccess] = React.useState(false);
  const [checking, setChecking] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);

    let alive = true;
    (async () => {
      try {
        const access = await checkAccess();
        if (alive) setIcAccess(Boolean(access?.hasAccess));
      } catch {
        if (alive) setIcAccess(false);
      } finally {
        if (alive) setChecking(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  if (!mounted) {
    return (
      <>
        <Head>
          <title>Strategy Room | Abraham of London</title>
          <meta name="description" content="Private strategy chamber for decision-heavy situations." />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <div className="flex min-h-screen items-center justify-center bg-black text-white">
          <div className="border border-white/[0.08] bg-white/[0.02] p-8">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-400/58">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400/50" />
              Initializing Strategy Room
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <Layout
      title="Strategy Room"
      description="A private chamber for high-consequence decisions requiring structured judgment, documented trade-offs, and execution-grade outputs."
      className="bg-black text-white"
    >
      <Head>
        <title>Strategy Room | Abraham of London</title>
        <meta
          name="description"
          content="A private strategy chamber for founders, boards, and institutional builders carrying decision pressure."
        />
        <link rel="canonical" href={`${SITE}/consulting/strategy-room`} />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="relative min-h-screen bg-black text-white">
        <AmbientField />

        {/* SERIOUS BUYER GATE - TOP */}
        <section className="relative pt-32 pb-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <SeriousBuyerGate />
          </div>
        </section>

        {/* HERO - Harrods meets BlackRock branding */}
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 lg:px-12 lg:pb-32 lg:pt-24">
            <div className="grid gap-16 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <RailLabel>Private strategy chamber</RailLabel>
                </motion.div>

                <motion.h1
                  className="mt-8 font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.7rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  For decisions
                  <span className="mt-3 block text-white/58">you cannot afford to get wrong</span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-xl font-light leading-relaxed text-white/56"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  Strategy Room sits above diagnostics and below nothing else.
                </motion.p>

                <motion.p
                  className="mt-6 max-w-2xl text-[1.02rem] leading-relaxed text-white/44"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.26 }}
                >
                  A private chamber for founders, boards, and institutional builders
                  facing irreversible calls, internal friction, strategic pressure,
                  or decisions with real downstream consequence.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.34 }}
                >
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="group inline-flex items-center justify-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                  >
                    <span>Request admission</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>

                  <Link
                    href="/diagnostics"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>Start with diagnostics</span>
                    <ChevronRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>

                <motion.div
                  className="mt-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.42 }}
                >
                  {checking ? (
                    <div className="inline-flex items-center gap-3 border border-white/[0.08] bg-white/[0.02] px-5 py-3">
                      <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400/50" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/36">
                        Verifying credentials
                      </span>
                    </div>
                  ) : icAccess ? (
                    <div className="inline-flex items-center gap-3 border border-amber-400/18 bg-amber-400/[0.06] px-5 py-3">
                      <Crown className="h-4 w-4 text-amber-300/70" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-200/80">
                        Inner Circle member — full artifact access
                      </span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-3 border border-white/[0.08] bg-white/[0.02] px-5 py-3">
                      <Lock className="h-4 w-4 text-amber-400/40" />
                      <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/36">
                        Artifact access restricted to Inner Circle
                      </span>
                    </div>
                  )}
                </motion.div>

                <motion.div
                  className="mt-12 h-px w-40 bg-gradient-to-r from-amber-400/28 to-transparent"
                  initial={{ scaleX: 0, opacity: 0 }}
                  animate={{ scaleX: 1, opacity: 1 }}
                  transition={{ duration: 1.05, delay: 0.5 }}
                  style={{ transformOrigin: "left" }}
                />
              </div>

              <motion.div
                className="self-end"
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.2 }}
              >
                <div className="border border-white/[0.06] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div className="relative">
                    <div className="mb-8 flex items-center justify-between">
                      <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">
                        Chamber profile
                      </span>
                      <Building2 className="h-4 w-4 text-amber-300/42" />
                    </div>

                    <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                      <MetricTile label="Mode" value="Private" />
                      <MetricTile label="Bias" value="Documented" />
                      <MetricTile label="Output" value="Actionable" />
                    </div>

                    <div className="mt-8 space-y-4">
                      {[
                        "Authority audit before advice",
                        "Constraint-aware options and trade-offs",
                        "No brainstorming theatre",
                        "Structured artifacts for execution",
                        "Institutional assessment framework",
                      ].map((line) => (
                        <div key={line} className="flex items-center gap-3">
                          <CheckCircle2 className="h-4 w-4 text-amber-300/70" />
                          <span className="text-sm text-white/56">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ENTRY ROUTING SECTION */}
        <section className="relative border-t border-white/5 py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12">
              <div className="inline-flex items-center gap-3">
                <span className="h-6 w-px bg-amber-500/30" />
                <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">
                  Entry routing
                </span>
              </div>

              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Institutional assessment before admission
              </h2>

              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                Strategy Room employs a structured assessment framework to ensure
                alignment before access. Every submission is evaluated against
                institutional criteria, with routing determined by mandate fit.
              </p>
            </div>

            <StrategyRoomEntryRouter />
          </div>
        </section>

        {/* PRESSURE SIGNALS */}
        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Decision pressure</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                When this chamber is appropriate
              </h2>
              <p className="mt-4 max-w-3xl text-lg text-white/48">
                Strategy Room is designed for situations where the decision cannot
                safely be handled by instinct, casual counsel, or loose internal alignment.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {PRESSURE_SIGNALS.map((item) => (
                <PressureCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        {/* INTAKE FORM - INSTITUTIONAL TONE */}
        {showForm && (
          <motion.section
            initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative py-16"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.035] to-transparent" />
            <div className="relative mx-auto max-w-4xl px-6">
              <div className="border border-white/[0.06] bg-white/[0.02] p-8 md:p-12">
                <div className="mb-8 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ScrollText className="h-4 w-4 text-amber-400/48" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/62">
                      Confidential assessment
                    </span>
                  </div>
                  <Compass className="h-4 w-4 text-amber-400/40" />
                </div>
                <InstitutionalIntakeForm />
              </div>
            </div>
          </motion.section>
        )}

        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <SectionDivider />
        </div>

        {/* DELIVERABLES */}
        <section className="relative py-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12">
              <RailLabel>Outputs</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                What leaves the chamber
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/48">
                Materials built to move a real decision, not to decorate one.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {DELIVERABLES.map((item) => (
                <DeliverableCard key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        {/* ARTIFACTS */}
        <section className="relative py-8">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-12">
              <RailLabel>Artifacts</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Decision-grade supporting material
              </h2>
              <p className="mt-4 max-w-2xl text-lg text-white/48">
                The chamber draws from the Canon, the frameworks library, and the
                controlled advisory stack behind the public-facing platform.
              </p>
            </div>

            <ArtifactGrid hasAccess={icAccess} />
          </div>
        </section>

        {/* ACCESS + ADMISSION */}
        <section className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-400/[0.03] to-transparent" />

          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <RailLabel>Access</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Privilege tiers
                </h2>
                <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/48">
                  The chamber is private. Artifact access is more private still.
                  That asymmetry is deliberate.
                </p>

                <div className="mt-10 border border-amber-400/16 bg-gradient-to-br from-amber-400/[0.04] to-transparent p-7">
                  <div className="mb-4 flex items-center gap-3">
                    <Key className="h-4 w-4 text-amber-300/58" />
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-amber-300/58">
                      Membership gate
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-white/48">
                    Full artifact access is reserved for Inner Circle members.
                    Access control is part of the value discipline, not an afterthought.
                  </p>

                  <Link
                    href="/inner-circle"
                    className="group mt-8 inline-flex w-full items-center justify-between border border-amber-400/24 bg-amber-400/[0.05] px-6 py-5 transition-colors hover:border-amber-400/55 hover:bg-amber-400/[0.08]"
                  >
                    <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-200/82">
                      Unlock Inner Circle access
                    </span>
                    <Lock className="h-4 w-4 text-amber-300/46 transition-transform group-hover:translate-x-1 group-hover:text-amber-200" />
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.65 }}
              >
                <RailLabel>Admission logic</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  What this chamber is not
                </h2>

                <div className="mt-10 space-y-8">
                  {ADMISSION_RULES.map((item) => (
                    <AdmissionCard key={item.title} {...item} />
                  ))}
                </div>

                <div className="mt-10 border border-white/[0.06] bg-white/[0.02] p-6">
                  <div className="flex items-start gap-4">
                    <BadgeCheck className="mt-0.5 h-5 w-5 text-amber-300/58" />
                    <div>
                      <p className="text-sm font-medium text-white/76">
                        Best use case
                      </p>
                      <p className="mt-1 text-sm text-white/42">
                        A live issue with timing pressure, competing priorities,
                        real downside, and the need for disciplined judgment.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* DIAGNOSTICS BRIDGE */}
        <section className="relative border-t border-white/5 py-20">
          <div className="mx-auto max-w-5xl px-6">
            <div className="border border-white/[0.06] bg-white/[0.02] p-8 md:p-10">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="max-w-3xl">
                  <RailLabel>Not ready for the chamber?</RailLabel>
                  <h2 className="mt-6 font-serif text-3xl text-white md:text-4xl">
                    Begin with diagnostics.
                  </h2>
                  <p className="mt-4 text-base leading-relaxed text-white/48">
                    When the issue requires a serious reading but not yet a private
                    mandate, diagnostics provide the clarity layer that sharpens
                    fit before escalation.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/diagnostics"
                    className="inline-flex items-center gap-2 rounded-full border border-amber-500/35 bg-amber-500/12 px-5 py-3 text-[10px] font-mono uppercase tracking-[0.30em] text-amber-300 hover:bg-amber-500/18"
                  >
                    Enter diagnostics <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TRUST FAQ */}
        <section className="relative border-t border-white/5 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Trust & reliability</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                Questions from those who carry consequence
              </h2>
              <p className="mt-4 max-w-3xl text-lg leading-relaxed text-white/48">
                No generic answers. This is boardroom-level clarity.
              </p>
            </div>

            <TrustFAQ />
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
              <div className="mb-8 inline-flex items-center gap-3">
                <div className="h-px w-8 bg-amber-400/28" />
                <Feather className="h-4 w-4 text-amber-300/40" />
                <div className="h-px w-8 bg-amber-400/28" />
              </div>

              <h2 className="font-serif text-4xl text-white md:text-5xl">
                Ready to move the decision properly?
              </h2>

              <p className="mx-auto mt-6 max-w-xl text-lg text-white/50">
                Enter the chamber if the issue carries real weight. Begin with
                diagnostics if it still requires a clearer reading first.
              </p>

              <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setShowForm(true)}
                  className="group inline-flex items-center justify-center gap-3 bg-white px-12 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                >
                  <span>Request admission</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>

                <Link
                  href="/diagnostics"
                  className="group inline-flex items-center justify-center gap-3 border border-white/10 px-12 py-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white transition-colors hover:border-white/20 hover:bg-white/5"
                >
                  <span>Begin with diagnostics</span>
                  <ChevronRight className="h-4 w-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                </Link>
              </div>

              <div className="mt-16 inline-flex items-center gap-2">
                <Feather className="h-3 w-3 text-amber-300/20" />
                <span className="font-mono text-[6px] uppercase tracking-[0.4em] text-white/10">
                  Strategy Room • Private Chamber • By Admission Only
                </span>
                <Feather className="h-3 w-3 text-amber-300/20" />
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

export default StrategyRoomPage;