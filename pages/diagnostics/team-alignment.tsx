import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Users,
  Scale,
  CheckCircle2,
  AlertTriangle,
  Crown,
  Workflow,
  Activity,
  FileText,
  ChevronRight,
  BadgeCheck,
  ScanSearch,
  Target,
  Briefcase,
  Building2,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  bandFromPct,
  buildSectionScore,
  severityFromPct,
  submitDiagnostic,
} from "@/lib/diagnostics/client";
import type {
  DiagnosticAnswer,
  DiagnosticAnswerValue,
  DiagnosticSubmitResponse,
} from "@/lib/diagnostics/types";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

type SignalCard = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

type OutcomeCard = {
  icon: React.ComponentType<any>;
  title: string;
  desc: string;
};

type QuestionBlock = {
  id: string;
  title: string;
  prompts: string[];
};

const SIGNALS: SignalCard[] = [
  {
    icon: AlertTriangle,
    title: "Execution looks busy but weak",
    desc: "There is visible motion, but not enough coherence, ownership, or strategic consistency behind it.",
  },
  {
    icon: Users,
    title: "Leadership says one thing, teams experience another",
    desc: "Direction may sound clear at the top but degrades as it moves through the operating structure.",
  },
  {
    icon: Workflow,
    title: "Meetings exist, but alignment does not",
    desc: "Cadence is present, but decision rights, follow-through, and operating trust remain unstable.",
  },
];

const OUTCOMES: OutcomeCard[] = [
  {
    icon: FileText,
    title: "Team alignment reading",
    desc: "A structured interpretation of drift, coherence, accountability gaps, and misalignment across the unit.",
  },
  {
    icon: Scale,
    title: "Pressure-tested next-step logic",
    desc: "Clarity on whether the issue is behavioural, managerial, governance-related, or requires private intervention.",
  },
  {
    icon: Target,
    title: "Commercially useful clarity",
    desc: "Enough signal to support internal correction, workshop design, or escalation into Enterprise or Strategy Room.",
  },
];

const BLOCKS: QuestionBlock[] = [
  {
    id: "direction",
    title: "Direction & Priority",
    prompts: [
      "The team can state the current priority set with enough consistency.",
      "Day-to-day work reflects declared priorities rather than noise.",
      "The team is not carrying conflicting versions of what success looks like.",
    ],
  },
  {
    id: "execution",
    title: "Execution Integrity",
    prompts: [
      "Work is moving with ownership rather than diffusion.",
      "Follow-through is strong enough that meetings convert into action.",
      "The team does not confuse activity for measurable progress.",
    ],
  },
  {
    id: "trust",
    title: "Trust & Communication",
    prompts: [
      "Important tensions are surfaced without avoidance or theatre.",
      "Communication reduces ambiguity rather than multiplying it.",
      "Trust is strong enough that correction can happen without paralysis.",
    ],
  },
  {
    id: "authority",
    title: "Authority & Escalation",
    prompts: [
      "Decision rights are clear enough to reduce drag.",
      "Escalation happens at the correct level and at the correct speed.",
      "Leadership intervention is helping the team move rather than making it dependent.",
    ],
  },
];

function AmbientField() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="absolute left-[10%] top-[8%] h-[26rem] w-[26rem] rounded-full bg-amber-500/[0.05] blur-[140px]" />
      <div className="absolute right-[10%] top-[28%] h-[22rem] w-[22rem] rounded-full bg-white/[0.02] blur-[120px]" />
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

function scoreLabel(value: DiagnosticAnswerValue) {
  if (value === 1) return "Strongly No";
  if (value === 2) return "No";
  if (value === 3) return "Mixed";
  if (value === 4) return "Yes";
  return "Strongly Yes";
}

