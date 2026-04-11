import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Building2,
  Crown,
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
  ScanSearch,
  Briefcase,
  ShieldCheck,
} from "lucide-react";

import Layout from "@/components/Layout";
import { bandFromPct, buildSectionScore, severityFromPct, submitDiagnostic } from "@/lib/diagnostics/client";
import type {
  DiagnosticAnswer,
  DiagnosticAnswerValue,
  DiagnosticSubmitResponse,
} from "@/lib/diagnostics/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

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

type QuestionBlock = {
  id: string;
  title: string;
  prompts: string[];
};

const SIGNALS: BoardSignal[] = [
  {
    icon: AlertTriangle,
    title: "The institution looks stable, but confidence is thinning",
    desc: "This is the zone where surface order can mask leadership gap, variance, and structural fragility.",
  },
  {
    icon: Users,
    title: "Executives and teams may be reading different realities",
    desc: "Perception divergence is often one of the clearest warnings that governance or culture is weakening.",
  },
  {
    icon: Gavel,
    title: "Delay now carries strategic cost",
    desc: "When hesitation increases operational, reputational, or leadership risk, a serious reading becomes commercially rational.",
  },
];

const OUTPUTS: EnterpriseOutput[] = [
  {
    icon: BarChart3,
    title: "Organisation snapshot",
    desc: "A top-line structural reading across key enterprise alignment domains.",
  },
  {
    icon: Radar,
    title: "Team variance and fragility signal",
    desc: "A reading of divergence, internal inconsistency, and where operating coherence is thinning.",
  },
  {
    icon: Scale,
    title: "Leadership gap interpretation",
    desc: "A focused reading of executive versus non-executive perception across the institution.",
  },
  {
    icon: FileText,
    title: "Board-useful reporting posture",
    desc: "Structured outputs strong enough to support escalation, intervention, or private strategic follow-through.",
  },
];

const BLOCKS: QuestionBlock[] = [
  {
    id: "leadership",
    title: "Leadership Coherence",
    prompts: [
      "The senior leadership group is reading the condition of the institution with enough consistency.",
      "Critical leadership disagreements are being surfaced rather than buried.",
      "Strategic messaging remains coherent as it moves through the enterprise.",
    ],
  },
  {
    id: "governance",
    title: "Governance Reliability",
    prompts: [
      "Decision rights are clear enough to reduce drag and duplication.",
      "Escalation and accountability are operating at the correct level.",
      "Governance structures are supporting execution rather than slowing it.",
    ],
  },
  {
    id: "execution",
    title: "Execution Variance",
    prompts: [
      "Performance varies within acceptable bounds rather than by dangerous extremes.",
      "Teams are not operating with materially different interpretations of priority.",
      "Operational signals are trustworthy enough for leadership to act on them.",
    ],
  },
  {
    id: "risk",
    title: "Institutional Risk Posture",
    prompts: [
      "Current delay does not materially increase strategic cost.",
      "Trust in the institution is not quietly weakening.",
      "Corrective action can still be taken without disproportionate political resistance.",
    ],
  },
];

function scoreLabel(value: DiagnosticAnswerValue) {
  if (value === 1) return "Strongly No";
  if (value === 2) return "No";
  if (value === 3) return "Mixed";
  if (value === 4) return "Yes";
  return "Strongly Yes";
}

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
      <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-amber-400/62">{children}</span>
    </div>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-l border-white/6 pl-4 first:border-l-0 first:pl-0">
      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">{label}</div>
      <div className="mt-2 font-serif text-lg text-white/84">{value}</div>
    </div>
  );
}

