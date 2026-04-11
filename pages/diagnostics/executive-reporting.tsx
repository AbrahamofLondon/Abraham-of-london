/* ============================================================================
   FILE: pages/diagnostics/executive-reporting/run.tsx
   EXECUTIVE REPORTING — LIVE PRODUCT SURFACE
   Form-first. Evidence-first. Consequence-first.
============================================================================ */

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronRight,
  Crown,
  FileDown,
  FileText,
  Landmark,
  Loader2,
  Lock,
  Scale,
  ShieldCheck,
  Target,
  Users,
  Zap,
} from "lucide-react";

import Layout from "@/components/Layout";
import BoardroomMode from "@/components/admin/reporting/boardroom-mode";
import BriefingPDFTemplate from "@/components/admin/reporting/briefing-pdf-template";
import InterventionProposal from "@/components/admin/reporting/intervention-proposal";
import { ReportRecommendationsPanel } from "@/components/admin/reporting/ReportRecommendationsPanel";
import type { ExecutiveReportViewModel } from "@/lib/admin/reporting/executive-report-view-model";

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

type IntakeState = {
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  sector: string;
  geography: string;
  organisationStage: string;
  teamSize: string;
  annualRevenueBand: string;

  problemStatement: string;
  symptoms: string;
  desiredOutcome: string;
  currentConstraint: string;
  whyNow: string;
  consequenceOfInaction: string;

  decisionOwner: string;
  boardInvolved: string;
  stakeholderMap: string;
  sponsorAlignment: string;

  priorAttempts: string;
  evidenceAvailable: string;
  metricsAffected: string;
  timeHorizon: string;
};

type RuntimeState = {
  loading: boolean;
  error: string;
  runKey: string;
  canonical: any | null;
  report: ExecutiveReportViewModel | null;
};

type Entitlements = {
  canDownloadSample: boolean;
  canViewFullReport: boolean;
  canExportBoardroomPdf: boolean;
  canExportIntervention: boolean;
  canAccessStrategyRoomArtefacts: boolean;
};

const INITIAL_INTAKE: IntakeState = {
  fullName: "",
  email: "",
  organisation: "",
  role: "",
  sector: "",
  geography: "",
  organisationStage: "",
  teamSize: "",
  annualRevenueBand: "",

  problemStatement: "",
  symptoms: "",
  desiredOutcome: "",
  currentConstraint: "",
  whyNow: "",
  consequenceOfInaction: "",

  decisionOwner: "",
  boardInvolved: "",
  stakeholderMap: "",
  sponsorAlignment: "",

  priorAttempts: "",
  evidenceAvailable: "",
  metricsAffected: "",
  timeHorizon: "",
};

const DEFAULT_ENTITLEMENTS: Entitlements = {
  canDownloadSample: false,
  canViewFullReport: false,
  canExportBoardroomPdf: false,
  canExportIntervention: false,
  canAccessStrategyRoomArtefacts: false,
};

const STORAGE_KEY = "aol_executive_reporting_run_v2";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function Rule() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-3">
      <span className="h-5 w-px bg-amber-500/40" />
      <span className="font-mono text-[9px] uppercase tracking-[0.32em] text-amber-400/72">
        {children}
      </span>
    </div>
  );
}

function Panel({
  children,
  className = "",
  gold = false,
}: {
  children: React.ReactNode;
  className?: string;
  gold?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[28px] border bg-black/[0.42] backdrop-blur-sm",
        gold
          ? "border-amber-500/20 shadow-[0_0_60px_-24px_rgba(245,158,11,0.16)]"
          : "border-white/[0.08] shadow-[0_28px_90px_-48px_rgba(0,0,0,0.92)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.02),transparent_48%)]" />
      <div className="relative z-10">{children}</div>
    </section>
  );
}

function AmbientGlow() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute left-[8%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.035] blur-[140px]" />
      <div className="absolute right-[8%] top-[12%] h-[20rem] w-[20rem] rounded-full bg-white/[0.015] blur-[120px]" />
      <div className="absolute bottom-[-6rem] left-1/2 h-[16rem] w-[36rem] -translate-x-1/2 rounded-full bg-amber-500/[0.025] blur-[110px]" />
    </div>
  );
}

function inputClass() {
  return "w-full rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-[14px] text-white/88 outline-none transition placeholder:text-white/20 focus:border-amber-500/30 focus:bg-white/[0.05]";
}

function textAreaClass() {
  return cn(inputClass(), "min-h-[132px] resize-none leading-7");
}

function selectClass() {
  return cn(inputClass(), "appearance-none");
}

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function fieldWeight(value: string, minimum: number, strong: number) {
  const len = value.trim().length;
  if (!len) return 0;
  if (len >= strong) return 100;
  if (len >= minimum) return 70;
  return 35;
}

