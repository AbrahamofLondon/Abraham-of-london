// pages/diagnostics/enterprise-assessment.tsx
// Design: Institutional Monumentalism
// Canonical enterprise layer — one page, one instrument, one route.
// Replaces both enterprise.tsx (inline Likert) and enterprise-assessment.tsx (suite wrapper).
// The EnterpriseAssessmentSuite slider component is retired from this page.
//
// Architecture:
// Phase 1 — Identity: respondent and organisation context
// Phase 2 — Instrument: 4 blocks × 3 Likert questions with live signal panel
// Phase 3 — Result: structural reading, section analysis, escalation routing
//
// Result surface produces:
// - Band (STABLE / WATCH / FRAGILE / ESCALATE)
// - Section breakdown with pattern reading per section
// - Dominant failure mode identified
// - Specific escalation route with structural justification
// - Connection to team assessment result if available in sessionStorage

import type { GetServerSideProps } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { trackStageStart, trackStageComplete, trackDropoff } from "@/lib/analytics/funnel";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Building2,
  CheckSquare,
  ChevronRight,
  Crown,
  FileText,
  Gavel,
  Scale,
  Users,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  buildSectionScore,
  severityFromPct,
  bandFromPct,
  submitDiagnostic,
} from "@/lib/diagnostics/client";
import type {
  DiagnosticAnswer,
  DiagnosticAnswerValue,
  DiagnosticSubmitResponse,
} from "@/lib/diagnostics/types";
import {
  readConstitutionalThread,
  mergeEnterpriseFindingsIntoThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";
import { deriveDecisionSignalFromEnterpriseInput } from "@/lib/decision/system-constitution";
import { matchPlaybooks } from "@/lib/playbooks/matcher";
import InheritedThreadContext from "@/components/diagnostics/results/InheritedThreadContext";
import TrajectoryLine from "@/components/diagnostics/results/TrajectoryLine";
import { inferTrajectory } from "@/lib/diagnostics/prognosis";
import RecommendedPlaybooks from "@/components/diagnostics/results/RecommendedPlaybooks";
import FreeLayerBoundary from "@/components/diagnostics/results/FreeLayerBoundary";
import { buildDecisionObjectFromSignals, buildEnterpriseDecisionResult } from "@/lib/diagnostics/decision-engine";
import { loadSpineFromSession } from "@/lib/decision/spine-persistence";
import { getInheritedContext } from "@/lib/decision/spine-guard";
import type { IntelligenceSpine } from "@/lib/decision/intelligence-spine";
import { generateAdaptiveQuestions, type AdaptiveQuestion } from "@/lib/decision/adaptive-question-engine";
import { registerPressureLoopFromSpine } from "@/lib/follow-up/register-loop-client";
import CaseActiveBanner from "@/components/diagnostics/unified/CaseActiveBanner";
import ConsequenceTimelineBlock from "@/components/diagnostics/unified/ConsequenceTimeline";
import LimitationsBlock from "@/components/diagnostics/unified/LimitationsBlock";
import DirectiveCTA from "@/components/diagnostics/unified/DirectiveCTA";
import FeedbackLoopBlock from "@/components/diagnostics/unified/FeedbackLoop";
import { generateConsequenceTimeline } from "@/lib/diagnostics/consequence-timeline";
import BoundaryProximityLine, {
  boundaryProximityText,
} from "@/components/diagnostics/results/ThresholdProximityLine";
import DecisionChallengeCard from "@/components/diagnostics/DecisionChallengeCard";
import type { ChallengeResult } from "@/lib/server/decision/challenge-engine.server";
import ResultEmailCapture from "@/components/diagnostics/ResultEmailCapture";
import DualAxisPromptCard from "@/components/diagnostics/DualAxisPromptCard";
import type { DualAxisAnswer } from "@/lib/alignment/types";
import {
  clearVersionedAssessmentState,
  loadVersionedAssessmentState,
  saveVersionedAssessmentState,
} from "@/lib/client/assessment-state";
import { detectDualAxisIntegrityChallenge } from "@/lib/client/assessment-integrity";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";
const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUMENT SCHEMA
// 4 blocks × 3 questions = 12 questions total
// Same Likert 1-5 pattern as constitutional and team instruments
// ─────────────────────────────────────────────────────────────────────────────

type Block = { id: string; title: string; domain: string; prompts: [string, string, string] };

const BLOCKS: Block[] = [
  {
    id: "leadership", title: "Leadership Coherence", domain: "Authority & signal",
    prompts: [
      "Senior leadership reads the condition of the institution with enough consistency.",
      "Critical leadership disagreements are surfaced rather than buried.",
      "Strategic messaging remains coherent as it moves through the enterprise.",
    ],
  },
  {
    id: "governance", title: "Governance Reliability", domain: "Structure & accountability",
    prompts: [
      "Decision rights are clear enough to reduce drag and duplication.",
      "Escalation and accountability are operating at the correct level.",
      "Governance structures are supporting execution rather than slowing it.",
    ],
  },
  {
    id: "execution", title: "Execution Variance", domain: "Operating consistency",
    prompts: [
      "Performance varies within acceptable bounds rather than by dangerous extremes.",
      "Teams are not operating with materially different interpretations of priority.",
      "Operational signals are trustworthy enough for leadership to act on them.",
    ],
  },
  {
    id: "risk", title: "Institutional Risk Posture", domain: "Consequence & urgency",
    prompts: [
      "Current delay does not materially increase strategic cost.",
      "Trust in the institution is not quietly weakening.",
      "Corrective action can still be taken without disproportionate political resistance.",
    ],
  },
];

const SCORE_LABELS: Record<DiagnosticAnswerValue, string> = {
  1: "Strongly no", 2: "No", 3: "Mixed", 4: "Yes", 5: "Strongly yes",
};

// ─────────────────────────────────────────────────────────────────────────────
// ANALYSIS ENGINE
// Produces a pattern reading specific to the combination of section scores
// ─────────────────────────────────────────────────────────────────────────────

type SectionScore = { id: string; title: string; pct: number };
type EnterpriseAxisAnswers = Record<string, DualAxisAnswer>;
type EnterpriseDraftSnapshot = {
  phase: "identity" | "instrument";
  identity: {
    name: string;
    email: string;
    organisation: string;
    role: string;
    recentDecision: string;
    notes: string;
  };
  answers: EnterpriseAxisAnswers;
  instrumentPage: number;
  startedAt: number;
};
const ENT_STORAGE_KEY = "aol-enterprise-assessment-state";
const ENT_STORAGE_VERSION = "2026-04-standardized";

type EnterpriseReading = {
  band:          string;
  patternTitle:  string;
  primaryReading:string;
  dominantFailure:string | null;
  firstAction:   string;
  escalationNote:string;
  route:         "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "WATCH";
  decisionSignal: {
    clarityScore: number;
    structuralRisk: number;
    signalStrength: number;
  };
  decisionObject: import("@/lib/diagnostics/decision-engine").DecisionObject;
};

function sectionPct(answers: EnterpriseAxisAnswers, blockId: string): number {
  const vals = [0, 1, 2]
    .map((i) => answers[`${blockId}-${i}`])
    .filter(isAnswered)
    .map((answer) => toDiagnosticValue(answer));
  if (!vals.length) return 0;
  return Math.round((vals.reduce((s: number, v: number) => s + v, 0) / (vals.length * 5)) * 100);
}

function defaultAxisAnswer(): DualAxisAnswer {
  return { resonance: 5, certainty: 5 };
}

function isAnswered(answer: DualAxisAnswer | undefined) {
  return Boolean(answer) && !(answer!.resonance === 5 && answer!.certainty === 5);
}

function toDiagnosticValue(answer: DualAxisAnswer | undefined): DiagnosticAnswerValue {
  if (!answer) return 3;
  const mapped = Math.round(answer.resonance / 2);
  return Math.min(5, Math.max(1, mapped === 0 ? 1 : mapped)) as DiagnosticAnswerValue;
}

function deriveReading(
  answers: EnterpriseAxisAnswers,
  totalPct: number,
  teamAlignmentPct: number | null,
  recentDecision: string,
): EnterpriseReading {
  const scores: Record<string, number> = {};
  for (const b of BLOCKS) scores[b.id] = sectionPct(answers, b.id);

  const scoreMap = scores as Record<string, number>;
  const leadership = scoreMap["leadership"] ?? 0;
  const governance = scoreMap["governance"] ?? 0;
  const execution  = scoreMap["execution"]  ?? 0;
  const risk       = scoreMap["risk"]       ?? 0;
  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]!;
  const decisionSignal = deriveDecisionSignalFromEnterpriseInput(recentDecision);

  // Band
  const band = totalPct >= 80 ? "STABLE"
             : totalPct >= 60 ? "WATCH"
             : totalPct >= 40 ? "FRAGILE"
             : "ESCALATE";

  // Dominant failure mode — what is weakest and by how much
  let dominantFailure: string | null = null;
  if (weakest[1] < 40) {
    const titles: Record<string, string> = { leadership: "Leadership coherence", governance: "Governance reliability", execution: "Execution variance", risk: "Risk posture" };
    dominantFailure = titles[weakest[0]] ?? null;
  }

  // Pattern reading — specific to the combination of weak sections
  let patternTitle = "";
  let primaryReading = "";
  let firstAction = "";
  let escalationNote = "";
  let route: EnterpriseReading["route"] = "WATCH";

  const govLeaderWeak = leadership < 50 && governance < 50;
  const execRiskWeak  = execution < 50 && risk < 50;
  const leaderWeak    = leadership < 45;
  const govWeak       = governance < 45;
  const execWeak      = execution < 45;
  const riskWeak      = risk < 45;

  if (band === "ESCALATE" || (govLeaderWeak && execRiskWeak)) {
    patternTitle   = "Distributed constitutional strain";
    primaryReading = `All four domains are below the governed boundary at once. That means the institution is not carrying a local defect but a distributed constitutional strain across leadership, governance, execution, and risk posture. The institution has already moved from operational difficulty into structural danger. The next move is governed executive interpretation before any direct intervention is attempted.`;
    firstAction    = "Pause discretionary strategic initiatives. Convene the executive decision-making group around one question only: what are the three decisions that must not be made until consequence has been priced and priority has been governed?";
    escalationNote = "Executive Reporting should come before any mandate or chamber work. Entering Strategy Room without that ordering would compound disorder rather than reduce it.";
    route = "EXECUTIVE_REPORTING";

  } else if (govLeaderWeak) {
    patternTitle   = "Authority and governance out of order";
    primaryReading = `Leadership coherence (${leadership}%) and governance reliability (${governance}%) are both below the governed boundary. Authority is therefore not sufficiently ordered, and the structures meant to contain it are no longer load-bearing. The institution may still be moving, but it is moving without a stable governing frame. The review point for safe escalation remains closed until the authority architecture is made intelligible again.`;
    firstAction    = "Map the last five significant institutional decisions: who decided, on what authority, with what governance process. If this exercise reveals ambiguity in more than two, the governance architecture requires formal reconstruction before strategic escalation.";
    escalationNote = "Executive Reporting is needed to determine whether this is executive incoherence, governance failure, or both. That distinction determines the correction path.";
    route = "EXECUTIVE_REPORTING";

  } else if (execRiskWeak) {
    patternTitle   = "Execution drift under rising pressure";
    primaryReading = `Execution variance (${execution}%) and risk posture (${risk}%) are both below the governed boundary. The system is therefore carrying pressure that is no longer being translated into ordered action, which is how structural risk hardens quietly. The institution has moved beyond routine operating variance and into compounding strain. The next move is executive interpretation before pressure fully displaces judgment.`;
    firstAction    = "Produce a single-page operational reality map: where are the three highest-variance execution points in the institution right now, what is the specific consequence of inaction in each, and who holds decision authority to correct them? If this document cannot be produced in 48 hours, that is itself a governance finding.";
    escalationNote = "Executive Reporting will turn this strain into a governed priority stack. Without that ordering, execution correction is likely to be aimed at the wrong level.";
    route = "EXECUTIVE_REPORTING";

  } else if (leaderWeak) {
    patternTitle   = "Leadership signal no longer coherent";
    primaryReading = `Leadership coherence is at ${leadership}%, below the level at which the executive layer can reliably carry common judgment. Governance and execution may still appear functional, but they are now leaning on inertia instead of ordered evidence. The review point issue is therefore upstream, not downstream. The next move is to read the leadership condition directly before wider intervention is chosen.`;
    firstAction    = "Identify the three most important beliefs the leadership group holds about the institution's current condition. Test whether those beliefs are shared. The gap between individual leadership beliefs is the governance problem.";
    escalationNote = "Leadership incoherence at this level warrants Executive Reporting first. A governed reading of the executive layer is more useful than premature intervention.";
    route = totalPct >= 60 ? "WATCH" : "EXECUTIVE_REPORTING";

  } else if (govWeak) {
    patternTitle   = "Governance no longer carrying order";
    primaryReading = `Governance reliability is at ${governance}%. Decision rights, escalation lanes, and accountability structures are no longer carrying enough order for the system to move cleanly. That means friction is now constitutional, not merely procedural. The review point for safe escalation depends on restoring governance as a load-bearing structure. The next move is to make the governance map explicit before choosing intervention.`;
    firstAction    = "Map decision rights explicitly. For the top ten classes of institutional decision, document who has authority, who must be consulted, and who must be informed. Circulate this document to all executives and track the areas of disagreement — those disagreements are the governance problem made visible.";
    escalationNote = "Executive Reporting will establish whether governance requires reconstruction or a more limited correction. That distinction should be made before any chamber escalation.";
    route = totalPct >= 65 ? "WATCH" : "EXECUTIVE_REPORTING";

  } else if (execWeak) {
    patternTitle   = "Operating layer drifting from intent";
    primaryReading = `Execution variance is at ${execution}% while leadership and governance remain comparatively stronger. The institution still has some ordering at the top, but that order is not reaching the operating layer in a stable form. This is motion without sufficient coherence. The institution has not yet moved into full disorder, but the strain is real. The next move is to tighten translation between priority and execution before drift compounds.`;
    firstAction    = "Identify the highest-variance operating unit. Run a structured rapid diagnostic there — not a full assessment, a focused reading of three things: what do they believe the current priorities are, what do they believe success looks like this quarter, and what is stopping them from operating at full capacity. The answers will locate the translation failure.";
    escalationNote = "This can still be corrected without heavy escalation if the strain is contained. Executive Reporting is warranted if the same pattern appears across units or begins to alter risk posture.";
    route = "WATCH";

  } else if (riskWeak) {
    patternTitle   = "Risk posture no longer stable";
    primaryReading = `Risk posture is at ${risk}%, which means the system is losing room to correct cleanly. Trust is weakening, delay is increasing consequence, and pressure is beginning to displace deliberate judgment. Collapse has not arrived, but the window for ordered correction is narrowing. The next move is to define consequence precisely before the institution is forced into reaction.`;
    firstAction    = "Define the specific cost of inaction in the next 90 days: what becomes harder, more expensive, or politically impossible if nothing changes? Document this as a concrete consequence list, not as abstract risk language. That document is the basis for any board-level escalation.";
    escalationNote = "Executive Reporting provides the governed interpretation needed to act before pressure takes over sequencing. Without that, the institution is likely to move reactively.";
    route = totalPct >= 70 ? "WATCH" : "EXECUTIVE_REPORTING";

  } else if (band === "STABLE") {
    patternTitle   = "Institutional posture remains ordered";
    primaryReading = `All four domains are above the governed boundary: leadership coherence (${leadership}%), governance reliability (${governance}%), execution consistency (${execution}%), and risk posture (${risk}%). Based on this single-respondent reading, the institution appears to carry enough order for judgment, execution, and correction to remain aligned. The posture remains on the ordered side of strain. The next move is not emergency escalation, but testing whether this posture holds under real pressure.`;
    firstAction    = "The most productive use of this reading is stress-testing: identify the three conditions under which this institutional coherence would be most likely to degrade, and verify whether governance, execution, and leadership are resilient to each.";
    escalationNote = "A stable institutional reading supports proactive Executive Reporting if leadership wants a governed planning brief rather than crisis correction.";
    route = "WATCH";

  } else {
    patternTitle   = "Watch condition under moderate strain";
    primaryReading = `The enterprise reading sits in the WATCH posture (${totalPct}%). No single domain has fully failed, but the institution is carrying enough friction, pressure, or coherence strain to warrant disciplined attention. The danger is normalization: low-grade disorder becomes mistaken for normal operating reality. The case for heavy escalation is not established yet. The next move is to name the highest-strain point and govern it before it spreads.`;
    firstAction    = "Identify the institutional area where the friction is highest and the cost of continuing to absorb it is most visible. That is the diagnostic priority. The reading does not require immediate escalation, but it does require a named owner for the correction.";
    escalationNote = "A WATCH condition justifies continued monitoring and readiness for Executive Reporting. If this reading degrades on reassessment, escalation should follow quickly.";
    route = "WATCH";
  }

  // Team assessment context
  if (teamAlignmentPct !== null) {
    if (teamAlignmentPct < 45 && totalPct < 60) {
      primaryReading += ` Your Team Assessment reading of ${teamAlignmentPct}% compounds this enterprise reading — misalignment is present at both the team and institutional level simultaneously. This combination accelerates the case for Executive Reporting.`;
    } else if (teamAlignmentPct < 45 && totalPct >= 60) {
      primaryReading += ` Your Team Assessment reading of ${teamAlignmentPct}% indicates team-level misalignment that the enterprise reading does not fully capture. The institutional architecture may be functioning, but the operating layer is not translating it.`;
    }
  }

  if (decisionSignal.clarityScore < 55) {
    primaryReading += ` The recent decision signal reinforces this reading: decision clarity is ${decisionSignal.clarityScore}%, which means the enterprise is not only scoring under strain but also producing low-clarity judgment under real conditions.`;
  } else if (decisionSignal.structuralRisk >= 60) {
    primaryReading += ` The recent decision signal adds pressure: structural risk is ${decisionSignal.structuralRisk}%, so the assessment is reading consequence through an actual decision, not only through abstract condition scoring.`;
  } else {
    primaryReading += ` The recent decision signal is sufficiently legible (${decisionSignal.clarityScore}% clarity), which gives the enterprise reading a concrete decision reference rather than a generic condition score.`;
  }

  return {
    band,
    patternTitle,
    primaryReading,
    dominantFailure,
    firstAction,
    escalationNote,
    route,
    decisionSignal,
    decisionObject: buildDecisionObjectFromSignals({
      condition: patternTitle,
      signals: [
        {
          id: govLeaderWeak ? "mandate_vacuum" : execRiskWeak ? "execution_drift" : govWeak ? "governance_failure" : "reactive_decision_pattern",
          label: "Legacy enterprise reading",
          summary: primaryReading,
          severity: band === "ESCALATE" ? 9 : band === "FRAGILE" ? 7 : band === "WATCH" ? 4 : 2,
        },
      ],
      consequence: escalationNote,
      action: firstAction,
    }),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function GoldRule({ soft = false }: { soft?: boolean }) {
  return <div className={soft ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"} />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}BB` }}>{children}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", backgroundColor: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.09)",
  outline: "none", minHeight: "44px", padding: "10px 13px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.80)",
  transition: "border-color 250ms ease",
};
const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: "0.45rem",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.26)",
};