function Card({ icon: Icon, title, desc }: { icon: React.ComponentType<any>; title: string; desc: string }) {
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
  const [answers, setAnswers] = React.useState<Record<string, DiagnosticAnswerValue>>({});
  const [organisation, setOrganisation] = React.useState("");
  const [respondentName, setRespondentName] = React.useState("");
  const [respondentEmail, setRespondentEmail] = React.useState("");
  const [respondentRole, setRespondentRole] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitResult, setSubmitResult] = React.useState<DiagnosticSubmitResponse | null>(null);

  const allPrompts = React.useMemo(
    () =>
      BLOCKS.flatMap((block) =>
        block.prompts.map((prompt, idx) => ({
          sectionId: block.id,
          sectionTitle: block.title,
          questionId: `${block.id}-${idx}`,
          prompt,
        })),
      ),
    [],
  );

  const answerList = React.useMemo<DiagnosticAnswer[]>(
    () =>
      allPrompts
        .filter((p) => answers[p.questionId])
        .map((p) => ({
          sectionId: p.sectionId,
          questionId: p.questionId,
          prompt: p.prompt,
          value: answers[p.questionId]!,
        })),
    [allPrompts, answers],
  );

  const totalQuestions = allPrompts.length;
  const totalScore = answerList.reduce((sum, a) => sum + a.value, 0);
  const maxScore = totalQuestions * 5;
  const pct = maxScore ? Math.round((totalScore / maxScore) * 100) : 0;
  const severity = severityFromPct(pct);
  const band = bandFromPct(pct);
  const canSubmit = answerList.length === totalQuestions && !isSubmitting;
  const strategyReady = pct >= 70;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    const res = await submitDiagnostic({
      kind: "enterprise",
      version: "2026.1",
      source: "diagnostics",
      entry: "enterprise",
      intent: "enterprise-diagnostic",
      title: "Enterprise Alignment Diagnostic",
      respondent: {
        name: respondentName || null,
        email: respondentEmail || null,
        organisation: organisation || null,
        role: respondentRole || null,
      },
      answers: answerList,
      notes: notes || null,
      summary: {
        totalScore,
        maxScore,
        pct,
        severity,
        band,
        sectionScores: BLOCKS.map((block) =>
          buildSectionScore({
            sectionId: block.id,
            title: block.title,
            answers: answerList.filter((a) => a.sectionId === block.id),
          }),
        ),
      },
      metadata: {
        ui: "enterprise-diagnostic",
        nextStepHref: strategyReady ? "/strategy-room" : "/diagnostics/executive-reporting",
        nextRoute: strategyReady ? "STRATEGY_ROOM" : "EXECUTIVE_REPORTING",
      },
    });

    setSubmitResult(res);
    setIsSubmitting(false);
  };

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
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-4xl">
                <motion.div initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
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
                  This is the final serious stop before the chamber. The purpose is not to flatter the buyer. It is to determine whether the institution is ready for private intervention.
                </motion.p>
              </div>

              <motion.div
                className="relative self-end"
                initial={{ opacity: 0, x: reduceMotion ? 0 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.9, delay: 0.18 }}
              >
                <div className="border border-white/[0.07] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
                  <div className="mb-8 flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/24">Commercial role</span>
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
                    ].map((line) => (
                      <div key={line} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-amber-400/70" />
                        <span className="text-sm text-white/58">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="relative py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="mb-14">
              <RailLabel>Typical triggers</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">Why institutions usually enter here</h2>
              <p className="mt-4 max-w-3xl text-lg text-white/48">Not because collapse has happened. Because consequence is becoming visible.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {SIGNALS.map((item, idx) => (
                <Card key={`trigger-signal-${idx}`} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <RailLabel>Enterprise instrument</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Build the reading before private mandate work
                </h2>

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {[
                    { label: "Organisation", value: organisation, set: setOrganisation, type: "text" },
                    { label: "Respondent Name", value: respondentName, set: setRespondentName, type: "text" },
                    { label: "Respondent Email", value: respondentEmail, set: setRespondentEmail, type: "email" },
                    { label: "Role", value: respondentRole, set: setRespondentRole, type: "text" },
                  ].map((field) => (
                    <div key={field.label} className="border border-white/[0.06] bg-white/[0.015] p-6">
                      <label className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">{field.label}</label>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.set(e.target.value)}
                        className="mt-3 w-full border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none focus:border-amber-500/30"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-10 space-y-8">
                  {BLOCKS.map((block) => (
                    <div key={block.id} className="border border-white/[0.06] bg-white/[0.015] p-8">
                      <h3 className="font-serif text-2xl text-white">{block.title}</h3>

                      <div className="mt-6 space-y-4">
                        {block.prompts.map((prompt, qIdx) => {
                          const qId = `${block.id}-${qIdx}`;
                          const selected = answers[qId];

                          return (
                            <div key={qId} className="border border-white/6 bg-black/20 p-5">
                              <div className="text-sm leading-relaxed text-white/78">{prompt}</div>

                              <div className="mt-4 grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((n) => {
                                  const value = n as DiagnosticAnswerValue;
                                  const active = selected === value;

                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => setAnswers((prev) => ({ ...prev, [qId]: value }))}
                                      className={[
                                        "border px-2 py-3 text-center transition-all",
                                        active
                                          ? "border-amber-500 bg-amber-500/10 text-white"
                                          : "border-white/10 bg-black/10 text-white/40 hover:border-white/20 hover:text-white/70",
                                      ].join(" ")}
                                    >
                                      <div className="font-mono text-[11px] font-bold">{n}</div>
                                      <div className="mt-1 text-[9px] uppercase tracking-wide">{scoreLabel(value)}</div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-10 border border-white/[0.06] bg-white/[0.015] p-8">
                  <label className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
                    Institutional Observations
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="mt-3 w-full border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none focus:border-amber-500/30"
                    placeholder="Where are leadership signal, governance reliability, trust, or institutional risk posture becoming unstable?"
                  />
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? "Submitting…" : "Submit enterprise diagnostic"}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    href={strategyReady ? "/strategy-room" : "/diagnostics/executive-reporting"}
                    className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    {strategyReady ? "Enter Strategy Room" : "View Executive Reporting"}
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="mt-10 text-xs opacity-40">
                  Diagnostic Ref: {submitResult?.ok ? submitResult.diagnosticRef : "Pending API generation"}
                </div>

                {submitResult?.ok ? (
                  <div className="mt-8 border border-emerald-500/20 bg-emerald-500/[0.04] p-6">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">Submitted</div>
                    <div className="mt-3 text-sm text-white/70">
                      Enterprise diagnostic captured and prepared for board-grade reporting and strategic escalation.
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={submitResult.dashboardHref || "/dashboard?tab=diagnostics"}
                        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300 hover:text-emerald-200"
                      >
                        Continue to dashboard
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>

                      <Link
                        href={strategyReady ? "/strategy-room" : "/diagnostics/executive-reporting"}
                        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300 hover:text-amber-200"
                      >
                        {strategyReady ? "Enter Strategy Room" : "Open Executive Reporting"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : null}

                {submitResult && !submitResult.ok ? (
                  <div className="mt-8 border border-red-500/20 bg-red-500/[0.04] p-6">
                    <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-red-300">Submission error</div>
                    <div className="mt-3 text-sm text-white/70">{submitResult.error}</div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-10">
                <div className="sticky top-24 space-y-10">
                  <div className="border border-amber-500/16 bg-gradient-to-br from-amber-500/[0.03] to-transparent p-8">
                    <ScanSearch className="mb-6 h-9 w-9 text-amber-400/55" />
                    <h3 className="font-serif text-2xl text-white">Current board signal</h3>

                    <div className="mt-6 grid grid-cols-3 gap-4 border-y border-white/6 py-6">
                      <MetricTile label="Score" value={`${totalScore}/${maxScore}`} />
                      <MetricTile label="Band" value={band} />
                      <MetricTile label="Severity" value={severity} />
                    </div>

                    <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 p-5">
                      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/56">
                        Chamber threshold
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-white/46">
                        A serious enterprise signal should make the buyer feel one thing clearly: delaying the Strategy Room may now be more expensive than entering it.
                      </p>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-5">
                      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/56">
                        Current next move
                      </div>
                      <div className="mt-3 text-lg text-white">
                        {strategyReady ? "Strategy Room now makes sense" : "Executive reporting still has commercial value"}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
                    {OUTPUTS.map((item, idx) => (
                      <Card key={`output-card-${idx}`} {...item} />
                    ))}
                  </div>

                  <div className="border border-white/[0.06] bg-white/[0.015] p-8">
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-5 w-5 text-amber-300/70" />
                      <div className="font-serif text-2xl text-white">Why this page must feel heavier</div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/55">
                      Because this is the step immediately before private mandate work. It should not feel lighter than Directional Integrity. It should feel more consequential.
                    </p>
                    <div className="mt-5">
                      <Link
                        href="/strategy-room"
                        className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 transition hover:bg-amber-500/18"
                      >
                        Inspect Strategy Room
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>

                  <div className="border border-white/[0.06] bg-white/[0.015] p-8">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-amber-300/70" />
                      <div className="font-serif text-2xl text-white">Executive Reporting</div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/55">
                      Where a full advisory mandate is premature, executive reporting becomes the disciplined commercial middle. That keeps the ladder clean.
                    </p>
                    <div className="mt-5">
                      <Link
                        href="/diagnostics/executive-reporting"
                        className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-2 text-sm text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                      >
                        Open Executive Reporting
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default EnterpriseDiagnosticPage;