function computeIntakeScore(intake: IntakeState) {
  const identity =
    [
      intake.fullName,
      intake.email,
      intake.organisation,
      intake.role,
      intake.sector,
      intake.geography,
    ].filter((x) => x.trim()).length / 6;

  const context =
    [
      intake.organisationStage,
      intake.teamSize,
      intake.annualRevenueBand,
      intake.decisionOwner,
      intake.boardInvolved,
      intake.timeHorizon,
    ].filter((x) => x.trim()).length / 6;

  const seriousness =
    (fieldWeight(intake.problemStatement, 120, 260) * 0.24 +
      fieldWeight(intake.symptoms, 120, 240) * 0.18 +
      fieldWeight(intake.desiredOutcome, 70, 160) * 0.12 +
      fieldWeight(intake.currentConstraint, 70, 160) * 0.12 +
      fieldWeight(intake.consequenceOfInaction, 70, 180) * 0.14 +
      fieldWeight(intake.priorAttempts, 60, 160) * 0.10 +
      fieldWeight(intake.evidenceAvailable, 50, 140) * 0.10) /
    1;

  const score = Math.round(identity * 18 + context * 22 + seriousness * 0.6);

  let seriousnessLabel = "Weak";
  if (score >= 78) seriousnessLabel = "Serious";
  else if (score >= 58) seriousnessLabel = "Credible";
  else if (score >= 38) seriousnessLabel = "Thin";

  return {
    score: Math.max(0, Math.min(100, score)),
    seriousnessLabel,
    completenessPct: Math.round(
      (Object.values(intake).filter((x) => x.trim()).length /
        Object.keys(intake).length) *
        100,
    ),
  };
}

function validate(intake: IntakeState): string | null {
  if (!intake.fullName.trim()) return "Full name is required.";
  if (!validateEmail(intake.email)) return "A valid email is required.";
  if (!intake.organisation.trim()) return "Organisation is required.";
  if (!intake.role.trim()) return "Role is required.";
  if (!intake.sector.trim()) return "Sector is required.";
  if (intake.problemStatement.trim().length < 120) {
    return "Problem statement is too thin. State what is actually wrong in structural terms.";
  }
  if (intake.symptoms.trim().length < 100) {
    return "Observed symptoms are too thin. Show the visible operating reality.";
  }
  if (intake.desiredOutcome.trim().length < 60) {
    return "Desired outcome is too vague. Name the decision-quality result required.";
  }
  if (intake.currentConstraint.trim().length < 50) {
    return "Current constraint is too thin. Name the real blocker.";
  }
  if (intake.consequenceOfInaction.trim().length < 60) {
    return "Consequence of inaction must be stated clearly.";
  }
  if (!intake.decisionOwner.trim()) return "Decision owner is required.";
  if (!intake.boardInvolved.trim()) return "Board or senior stakeholder involvement must be stated.";
  if (intake.priorAttempts.trim().length < 40) {
    return "Prior intervention history is too thin. State what has already been tried.";
  }
  return null;
}

function AccessChip({
  label,
  enabled,
}: {
  label: string;
  enabled: boolean;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.18em]",
        enabled
          ? "border-emerald-500/22 bg-emerald-500/[0.08] text-emerald-300/90"
          : "border-white/[0.08] bg-white/[0.03] text-white/28",
      )}
    >
      {enabled ? <CheckCircle2 className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
      {label}
    </div>
  );
}

function StageCard({
  index,
  title,
  body,
  pct,
  active = false,
}: {
  index: string;
  title: string;
  body: string;
  pct: number;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border p-4 transition",
        active
          ? "border-amber-500/24 bg-amber-500/[0.05]"
          : "border-white/[0.08] bg-white/[0.02]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
          {index}
        </div>
        <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/28">
          {pct}%
        </div>
      </div>
      <div className="mt-4 font-serif text-xl text-white/92">{title}</div>
      <p className="mt-2 text-[12px] leading-6 text-white/42">{body}</p>
      <div className="mt-4 h-1 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            active ? "bg-amber-500/70" : "bg-white/18",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block font-mono text-[8px] uppercase tracking-[0.24em] text-white/40">
        {label}
        {required ? <span className="ml-1 text-amber-400/70">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="text-[11px] leading-6 text-white/34">{hint}</p>
      ) : null}
    </div>
  );
}

function SectionHeader({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="mb-6">
      <div className="font-mono text-[8px] uppercase tracking-[0.26em] text-white/28">
        {title}
      </div>
      <p className="mt-2 max-w-3xl text-[13px] leading-7 text-white/42">{body}</p>
    </div>
  );
}

function IntakeArchitecture({
  intake,
  score,
}: {
  intake: IntakeState;
  score: ReturnType<typeof computeIntakeScore>;
}) {
  const sections = [
    {
      id: "01",
      title: "Operator context",
      body: "Identity, role, sector, geography, operating stage.",
      pct: Math.round(
        ([
          intake.fullName,
          intake.email,
          intake.organisation,
          intake.role,
          intake.sector,
          intake.geography,
        ].filter((x) => x.trim()).length /
          6) *
          100,
      ),
    },
    {
      id: "02",
      title: "Mandate and symptoms",
      body: "The actual problem, visible symptoms, desired outcome, constraint.",
      pct: Math.round(
        ([
          intake.problemStatement,
          intake.symptoms,
          intake.desiredOutcome,
          intake.currentConstraint,
        ].filter((x) => x.trim()).length /
          4) *
          100,
      ),
    },
    {
      id: "03",
      title: "Authority and stakeholders",
      body: "Decision owner, board involvement, sponsor alignment, stakeholder field.",
      pct: Math.round(
        ([
          intake.decisionOwner,
          intake.boardInvolved,
          intake.stakeholderMap,
          intake.sponsorAlignment,
        ].filter((x) => x.trim()).length /
          4) *
          100,
      ),
    },
    {
      id: "04",
      title: "Exposure and operating scale",
      body: "Revenue band, team size, time horizon, consequence of inaction.",
      pct: Math.round(
        ([
          intake.annualRevenueBand,
          intake.teamSize,
          intake.timeHorizon,
          intake.consequenceOfInaction,
        ].filter((x) => x.trim()).length /
          4) *
          100,
      ),
    },
    {
      id: "05",
      title: "Evidence and correction history",
      body: "Evidence pack, metrics affected, previous attempts, why now.",
      pct: Math.round(
        ([
          intake.evidenceAvailable,
          intake.metricsAffected,
          intake.priorAttempts,
          intake.whyNow,
        ].filter((x) => x.trim()).length /
          4) *
          100,
      ),
    },
  ];

  return (
    <Panel className="p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Intake architecture</Eyebrow>
          <h2 className="mt-4 font-serif text-2xl text-white">Signal quality before processing</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/42">
            A serious report needs real operating context. This intake is built to reduce guesswork,
            not to generate managerial astrology from five lucky prompts.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/25">
            Readiness
          </div>
          <div className="mt-2 font-serif text-4xl text-white/92">{score.score}%</div>
        </div>
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((item, i) => (
          <StageCard
            key={item.id}
            index={item.id}
            title={item.title}
            body={item.body}
            pct={item.pct}
            active={i === 1}
          />
        ))}
      </div>
    </Panel>
  );
}