function bandColor(band: string) {
  switch (band) {
    case "STABLE":   return { border: "rgba(110,231,183,0.25)", bg: "rgba(110,231,183,0.06)", text: "rgba(110,231,183,0.90)" };
    case "WATCH":    return { border: `${GOLD}30`, bg: `${GOLD}08`, text: `${GOLD}CC` };
    case "FRAGILE":  return { border: "rgba(253,186,116,0.25)", bg: "rgba(253,186,116,0.06)", text: "rgba(253,186,116,0.90)" };
    default:         return { border: "rgba(252,165,165,0.25)", bg: "rgba(252,165,165,0.06)", text: "rgba(252,165,165,0.90)" };
  }
}

function ScoreSelector({ value, onChange }: { value: DiagnosticAnswerValue | 0; onChange: (v: DiagnosticAnswerValue) => void }) {
  return (
    <div className="flex gap-1.5 mt-3">
      {([1, 2, 3, 4, 5] as DiagnosticAnswerValue[]).map(n => {
        const isActive = value === n;
        return (
          <button key={n} type="button" onClick={() => onChange(n)} title={SCORE_LABELS[n]}
            style={{ flex: 1, minHeight: "44px", padding: "8px 4px", textAlign: "center", border: `1px solid ${isActive ? `${GOLD}55` : "rgba(255,255,255,0.07)"}`, backgroundColor: isActive ? `${GOLD}12` : "rgba(255,255,255,0.01)", color: isActive ? GOLD : "rgba(255,255,255,0.30)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 200ms ease" }}
            onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = `${GOLD}28`; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.55)"; } }}
            onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.30)"; } }}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT SURFACE
// ─────────────────────────────────────────────────────────────────────────────

function ResultSurface({ reading, sections, totalScore, maxScore, totalPct, teamAlignmentPct, submitResult, onSubmit, isSubmitting, onRevise, constitutionalThread = null, matchedPlaybooks = [] }: {
  reading: EnterpriseReading; sections: SectionScore[]; totalScore: number; maxScore: number; totalPct: number;
  teamAlignmentPct: number | null; submitResult: DiagnosticSubmitResponse | null;
  onSubmit: () => void; isSubmitting: boolean; onRevise: () => void;
  constitutionalThread?: ConstitutionalThread | null;
  matchedPlaybooks?: ReturnType<typeof matchPlaybooks>;
}) {
  const bc = bandColor(reading.band);
  const routeConfig = {
    EXECUTIVE_REPORTING: { href: "/diagnostics/executive-reporting", label: "Move to Executive Reporting", border: `${GOLD}35`, bg: `${GOLD}0D`, text: `${GOLD}BB` },
    STRATEGY_ROOM:       { href: "/strategy-room", label: "Enter Strategy Room", border: "rgba(52,211,153,0.30)", bg: "rgba(52,211,153,0.07)", text: "rgba(110,231,183,0.90)" },
    WATCH:               { href: "/diagnostics/watch?source=enterprise-assessment", label: "Enter Watch State", border: "rgba(255,255,255,0.10)", bg: "rgba(255,255,255,0.02)", text: "rgba(255,255,255,0.55)" },
  }[reading.route];

  function MRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.58)" }}>{value}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div style={{ border: `1px solid ${bc.border}`, backgroundColor: bc.bg, padding: "2rem" }}>
        <Eyebrow>Enterprise assessment result</Eyebrow>
        <div className="flex items-end justify-between gap-4 flex-wrap mt-4">
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", lineHeight: 1.0, letterSpacing: "-0.022em", color: "rgba(255,255,255,0.92)" }}>
              {reading.patternTitle}
            </h2>
            <div style={{ marginTop: "0.6rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.30em", textTransform: "uppercase", color: bc.text, opacity: 0.90 }}>
              {reading.band} — {totalPct}% overall
            </div>
            <BoundaryProximityLine
              text={boundaryProximityText({
                label: "Decision clarity",
                value: reading.decisionSignal.clarityScore,
                boundaryLabel: "EXECUTIVE REPORTING",
                boundary: 55,
              })}
            />
          </div>
          {/* Section mini-grid */}
          <div className="grid grid-cols-2 gap-2 shrink-0">
            {sections.map(s => {
              const c = s.pct >= 65 ? "rgba(110,231,183,0.75)" : s.pct >= 40 ? `${GOLD}CC` : "rgba(252,165,165,0.75)";
              return (
                <div key={s.id} style={{ textAlign: "right" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.4rem", lineHeight: 1, color: c }}>{s.pct}%</div>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>{s.id}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <ResultEmailCapture
            source="enterprise_assessment"
            resultRef={submitResult && submitResult.ok ? submitResult.diagnosticRef : reading.patternTitle}
          />
        </div>
        <p style={{ marginTop: "1rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.30)", fontStyle: "italic" }}>
          This pattern is commonly seen before structural correction. This reading can be tracked over time. Re-evaluate in 14 days to see whether the pattern improves or repeats.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Left */}
        <div className="space-y-5">
          {constitutionalThread && (
            <>
              <InheritedThreadContext
                thread={constitutionalThread}
                title="Inherited constitutional thread"
              />
              <TrajectoryLine trajectory={inferTrajectory(
                constitutionalThread.domainScores.coherence,
                ({ FRAGILE: 25, EMERGING: 40, STABILIZING: 55, EXECUTION_READY: 75, SOVEREIGN: 90 } as Record<string, number>)[constitutionalThread.readinessTier] ?? 50,
                constitutionalThread.failureModes,
              )} />
            </>
          )}

          {/* Structural reading */}
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, overflow: "hidden" }}>
            <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: `linear-gradient(to right, ${GOLD}08, transparent)` }}><Eyebrow>Structural reading</Eyebrow></div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.78, color: "rgba(255,255,255,0.70)" }}>{reading.primaryReading}</p>
            </div>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.25rem 1.5rem" }}>
            <Eyebrow>Evidence from this assessment</Eyebrow>
            <p style={{ marginTop: "0.75rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.94rem", lineHeight: 1.8, color: "rgba(255,255,255,0.80)", maxWidth: "62ch" }}>
              {reading.decisionObject.evidence[0]?.summary ?? `The overall enterprise reading is ${reading.band.toLowerCase()} at ${totalPct}%. The strongest pressure sits in ${reading.dominantFailure ?? "the weakest operating domain"}, and the recent decision signal is ${reading.decisionSignal.clarityScore}% clear against ${reading.decisionSignal.structuralRisk}% structural risk.`}
            </p>
          </div>

          <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}05`, padding: "1.25rem 1.5rem" }}>
            <Eyebrow>Recent decision signal</Eyebrow>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <MRow label="Clarity" value={`${reading.decisionSignal.clarityScore}%`} />
              <MRow label="Structural risk" value={`${reading.decisionSignal.structuralRisk}%`} />
              <MRow label="Signal strength" value={`${reading.decisionSignal.signalStrength}%`} />
            </div>
          </div>

          {/* Dominant failure mode */}
          {reading.dominantFailure && (
            <div style={{ border: "1px solid rgba(252,165,165,0.18)", backgroundColor: "rgba(252,165,165,0.04)", padding: "1.25rem 1.5rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(252,165,165,0.60)", marginBottom: "0.65rem" }}>
                Dominant failure mode
              </div>
              <div className="flex items-start gap-2.5">
                <AlertTriangle style={{ width: "12px", height: "12px", color: "rgba(252,165,165,0.65)", flexShrink: 0, marginTop: "3px" }} />
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.60, color: "rgba(255,255,255,0.65)" }}>
                  {reading.dominantFailure} is the weakest domain — below 40%. This is where structural pressure is most concentrated and where corrective action must begin.
                </span>
              </div>
            </div>
          )}

          {/* Section breakdown */}
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgb(5 5 7)" }}>
            <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><Eyebrow>Section breakdown</Eyebrow></div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {sections.map(s => {
                const pctColor = s.pct >= 65 ? "rgba(110,231,183,0.75)" : s.pct >= 40 ? `${GOLD}BB` : "rgba(252,165,165,0.75)";
                const block = BLOCKS.find(b => b.id === s.id)!;
                return (
                  <div key={s.id} style={{ padding: "1rem 1.5rem" }}>
                    <div className="flex items-center justify-between gap-3 mb-1.5">
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", color: "rgba(255,255,255,0.72)" }}>{s.title}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.5rem", lineHeight: 1, color: pctColor, flexShrink: 0 }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "0.4rem" }}>
                      <motion.div style={{ height: "100%", width: `${Math.max(2, s.pct)}%`, backgroundColor: pctColor }} animate={{ width: `${Math.max(2, s.pct)}%` }} transition={{ duration: 0.6 }} />
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{block.domain}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* First action */}
          <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}07`, padding: "1.5rem" }}>
            <Eyebrow>Immediate governance action</Eyebrow>
            <p style={{ marginTop: "0.85rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72, color: "rgba(255,255,255,0.72)" }}>{reading.decisionObject.action}</p>
          </div>

          <details style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.5rem" }}>
            <summary style={{ cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              How this was determined
            </summary>
            <div className="mt-5 space-y-5">
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>You indicated</div>
                <ul className="mt-3 space-y-2">
                  {sections.slice(0, 4).map((section) => (
                    <li key={section.id} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.96rem", lineHeight: 1.6, color: "rgba(255,255,255,0.72)" }}>
                      {section.title}: {section.pct}% structural strength
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Contradiction mapping</div>
                <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.96rem", lineHeight: 1.6, color: "rgba(255,255,255,0.72)" }}>
                  The reading compares enterprise coherence, governance, execution, and risk against the decision signal from your recent high-stakes decision. The conflict between those layers drives the route.
                </p>
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Pattern trigger explanation</div>
                <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.96rem", lineHeight: 1.6, color: "rgba(255,255,255,0.72)" }}>
                  This combination produces {reading.patternTitle.toLowerCase()} because the weakest enterprise domain is {reading.dominantFailure ?? "the lowest-scoring structural block"}, while the recent decision signal resolves at {reading.decisionSignal.clarityScore}% clarity and {reading.decisionSignal.structuralRisk}% structural risk.
                </p>
              </div>
            </div>
          </details>

          {/* ── Anchor-driven escalation hook ─── */}
          <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}05`, padding: "1.5rem" }}>
            <Eyebrow>Next unknown</Eyebrow>
            <p style={{ marginTop: "0.85rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72, color: "rgba(255,255,255,0.82)" }}>
              This is now a governance and exposure problem. It has financial consequences.
            </p>
            <p style={{ marginTop: "0.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>
              {reading.route === "EXECUTIVE_REPORTING"
                ? `The institutional condition at ${totalPct}% has crossed from operational strain to structural risk. Executive Reporting translates this into priced consequence and governed intervention sequencing.`
                : `The institutional reading at ${totalPct}% is under watch. Executive Reporting will determine whether the current condition has financial exposure that warrants intervention before pressure takes over sequencing.`}
            </p>
            <Link href="/diagnostics/executive-reporting" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", padding: "11px 20px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", textDecoration: "none" }}>
              Escalate to Executive Reporting <ChevronRight style={{ width: 11, height: 11 }} />
            </Link>
          </div>

          <RecommendedPlaybooks playbooks={matchedPlaybooks} />

          <FreeLayerBoundary
            summary="This assessment identifies organisational pressure signals and the first governance action from a single intake."
            limitation="One respondent's domain scores cannot prove enterprise-wide condition. It does not price consequence, order interventions, or enforce execution."
            validityBasis="Single-respondent enterprise intake. Posture classification is directional, not statistically validated across the organisation."
            strengthenWith="Compare leadership, execution, and governance respondents independently using the multi-stakeholder campaign."
          />

          {/* ── Unified Conversion Surface ── */}
          <CaseActiveBanner caseReference={`ENT-${Date.now().toString(36).toUpperCase()}`} committed assessmentType="enterprise" />
          <ConsequenceTimelineBlock {...generateConsequenceTimeline({ assessmentType: "enterprise", score: totalPct, weakestDomain: reading.dominantFailure ?? sections.sort((a, b) => a.pct - b.pct)[0]?.title })} />
          <LimitationsBlock assessmentType="enterprise" />
          <DirectiveCTA assessmentType="enterprise" route={reading.route} score={totalPct} />
          <FeedbackLoopBlock assessmentType="enterprise" />

          {/* Save */}
          <div style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.008)", padding: "1.25rem" }}>
            {!submitResult ? (
              <div className="flex items-center justify-between gap-4">
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Save the diagnostic record and receive a reference.</p>
                <button type="button" onClick={onSubmit} disabled={isSubmitting}
                  style={{ padding: "10px 20px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.50)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", cursor: isSubmitting ? "not-allowed" : "pointer", flexShrink: 0 }}>
                  {isSubmitting ? "Saving…" : "Save record"}
                </button>
              </div>
            ) : submitResult.ok ? (
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(110,231,183,0.65)", marginBottom: "0.4rem" }}>Record saved</div>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", color: "rgba(255,255,255,0.30)" }}>Ref: {submitResult.diagnosticRef}</p>
              </div>
            ) : (
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(252,165,165,0.70)" }}>{submitResult.error}</p>
            )}
          </div>
        </div>

        {/* Right */}
        <div className="space-y-4">
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Enterprise metrics</span></div>
            <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
              <MRow label="Overall score"    value={`${totalScore}/${maxScore}`} />
              <MRow label="Overall pct"      value={`${totalPct}%`} />
              <MRow label="Band"             value={reading.band} />
              <MRow label="Severity"         value={severityFromPct(totalPct)} />
              <MRow label="Dominant failure" value={reading.dominantFailure ?? "None identified"} />
              <MRow label="Route"            value={reading.route.replace("_", " ")} />
              {teamAlignmentPct !== null && <MRow label="Team alignment" value={`${teamAlignmentPct}%`} />}
            </div>
          </div>

          {/* Section bars */}
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
            <Eyebrow>Domain scores</Eyebrow>
            <div className="mt-4 space-y-3">
              {sections.map(s => {
                const c = s.pct >= 65 ? "rgba(110,231,183,0.65)" : s.pct >= 40 ? `${GOLD}80` : "rgba(252,165,165,0.65)";
                return (
                  <div key={s.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>{s.title}</span>
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", color: c }}>{s.pct}%</span>
                    </div>
                    <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <motion.div style={{ height: "100%", backgroundColor: c }} animate={{ width: `${Math.max(2, s.pct)}%` }} transition={{ duration: 0.6 }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

type PagePhase = "identity" | "instrument" | "result";

export default function EnterpriseAssessmentPage() {
  const [phase,       setPhase]       = React.useState<PagePhase>("identity");
  const [answers,     setAnswers]     = React.useState<EnterpriseAxisAnswers>({});
  const [identity,    setIdentity]    = React.useState({ name: "", email: "", organisation: "", role: "", recentDecision: "", notes: "" });
  const [submitResult,setSubmitResult]= React.useState<DiagnosticSubmitResponse | null>(null);
  const [isSubmitting,setIsSubmitting]= React.useState(false);
  const [teamAlignmentPct, setTeamAlignmentPct] = React.useState<number | null>(null);
  const [subjectId, setSubjectId] = React.useState("");
  const [constitutionalThread, setConstitutionalThread] = React.useState<ConstitutionalThread | null>(null);
  const [entSpine, setEntSpine]                           = React.useState<IntelligenceSpine | null>(null);
  const [_spineCtx, _setSpineCtx]                       = React.useState<ReturnType<typeof getInheritedContext> | null>(null);
  const [adaptiveQuestions, setAdaptiveQuestions]         = React.useState<AdaptiveQuestion[]>([]);
  const [adaptiveAnswers, setAdaptiveAnswers]             = React.useState<Record<string, string>>({});
  const [showAdaptive, setShowAdaptive]                   = React.useState(false);
  const [challenge, setChallenge] = React.useState<ChallengeResult | null>(null);
  const [instrumentPage, setInstrumentPage] = React.useState(0);
  const [showResume, setShowResume] = React.useState(false);
  const [draftSnapshot, setDraftSnapshot] = React.useState<EnterpriseDraftSnapshot | null>(null);
  const startedAtRef = React.useRef(Date.now());
  const recentDecisionReady = identity.recentDecision.trim().length >= 40;

  async function runEnterpriseChallenge(stage: string): Promise<ChallengeResult | null> {
    setChallenge(null);
    try {
      const response = await fetch("/api/diagnostics/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentType: "enterprise",
          stage,
          answers: {
            recentDecision: identity.recentDecision,
            authority: identity.role,
            consequence: identity.notes,
          },
        }),
      });
      if (!response.ok) return null;
      const json = (await response.json()) as { ok: boolean } & ChallengeResult;
      if (json.ok && json.severity !== "none") {
        setChallenge(json);
        return json;
      }
      return null;
    } catch {
      return null;
    }
  }

  React.useEffect(() => {
    const saved = loadVersionedAssessmentState<EnterpriseDraftSnapshot>(
      ENT_STORAGE_KEY,
      ENT_STORAGE_VERSION,
    );
    if (!saved) return;
    setDraftSnapshot(saved);
    setShowResume(true);
  }, []);

  React.useEffect(() => {
    if (phase === "result") return;
    const timer = setTimeout(() => {
      saveVersionedAssessmentState(ENT_STORAGE_KEY, ENT_STORAGE_VERSION, {
        phase,
        identity,
        answers,
        instrumentPage,
        startedAt: startedAtRef.current,
        timestamp: new Date().toISOString(),
      });
    }, 800);
    return () => clearTimeout(timer);
  }, [identity, answers, phase, instrumentPage]);

  React.useEffect(() => {
    trackStageStart("enterprise");
    // Load spine for inherited context + adaptive questions
    const loaded = loadSpineFromSession();
    if (loaded) {
      setEntSpine(loaded);
      _setSpineCtx(getInheritedContext(loaded));
      const qs = generateAdaptiveQuestions({
        conditionClass: "definition",
        contradiction: loaded.synthesis?.primaryContradiction ?? null,
        c3Gaps: loaded.c3.missing,
        memorySignals: [],
        stage: "enterprise",
        maxQuestions: 2,
      });
      setAdaptiveQuestions(qs);
    }
    const handleUnload = () => trackDropoff("enterprise");
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("team-assessment-result");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.overallReality === "number") setTeamAlignmentPct(p.overallReality);
        if (typeof p?.subjectId === "string") setSubjectId(p.subjectId);
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    setConstitutionalThread(readConstitutionalThread());
  }, []);

  const allPrompts = BLOCKS.flatMap(b => b.prompts.map((_, i) => `${b.id}-${i}`));
  const answeredCount = allPrompts.filter((k) => isAnswered(answers[k])).length;
  const complete = answeredCount === allPrompts.length;

  const answerList: DiagnosticAnswer[] = BLOCKS.flatMap(b =>
    b.prompts.map((prompt, i) => ({
      sectionId: b.id, questionId: `${b.id}-${i}`, prompt,
      value: toDiagnosticValue(answers[`${b.id}-${i}`]),
    }))
  ).filter(a => isAnswered(answers[a.questionId]));

  const totalScore = answerList.reduce((s, a) => s + a.value, 0);
  const maxScore   = allPrompts.length * 5;
  const totalPct   = complete ? Math.round((totalScore / maxScore) * 100) : 0;

  const sections: SectionScore[] = BLOCKS.map(b => ({
    id: b.id, title: b.title,
    pct: sectionPct(answers, b.id),
  }));

  const reading = React.useMemo(
    () =>
      complete
        ? buildEnterpriseDecisionResult({
            totalPct,
            sections,
            teamAlignmentPct,
            recentDecision: identity.recentDecision,
          })
        : null,
    [complete, identity.recentDecision, sections, teamAlignmentPct, totalPct]
  );
  const matchedPlaybooks = React.useMemo(
    () =>
      reading
        ? matchPlaybooks({
            route: "ENTERPRISE",
            readiness: constitutionalThread?.readinessTier ?? "STABILIZING",
            failureModes: [
              ...(constitutionalThread?.failureModes ?? []),
              ...(reading.dominantFailure === "Governance reliability" ? ["GOVERNANCE_FAILURE"] : []),
              ...(reading.dominantFailure === "Leadership coherence" ? ["SIGNAL_FAILURE"] : []),
              ...(reading.dominantFailure === "Execution variance" ? ["EXECUTION_DRIFT"] : []),
              ...(reading.dominantFailure === "Risk posture" ? ["RISK_POSTURE_DEGRADATION"] : []),
              ...(reading.band === "ESCALATE" ? ["SYSTEMIC_BREAKDOWN"] : []),
              ...(reading.band === "FRAGILE" ? ["STRUCTURAL_MISALIGNMENT"] : []),
            ],
            dominantDomains: sections
              .filter((section) => section.pct < 55)
              .map((section) => section.id),
            authorityType: constitutionalThread?.authorityType ?? null,
          })
        : [],
    [constitutionalThread, reading, sections],
  );
  const visibleBlocks = BLOCKS.slice(instrumentPage * 2, instrumentPage * 2 + 2);
  const instrumentGroupComplete = visibleBlocks.every((block) =>
    [0, 1, 2].every((idx) => isAnswered(answers[`${block.id}-${idx}`])),
  );

  function resumeDraft() {
    if (!draftSnapshot) return;
    setPhase(draftSnapshot.phase);
    setIdentity(draftSnapshot.identity);
    setAnswers(draftSnapshot.answers);
    setInstrumentPage(draftSnapshot.instrumentPage);
    startedAtRef.current = draftSnapshot.startedAt;
    setShowResume(false);
  }

  function discardDraft() {
    clearVersionedAssessmentState(ENT_STORAGE_KEY);
    setDraftSnapshot(null);
    setShowResume(false);
  }

  function setAnswer(key: string, value: DualAxisAnswer) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function advance(to: PagePhase) {
    window.scrollTo({ top: 0, behavior: "smooth" });
    if (to === "instrument") setInstrumentPage(0);
    setPhase(to);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const res = await submitDiagnostic({
      kind: "enterprise", version: "2026.1", source: "diagnostics", entry: "enterprise-assessment",
      intent: "enterprise-diagnostic", title: "Enterprise Assessment",
      respondent: { name: identity.name || null, email: identity.email || null, organisation: identity.organisation || null, role: identity.role || null },
      answers: answerList, notes: identity.notes || null,
      summary: { totalScore, maxScore, pct: totalPct, severity: severityFromPct(totalPct), band: bandFromPct(totalPct), sectionScores: BLOCKS.map(b => buildSectionScore({ sectionId: b.id, title: b.title, answers: answerList.filter(a => a.sectionId === b.id) })) },
      metadata: {
        ui: "enterprise-assessment",
        nextStepHref: reading?.route === "STRATEGY_ROOM" ? "/strategy-room" : "/diagnostics/executive-reporting",
        nextRoute: (reading?.route ?? "EXECUTIVE_REPORTING") as import("@/lib/diagnostics/types").DiagnosticRoute,
        teamAlignmentPct,
        recentDecision: identity.recentDecision,
        decisionSignal: reading?.decisionSignal ?? null,
        authorityInput: reading ? {
          condition: reading.patternTitle,
          contradiction: reading.primaryReading,
          decisionText: reading.decisionObject.decision || identity.recentDecision,
          constraintText: identity.notes,
          costOfDelayText: reading.decisionObject.consequence,
          stakeholderText: identity.organisation,
          affectedDomain: reading.dominantFailure ?? sections.sort((a, b) => a.pct - b.pct)[0]?.title ?? "enterprise",
          firstMove: reading.decisionObject.action,
          skippedConsequence: reading.decisionObject.consequence,
          escalationCondition: reading.route === "EXECUTIVE_REPORTING"
            ? "Proceed to Executive Reporting because enterprise consequence requires governed interpretation."
            : "Monitor and escalate if the same failure evidence appears in two or more domains.",
          riskScore: Math.min(100, Math.max(0, 100 - totalPct + (reading.decisionSignal.structuralRisk * 0.35))),
          formula: "(100 - enterprise percent) + decision structural risk x 0.35",
          reasoning: [
            `Enterprise score: ${totalPct}%`,
            `Decision clarity: ${reading.decisionSignal.clarityScore}%`,
            `Decision structural risk: ${reading.decisionSignal.structuralRisk}%`,
            `Dominant failure: ${reading.dominantFailure ?? "none"}`,
          ],
          confidence: reading.decisionObject.signalStrength === "high" ? 0.88 : reading.decisionObject.signalStrength === "medium" ? 0.7 : 0.5,
        } : null,
      },
    });
    setSubmitResult(res);
    clearVersionedAssessmentState(ENT_STORAGE_KEY);

    const nextHref = reading?.route === "STRATEGY_ROOM" ? "/strategy-room" : "/diagnostics/executive-reporting";
    const outcome = reading?.route === "STRATEGY_ROOM" ? "strategy" as const : "diagnostic" as const;
    trackStageComplete("enterprise", outcome, nextHref);

    // Write enterprise findings back into the constitutional thread
    const weakBlocks = BLOCKS
      .map(b => ({ id: b.id, title: b.title, pct: sections.find(s => s.id === b.id)?.pct ?? 0 }))
      .filter(b => b.pct < 50)
      .map(b => b.title);

    // Register pressure loop for follow-up
    registerPressureLoopFromSpine(entSpine);

    mergeEnterpriseFindingsIntoThread({
      completedAt: new Date().toISOString(),
      band: bandFromPct(totalPct),
      totalPct,
      weakBlocks,
      patternTitle: reading?.patternTitle ?? "",
      route: reading?.route ?? "EXECUTIVE_REPORTING",
      narrative: (reading?.primaryReading ?? "").slice(0, 300),
      decisionClarity: reading?.decisionSignal.clarityScore,
    });

    // Handoff to /diagnostics/executive-reporting (and the Strategy Room chain).
    // Canonical key per CLAUDE_SESSION_LOG.md section 4 ladder chain:
    // purpose-alignment-result → team-assessment-result → enterprise-assessment-result
    // → executive-report-result → strategy-room-result.
    // Mirrors the Team → Enterprise write pattern. Preserves the server response
    // plus the key computed enterprise metrics so downstream surfaces can enrich
    // without an extra round-trip.
    try {
      sessionStorage.setItem(
        "enterprise-assessment-result",
        JSON.stringify({
          ...(res || {}),
          totalScore,
          maxScore,
          totalPct,
          severity: severityFromPct(totalPct),
          band: bandFromPct(totalPct),
          sections: sections.map(s => ({ id: s.id, title: s.title, pct: s.pct })),
          decisionSignal: reading?.decisionSignal ?? null,
          recentDecision: identity.recentDecision,
          subjectId,
          nextRoute: reading?.route ?? "EXECUTIVE_REPORTING",
          teamAlignmentPct,
        }),
      );
    } catch {
      /* sessionStorage unavailable (private mode / SSR) — handoff degrades gracefully */
    }

    setIsSubmitting(false);
  }

  return (
    <Layout title="Enterprise Assessment | Abraham of London" description="Institution-wide diagnostic mapping for authority, governance, trust, and execution integrity." canonicalUrl="/diagnostics/enterprise-assessment" fullWidth headerTransparent>
      <Head><meta name="robots" content="index,follow" /></Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* ── HERO ──────────────────────────────────────────────────────── */}
        {phase === "identity" && (
          <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute" style={{ left: "-5%", top: "-15%", width: "600px", height: "600px", borderRadius: "50%", background: `radial-gradient(ellipse at center, ${GOLD}08 0%, transparent 65%)`, filter: "blur(140px)" }} />
              <div className="absolute inset-x-0 bottom-0 h-40" style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }} />
              <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
            </div>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}20, transparent)` }} />

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
              <div className="pt-32 md:pt-40 pb-12">
                <div className="flex items-center gap-2 mb-10">
                  <Link href="/diagnostics" className="flex items-center gap-1.5 transition-opacity hover:opacity-70" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    <ArrowLeft style={{ width: "10px", height: "10px" }} /> Diagnostics
                  </Link>
                  <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Enterprise Assessment</span>
                </div>

                <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                  <div>
                    <Eyebrow>Layer 03 · Institution-wide diagnostic</Eyebrow>
                    <h1 style={{ marginTop: "1.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 5.5rem)", lineHeight: 0.90, letterSpacing: "-0.042em", color: "rgba(255,255,255,0.94)" }}>
                      When the institution
                      <br /><span style={{ color: "rgba(255,255,255,0.28)" }}>needs a serious reading.</span>
                    </h1>
                    <p style={{ marginTop: "1.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1rem, 1.4vw, 1.18rem)", lineHeight: 1.72, color: "rgba(255,255,255,0.42)", maxWidth: "48ch" }}>
                      Some problems are not team-sized. This instrument maps where authority,
                      governance, execution consistency, and institutional risk posture are
                      failing across the full institutional architecture.
                    </p>
                    {teamAlignmentPct !== null && (
                      <div style={{ marginTop: "1.25rem", padding: "0.85rem 1.25rem", border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}07`, display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}90` }}>Team assessment loaded — {teamAlignmentPct}%</span>
                      </div>
                    )}
                    {constitutionalThread && (
                      <div style={{ marginTop: "1rem", padding: "0.95rem 1.25rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.45rem" }}>
                          Constitutional inheritance
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(255,255,255,0.54)" }}>
                          {constitutionalThread.bridge.enterpriseAssessment.rationale}
                        </p>
                        {constitutionalThread.bridge.enterpriseAssessment.watchpoints.length > 0 && (
                          <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.58, color: "rgba(255,255,255,0.40)", fontStyle: "italic" }}>
                            This stage is testing whether strain in {String(constitutionalThread.bridge.enterpriseAssessment.watchpoints[0] ?? "the inherited watchpoint").toLowerCase()} is distributed across the institution.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, padding: "1.5rem" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "1rem" }}>Position in ladder</div>
                    {[
                      { label: "01 Constitutional",  done: true,  active: false },
                      { label: "02 Team Assessment", done: true,  active: false },
                      { label: "03 Enterprise",      done: false, active: true },
                      { label: "04 Executive Reporting",done: false, active: false },
                    ].map(item => (
                      <div key={item.label} style={{ padding: "0.55rem 0.85rem", marginBottom: "0.30rem", border: `1px solid ${item.active ? `${GOLD}22` : "transparent"}`, backgroundColor: item.active ? `${GOLD}08` : "transparent", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: item.active ? `${GOLD}CC` : item.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)", textDecoration: item.done ? "line-through" : "none" }}>
                        {item.label}
                      </div>
                    ))}
                    <div style={{ marginTop: "1rem", padding: "0.75rem 0.85rem", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.35rem" }}>Dimensions mapped</div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {["Leadership", "Governance", "Execution", "Risk posture"].map(d => (
                          <span key={d} style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{d}</span>
                        ))}
                      </div>
                    </div>
                    {constitutionalThread?.bridge.enterpriseAssessment.watchpoints?.length ? (
                      <div style={{ marginTop: "1rem", padding: "0.75rem 0.85rem", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.35rem" }}>Watchpoints</div>
                        {constitutionalThread.bridge.enterpriseAssessment.watchpoints.slice(0, 3).map((watchpoint) => (
                          <p key={watchpoint} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.84rem", lineHeight: 1.55, color: "rgba(255,255,255,0.42)", marginTop: "0.35rem" }}>
                            {watchpoint}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ── STICKY PROGRESS ───────────────────────────────────────────── */}
        {phase === "instrument" && (
          <div style={{ backgroundColor: "rgba(0,0,0,0.50)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="flex items-center justify-between py-3">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                  Enterprise instrument
                </span>
                <div className="flex items-center gap-3">
                  <div style={{ height: "2px", width: "120px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.round((answeredCount / allPrompts.length) * 100)}%`, backgroundColor: `${GOLD}80`, transition: "width 400ms ease" }} />
                  </div>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)" }}>
                    {answeredCount}/{allPrompts.length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatePresence mode="wait">

            {/* IDENTITY */}
            {phase === "identity" && (
              <motion.div key="identity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.50 }}>
                <div className="py-14 max-w-2xl">
                  <Eyebrow>Step 1 — Identity</Eyebrow>
                  <h2 style={{ marginTop: "1.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", lineHeight: 1.0, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>Tell us about the institution.</h2>

                  <div className="grid gap-4 mt-8 sm:grid-cols-2">
                    {[
                      { label: "Role",            key: "role",         type: "text",  placeholder: "Board chair, CEO, Director…" },
                      { label: "Organisation",    key: "organisation", type: "text",  placeholder: "Company or institution" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={labelStyle}>{f.label}</label>
                        <input type={f.type} value={identity[f.key as keyof typeof identity]} onChange={e => setIdentity(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ ...inputStyle, minHeight: "44px", fontSize: "16px" }}
                          onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label style={labelStyle}>Most important decision in the last 90 days</label>
                      <textarea value={identity.recentDecision} onChange={e => setIdentity(prev => ({ ...prev, recentDecision: e.target.value }))} rows={4} placeholder="Describe the most important decision made in the last 90 days. Include what was decided, who carried authority, what constraint shaped the decision, and what happened next." style={{ ...inputStyle, resize: "none", lineHeight: 1.75, minHeight: "44px", fontSize: "16px" }}
                        onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
                      />
                      <p style={{ marginTop: "0.45rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: recentDecisionReady ? "rgba(110,231,183,0.55)" : "rgba(255,255,255,0.22)" }}>
                        {identity.recentDecision.trim().length}/40 minimum characters
                      </p>
                    </div>
                    <details className="sm:col-span-2" style={{ marginTop: "0.5rem" }}>
                      <summary style={{ cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                        Optional context
                      </summary>
                      <div className="grid gap-4 mt-4 sm:grid-cols-2">
                        {[
                          { label: "Respondent name", key: "name", type: "text", placeholder: "Full name" },
                          { label: "Email", key: "email", type: "email", placeholder: "email@org.com" },
                        ].map(f => (
                          <div key={f.key}>
                            <label style={labelStyle}>{f.label}</label>
                            <input type={f.type} value={identity[f.key as keyof typeof identity]} onChange={e => setIdentity(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ ...inputStyle, minHeight: "44px", fontSize: "16px" }}
                              onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                              onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
                            />
                          </div>
                        ))}
                        <div className="sm:col-span-2">
                          <label style={labelStyle}>Initial observations (optional)</label>
                          <textarea value={identity.notes} onChange={e => setIdentity(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Where is institutional signal, governance reliability, or trust becoming unstable?" style={{ ...inputStyle, resize: "none", lineHeight: 1.75, minHeight: "44px", fontSize: "16px" }}
                            onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                            onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
                          />
                        </div>
                      </div>
                    </details>
                  </div>

                  {showResume ? (
                    <div style={{ marginTop: "1.5rem", padding: "1.25rem", border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}06` }}>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: `${GOLD}90` }}>
                        Resume your assessment?
                      </div>
                      <p style={{ marginTop: "0.6rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.46)" }}>
                        A saved enterprise reading is available on this device.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={resumeDraft} style={{ padding: "10px 18px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                          Resume
                        </button>
                        <button type="button" onClick={discardDraft} style={{ padding: "10px 18px", border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "transparent", color: "rgba(255,255,255,0.42)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", cursor: "pointer" }}>
                          Start fresh
                        </button>
                      </div>
                    </div>
                  ) : null}

                  {/* Challenge card — after recent decision input */}
                  {challenge && (
                    <div style={{ marginTop: "1.25rem" }}>
                      <DecisionChallengeCard
                        challenge={challenge}
                        onRevise={() => setChallenge(null)}
                        onAccept={() => { setChallenge(null); advance("instrument"); }}
                      />
                    </div>
                  )}

                  <button type="button" onClick={async () => {
                    if (!recentDecisionReady) return;
                    const hit = await runEnterpriseChallenge("enterprise_problem");
                    if (hit) return; // challenge card visible — user clicks Accept or Revise
                    advance("instrument");
                  }} disabled={!recentDecisionReady} style={{ marginTop: "1.75rem", padding: "13px 28px", border: `1px solid ${recentDecisionReady ? `${GOLD}42` : "rgba(255,255,255,0.06)"}`, backgroundColor: recentDecisionReady ? `${GOLD}10` : "rgba(255,255,255,0.01)", color: recentDecisionReady ? `${GOLD}CC` : "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: recentDecisionReady ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
                    onMouseEnter={e => { if (recentDecisionReady) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }}
                    onMouseLeave={e => { if (recentDecisionReady) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}
                  >
                    Test whether the condition is institutional <ArrowRight style={{ width: "12px", height: "12px" }} />
                  </button>
                </div>
              </motion.div>
            )}

            {/* INSTRUMENT */}
            {phase === "instrument" && (
              <motion.div key="instrument" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.45 }}>
                <div className="py-14">
                  <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
                    {/* Questions */}
                    <div>
                      <Eyebrow>Enterprise instrument</Eyebrow>
                      <div style={{ marginTop: "0.75rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                        Block {instrumentPage * 2 + 1}–{Math.min(instrumentPage * 2 + 2, BLOCKS.length)} of {BLOCKS.length}
                      </div>
                      <h2 style={{ marginTop: "1.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", lineHeight: 1.0, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)", marginBottom: "0.75rem" }}>Rate the institutional condition.</h2>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.70, color: "rgba(255,255,255,0.38)", fontStyle: "italic", maxWidth: "48ch", marginBottom: "2rem" }}>
                        Answer for the actual current condition — not aspirations. 1 = Strongly no. 5 = Strongly yes.
                      </p>

                      <div className="space-y-4">
                        {visibleBlocks.map(block => {
                          const blockAnswered = [0, 1, 2].filter(i => isAnswered(answers[`${block.id}-${i}`])).length;
                          return (
                            <div key={block.id} style={{ border: "1px solid rgba(255,255,255,0.062)", backgroundColor: "rgb(5 5 7)" }}>
                              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div>
                                  <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.10rem", color: "rgba(255,255,255,0.80)" }}>{block.title}</span>
                                  <span style={{ marginLeft: "0.75rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>{block.domain}</span>
                                </div>
                                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: blockAnswered === 3 ? "rgba(110,231,183,0.60)" : "rgba(255,255,255,0.18)" }}>{blockAnswered}/3</span>
                              </div>
                              <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                                {block.prompts.map((prompt, idx) => {
                                  const key = `${block.id}-${idx}`;
                                  const val = answers[key] ?? defaultAxisAnswer();
                                  return (
                                    <div key={key} style={{ padding: "1rem 1.5rem" }}>
                                      <DualAxisPromptCard
                                        domainLabel={block.domain}
                                        statement={prompt}
                                        value={val}
                                        touched={isAnswered(answers[key])}
                                        onChange={(next) => setAnswer(key, next)}
                                      />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Adaptive free-text questions from spine */}
                      {showAdaptive && adaptiveQuestions.length > 0 && (
                        <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: "rgb(10,14,20)", padding: "1.5rem", marginTop: "1.5rem" }}>
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.36em", textTransform: "uppercase", color: `${GOLD}80` }}>
                            Structural evidence — from your specific decision
                          </span>
                          <p style={{ marginTop: "0.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>
                            These questions test whether the current decision pattern is institutional rather than local.
                          </p>
                          <div className="mt-4 space-y-4">
                            {adaptiveQuestions.map((q) => (
                              <div key={q.id}>
                                <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: q.purpose === "challenge" ? "rgba(252,165,165,0.50)" : "rgba(255,255,255,0.30)", marginBottom: "0.4rem" }}>
                                  {q.prompt}
                                </label>
                                <textarea
                                  value={adaptiveAnswers[q.id] ?? ""}
                                  onChange={(e) => setAdaptiveAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                                  rows={2}
                                  placeholder="Be specific to your situation."
                                  style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.09)", padding: "8px 10px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.70)", resize: "none", outline: "none" }}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {challenge && (
                        <div style={{ marginTop: "1.5rem" }}>
                          <DecisionChallengeCard
                            challenge={challenge}
                            onRevise={() => setChallenge(null)}
                            onAccept={() => {
                              setChallenge(null);
                              if (instrumentPage === 0) {
                                setInstrumentPage(1);
                                window.scrollTo({ top: 0, behavior: "smooth" });
                                return;
                              }
                              if (adaptiveQuestions.length > 0 && !showAdaptive) {
                                setShowAdaptive(true);
                                return;
                              }
                              advance("result");
                            }}
                          />
                        </div>
                      )}

                      <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button type="button" onClick={() => advance("identity")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <ArrowLeft style={{ width: "11px", height: "11px" }} /> Back
                        </button>
                        <div style={{ textAlign: "center" }}>
                          {!instrumentGroupComplete && <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.5rem" }}>Answer all 6 questions on this screen to continue</p>}
                          <button type="button" onClick={() => {
                            if (!instrumentGroupComplete) return;
                            if (instrumentPage === 0) {
                              const integrityHit = detectDualAxisIntegrityChallenge({ answers: Object.fromEntries(visibleBlocks.flatMap((block) => [0,1,2].map((idx) => [`${block.id}-${idx}`, answers[`${block.id}-${idx}`] ?? defaultAxisAnswer()]))) as Record<string, DualAxisAnswer>, minimumAnswers: 6, startedAt: startedAtRef.current, submittedAt: Date.now() });
                              if (integrityHit) { setChallenge(integrityHit); return; }
                              setInstrumentPage(1);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                              return;
                            }
                            if (!complete) return;
                            if (adaptiveQuestions.length > 0 && !showAdaptive) { setShowAdaptive(true); return; }
                            advance("result");
                          }} disabled={!instrumentGroupComplete}
                            style={{ padding: "11px 24px", border: `1px solid ${instrumentGroupComplete ? `${GOLD}42` : "rgba(255,255,255,0.06)"}`, backgroundColor: instrumentGroupComplete ? `${GOLD}10` : "rgba(255,255,255,0.01)", color: instrumentGroupComplete ? `${GOLD}CC` : "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: instrumentGroupComplete ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
                            onMouseEnter={e => { if (instrumentGroupComplete) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }}
                            onMouseLeave={e => { if (instrumentGroupComplete) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}
                          >
                            {instrumentPage === 0 ? "Continue to remaining domains" : showAdaptive ? "Generate enterprise reading" : adaptiveQuestions.length > 0 ? "Add structural evidence" : "Generate enterprise reading"} <ArrowRight style={{ width: "11px", height: "11px" }} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Live signal sidebar */}
                    <div className="hidden lg:block">
                      <div style={{ position: "sticky", top: "5rem" }} className="space-y-3">
                        <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}06` }}>
                          <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1px solid ${GOLD}10` }}><Eyebrow>Live signal</Eyebrow></div>
                          <div style={{ padding: "1rem 1.25rem" }}>
                            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "2.5rem", lineHeight: 1, color: GOLD, marginBottom: "0.4rem" }}>{answeredCount > 0 ? `${totalPct}%` : "—"}</div>
                            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "1rem" }}>{answeredCount > 0 ? bandFromPct(totalPct).toUpperCase() : "Awaiting answers"}</div>
                            <div className="space-y-2.5">
                              {sections.map(s => {
                                const c = s.pct >= 65 ? "rgba(110,231,183,0.65)" : s.pct >= 40 ? `${GOLD}80` : s.pct > 0 ? "rgba(252,165,165,0.65)" : "rgba(255,255,255,0.12)";
                                return (
                                  <div key={s.id}>
                                    <div className="flex justify-between mb-1">
                                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>{s.id}</span>
                                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", color: c }}>{s.pct > 0 ? `${s.pct}%` : "—"}</span>
                                    </div>
                                    <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                      <motion.div style={{ height: "100%", backgroundColor: c }} animate={{ width: `${Math.max(0, s.pct)}%` }} transition={{ duration: 0.4 }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <div style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.008)", padding: "1rem" }}>
                          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>This is the final diagnostic layer before Executive Reporting. Answer for the actual condition — not the aspiration.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* RESULT */}
            {phase === "result" && reading && (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <div className="py-14">
                  <ResultSurface reading={reading} sections={sections} totalScore={totalScore} maxScore={maxScore} totalPct={totalPct} teamAlignmentPct={teamAlignmentPct} submitResult={submitResult} onSubmit={handleSubmit} isSubmitting={isSubmitting} onRevise={() => advance("instrument")} constitutionalThread={constitutionalThread} matchedPlaybooks={matchedPlaybooks} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── CLOSE ─────────────────────────────────────────────────────── */}
        {phase === "identity" && (
          <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6" style={{ background: `linear-gradient(to right, ${GOLD}30, transparent)` }} />
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Layer 03 of 04</span>
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/diagnostics" className="transition-opacity hover:opacity-70" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Diagnostic ladder</Link>
                  <Link href="/diagnostics/executive-reporting" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>
                    Executive Reporting <ChevronRight style={{ width: "10px", height: "10px" }} />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </Layout>
  );
}


export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };

};