const TeamAlignmentDiagnosticPage: NextPage = () => {
  const reduceMotion = useReducedMotion();
  const [answers, setAnswers] = React.useState<Record<string, DiagnosticAnswerValue>>({});
  const [teamName, setTeamName] = React.useState("");
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
          value: answers[p.questionId],
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

  const nextStepHref =
    pct >= 80 ? "/strategy-room" : pct >= 55 ? "/diagnostics/enterprise" : "/diagnostics";

  const nextStepLabel =
    pct >= 80 ? "Escalate to Strategy Room" : pct >= 55 ? "Continue to Enterprise Diagnostic" : "Return to Diagnostic Ladder";

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    const res = await submitDiagnostic({
      kind: "team-alignment",
      version: "2026.1",
      source: "diagnostics",
      entry: "team-alignment",
      intent: "team-alignment-diagnostic",
      title: "Team Alignment Diagnostic",
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
        ui: "team-alignment",
        teamName: teamName || null,
        nextStepHref,
        nextRoute: pct >= 80 ? "STRATEGY_ROOM" : pct >= 55 ? "ENTERPRISE" : "FOUNDATION",
      },
    });

    setSubmitResult(res);
    setIsSubmitting(false);
  };

  return (
    <Layout
      title="Team Alignment Diagnostic"
      description="A structured diagnostic for leadership teams and operating units experiencing drift, inconsistency, or execution misalignment."
      className="bg-black text-white"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/diagnostics/team-alignment`} />
      </Head>

      <main className="min-h-screen bg-black text-white selection:bg-amber-500/30">
        <section className="relative overflow-hidden border-b border-white/5">
          <AmbientField />

          <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-36 lg:px-12 lg:pb-32 lg:pt-44">
            <div className="grid gap-14 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="max-w-4xl">
                <motion.div
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  <RailLabel>Team diagnostic</RailLabel>
                </motion.div>

                <motion.h1
                  className="mt-8 max-w-[12ch] font-serif text-5xl font-light leading-[0.92] tracking-[-0.04em] text-white md:text-7xl lg:text-[5.4rem]"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.95, delay: 0.08 }}
                >
                  When the team
                  <span className="mt-3 block text-white/56">is no longer moving as one</span>
                </motion.h1>

                <motion.p
                  className="mt-8 max-w-2xl text-lg font-light leading-relaxed text-white/54 md:text-[1.18rem]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.9, delay: 0.18 }}
                >
                  This sits between the private signal and the enterprise chamber. It asks whether the problem is still local,
                  already managerial, or drifting into institutional consequence.
                </motion.p>

                <motion.div
                  className="mt-12 flex flex-wrap gap-4"
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.85, delay: 0.26 }}
                >
                  <Link
                    href="#instrument"
                    className="group inline-flex items-center justify-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50"
                  >
                    <span>Run the instrument</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/strategy-room"
                    className="group inline-flex items-center justify-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    <span>View Strategy Room</span>
                    <ChevronRight className="h-4 w-4 opacity-60 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
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
                    <Briefcase className="h-4 w-4 text-amber-500/40" />
                  </div>

                  <div className="grid grid-cols-3 gap-6 border-y border-white/6 py-6">
                    <MetricTile label="Layer" value="Mid" />
                    <MetricTile label="Use" value="Filter" />
                    <MetricTile label="Bias" value="Actionable" />
                  </div>

                  <div className="mt-8 space-y-4">
                    {[
                      "Clarifies whether the problem is local or structural",
                      "Exposes authority drag and execution softness",
                      "Creates a credible bridge into Enterprise or Strategy Room",
                      "Turns vague friction into governed signal",
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
              <RailLabel>Typical signals</RailLabel>
              <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">What usually brings teams here</h2>
              <p className="mt-4 max-w-3xl text-lg text-white/48">The team is not collapsing. That is precisely the danger.</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {SIGNALS.map((item) => (
                <Card key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section id="instrument" className="relative border-t border-white/5 py-24">
          <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent" aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
            <div className="grid gap-16 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <RailLabel>Team instrument</RailLabel>
                <h2 className="mt-7 font-serif text-4xl text-white md:text-5xl">
                  Build the reading before you buy the intervention
                </h2>

                <div className="mt-10 grid gap-6 md:grid-cols-2">
                  {[
                    { label: "Organisation", value: organisation, set: setOrganisation, type: "text" },
                    { label: "Team / Unit", value: teamName, set: setTeamName, type: "text" },
                    { label: "Respondent Name", value: respondentName, set: setRespondentName, type: "text" },
                    { label: "Respondent Email", value: respondentEmail, set: setRespondentEmail, type: "email" },
                    { label: "Respondent Role", value: respondentRole, set: setRespondentRole, type: "text" },
                  ].map((field) => (
                    <div key={field.label} className="border border-white/[0.06] bg-white/[0.015] p-6">
                      <label className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/28">
                        {field.label}
                      </label>
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
                        {block.prompts.map((prompt, idx) => {
                          const questionId = `${block.id}-${idx}`;
                          return (
                            <div key={questionId} className="border border-white/6 bg-black/20 p-5">
                              <div className="text-sm leading-relaxed text-white/78">{prompt}</div>

                              <div className="mt-4 grid grid-cols-5 gap-2">
                                {[1, 2, 3, 4, 5].map((n) => {
                                  const value = n as DiagnosticAnswerValue;
                                  const active = answers[questionId] === value;

                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      onClick={() => setAnswers((prev) => ({ ...prev, [questionId]: value }))}
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
                    Operating Observations
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    className="mt-3 w-full border border-white/10 bg-black/20 px-4 py-4 text-sm text-white outline-none focus:border-amber-500/30"
                    placeholder="Where are drift, communication drag, weak ownership, or trust fractures becoming visible?"
                  />
                </div>

                <div className="mt-10 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!canSubmit}
                    className="inline-flex items-center gap-3 bg-white px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-black transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {isSubmitting ? "Submitting…" : "Submit team diagnostic"}
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  <Link
                    href={nextStepHref}
                    className="inline-flex items-center gap-3 border border-white/10 px-8 py-4 font-mono text-[10px] uppercase tracking-[0.22em] text-white/78 transition-colors hover:border-white/20 hover:bg-white/[0.04] hover:text-white"
                  >
                    {nextStepLabel}
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
                      Team diagnostic captured. The next correct move is now visible.
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
                        href={nextStepHref}
                        className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300 hover:text-amber-200"
                      >
                        {nextStepLabel}
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
                    <h3 className="font-serif text-2xl text-white">Current team signal</h3>

                    <div className="mt-6 grid grid-cols-3 gap-4 border-y border-white/6 py-6">
                      <MetricTile label="Score" value={`${totalScore}/${maxScore}`} />
                      <MetricTile label="Band" value={band} />
                      <MetricTile label="Severity" value={severity} />
                    </div>

                    <div className="mt-8 rounded-2xl border border-white/8 bg-black/20 p-5">
                      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/56">
                        Escalation principle
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-white/46">
                        If the reading reveals authority drag, soft execution, and widening interpretation gaps, the next useful question is no longer personal. It is institutional.
                      </p>
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/8 bg-black/20 p-5">
                      <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-amber-300/56">
                        Likely next move
                      </div>
                      <div className="mt-3 text-lg text-white">{nextStepLabel}</div>
                    </div>
                  </div>

                  <div className="grid gap-6">
                    {OUTCOMES.map((item) => (
                      <Card key={item.title} {...item} />
                    ))}
                  </div>

                  <div className="border border-white/[0.06] bg-white/[0.015] p-8">
                    <div className="flex items-center gap-3">
                      <Building2 className="h-5 w-5 text-amber-300/70" />
                      <div className="font-serif text-2xl text-white">What this is really doing</div>
                    </div>
                    <p className="mt-4 text-sm leading-7 text-white/55">
                      It makes the user feel the problem has grown a body. Not just a mood. Not just a complaint. A structure.
                    </p>
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

export default TeamAlignmentDiagnosticPage;