function LiveSignalPreview({
  intake,
  score,
}: {
  intake: IntakeState;
  score: ReturnType<typeof computeIntakeScore>;
}) {
  const known = [
    intake.problemStatement && "Mandate and symptoms",
    intake.decisionOwner && "Authority and sponsor posture",
    intake.boardInvolved && "Stakeholder breadth and board involvement",
    intake.annualRevenueBand && "Revenue scale and commercial exposure",
    intake.priorAttempts && "Correction history",
    intake.evidenceAvailable && "Evidence quality",
  ].filter(Boolean) as string[];

  return (
    <Panel className="p-6 md:p-7">
      <Eyebrow>Live signal preview</Eyebrow>
      <h2 className="mt-4 font-serif text-2xl text-white">Is this intake serious enough?</h2>
      <p className="mt-3 text-sm leading-7 text-white/42">
        Before you press run, the page should already tell you whether the system has enough
        context to interpret consequence with a straight face.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-4">
        {[
          ["Readiness", `${score.score}%`],
          ["Completeness", `${score.completenessPct}%`],
          ["Seriousness", score.seriousnessLabel],
          ["Exposure", intake.annualRevenueBand || "—"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-4"
          >
            <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
              {label}
            </div>
            <div className="mt-3 font-serif text-2xl text-white/90">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
            What the system now knows
          </div>
          <div className="mt-4 space-y-2">
            {known.length ? (
              known.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm text-white/62">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/65" />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <div className="text-sm leading-7 text-white/38">
                Not enough real context yet.
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-5">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
            Why this matters
          </div>
          <p className="mt-4 text-sm leading-7 text-white/52">
            A board-grade report cannot be produced responsibly from shallow prompts and a theatrical
            loading spinner. This intake exists to give the constitutional and reporting layers enough
            governed context to interpret consequence instead of guessing at it.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function IntakeForm({
  intake,
  runtime,
  score,
  onChange,
  onSubmit,
}: {
  intake: IntakeState;
  runtime: RuntimeState;
  score: ReturnType<typeof computeIntakeScore>;
  onChange: <K extends keyof IntakeState>(key: K, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Panel className="p-6 md:p-7">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Live intake</Eyebrow>
          <h2 className="mt-4 font-serif text-2xl text-white">Submit a real signal</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/42">
            The system should not be guessing what your business problem is. Give it enough
            architectural signal to do its job properly.
          </p>
        </div>

        <div className="shrink-0 rounded-[18px] border border-white/[0.08] bg-white/[0.03] p-3">
          <ShieldCheck className="h-5 w-5 text-amber-400/60" />
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-8">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name" required>
            <input
              className={inputClass()}
              value={intake.fullName}
              onChange={(e) => onChange("fullName", e.target.value)}
              placeholder="Name of principal"
            />
          </Field>

          <Field label="Email" required>
            <input
              type="email"
              className={inputClass()}
              value={intake.email}
              onChange={(e) => onChange("email", e.target.value)}
              placeholder="you@institution.com"
            />
          </Field>

          <Field label="Organisation" required>
            <input
              className={inputClass()}
              value={intake.organisation}
              onChange={(e) => onChange("organisation", e.target.value)}
              placeholder="Company, fund, board, ministry, group"
            />
          </Field>

          <Field label="Role" required>
            <input
              className={inputClass()}
              value={intake.role}
              onChange={(e) => onChange("role", e.target.value)}
              placeholder="Founder, CEO, Chair, COO, Director"
            />
          </Field>

          <Field label="Sector" required>
            <input
              className={inputClass()}
              value={intake.sector}
              onChange={(e) => onChange("sector", e.target.value)}
              placeholder="Infrastructure, finance, professional services, tech"
            />
          </Field>

          <Field label="Geography">
            <input
              className={inputClass()}
              value={intake.geography}
              onChange={(e) => onChange("geography", e.target.value)}
              placeholder="UK, Nigeria, regional, global"
            />
          </Field>

          <Field label="Organisation stage">
            <select
              className={selectClass()}
              value={intake.organisationStage}
              onChange={(e) => onChange("organisationStage", e.target.value)}
            >
              <option value="">Select stage</option>
              <option value="EARLY">Early</option>
              <option value="GROWTH">Growth</option>
              <option value="MATURE">Mature</option>
              <option value="TURNAROUND">Turnaround</option>
              <option value="TRANSFORMATION">Transformation</option>
            </select>
          </Field>

          <Field label="Team size">
            <select
              className={selectClass()}
              value={intake.teamSize}
              onChange={(e) => onChange("teamSize", e.target.value)}
            >
              <option value="">Select size</option>
              <option value="1-10">1–10</option>
              <option value="11-50">11–50</option>
              <option value="51-200">51–200</option>
              <option value="201-1000">201–1000</option>
              <option value="1000+">1000+</option>
            </select>
          </Field>

          <Field label="Annual revenue band">
            <select
              className={selectClass()}
              value={intake.annualRevenueBand}
              onChange={(e) => onChange("annualRevenueBand", e.target.value)}
            >
              <option value="">Select band</option>
              <option value="UNDER_250K">Under £250k</option>
              <option value="250K_1M">£250k–£1m</option>
              <option value="1M_10M">£1m–£10m</option>
              <option value="10M_50M">£10m–£50m</option>
              <option value="50M_PLUS">£50m+</option>
            </select>
          </Field>

          <Field label="Time horizon">
            <select
              className={selectClass()}
              value={intake.timeHorizon}
              onChange={(e) => onChange("timeHorizon", e.target.value)}
            >
              <option value="">Select horizon</option>
              <option value="0_30_DAYS">0–30 days</option>
              <option value="30_90_DAYS">30–90 days</option>
              <option value="THIS_YEAR">This year</option>
              <option value="12M_PLUS">12 months+</option>
            </select>
          </Field>
        </div>

        <Rule />

        <SectionHeader
          title="Mandate and symptoms"
          body="Describe the real problem in structural terms. Not frustration. Not mood. What is actually wrong, where, and in what way?"
        />

        <Field
          label="Problem statement"
          required
          hint="State the strategic or operating problem clearly. What has broken down, where, and in what way?"
        >
          <textarea
            className={textAreaClass()}
            value={intake.problemStatement}
            onChange={(e) => onChange("problemStatement", e.target.value)}
            placeholder="Describe the actual problem in structural terms."
          />
        </Field>

        <Field
          label="Observed symptoms"
          required
          hint="List what people are seeing, saying, avoiding, escalating, repeating, or failing to resolve."
        >
          <textarea
            className={textAreaClass()}
            value={intake.symptoms}
            onChange={(e) => onChange("symptoms", e.target.value)}
            placeholder="Delays, authority confusion, execution drag, trust decay, margin leakage, political bottlenecks..."
          />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Desired outcome"
            required
            hint="What decision-quality outcome must this process produce?"
          >
            <textarea
              className={textAreaClass()}
              value={intake.desiredOutcome}
              onChange={(e) => onChange("desiredOutcome", e.target.value)}
              placeholder="Clear decision, corrected sequence, sponsor clarity, escalation path, board-ready brief..."
            />
          </Field>

          <Field
            label="Current constraint"
            required
            hint="What is blocking movement now?"
          >
            <textarea
              className={textAreaClass()}
              value={intake.currentConstraint}
              onChange={(e) => onChange("currentConstraint", e.target.value)}
              placeholder="Authority, money, trust, timing, politics, legal sensitivity, sponsor hesitation..."
            />
          </Field>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Why now"
            hint="Why has this become decision-relevant now rather than six months ago?"
          >
            <textarea
              className={textAreaClass()}
              value={intake.whyNow}
              onChange={(e) => onChange("whyNow", e.target.value)}
              placeholder="Board pressure, quarter-end exposure, market instability, failed correction cycle..."
            />
          </Field>

          <Field
            label="Consequence of inaction"
            required
            hint="What happens if nobody acts?"
          >
            <textarea
              className={textAreaClass()}
              value={intake.consequenceOfInaction}
              onChange={(e) => onChange("consequenceOfInaction", e.target.value)}
              placeholder="Lost revenue, sponsor mistrust, regulatory exposure, operational breakdown, stalled growth..."
            />
          </Field>
        </div>

        <Rule />

        <SectionHeader
          title="Authority and stakeholders"
          body="The system needs to know who can decide, who can block, and how wide the consequence field is."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Decision owner" required>
            <input
              className={inputClass()}
              value={intake.decisionOwner}
              onChange={(e) => onChange("decisionOwner", e.target.value)}
              placeholder="Name the actual decision owner or decision seat"
            />
          </Field>

          <Field label="Board involved" required>
            <select
              className={selectClass()}
              value={intake.boardInvolved}
              onChange={(e) => onChange("boardInvolved", e.target.value)}
            >
              <option value="">Select</option>
              <option value="YES">Yes</option>
              <option value="NO">No</option>
              <option value="INDIRECT">Indirectly</option>
              <option value="UNCLEAR">Unclear</option>
            </select>
          </Field>

          <Field label="Stakeholder map">
            <textarea
              className={textAreaClass()}
              value={intake.stakeholderMap}
              onChange={(e) => onChange("stakeholderMap", e.target.value)}
              placeholder="Who is materially affected? Board, customers, lenders, regulators, delivery teams, partners..."
            />
          </Field>

          <Field label="Sponsor alignment">
            <textarea
              className={textAreaClass()}
              value={intake.sponsorAlignment}
              onChange={(e) => onChange("sponsorAlignment", e.target.value)}
              placeholder="Are senior sponsors aligned, split, absent, or politically constrained?"
            />
          </Field>
        </div>

        <Rule />

        <SectionHeader
          title="Evidence and correction history"
          body="A serious reporting surface should know what has already been tried and what evidence exists, not hallucinate maturity."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Prior attempts" required>
            <textarea
              className={textAreaClass()}
              value={intake.priorAttempts}
              onChange={(e) => onChange("priorAttempts", e.target.value)}
              placeholder="What has already been tried? What failed? What partly worked?"
            />
          </Field>

          <Field label="Evidence available">
            <textarea
              className={textAreaClass()}
              value={intake.evidenceAvailable}
              onChange={(e) => onChange("evidenceAvailable", e.target.value)}
              placeholder="Board packs, performance data, pipeline numbers, risk logs, complaints, attrition, delivery metrics..."
            />
          </Field>

          <Field label="Metrics affected">
            <textarea
              className={textAreaClass()}
              value={intake.metricsAffected}
              onChange={(e) => onChange("metricsAffected", e.target.value)}
              placeholder="Revenue, margin, delivery times, attrition, NPS, trust, governance lag..."
            />
          </Field>
        </div>

        <AnimatePresence>
          {runtime.error ? (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3 rounded-[14px] border border-red-400/20 bg-red-500/[0.08] px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-300/85" />
              <span className="text-sm text-red-200/85">{runtime.error}</span>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex flex-col gap-4 border-t border-white/[0.08] pt-5 md:flex-row md:items-center md:justify-between">
          <div className="text-[11px] leading-6 text-white/34">
            Serious output requires serious input. The system will reward specificity,
            consequence awareness, and governance clarity.
          </div>

          <button
            type="submit"
            disabled={runtime.loading || score.score < 32}
            className={cn(
              "inline-flex items-center justify-center gap-2 rounded-[14px] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.22em] transition",
              runtime.loading
                ? "cursor-not-allowed bg-amber-500/45 text-black/55"
                : score.score >= 32
                  ? "bg-amber-500 text-black hover:bg-amber-400"
                  : "cursor-not-allowed border border-white/[0.08] bg-white/[0.03] text-white/24",
            )}
          >
            {runtime.loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating executive report
              </>
            ) : (
              <>
                Generate executive report
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </Panel>
  );
}

function ProductLogic() {
  const steps = [
    {
      n: "01",
      title: "Rich intake",
      body: "Capture enough signal to understand authority, economics, history, consequence, and decision need.",
      icon: FileText,
    },
    {
      n: "02",
      title: "Governed processing",
      body: "Classify posture, failure modes, priority order, route, and corrective logic.",
      icon: Activity,
    },
    {
      n: "03",
      title: "Board-grade rendering",
      body: "Produce an executive output that can actually support judgment under consequence.",
      icon: Building2,
    },
    {
      n: "04",
      title: "Controlled action",
      body: "Only then unlock exports, intervention artefacts, and escalation surfaces.",
      icon: Zap,
    },
  ];

  return (
    <Panel className="p-7 md:p-9">
      <Eyebrow>Product logic</Eyebrow>
      <h2 className="mt-4 font-serif text-4xl text-white md:text-5xl">
        This page should earn trust before asking for it.
      </h2>
      <p className="mt-4 max-w-4xl text-base leading-8 text-white/42">
        The user should feel the product is doing real work, not pretending to perform
        executive intelligence from a handful of lucky numbers and a prayer.
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.n}
            className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-6"
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/30">
                {step.n}
              </div>
              <step.icon className="h-4 w-4 text-white/18" />
            </div>
            <div className="mt-5 font-serif text-2xl text-white/92">{step.title}</div>
            <p className="mt-3 text-sm leading-7 text-white/42">{step.body}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function money(value: number) {
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 0,
    }).format(value || 0);
  } catch {
    return `£${Math.round(value || 0).toLocaleString()}`;
  }
}

function ReportHeader({
  report,
  runKey,
}: {
  report: ExecutiveReportViewModel;
  runKey: string;
}) {
  return (
    <Panel gold className="p-7 md:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Eyebrow>Executive output</Eyebrow>
          <h2 className="mt-4 max-w-4xl font-serif text-3xl leading-tight text-white md:text-5xl">
            {report.summary.headline}
          </h2>
          <p className="mt-4 max-w-4xl text-base leading-8 text-white/50">
            {report.summary.summary}
          </p>
          <div className="mt-5 rounded-[16px] border border-amber-500/16 bg-amber-500/[0.05] p-4 text-sm leading-7 text-white/68">
            <strong className="text-white/86">Mandate:</strong> {report.summary.mandate}
          </div>
        </div>

        <div className="shrink-0 rounded-[18px] border border-white/[0.08] bg-white/[0.02] p-4">
          <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/30">
            Run key
          </div>
          <div className="mt-2 font-mono text-[12px] text-amber-300/80">
            {runKey.slice(0, 18)}...
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Route", report.header.route],
          ["Confidence", `${Math.round(report.header.confidence)}%`],
          ["Readiness", report.header.readinessTier],
          ["Authority", report.header.authorityType],
          ["Exposure", money(report.financialExposure.totalExposure)],
        ].map(([label, value], i) => (
          <div
            key={label}
            className={cn(
              "rounded-[18px] border p-4",
              i === 0
                ? "border-amber-500/20 bg-amber-500/[0.05]"
                : "border-white/[0.08] bg-white/[0.02]",
            )}
          >
            <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
              {label}
            </div>
            <div className="mt-3 font-serif text-2xl text-white/92">{value}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function FailureAndPriorityPanel({
  report,
}: {
  report: ExecutiveReportViewModel;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel className="p-6">
        <Eyebrow>Failure modes</Eyebrow>
        <h3 className="mt-4 font-serif text-2xl text-white">What is actually going wrong</h3>
        <div className="mt-5 space-y-3">
          {report.summary.failureModes.slice(0, 6).map((item) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-[14px] border border-white/[0.06] bg-white/[0.02] px-4 py-3"
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/65" />
              <span className="text-sm leading-7 text-white/62">{item}</span>
            </div>
          ))}
        </div>
      </Panel>

      <Panel className="p-6">
        <Eyebrow>Priority stack</Eyebrow>
        <h3 className="mt-4 font-serif text-2xl text-white">Correction order</h3>
        <div className="mt-5 space-y-3">
          {report.summary.priorityStack.slice(0, 6).map((item, i) => (
            <div
              key={item}
              className="flex items-start gap-3 rounded-[14px] border border-amber-500/12 bg-amber-500/[0.04] px-4 py-3"
            >
              <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/20 font-mono text-[7px] text-amber-400">
                {i + 1}
              </div>
              <span className="text-sm leading-7 text-white/68">{item}</span>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function ExportControl({
  entitlements,
  onExportPdf,
}: {
  entitlements: Entitlements;
  onExportPdf: () => Promise<void>;
}) {
  const [exporting, setExporting] = React.useState(false);

  return (
    <Panel className="p-6 md:p-7">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <Eyebrow>Controlled exports</Eyebrow>
          <h3 className="mt-4 font-serif text-2xl text-white">Entitlement-governed artefacts</h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-white/42">
            Export access should follow product tier and authority logic. It should not be implied by the mere presence of a button.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <AccessChip label="Sample" enabled={entitlements.canDownloadSample} />
          <AccessChip label="Full report" enabled={entitlements.canViewFullReport} />
          <AccessChip label="Boardroom PDF" enabled={entitlements.canExportBoardroomPdf} />
          <AccessChip label="Intervention" enabled={entitlements.canExportIntervention} />
          <AccessChip
            label="Strategy artefacts"
            enabled={entitlements.canAccessStrategyRoomArtefacts}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!entitlements.canExportBoardroomPdf || exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await onExportPdf();
            } finally {
              setExporting(false);
            }
          }}
          className={cn(
            "inline-flex items-center gap-2 rounded-[12px] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] transition",
            entitlements.canExportBoardroomPdf
              ? "border border-amber-500/20 bg-amber-500/10 text-amber-300 hover:bg-amber-500/16"
              : "cursor-not-allowed border border-white/[0.08] bg-white/[0.03] text-white/20",
          )}
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          Export boardroom PDF
        </button>

        <Link
          href="/consulting/strategy-room"
          className="inline-flex items-center gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/60 transition hover:border-white/14 hover:bg-white/[0.05] hover:text-white/84"
        >
          <Crown className="h-3.5 w-3.5 text-amber-400/55" />
          Enter Strategy Room
        </Link>
      </div>
    </Panel>
  );
}

function PDFPreview({ report }: { report: ExecutiveReportViewModel }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Panel className="p-6 md:p-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Eyebrow>Briefing export</Eyebrow>
          <h3 className="mt-4 font-serif text-2xl text-white">Boardroom preview</h3>
          <p className="mt-3 text-sm leading-7 text-white/42">
            This is the export surface, not a decorative mockup.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-4 py-2 font-mono text-[9px] uppercase tracking-[0.18em] text-white/55 transition hover:border-white/14 hover:bg-white/[0.05] hover:text-white/80"
        >
          {open ? "Collapse" : "Expand preview"}
        </button>
      </div>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <div className="overflow-auto rounded-[18px] border border-white/[0.06] bg-neutral-100 p-4">
              <BriefingPDFTemplate report={report} />
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </Panel>
  );
}

const ExecutiveReportingRunPage: NextPage<Props> = ({ latestReport }) => {
  const reduceMotion = useReducedMotion();

  const [intake, setIntake] = React.useState<IntakeState>(INITIAL_INTAKE);
  const [runtime, setRuntime] = React.useState<RuntimeState>({
    loading: false,
    error: "",
    runKey: "",
    canonical: null,
    report: null,
  });
  const [entitlements, setEntitlements] =
    React.useState<Entitlements>(DEFAULT_ENTITLEMENTS);

  const outputRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as IntakeState;
      setIntake({ ...INITIAL_INTAKE, ...parsed });
    } catch {
      // ignore
    }
  }, []);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(intake));
    } catch {
      // ignore
    }
  }, [intake]);

  const score = React.useMemo(() => computeIntakeScore(intake), [intake]);

  function updateField<K extends keyof IntakeState>(key: K, value: string) {
    setIntake((prev) => ({ ...prev, [key]: value }));
    if (runtime.error) {
      setRuntime((prev) => ({ ...prev, error: "" }));
    }
  }

  async function handleRunReport(e: React.FormEvent) {
    e.preventDefault();

    const error = validate(intake);
    if (error) {
      setRuntime((prev) => ({ ...prev, error }));
      return;
    }

    setRuntime({
      loading: true,
      error: "",
      runKey: "",
      canonical: null,
      report: null,
    });

    try {
      const response = await fetch("/api/executive-reporting/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake }),
      });

      const json = await response.json();

      if (!response.ok || !json?.ok) {
        throw new Error(json?.error || "Failed to generate executive report.");
      }

      setRuntime({
        loading: false,
        error: "",
        runKey: json.runKey,
        canonical: json.canonical,
        report: json.viewModel,
      });

      setEntitlements(json.entitlements ?? DEFAULT_ENTITLEMENTS);

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (err) {
      setRuntime({
        loading: false,
        error:
          err instanceof Error ? err.message : "Unexpected error. Try again.",
        runKey: "",
        canonical: null,
        report: null,
      });
    }
  }

  async function handleExportBoardroomPdf() {
    if (!runtime.runKey) return;

    const response = await fetch("/api/executive-reporting/export/boardroom-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runKey: runtime.runKey, email: intake.email }),
    });

    const json = await response.json();

    if (!response.ok || !json?.ok) {
      throw new Error(json?.error || "Boardroom PDF export failed.");
    }

    if (json.downloadUrl) {
      window.open(json.downloadUrl, "_blank", "noopener,noreferrer");
      return;
    }

    alert(json.message || "Boardroom PDF export completed.");
  }

  async function handleExportIntervention(payload: any) {
    const response = await fetch("/api/executive-reporting/export/intervention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runKey: runtime.runKey,
        email: intake.email,
        payload,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json?.ok) {
      throw new Error(json?.error || "Intervention export failed.");
    }

    alert(json.message || "Intervention artefact exported.");
  }

  async function handleDeployIntervention(payload: any) {
    const response = await fetch("/api/executive-reporting/deploy/intervention", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        runKey: runtime.runKey,
        email: intake.email,
        payload,
      }),
    });

    const json = await response.json();

    if (!response.ok || !json?.ok) {
      throw new Error(json?.error || "Intervention deployment failed.");
    }

    alert(json.message || "Intervention deployment initiated.");
  }

  const report = runtime.report;

  const boardroomSlides = React.useMemo(() => {
    if (!report) return [];

    return [
      {
        id: "headline",
        eyebrow: "Executive headline",
        title: "Headline posture",
        subtitle: report.summary.summary,
        render: (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Route", report.header.route],
              ["Confidence", `${Math.round(report.header.confidence)}%`],
              ["Readiness", report.header.readinessTier],
              ["Authority", report.header.authorityType],
            ].map(([label, value], i) => (
              <div
                key={label}
                className={cn(
                  "rounded-[18px] border p-4",
                  i === 0
                    ? "border-amber-500/18 bg-amber-500/[0.05]"
                    : "border-white/[0.08] bg-white/[0.02]",
                )}
              >
                <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                  {label}
                </div>
                <div className="mt-3 font-serif text-2xl text-white/92">{value}</div>
              </div>
            ))}
          </div>
        ),
      },
      {
        id: "structure",
        eyebrow: "Structural interpretation",
        title: "Failure modes and priority order",
        subtitle: `State: ${report.summary.state}`,
        render: (
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel className="p-6">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
                Failure modes
              </div>
              <div className="mt-4 space-y-2.5">
                {report.summary.failureModes.slice(0, 5).map((item) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-white/62">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400/60" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel className="p-6">
              <div className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/28">
                Priority stack
              </div>
              <div className="mt-4 space-y-2.5">
                {report.summary.priorityStack.slice(0, 5).map((item, i) => (
                  <div key={item} className="flex items-start gap-2.5 text-sm text-white/62">
                    <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-amber-500/15 font-mono text-[7px] text-amber-400">
                      {i + 1}
                    </div>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        ),
      },
      {
        id: "recommendations",
        eyebrow: "Governed recommendations",
        title: "Asset layer and next moves",
        subtitle: report.recommendations.nextAction,
        render: (
          <ReportRecommendationsPanel
            decisionLayer={report.recommendations}
            sessionKey={runtime.runKey}
          />
        ),
      },
    ];
  }, [report, runtime.runKey]);

  return (
    <Layout
      title="Run Executive Report"
      description="Submit a real situation and receive a live executive reporting output."
      className="bg-black text-white"
    >
      <Head>
        <title>Run Executive Report | Abraham of London</title>
        <meta
          name="description"
          content="A form-first executive reporting surface that captures real operating signal and turns it into governed board-grade output."
        />
        <link rel="canonical" href={`${SITE}/diagnostics/executive-reporting/run`} />
      </Head>

      <main className="min-h-screen bg-[#050608] text-white">
        <section className="relative overflow-hidden border-b border-white/[0.05]">
          <AmbientGlow />
          <div className="absolute inset-x-0 top-0">
            <Rule />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-18 pt-28 lg:px-12 lg:pb-22 lg:pt-32">
            <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr]">
              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
                className="space-y-8"
              >
                <div>
                  <Link
                    href="/diagnostics/executive-reporting"
                    className="inline-flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.28em] text-white/28 transition hover:text-white/50"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Executive Reporting
                  </Link>

                  <div className="mt-6 max-w-4xl">
                    <Eyebrow>Live product surface</Eyebrow>
                    <h1 className="mt-4 max-w-[11ch] font-serif text-5xl leading-[0.95] tracking-[-0.03em] text-white md:text-6xl lg:text-7xl">
                      Make the input serious enough for the output.
                    </h1>
                    <p className="mt-6 max-w-2xl text-lg leading-8 text-white/50">
                      A serious executive report cannot be produced from a decorative form.
                      This surface captures enough context to interpret authority, exposure,
                      failure history, stakeholder breadth, and decision consequence with a straight face.
                    </p>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    {[
                      ["Product mode", "Live", "Not brochure mode"],
                      ["Input logic", "Structured", "Not lottery numbers"],
                      ["Output goal", "Board-grade", "Decision support under consequence"],
                    ].map(([label, value, sub]) => (
                      <div
                        key={label}
                        className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] p-5"
                      >
                        <div className="font-mono text-[8px] uppercase tracking-[0.22em] text-white/28">
                          {label}
                        </div>
                        <div className="mt-4 font-serif text-2xl text-white/92">{value}</div>
                        <div className="mt-2 text-[12px] leading-6 text-white/38">{sub}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <LiveSignalPreview intake={intake} score={score} />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, delay: 0.08 }}
                className="space-y-6"
              >
                <IntakeArchitecture intake={intake} score={score} />
                <IntakeForm
                  intake={intake}
                  runtime={runtime}
                  score={score}
                  onChange={updateField}
                  onSubmit={handleRunReport}
                />
              </motion.div>
            </div>
          </div>
        </section>

        <div ref={outputRef} className="scroll-mt-10">
          <AnimatePresence mode="wait">
            {report ? (
              <motion.div
                key="output"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto max-w-7xl space-y-6 px-6 py-12 lg:px-12"
              >
                <ReportHeader report={report} runKey={runtime.runKey} />
                <FailureAndPriorityPanel report={report} />

                <BoardroomMode
                  slides={boardroomSlides}
                  title={`Executive Reporting · ${report.header.organisationName}`}
                  generatedAt={report.header.generatedAt}
                />

                <ReportRecommendationsPanel
                  decisionLayer={report.recommendations}
                  sessionKey={runtime.runKey}
                />

                <InterventionProposal
                  campaignId={runtime.runKey}
                  metrics={report.telemetry.domains.map((item) => ({
                    label: item.label,
                    intent: item.intent,
                    reality: item.reality,
                    burnoutIndex: report.telemetry.burnoutIndex,
                  }))}
                  reportContext={{
                    state: report.summary.state,
                    priorityStack: report.summary.priorityStack,
                    failureModes: report.summary.failureModes,
                  }}
                  canExport={entitlements.canExportIntervention}
                  canDeploy={entitlements.canAccessStrategyRoomArtefacts}
                  onExport={handleExportIntervention}
                  onDeploy={handleDeployIntervention}
                />

                <ExportControl
                  entitlements={entitlements}
                  onExportPdf={handleExportBoardroomPdf}
                />

                <PDFPreview report={report} />

                <Panel gold className="p-7 md:p-9">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <Eyebrow>Escalation logic</Eyebrow>
                      <h3 className="mt-4 max-w-3xl font-serif text-3xl text-white">
                        The report is not the final room. It is the disciplined bridge.
                      </h3>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-white/46">
                        When the reading reveals material consequence, the next right move is Strategy Room.
                      </p>
                    </div>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Link
                        href="/consulting/strategy-room"
                        className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-amber-500/20 bg-amber-500/10 px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-amber-300 transition hover:bg-amber-500/16"
                      >
                        <Crown className="h-3.5 w-3.5" />
                        Enter Strategy Room
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/diagnostics"
                        className="inline-flex items-center justify-center gap-2 rounded-[12px] border border-white/[0.08] bg-white/[0.03] px-5 py-3 font-mono text-[9px] uppercase tracking-[0.2em] text-white/58 transition hover:border-white/14 hover:bg-white/[0.05] hover:text-white/84"
                      >
                        Back to diagnostics
                      </Link>
                    </div>
                  </div>
                </Panel>
              </motion.div>
            ) : (
              <motion.div
                key="logic"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto max-w-7xl px-6 py-12 lg:px-12"
              >
                <ProductLogic />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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

      const reports: QuarterlyReport[] = [];

      for (const file of mdxFiles) {
        if (
          !file.includes("global-market-intelligence-report") &&
          !file.includes("global-market-intelligence-q")
        ) {
          continue;
        }

        const filePath = path.join(artifactsDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        const fm = parseFrontmatter(content);

        let quarter = String(fm.quarter || "").trim();
        let year = Number(fm.year || 0);

        if (!quarter) {
          if (file.toLowerCase().includes("q1")) quarter = "Q1";
          if (file.toLowerCase().includes("q2")) quarter = "Q2";
          if (file.toLowerCase().includes("q3")) quarter = "Q3";
          if (file.toLowerCase().includes("q4")) quarter = "Q4";
        }

        if (!year) {
          const m = file.match(/20\d{2}/);
          year = m ? Number(m[0]) : 2026;
        }

        reports.push({
          id: file.replace(".mdx", ""),
          slug: file.replace(".mdx", ""),
          title: String(fm.title || "Global Market Intelligence Report"),
          description: String(
            fm.description ||
              "Executive analysis of market conditions, strategic risks, and institutional opportunities.",
          ),
          publishedAt: String(fm.date || new Date().toISOString()),
          quarter: quarter || "Q1",
          year: year || 2026,
          readingTime: Number(fm.readingTime || 25),
          pdfUrl: typeof fm.pdfUrl === "string" ? fm.pdfUrl : null,
          keyFindings: Array.isArray(fm.keyFindings)
            ? fm.keyFindings.map((x: any) => String(x))
            : [],
        });
      }

      const qOrder: Record<string, number> = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      reports.sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return (qOrder[b.quarter] || 0) - (qOrder[a.quarter] || 0);
      });

      latestReport = reports[0] || null;
    }
  } catch (err) {
    console.error("Failed to load quarterly report:", err);
  }

  return {
    props: { latestReport },
    revalidate: 3600,
  };
};

function parseFrontmatter(content: string): Record<string, any> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const lines = match[1]!.split("\n");
  const result: Record<string, any> = {};
  let currentArrayKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.replace(/\r/g, "");
    if (!line.trim()) continue;

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      if (!Array.isArray(result[currentArrayKey])) result[currentArrayKey] = [];
      result[currentArrayKey].push(
        arrayItemMatch[1]!.trim().replace(/^['"]|['"]$/g, ""),
      );
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!keyMatch) {
      currentArrayKey = null;
      continue;
    }

    const [, key, rawValue] = keyMatch as [string, string, string];
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

export default ExecutiveReportingRunPage;