/* eslint-disable @typescript-eslint/no-explicit-any */
// components/alignment/PurposeAlignmentAssessment.tsx
// Design: Institutional Monumentalism with Pattern-Breaker Enforcement
// Status: PRIMARY DIAGNOSTIC SURFACE with contract binding
//
// Architecture:
// - Deterministic scoring backbone
// - Synthesis engine via derivePatternReading
// - Pattern-Breaker Contract for enforcement
// - Memory interrupt for returning users
// - Demographic capture for peer intelligence
// - Verification scheduling and breach tracking
//
// UPGRADES INTEGRATED (v2.0):
// 1. Agentic Execution Bridge — execution-engine.ts
// 2. Context Graph / Decision Trace — enhanced-types.ts
// 3. Organizational Pattern Aggregation — organization-engine.ts
// 4. Behavioral Data Integration — behavioral-integration.ts
// 5. Tournament Architecture — tournament-engine.ts
// 6. Real-Time Progress Dashboard — ContractDashboard (inline)
// 7. Pattern Observatory — PatternObservatory.tsx

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Shield,
  Target,
  Activity,
  Heart,
  Landmark,
  AlertTriangle,
  CheckSquare,
  Lock,
  TrendingUp,
  Users,
  Briefcase,
  Calendar,
  MessageSquare,
  GitBranch,
  BarChart3,
  Crown,
  Globe,
  UserPlus,
  Zap,
  Clock,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import {
  PURPOSE_ALIGNMENT_QUESTIONS,
  ALIGNMENT_DOMAIN_ORDER,
  ALIGNMENT_DOMAIN_LABELS,
} from "@/lib/alignment/checklist";
import { getOrCreateSubjectId } from "@/lib/diagnostics/subject-id";
import { scorePurposeProfile, extractPurposeTensions } from "@/lib/alignment/scoring";
import { mergeAndSaveTensions } from "@/lib/diagnostics/thread-engine";
import type {
  AlignmentDomain,
  DualAxisAnswer,
  PurposeProfileResult,
  CoherenceBand,
} from "@/lib/alignment/types";
import { track } from "@/lib/analytics/track";
import { derivePatternReading, type PatternReading, type ScoredStatement } from "@/lib/alignment/pattern-reading-engine";
import { GOLD, BASE, LIFT, STAGE_DOMAINS, STAGE_LABELS, STAGE_INTROS, BAND_CONFIG } from "@/lib/alignment/assessment-theme";
import ResultInterruption from "@/components/diagnostics/results/ResultInterruption";
import ResultCondition from "@/components/diagnostics/results/ResultCondition";
import ResultContradiction from "@/components/diagnostics/results/ResultContradiction";
import ResultTrajectory from "@/components/diagnostics/results/ResultTrajectory";
import SystemMemoryBlock from "@/components/diagnostics/results/SystemMemoryBlock";
import ResultDecision from "@/components/diagnostics/results/ResultDecision";
import ResultAction from "@/components/diagnostics/results/ResultAction";
import ResultDiagnostics from "@/components/diagnostics/results/ResultDiagnostics";
import LongitudinalIntelligence from "@/components/diagnostics/results/LongitudinalIntelligence";
import OutcomeVerification from "@/components/diagnostics/results/OutcomeVerification";
import FreeLayerBoundary from "@/components/diagnostics/results/FreeLayerBoundary";
import DecisionGradeBlocks from "@/components/diagnostics/results/DecisionGradeBlocks";
import LadderProgressionGate from "@/components/diagnostics/results/LadderProgressionGate";
import { buildPurposeDecisionObject } from "@/lib/diagnostics/decision-engine";
import EvidenceChainSurface from "@/components/diagnostics/results/EvidenceChainSurface";
import ProductAdvantageBlocks from "@/components/diagnostics/results/ProductAdvantageBlocks";
import { buildPurposeResult } from "@/lib/diagnostics/assessment-result-builders";
import { detectSignal } from "@/lib/diagnostics/signal-detector";
// useInstitutionalLayers removed — wired via spine guard when needed

// Pattern-Breaker Contract imports
import { PatternBreakerContract } from "@/components/alignment/PatternBreakerContract";
import { PastContractInterrupt } from "@/components/alignment/PastContractInterrupt";
import { getMostRecentContract, processDueVerifications } from "@/lib/alignment/contract-engine";
import type { PatternBreakerContract as ContractType } from "@/lib/alignment/contract-types";

// Demographic context component imports
import { DemographicContextCapture } from "@/components/alignment/DemographicContextCapture";

// ═════════════════════════════════════════════════════════════════════════════
// UPGRADE 1: Agentic Execution Bridge
// ═════════════════════════════════════════════════════════════════════════════
import {
  saveExecutionTrace,
  getExecutionTrace,
  getExecutionTraces,
  updateProgress,
  processDueCheckins,
  reportProgress,
  requestExtension,
} from "@/lib/alignment/execution-engine";
import type { ExecutionTrace, MicroCheckin } from "@/lib/alignment/enhanced-types";

// ═════════════════════════════════════════════════════════════════════════════
// UPGRADE 2: Context Graph / Decision Trace types
// ═════════════════════════════════════════════════════════════════════════════
import type {
  DecisionTrace,
  OrganizationContext,
  BehavioralDataSource,
  TournamentResult,
  GlobalTrends,
} from "@/lib/alignment/enhanced-types";

// ═════════════════════════════════════════════════════════════════════════════
// UPGRADE 3: Organizational Pattern Aggregation
// ═════════════════════════════════════════════════════════════════════════════
import {
  createOrganization,
  joinOrganization,
  refreshOrganizationAnalytics,
} from "@/lib/alignment/organization-engine";

// ═════════════════════════════════════════════════════════════════════════════
// UPGRADE 4: Behavioral Data Integration
// ═════════════════════════════════════════════════════════════════════════════
import {
  saveBehavioralConnection,
  getBehavioralConnections,
  verifyWithBehavioralData,
  connectGoogleCalendar,
  connectSlack,
} from "@/lib/alignment/behavioral-integration";

// ═════════════════════════════════════════════════════════════════════════════
// UPGRADE 5: Tournament Architecture
// ═════════════════════════════════════════════════════════════════════════════
import { runTournament } from "@/lib/alignment/tournament-engine";

// ═════════════════════════════════════════════════════════════════════════════
// UPGRADE 7: Pattern Observatory
// ═════════════════════════════════════════════════════════════════════════════
import { PatternObservatory } from "@/components/alignment/PatternObservatory";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

// Design tokens and constants imported from lib/alignment/assessment-theme.ts

const DOMAIN_ICONS: Record<AlignmentDomain, React.ComponentType<{ style?: React.CSSProperties }>> = {
  identity:        Shield,
  decision:        Target,
  environment:     Activity,
  behaviour:       CheckSquare,
  emotional_order: Heart,
  legacy:          Landmark,
};

// BAND_CONFIG imported from lib/alignment/assessment-theme.ts
// Pattern reading engine imported from lib/alignment/pattern-reading-engine.ts

// derivePatternReading is now imported from lib/alignment/pattern-reading-engine.ts
// This legacy inline version is kept only as a type-check reference and will be removed.
function _legacyDerivePatternReading(
  answers: Record<string, DualAxisAnswer>,
  result: PurposeProfileResult,
): PatternReading {
  if (result.primaryPattern && result.reportNarrative) {
    return {
      primaryPattern: [
        result.reportNarrative.conditionStatement,
        result.reportNarrative.classificationExplanation,
        result.reportNarrative.contradictionExplanation,
        result.reportNarrative.consequenceBlock,
        result.reportNarrative.nextStepBlock,
      ].join(" "),
      patternTitle: result.primaryPattern.label,
      urgentStatement: result.evidence?.sharpestWeakSignal
        ? `"${result.evidence.sharpestWeakSignal.statement}" — ${result.evidence.sharpestWeakSignal.resonance}/10 resonance with ${result.evidence.sharpestWeakSignal.certainty}/10 certainty. This is the sharpest weak evidence in the profile.`
        : null,
      uncertaintyNote: result.contradictions?.length
        ? result.contradictions.map((item) => item.evidence).join(" ")
        : null,
      firstAction: result.firstAction ?? result.reportNarrative.firstActionBlock,
      escalationNote: result.routingRecommendation?.reason ?? result.reportNarrative.nextStepBlock,
      weakestDomain: result.weakestDomains[0] ?? "identity",
      sharpestSignal: result.evidence?.sharpestWeakSignal,
    };
  }

  // Score every answered statement
  const scored: ScoredStatement[] = PURPOSE_ALIGNMENT_QUESTIONS
    .filter(q => answers[q.id])
    .map(q => {
      const a = answers[q.id]!;
      return {
        id:        q.id,
        domain:    q.domain,
        statement: q.statement,
        resonance: a.resonance,
        certainty: a.certainty,
        weighted:  a.resonance * (a.certainty / 10),
        gap:       a.resonance - a.certainty,
      };
    });

  // Find the single lowest-weighted statement
  const lowest = [...scored].sort((a, b) => a.weighted - b.weighted)[0] ?? null;

  // Find statements where certainty >> resonance (acknowledged problem)
  const acknowledgedProblems = scored
    .filter(s => s.resonance < 5 && s.certainty >= 6)
    .sort((a, b) => a.resonance - b.resonance);

  // Find statements where resonance >> certainty (unexamined assumption)
  const unexaminedWeakness = scored
    .filter(s => s.resonance <= 5 && s.certainty <= 4)
    .sort((a, b) => a.weighted - b.weighted);

  const weakestDomain = result.weakestDomains[0] ?? "identity";
  const secondWeakest  = result.weakestDomains[1] ?? "decision";

  // Pattern: where are both weakness domains?
  const bothDrifting  = result.domainProfiles.filter(d => d.percent < 40).length;
  const highVariance  = result.domainProfiles.some(d => d.percent >= 70) &&
                        result.domainProfiles.some(d => d.percent < 40);

  let primaryPattern = "";
  let patternTitle   = "";

  const strongest = [...scored].sort((a, b) => b.weighted - a.weighted)[0] ?? null;

  const wkPct = result.domainProfiles.find(d => d.domain === weakestDomain)?.percent ?? 0;
  const skPct = result.domainProfiles.find(d => d.domain === secondWeakest)?.percent ?? 0;
  const bandWord = result.coherenceBand === "FRAGMENTED" ? "fragmented" : result.coherenceBand === "DRIFTING" ? "drifting" : result.coherenceBand === "ALIGNED" ? "aligned" : "sovereign";

  if (weakestDomain === "identity" || weakestDomain === "decision") {
    if (weakestDomain === "identity" && secondWeakest === "decision") {
      patternTitle   = "Mandate without architecture";
      primaryPattern = `Your alignment reads as ${bandWord}. This is not a motivation problem or a capability problem — it is a direction problem. Identity scored ${wkPct}% and Decision Integrity scored ${skPct}%. Together, these create a specific condition: decisions are being made, but not from a coherent centre. The downstream effect is predictable — where time and money go will keep drifting from what you say matters.`;
    } else if (weakestDomain === "identity") {
      patternTitle   = "Unclear mandate driving downstream confusion";
      primaryPattern = `Your alignment reads as ${bandWord}, with Identity & Mandate at ${wkPct}% — the lowest in your profile. This is the root layer. When identity is unclear, everything downstream becomes harder to prioritise. The pattern is not poor decisions individually — it is decisions that do not cohere over time, because they are not anchored to a stable mandate.`;
    } else {
      patternTitle   = "Principled intent, pressure-driven execution";
      primaryPattern = `Your alignment reads as ${bandWord}. You know what you stand for — Identity is relatively strong — but Decision Integrity scored ${wkPct}%. This is the pattern of someone whose values are clear but whose recent decisions do not reflect them under pressure. The gap between stated principle and actual choices is the structural problem.`;
    }
  } else if (weakestDomain === "environment" || weakestDomain === "behaviour") {
    if (weakestDomain === "environment" && secondWeakest === "behaviour") {
      patternTitle   = "Environmental drag producing behavioural erosion";
      primaryPattern = `Your alignment reads as ${bandWord}. Environment scored ${wkPct}% and Behaviour scored ${skPct}%. The environment is not reinforcing your direction — and the behavioural evidence confirms it. Even clear intention will struggle to hold when operating conditions produce friction faster than discipline can absorb.`;
    } else if (weakestDomain === "environment") {
      patternTitle   = "Environment working against direction";
      primaryPattern = `Your alignment reads as ${bandWord}, with Environmental Alignment at ${wkPct}%. The relationships, inputs, and operating contexts around you are not reinforcing your stated direction. This is a structural problem, not a willpower problem. You cannot consistently outperform an environment that is working against you.`;
    } else {
      patternTitle   = "Declared priorities not reflected in daily operation";
      primaryPattern = `Your alignment reads as ${bandWord}. Operational Behaviour scored ${wkPct}% — the most observable domain in the system. The calendar, habits, and measurable output are not tracking with stated purpose. This is where intention meets evidence: it shows up in how time is actually spent.`;
    }
  } else if (weakestDomain === "emotional_order") {
    patternTitle   = "Internal instability constraining strategic capacity";
    primaryPattern = `Your alignment reads as ${bandWord}, with Emotional & Internal Order at ${wkPct}%. Under-regulation here is expensive — reactive decisions, dependency on external validation, slow recovery from disruption. These costs do not appear on any report but they determine the quality of everything else.`;
  } else if (weakestDomain === "legacy") {
    patternTitle   = "Operating in the immediate at the expense of the structural";
    primaryPattern = `Your alignment reads as ${bandWord}, with Legacy Orientation at ${wkPct}%. The operating posture is weighted toward managing the present rather than building what outlasts it. This is a sequencing problem, not a character one — but without correction, tactical competence will continue to substitute for strategic architecture.`;
  } else {
    patternTitle   = "Distributed misalignment across multiple domains";
    primaryPattern = `Your alignment reads as ${bandWord}. Misalignment is distributed across domains rather than concentrated in one. There is no single root cause, which makes correction harder. The work is sequential: stabilise Identity first, then Decision Integrity, then the operational domains.`;
  }

  if (highVariance) {
    primaryPattern += ` The significant gap between your strongest and weakest domains reveals that your alignment is situational — performing well in some areas while operating from misalignment in others. That inconsistency is itself the tension.`;
  }

  if (lowest && strongest && lowest.id !== strongest.id) {
    const mirrorBack = ` Your sharpest weak signal is "${lowest.statement}" (${lowest.weighted.toFixed(1)} weighted). Your strongest signal is "${strongest.statement}" (${strongest.weighted.toFixed(1)} weighted). The distance between those two points defines your current operating condition.`;
    primaryPattern += mirrorBack;
  }

  let urgentStatement: string | null = null;
  if (lowest && lowest.weighted < 3) {
    urgentStatement = `"${lowest.statement}" — you scored ${lowest.resonance}/10 resonance with ${lowest.certainty}/10 certainty. This is not a soft weakness. It is the point where your alignment is most visibly failing.`;
  }

  let uncertaintyNote: string | null = null;
  if (unexaminedWeakness.length > 0 && acknowledgedProblems.length === 0) {
    const q = unexaminedWeakness[0]!;
    uncertaintyNote = `You scored low on "${q.statement}" — but with low certainty. You are not sure how bad this is. That uncertainty is more dangerous than a known weakness, because you cannot correct what you have not yet seen clearly.`;
  } else if (acknowledgedProblems.length > 0) {
    const q = acknowledgedProblems[0]!;
    uncertaintyNote = `You scored "${q.statement}" at ${q.resonance}/10 resonance with ${q.certainty}/10 certainty. You know this is failing. That clarity is an asset — acknowledged problems can be corrected. Unexamined ones compound.`;
  }

  const actionMap: Record<AlignmentDomain, string> = {
    identity:        "Rewrite your current mandate in one sentence. Not what you want it to be — what it actually is, evidenced by how your last 30 days have been spent. Then identify one commitment that contradicts it.",
    decision:        "Retrieve the last five decisions of consequence you made in the past 60 days. For each one, note whether it was made from principle or from pressure. The pattern is the diagnosis.",
    environment:     "List every regular input — relationships, information sources, recurring meetings — that produced confusion, doubt, or diffusion of focus in the last quarter. Remove the highest-cost one.",
    behaviour:       "Open your calendar for the last two weeks and mark every block that directly served your stated long-term outcomes. Everything else is the gap between intention and operation.",
    emotional_order: "Track your response time and decision quality under stress for seven consecutive days. Do not attempt to change anything yet — the first step is accurate observation, not correction.",
    legacy:          "Name the one structure — not a goal, a structure — that you are building which must outlast your current season. If you cannot name it, that is the diagnosis.",
  };

  const firstAction = actionMap[weakestDomain];

  let escalationNote = "";
  if (result.coherenceBand === "FRAGMENTED" || result.coherenceBand === "DRIFTING") {
    escalationNote = "The Constitutional Diagnostic will surface whether this misalignment extends into the operating structure of the organisation — or whether it is contained at the individual level. Run it before taking strategic action.";
  } else if (result.coherenceBand === "ALIGNED") {
    escalationNote = "The Team Assessment will verify whether your alignment translates across the people carrying your organisation's direction. Individual alignment that does not propagate is a governance problem.";
  } else {
    escalationNote = "At sovereign alignment, the Team Assessment surfaces whether the people around you are operating at the same standard — or whether there is a gap between your clarity and the organisation's execution.";
  }

  return { 
    primaryPattern, 
    patternTitle, 
    urgentStatement, 
    uncertaintyNote, 
    firstAction, 
    escalationNote,
    weakestDomain,
    sharpestSignal: lowest ? { statement: lowest.statement, resonance: lowest.resonance, certainty: lowest.certainty } : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-4 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7.5px", letterSpacing: "0.40em", textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DUAL-AXIS RATING — the core input instrument
// ─────────────────────────────────────────────────────────────────────────────

const RESONANCE_ANCHORS: Record<number, string> = {
  0: "Completely untrue", 2: "Mostly untrue", 4: "Slightly untrue",
  5: "Neutral", 6: "Slightly true", 8: "Mostly true", 10: "Completely true",
};

const CERTAINTY_ANCHORS: Record<number, string> = {
  0: "No confidence", 3: "Some doubt", 5: "Moderate",
  7: "Confident", 10: "Absolute certainty",
};

function getAnchor(value: number, map: Record<number, string>): string {
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b);
  let closest = keys[0]!;
  for (const k of keys) {
    if (Math.abs(k - value) <= Math.abs(closest - value)) closest = k;
  }
  return map[closest] ?? "";
}

function DualAxisInput({
  questionId,
  statement,
  domain,
  answer,
  onChange,
}: {
  questionId: string;
  statement:  string;
  domain:     AlignmentDomain;
  answer:     DualAxisAnswer | undefined;
  onChange:   (field: "resonance" | "certainty", v: number) => void;
}) {
  const Icon = DOMAIN_ICONS[domain];
  const resonance = answer?.resonance ?? 5;
  const certainty = answer?.certainty ?? 5;
  const weighted  = Math.round(resonance * (certainty / 10));

  const wColor = weighted >= 6 ? "rgba(110,231,183,0.75)"
               : weighted >= 4 ? `${GOLD}AA`
               : weighted >= 2 ? "rgba(253,186,116,0.80)"
               : "rgba(252,165,165,0.80)";

  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.062)",
      backgroundColor: "rgb(5 5 7)",
      padding: "1.5rem 1.75rem",
    }}>
      <div className="flex items-start gap-3 mb-5">
        <Icon style={{ width: "14px", height: "14px", color: `${GOLD}70`, flexShrink: 0, marginTop: "4px" }} />
        <div className="flex-1">
          <div style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "6.5px", letterSpacing: "0.30em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.22)", marginBottom: "0.4rem",
          }}>
            {ALIGNMENT_DOMAIN_LABELS[domain]}
          </div>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.60,
            color: "rgba(255,255,255,0.80)",
          }}>
            {statement}
          </p>
        </div>
        <div style={{
          flexShrink: 0, textAlign: "center", padding: "0.4rem 0.6rem",
          border: "1px solid rgba(255,255,255,0.07)",
          backgroundColor: "rgba(255,255,255,0.01)",
        }}>
          <div style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "1.4rem", lineHeight: 1, color: wColor,
          }}>
            {weighted}
          </div>
          <div style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "6px", letterSpacing: "0.20em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.18)",
          }}>
            /10
          </div>
        </div>
      </div>

      <div className="space-y-5 pl-5">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase",
              color: `${GOLD}90`,
            }}>
              Resonance
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px", letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.45)",
            }}>
              {resonance}/10 · {getAnchor(resonance, RESONANCE_ANCHORS)}
            </span>
          </div>
          <input
            type="range" min={0} max={10} step={1} value={resonance}
            onChange={e => onChange("resonance", Number(e.target.value))}
            style={{ width: "100%", height: "2px", cursor: "pointer", accentColor: GOLD }}
          />
          <div className="flex justify-between mt-1">
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Not true</span>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" }}>How true is this right now?</span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Completely true</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase",
              color: "rgba(110,231,183,0.70)",
            }}>
              Certainty
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px", letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.45)",
            }}>
              {certainty}/10 · {getAnchor(certainty, CERTAINTY_ANCHORS)}
            </span>
          </div>
          <input
            type="range" min={0} max={10} step={1} value={certainty}
            onChange={e => onChange("certainty", Number(e.target.value))}
            style={{ width: "100%", height: "2px", cursor: "pointer", accentColor: "rgb(110,231,183)" }}
          />
          <div className="flex justify-between mt-1">
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Uncertain</span>
            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" }}>How confident are you in that score?</span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Certain</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE PROFILE SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

function LiveProfileSidebar({ profile, totalAnswered, totalQuestions }: {
  profile: PurposeProfileResult | null;
  totalAnswered: number;
  totalQuestions: number;
}) {
  const progress = Math.round((totalAnswered / totalQuestions) * 100);

  return (
    <div className="space-y-3">
      <div style={{
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.01)",
        padding: "1rem 1.25rem",
      }}>
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
            Progress
          </span>
          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)" }}>
            {totalAnswered}/{totalQuestions}
          </span>
        </div>
        <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, backgroundColor: `${GOLD}80`, transition: "width 400ms ease" }} />
        </div>
      </div>

      {profile ? (
        <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}06` }}>
          <div style={{ padding: "0.75rem 1.25rem", borderBottom: `1px solid ${GOLD}10` }}>
            <div className="flex items-center justify-between">
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: `${GOLD}90` }}>
                Live profile
              </span>
              <span style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300, fontSize: "1.5rem", lineHeight: 1,
                color: BAND_CONFIG[profile.coherenceBand].text,
              }}>
                {profile.percent}%
              </span>
            </div>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase",
              color: BAND_CONFIG[profile.coherenceBand].text, opacity: 0.80,
            }}>
              {BAND_CONFIG[profile.coherenceBand].label}
            </span>
          </div>
          <div style={{ padding: "0.75rem 1.25rem" }}>
            {profile.domainProfiles.map(dp => {
              const Icon = DOMAIN_ICONS[dp.domain];
              const barColor = dp.percent >= 65 ? "rgba(110,231,183,0.65)"
                             : dp.percent >= 40 ? `${GOLD}80`
                             : "rgba(252,165,165,0.65)";
              return (
                <div key={dp.domain} className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Icon style={{ width: "10px", height: "10px", color: "rgba(255,255,255,0.25)" }} />
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                        {dp.label}
                      </span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", color: "rgba(255,255,255,0.55)" }}>
                      {dp.percent}%
                    </span>
                  </div>
                  <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", backgroundColor: barColor }}
                      animate={{ width: `${Math.max(2, dp.percent)}%` }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.008)", padding: "1.25rem" }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>
            This will expose the decision and price the consequence. No preparation required. Takes 3–6 minutes.
          </p>
        </div>
      )}

      <div style={{ border: "1px solid rgba(255,255,255,0.04)", backgroundColor: "rgba(255,255,255,0.005)", padding: "1rem 1.25rem" }}>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.65, color: "rgba(255,255,255,0.25)", fontStyle: "italic" }}>
          This is not a personality test. It scores how aligned your decisions, environment, and behaviour actually are with what you say matters — then forces one binding commitment.
        </p>
      </div>

      <div style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.005)", padding: "1rem 1.25rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.65rem" }}>
          How scoring works
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.65, color: "rgba(255,255,255,0.30)" }}>
          Score = Resonance × (Certainty ÷ 10). High resonance with low certainty produces a lower weighted score — uncertainty about a domain is structural information, not just hesitation.
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTHORITY RESULT SURFACE — 10-block architecture with Contract Binding
// ─────────────────────────────────────────────────────────────────────────────

function AuthorityResultSurface({
  result,
  answers,
  reflections,
  demographicContext,
  executionTrace,
  setExecutionTrace,
  tournamentResult,
  behavioralConnections,
  setBehavioralConnections,
  organizationContext,
  setOrganizationContext,
  orgNameInput,
  setOrgNameInput,
  orgInviteCode,
  setOrgInviteCode,
  showPatternObservatory,
  setShowPatternObservatory,
  isPremium,
  setIsPremium,
  onRestart,
}: {
  result: PurposeProfileResult;
  answers: Record<string, DualAxisAnswer>;
  reflections: { avoidedDecision: string; lastSevenDays: string; dissenter: string };
  demographicContext: { role: string; industry: string; teamSize: string; yearsInRole: string } | null;
  executionTrace: ExecutionTrace | null;
  setExecutionTrace: (trace: ExecutionTrace | null) => void;
  tournamentResult: TournamentResult | null;
  behavioralConnections: BehavioralDataSource[];
  setBehavioralConnections: (connections: BehavioralDataSource[]) => void;
  organizationContext: OrganizationContext | null;
  setOrganizationContext: (ctx: OrganizationContext | null) => void;
  orgNameInput: string;
  setOrgNameInput: (val: string) => void;
  orgInviteCode: string;
  setOrgInviteCode: (val: string) => void;
  showPatternObservatory: boolean;
  setShowPatternObservatory: (val: boolean) => void;
  isPremium: boolean;
  setIsPremium: (val: boolean) => void;
  onRestart: () => void;
}) {
  const pattern = derivePatternReading(answers, result);
  const narrative = result.reportNarrative;
  const evidence = result.evidence;
  
  // Contract state
  const [showContract, setShowContract] = React.useState(false);
  const [contractCompleted, setContractCompleted] = React.useState(false);
  const [contractSkipped, setContractSkipped] = React.useState(false);
  
  // Memory interrupt state
  const [hasCheckedMemory, setHasCheckedMemory] = React.useState(false);
  const [pastContract, setPastContract] = React.useState<ContractType | null>(null);
  
  // Check for past contracts on mount
  React.useEffect(() => {
    const subjectId = getOrCreateSubjectId();
    const recent = getMostRecentContract(subjectId);
    setPastContract(recent);
    setHasCheckedMemory(true);
    
    // Process any due verifications
    processDueVerifications();
  }, []);

  const interruptionLine = narrative?.conditionStatement
    ?? pattern.primaryPattern.slice(0, 200)
    ?? (result.percent >= 70
      ? "Alignment is not the problem. The decision you are avoiding is."
      : result.percent >= 45
        ? "You are not misaligned. You are structurally undecided."
        : "This is not drift. This is a mandate that was never built.");

  const contradictionEvidence: Array<{ scoreLabel: string; scoreValue: string; textEvidence: string; contradictionType: string }> = [];

  if (evidence?.sharpestWeakSignal) {
    const ws = evidence.sharpestWeakSignal;
    contradictionEvidence.push({
      scoreLabel: "Weakest signal",
      scoreValue: `${ws.domain}: resonance ${ws.resonance}/10, certainty ${ws.certainty}/10`,
      textEvidence: `"${ws.statement}"`,
      contradictionType: "score_vs_reality",
    });
  }

  const decisionDomain = result.domainProfiles.find((d) => d.domain === "decision");
  if (reflections.avoidedDecision && decisionDomain && decisionDomain.percent >= 50) {
    contradictionEvidence.push({
      scoreLabel: "Decision Integrity",
      scoreValue: `${decisionDomain.percent}%`,
      textEvidence: `You also stated you are avoiding: "${reflections.avoidedDecision}"`,
      contradictionType: "score_vs_stated",
    });
  }

  if (result.contradictions) {
    for (const c of result.contradictions.slice(0, 2)) {
      contradictionEvidence.push({
        scoreLabel: c.type.replace(/_/g, " "),
        scoreValue: `Severity: ${c.severity}`,
        textEvidence: c.evidence,
        contradictionType: c.type,
      });
    }
  }

  const trajectoryConsequences = [
    pattern.primaryPattern.includes("consequence") ? pattern.primaryPattern.split("consequence")[1]?.slice(0, 150) : "The current pattern will persist unless directly addressed.",
    ...(result.corrections?.slice(0, 2) ?? []),
  ].filter(Boolean);

  const extractedDecision = reflections.avoidedDecision || pattern.firstAction || "";
  const decisionObject = buildPurposeDecisionObject({
    result,
    context: { reflections },
  });

  const actionSteps = [
    { step: pattern.firstAction, timeframe: "Today" },
    ...(result.nextActions?.slice(1, 3) ?? []).map((a) => ({ step: a, timeframe: "This week" })),
  ].filter((s) => s.step);

  const routing = result.routingRecommendation;

  const canonicalResult = buildPurposeResult({
    percent: result.percent,
    coherenceBand: result.coherenceBand,
    primaryPattern: result.primaryPattern ? {
      label: result.primaryPattern.label,
      consequence: result.primaryPattern.consequence,
      firstAction: result.primaryPattern.firstAction,
      reasons: result.primaryPattern.reasons,
      score: result.primaryPattern.score,
    } : null,
    domainProfiles: result.domainProfiles.map((d) => ({
      domain: d.domain,
      label: d.label,
      percent: d.percent,
      resonance: d.resonance,
      certainty: d.certainty,
    })),
    contradictions: result.contradictions?.map((c) => ({
      type: c.type,
      severity: c.severity,
      evidence: c.evidence,
    })),
    reflections,
  });

  return (
    <div className="space-y-4" style={{ maxWidth: "56rem" }}>
      {/* MEMORY INTERRUPT - Show past contract if exists */}
      {hasCheckedMemory && pastContract && pastContract.status !== "completed" && (
        <PastContractInterrupt 
          onAcknowledge={() => {
            track("past_contract_breach_acknowledged", { status: pastContract.status });
          }}
          onProceed={() => {}}
        />
      )}

      <EvidenceChainSurface result={canonicalResult} />

      <ProductAdvantageBlocks
        signalKey={detectSignal({ urgency: result.percent < 50 ? 3 : 2, ownershipScore: result.percent < 40 ? 3 : 2, stateScore: result.percent < 45 ? 3 : 2, clarityScore: result.percent < 50 ? 3 : 2, accountabilityScore: result.percent < 45 ? 3 : 2 })}
        scores={{ urgency: result.percent < 50 ? 3 : 2, ownership: result.percent < 40 ? 3 : 2, clarity: result.percent < 50 ? 3 : 2, accountability: result.percent < 45 ? 3 : 2, state: result.percent < 45 ? 3 : 2 }}
        layer="full"
      />

      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", margin: "1rem 0" }} />

      <ResultInterruption line={interruptionLine} />

      <ResultCondition
        name={pattern.patternTitle}
        definition={narrative?.classificationExplanation ?? pattern.primaryPattern.slice(0, 300)}
      />

      <ResultContradiction evidence={contradictionEvidence} />

      <SystemMemoryBlock currentStage="purpose_alignment" />

      <ResultDecision decision={decisionObject.decision || extractedDecision} />

      <ResultAction
        steps={actionSteps}
        consequence={decisionObject.consequence}
        title="Immediate correction"
      />

      <ResultTrajectory
        timeHorizon="30–60 days"
        consequences={trajectoryConsequences as string[]}
        label="If repeated"
      />

      <DecisionGradeBlocks data={{
        decisionDeclaration: result.percent < 45
          ? { optionA: "Confront the avoided decision now", optionB: "Continue operating around it" }
          : result.percent < 65
          ? { optionA: "Commit to the direction you stated", optionB: "Re-evaluate before the next pressure point" }
          : { optionA: "Lock the current direction", optionB: "Test whether the organisation shares it" },
        ifUnchanged: pattern.primaryPattern.slice(0, 200),
        minimumViableMove: pattern.firstAction,
        confidence: result.percent < 35 ? "strong" : result.percent < 60 ? "moderate" : "strong",
        scaleBreak: "At scale, personal decision avoidance becomes organisational drift. Teams compensate by creating informal authority structures that bypass the stated chain.",
      }} />

      <FreeLayerBoundary
        summary="This is personal behavioural evidence. It identifies a likely decision behaviour pattern from your self-reported answers, shows where your stated values and revealed choices diverge, and gives one practical correction. It may strengthen a corporate decision case, but it does not replace organisational diagnosis."
        limitation="It does not test whether the same pattern is structural in your organisation, price the consequence of delay, or sequence enforcement. It is a self-reported signal — not a full psychological profile and not organisational structural diagnosis."
        validityBasis="This result reflects your self-reported decision pattern from a single session. It identifies a likely pressure behaviour, not a confirmed organisational condition."
        strengthenWith="Repeat this assessment under a live decision scenario — when a real decision is on the table, not retrospectively. Then compare with the Constitutional Diagnostic to test whether the pattern extends into organisational structure."
      />

      {/* PATTERN-BREAKER CONTRACT - The Weapon */}
      {!contractCompleted && !contractSkipped && showContract && (
        <PatternBreakerContract
          pattern={{
            primaryPattern: pattern.primaryPattern,
            patternTitle: pattern.patternTitle,
            urgentStatement: pattern.urgentStatement,
            firstAction: pattern.firstAction,
            weakestDomain: pattern.weakestDomain as string,
            sharpestSignal: pattern.sharpestSignal,
          }}
          resultPercent={result.percent}
          coherenceBand={result.coherenceBand}
          onComplete={() => {
            setContractCompleted(true);
            // Wire contract-engine: load the signed contract for dashboard display
            const subjectId = getOrCreateSubjectId();
            const signed = getMostRecentContract(subjectId);
            if (signed) {
              // Initialize execution trace for progress tracking
              const trace: ExecutionTrace = {
                contractId: signed.id,
                checkpoints: [{ scheduledAt: new Date().toISOString(), type: "in_app", status: "sent", deliveredAt: new Date().toISOString() }],
                microActions: [],
                currentProgress: 0,
                predictedCompletion: signed.deadline,
                lastCheckinAt: new Date().toISOString(),
                nextCheckinAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
              };
              saveExecutionTrace(trace);
              setExecutionTrace(trace);
              track("contract_execution_initialized", { contractId: signed.id, weakestDomain: signed.weakestDomain });
            }
          }}
          onSkip={() => setContractSkipped(true)}
        />
      )}

      {!contractCompleted && !contractSkipped && !showContract && (
        <div style={{ marginTop: "1rem" }}>
          <button
            onClick={() => setShowContract(true)}
            style={{
              background: `${GOLD}15`,
              border: `1px solid ${GOLD}50`,
              padding: "14px 28px",
              color: GOLD,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px",
              letterSpacing: "0.25em",
              cursor: "pointer",
              width: "100%",
              textTransform: "uppercase",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={e => { 
              const el = e.currentTarget; 
              el.style.background = `${GOLD}25`;
              el.style.borderColor = `${GOLD}80`;
            }}
            onMouseLeave={e => { 
              const el = e.currentTarget; 
              el.style.background = `${GOLD}15`;
              el.style.borderColor = `${GOLD}50`;
            }}
          >
            <Lock style={{ width: "10px", height: "10px", display: "inline", marginRight: "8px" }} />
            Make this binding — sign the pattern-breaker contract →
          </button>
          <p style={{ 
            marginTop: "0.75rem", 
            fontFamily: "'JetBrains Mono', monospace", 
            fontSize: "6px", 
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.2)",
            textAlign: "center",
          }}>
            Contracts are stored and verified. The system remembers.
          </p>
        </div>
      )}

      {contractCompleted && (
        <div style={{ 
          border: `1px solid ${GOLD}30`, 
          backgroundColor: `${GOLD}08`,
          padding: "1rem",
          textAlign: "center",
        }}>
          <CheckSquare style={{ color: GOLD, width: "16px", height: "16px", display: "inline", marginRight: "8px" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.15em", color: GOLD }}>
            Contract signed. Verification scheduled for {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
          </span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          UPGRADE 6: Real-Time Contract Dashboard (Execution Progress)
          ═══════════════════════════════════════════════════════════════════════ */}
      {contractCompleted && executionTrace && (
        <div style={{ 
          border: `1px solid ${GOLD}20`, 
          backgroundColor: `${GOLD}04`,
          padding: "1.25rem",
        }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 style={{ width: "12px", height: "12px", color: GOLD }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.25em", color: GOLD }}>
                CONTRACT DASHBOARD
              </span>
            </div>
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
              {executionTrace.currentProgress}% complete
            </span>
          </div>

          {/* Progress bar */}
          <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.06)", marginBottom: "1rem", overflow: "hidden" }}>
            <motion.div
              animate={{ width: `${executionTrace.currentProgress}%` }}
              transition={{ duration: 0.8 }}
              style={{ height: "100%", backgroundColor: GOLD }}
            />
          </div>

          {/* Checkpoints */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
            {executionTrace.checkpoints.slice(-3).map((cp, i) => (
              <div key={i} style={{
                padding: "0.25rem 0.5rem",
                backgroundColor: cp.status === "sent" ? `${GOLD}10` : "rgba(110,231,183,0.1)",
                border: `1px solid ${cp.status === "sent" ? `${GOLD}20` : "rgba(110,231,183,0.2)"}`,
                fontSize: "0.6rem",
                color: cp.status === "sent" ? GOLD : "rgba(110,231,183,0.8)",
              }}>
                {cp.type.toUpperCase()} · {cp.status}
              </div>
            ))}
          </div>

          {/* Micro-actions */}
          {executionTrace.microActions.length > 0 && (
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>
              {executionTrace.microActions.length} action{executionTrace.microActions.length !== 1 ? "s" : ""} recorded
            </div>
          )}

          {/* Quick progress update */}
          <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
            {["25%", "50%", "75%", "100%"].map(pct => (
              <button
                key={pct}
                onClick={() => {
                  const val = parseInt(pct);
                  reportProgress(executionTrace.contractId, { status: val >= 100 ? "completed" : "in_progress", description: `Progress updated to ${pct}` });
                  updateProgress(executionTrace.contractId, val, `Progress updated to ${pct}`);
                  setExecutionTrace(getExecutionTrace(executionTrace.contractId));
                }}
                style={{
                  flex: 1,
                  padding: "6px 4px",
                  fontSize: "0.6rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: "transparent",
                  border: `1px solid ${GOLD}20`,
                  color: GOLD,
                  cursor: "pointer",
                  letterSpacing: "0.1em",
                }}
              >
                {pct}
              </button>
            ))}
          </div>

          {/* Report blocker + Request extension */}
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <button
              onClick={() => {
                reportProgress(executionTrace.contractId, { status: "blocked", description: "User-reported blocker" });
                track("contract_blocker_reported", { contractId: executionTrace.contractId });
              }}
              style={{
                flex: 1, padding: "6px 8px", fontSize: "0.55rem",
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: "rgba(252,165,165,0.05)", border: "1px solid rgba(252,165,165,0.20)",
                color: "rgba(252,165,165,0.70)", cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" as const,
              }}
            >
              <AlertTriangle style={{ width: "8px", height: "8px", display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
              Report blocker
            </button>
            <button
              onClick={() => {
                const extended = requestExtension(executionTrace.contractId, 7, "Need more time to complete commitment");
                if (extended) {
                  track("contract_extension_granted", { contractId: executionTrace.contractId });
                  setExecutionTrace(getExecutionTrace(executionTrace.contractId));
                }
              }}
              style={{
                flex: 1, padding: "6px 8px", fontSize: "0.55rem",
                fontFamily: "'JetBrains Mono', monospace",
                backgroundColor: "transparent", border: `1px solid ${GOLD}20`,
                color: `${GOLD}90`, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase" as const,
              }}
            >
              <Clock style={{ width: "8px", height: "8px", display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
              Request extension
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          UPGRADE 5: Tournament Architecture Verdict
          ═══════════════════════════════════════════════════════════════════════ */}
      {tournamentResult && (
        <div style={{
          border: `1px solid ${tournamentResult.arbiterVerdict === "contradiction_detected" ? "rgba(252,165,165,0.3)" : `${GOLD}20`}`,
          backgroundColor: tournamentResult.arbiterVerdict === "contradiction_detected" ? "rgba(252,165,165,0.04)" : `${GOLD}04`,
          padding: "1.25rem",
        }}>
          <div className="flex items-center gap-2 mb-2">
            <GitBranch style={{ width: "12px", height: "12px", color: GOLD }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.25em", color: GOLD }}>
              TOURNAMENT VERDICT
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.5rem" }}>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "7px",
              letterSpacing: "0.15em",
              color: tournamentResult.arbiterVerdict === "deterministic_wins" ? "rgba(110,231,183,0.9)" :
                     tournamentResult.arbiterVerdict === "contradiction_detected" ? "#fca5a5" : GOLD,
              padding: "4px 8px",
              border: `1px solid ${tournamentResult.arbiterVerdict === "deterministic_wins" ? "rgba(110,231,183,0.3)" :
                        tournamentResult.arbiterVerdict === "contradiction_detected" ? "rgba(252,165,165,0.3)" : `${GOLD}30`}`,
            }}>
              {tournamentResult.arbiterVerdict.replace(/_/g, " ").toUpperCase()}
            </span>
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)" }}>
              Confidence: {Math.round(tournamentResult.confidence * 100)}%
            </span>
          </div>
          {tournamentResult.contradictions.length > 0 && (
            <div style={{ marginTop: "0.5rem" }}>
              {tournamentResult.contradictions.map((c, i) => (
                <div key={i} style={{
                  fontSize: "0.7rem",
                  color: "rgba(252,165,165,0.7)",
                  padding: "0.25rem 0",
                  borderBottom: i < tournamentResult.contradictions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                }}>
                  ⚠ {c}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          UPGRADE 4: Behavioral Data Connection UI
          ═══════════════════════════════════════════════════════════════════════ */}
      {contractCompleted && (
        <div style={{ border: `1px solid ${GOLD}15`, padding: "1.25rem" }}>
          <div className="flex items-center gap-2 mb-3">
            <Zap style={{ width: "12px", height: "12px", color: GOLD }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.25em", color: GOLD }}>
              BEHAVIORAL DATA INTEGRATION
            </span>
          </div>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem" }}>
            Connect real data sources to verify your commitments automatically
          </p>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <button
              onClick={async () => {
                const connection = await connectGoogleCalendar();
                if (connection) {
                  saveBehavioralConnection(connection);
                  setBehavioralConnections(getBehavioralConnections());
                  track("behavioral_calendar_connected", {});
                }
              }}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "8px 14px",
                backgroundColor: behavioralConnections.some(c => c.type === "calendar") ? `${GOLD}15` : "transparent",
                border: `1px solid ${behavioralConnections.some(c => c.type === "calendar") ? `${GOLD}40` : "rgba(255,255,255,0.12)"}`,
                color: behavioralConnections.some(c => c.type === "calendar") ? GOLD : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <Calendar style={{ width: "10px", height: "10px" }} />
              {behavioralConnections.some(c => c.type === "calendar") ? "✓ Calendar" : "Calendar"}
            </button>
            <button
              onClick={async () => {
                const connection = await connectSlack();
                if (connection) {
                  saveBehavioralConnection(connection);
                  setBehavioralConnections(getBehavioralConnections());
                  track("behavioral_slack_connected", {});
                }
              }}
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "8px 14px",
                backgroundColor: behavioralConnections.some(c => c.type === "slack") ? `${GOLD}15` : "transparent",
                border: `1px solid ${behavioralConnections.some(c => c.type === "slack") ? `${GOLD}40` : "rgba(255,255,255,0.12)"}`,
                color: behavioralConnections.some(c => c.type === "slack") ? GOLD : "rgba(255,255,255,0.5)",
                cursor: "pointer",
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <MessageSquare style={{ width: "10px", height: "10px" }} />
              {behavioralConnections.some(c => c.type === "slack") ? "✓ Slack" : "Slack"}
            </button>
            <button
              style={{
                display: "flex", alignItems: "center", gap: "0.4rem",
                padding: "8px 14px",
                backgroundColor: "transparent",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.25)",
                cursor: "not-allowed",
                fontSize: "0.65rem",
                fontFamily: "'JetBrains Mono', monospace",
                opacity: 0.5,
              }}
            >
              <ExternalLink style={{ width: "10px", height: "10px" }} />
              Jira (soon)
            </button>
          </div>
          {behavioralConnections.length > 0 && (
            <div style={{ marginTop: "0.75rem" }}>
              <div style={{ fontSize: "0.6rem", color: "rgba(110,231,183,0.5)", marginBottom: "0.5rem" }}>
                {behavioralConnections.length} data source{behavioralConnections.length !== 1 ? "s" : ""} connected
              </div>
              {executionTrace && (
                <button
                  onClick={async () => {
                    try {
                      const subjectId = getOrCreateSubjectId();
                      const contract = getMostRecentContract(subjectId);
                      if (contract) {
                        const result = await verifyWithBehavioralData(executionTrace.contractId, subjectId, contract.userCommitment);
                        track("behavioral_verification_completed", { confidence: result.confidence, status: result.status });
                        if (result.status === "likely_completed" && result.confidence === "high") {
                          updateProgress(executionTrace.contractId, 100, "Verified by behavioral data");
                          setExecutionTrace(getExecutionTrace(executionTrace.contractId));
                        }
                      }
                    } catch (err) {
                      console.error("Behavioral verification failed:", err);
                    }
                  }}
                  style={{
                    width: "100%", padding: "8px 12px", fontSize: "0.6rem",
                    fontFamily: "'JetBrains Mono', monospace",
                    backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}25`,
                    color: `${GOLD}BB`, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase" as const,
                  }}
                >
                  <CheckSquare style={{ width: "9px", height: "9px", display: "inline", marginRight: "5px", verticalAlign: "middle" }} />
                  Verify commitment with behavioral data
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          UPGRADE 3: Organization Invite / Join UI
          ═══════════════════════════════════════════════════════════════════════ */}
      {contractCompleted && (
        <div style={{ border: `1px solid ${GOLD}15`, padding: "1.25rem" }}>
          <div className="flex items-center gap-2 mb-3">
            <Users style={{ width: "12px", height: "12px", color: GOLD }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.25em", color: GOLD }}>
              ORGANIZATION INTELLIGENCE
            </span>
          </div>
          {organizationContext ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <Globe style={{ width: "10px", height: "10px", color: GOLD }} />
                <span style={{ fontSize: "0.8rem", color: GOLD }}>{organizationContext.name}</span>
              </div>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>
                {organizationContext.members.length} member{organizationContext.members.length !== 1 ? "s" : ""} · {organizationContext.activeContracts} active contract{organizationContext.activeContracts !== 1 ? "s" : ""}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.6rem" }}>
                <span style={{ color: organizationContext.avgBreachRate > 0.3 ? "#fca5a5" : "rgba(110,231,183,0.7)" }}>
                  Breach rate: {Math.round(organizationContext.avgBreachRate * 100)}%
                </span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>
                  Invite code: <span style={{ color: GOLD, letterSpacing: "0.15em" }}>{organizationContext.inviteCode}</span>
                </span>
              </div>
              <button
                onClick={() => {
                  const refreshed = refreshOrganizationAnalytics(organizationContext.orgId);
                  if (refreshed) setOrganizationContext(refreshed);
                }}
                style={{
                  marginTop: "0.75rem",
                  padding: "6px 14px",
                  fontSize: "0.6rem",
                  fontFamily: "'JetBrains Mono', monospace",
                  backgroundColor: "transparent",
                  border: `1px solid ${GOLD}20`,
                  color: GOLD,
                  cursor: "pointer",
                }}
              >
                <RefreshCw style={{ width: "8px", height: "8px", display: "inline", marginRight: "4px" }} />
                Refresh analytics
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.75rem" }}>
                Compare patterns across your team or organization
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={orgNameInput}
                    onChange={e => setOrgNameInput(e.target.value)}
                    placeholder="Organization name"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      fontSize: "0.7rem",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)",
                      outline: "none",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                  <button
                    onClick={() => {
                      const subjectId = getOrCreateSubjectId();
                      const org = createOrganization(orgNameInput || "My Team", subjectId);
                      setOrganizationContext(org);
                      track("organization_created", { name: org.name });
                    }}
                    style={{
                      padding: "8px 14px",
                      fontSize: "0.6rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      backgroundColor: `${GOLD}10`,
                      border: `1px solid ${GOLD}30`,
                      color: GOLD,
                      cursor: "pointer",
                    }}
                  >
                    <UserPlus style={{ width: "10px", height: "10px", display: "inline", marginRight: "4px" }} />
                    Create
                  </button>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    value={orgInviteCode}
                    onChange={e => setOrgInviteCode(e.target.value.toUpperCase())}
                    placeholder="Invite code"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      fontSize: "0.7rem",
                      backgroundColor: "transparent",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)",
                      outline: "none",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.15em",
                    }}
                  />
                  <button
                    onClick={() => {
                      const subjectId = getOrCreateSubjectId();
                      const org = joinOrganization(orgInviteCode, subjectId);
                      if (org) {
                        setOrganizationContext(org);
                        track("organization_joined", { orgId: org.orgId });
                      }
                    }}
                    style={{
                      padding: "8px 14px",
                      fontSize: "0.6rem",
                      fontFamily: "'JetBrains Mono', monospace",
                      backgroundColor: "transparent",
                      border: `1px solid ${GOLD}30`,
                      color: GOLD,
                      cursor: "pointer",
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          UPGRADE 7: Pattern Observatory (Premium Gate)
          ═══════════════════════════════════════════════════════════════════════ */}
      {contractCompleted && (
        <div>
          {showPatternObservatory ? (
            <PatternObservatory
              organizationId={organizationContext?.orgId}
              isPremium={isPremium}
            />
          ) : (
            <div style={{ marginTop: "0.5rem" }}>
              <button
                onClick={() => setShowPatternObservatory(true)}
                style={{
                  width: "100%",
                  padding: "10px 18px",
                  backgroundColor: "transparent",
                  border: `1px solid ${GOLD}25`,
                  color: GOLD,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "7px",
                  letterSpacing: "0.2em",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${GOLD}08`; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <TrendingUp style={{ width: "10px", height: "10px", display: "inline", marginRight: "6px" }} />
                Open Pattern Observatory
              </button>
              <p style={{ marginTop: "0.5rem", fontFamily: "'JetBrains Mono', monospace", fontSize: "6px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.15)", textTransform: "uppercase" }}>
                Peer intelligence unlocks once enough anonymised contract traces exist. Premium pattern intelligence coming soon.
              </p>
            </div>
          )}
        </div>
      )}

      <LadderProgressionGate
        severity={result.percent < 40 ? "critical" : result.percent < 55 ? "high" : "medium"}
        nextStage={{
          label: routing?.label ?? "Constitutional Diagnostic",
          href: routing?.href ?? "/diagnostics/constitutional-diagnostic",
          reason: routing?.reason ?? "You now know the personal condition. The next layer tests whether the same pattern exists structurally in the organisation around you.",
        }}
        consequenceOfExit="You have the signal and one practical correction. The pattern continues to compound whether or not you proceed. Executive Reporting is needed when consequence must be priced. Constitutional Diagnostic is needed when you want to test whether this pattern is structural."
        trajectoryWarning={result.percent < 55 ? "If the same contradiction is already affecting live decisions, move to the next layer now." : undefined}
        deferNote="You can keep this result and act on the immediate correction first. Continue only when you need structural confirmation."
      />

      <LongitudinalIntelligence data={null} />
      <OutcomeVerification data={null} />

      <ResultDiagnostics
        domains={result.domainProfiles.map((d) => ({
          domain: d.domain,
          label: d.label,
          percent: d.percent,
          resonance: Math.round(d.resonance * 10) / 10,
          certainty: Math.round(d.certainty * 10) / 10,
        }))}
        percent={result.percent}
        band={result.coherenceBand}
      />

      <button
        type="button"
        onClick={onRestart}
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.18)",
          background: "none",
          border: "none",
          cursor: "pointer",
          marginTop: "1rem",
        }}
      >
        Restart assessment
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

type Props = {
  onScored?: (result: PurposeProfileResult, answers: Record<string, DualAxisAnswer>) => void;
};

export default function PurposeAlignmentAssessment({ onScored }: Props) {
  const [stage, setStage] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, DualAxisAnswer>>({});
  const [result, setResult] = React.useState<PurposeProfileResult | null>(null);
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  // Demographic context (captured at start)
  const [demographicCompleted, setDemographicCompleted] = React.useState(false);
  const [demographicContext, setDemographicContext] = React.useState<{ role: string; industry: string; teamSize: string; yearsInRole: string } | null>(null);
  const [showDemographicCapture, setShowDemographicCapture] = React.useState(true);

  // Diagnostic reflection gate
  const [showReflection, setShowReflection] = React.useState(false);
  const [reflections, setReflections] = React.useState({
    avoidedDecision: "",
    lastSevenDays: "",
    dissenter: "",
  });
  const [direction, setDirection] = React.useState(1);

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE STATE: Execution Trace (Agentic Bridge)
  // ═════════════════════════════════════════════════════════════════════════
  const [executionTrace, setExecutionTrace] = React.useState<ExecutionTrace | null>(null);
  const [showContractDashboard, setShowContractDashboard] = React.useState(false);

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE STATE: Organization Context (Team Features)
  // ═════════════════════════════════════════════════════════════════════════
  const [organizationContext, setOrganizationContext] = React.useState<OrganizationContext | null>(null);
  const [showOrganizationUI, setShowOrganizationUI] = React.useState(false);
  const [orgInviteCode, setOrgInviteCode] = React.useState("");
  const [orgNameInput, setOrgNameInput] = React.useState("");

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE STATE: Behavioral Data Integration
  // ═════════════════════════════════════════════════════════════════════════
  const [behavioralConnections, setBehavioralConnections] = React.useState<BehavioralDataSource[]>([]);
  const [showBehavioralConnect, setShowBehavioralConnect] = React.useState(false);

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE STATE: Tournament Architecture
  // ═════════════════════════════════════════════════════════════════════════
  const [tournamentResult, setTournamentResult] = React.useState<TournamentResult | null>(null);

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE STATE: Pattern Observatory (Premium)
  // ═════════════════════════════════════════════════════════════════════════
  const [showPatternObservatory, setShowPatternObservatory] = React.useState(false);
  const [isPremium, setIsPremium] = React.useState(false);

  const isResult = stage === STAGE_DOMAINS.length;
  const currentDomains = isResult ? [] : STAGE_DOMAINS[stage]!;
  const currentQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter(q => currentDomains.includes(q.domain));

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = PURPOSE_ALIGNMENT_QUESTIONS.length;

  const stageAnswered = currentQuestions.every(q => answers[q.id] !== undefined);

  const liveProfile = React.useMemo(() => {
    if (totalAnswered === 0) return null;
    return scorePurposeProfile({
      answers,
      context: { reflections },
    });
  }, [answers, reflections, totalAnswered]);

  React.useEffect(() => {
    if (totalAnswered === 1) {
      track("purpose_alignment_started", {
        total_questions: totalQuestions,
      });
    }
  }, [totalAnswered, totalQuestions]);

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE: Initialize execution bridge — process due checkins on mount
  // ═════════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    const dueCheckins = processDueCheckins();
    if (dueCheckins.length > 0) {
      track("execution_checkins_processed", { count: dueCheckins.length });
    }
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE: Load existing behavioral connections on mount
  // ═════════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    const existing = getBehavioralConnections();
    setBehavioralConnections(existing);
  }, []);

  // ═════════════════════════════════════════════════════════════════════════
  // UPGRADE: Load execution trace when result becomes available
  // ═════════════════════════════════════════════════════════════════════════
  React.useEffect(() => {
    if (result) {
      const subjectId = getOrCreateSubjectId();
      const traces = getExecutionTraces();
      const existingTrace = traces.find(t => t.contractId === subjectId);
      if (existingTrace) {
        setExecutionTrace(existingTrace);
      }
    }
  }, [result]);

  function updateAnswer(qid: string, field: "resonance" | "certainty", value: number) {
    setAnswers(prev => ({
      ...prev,
      [qid]: {
        resonance: prev[qid]?.resonance ?? 5,
        certainty: prev[qid]?.certainty ?? 5,
        [field]: value,
      },
    }));
  }

  function advance() {
    if (stage < STAGE_DOMAINS.length - 1) {
      setDirection(1); 
      setStage(s => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (!showReflection) {
      setShowReflection(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleComplete();
    }
  }

  function retreat() {
    if (stage > 0) { 
      setDirection(-1); 
      setStage(s => s - 1); 
    }
  }

  async function handleComplete() {
    setStatus("loading");
    const scored = scorePurposeProfile({
      answers,
      context: { reflections },
    });
    setResult(scored);
    setDirection(1);
    setStage(STAGE_DOMAINS.length);
    
    try {
      sessionStorage.setItem(
        "purpose-alignment-result",
        JSON.stringify({
          ...scored,
          subjectId: getOrCreateSubjectId(),
          reflections: {
            avoidedDecision: reflections.avoidedDecision || null,
            lastSevenDays: reflections.lastSevenDays || null,
            dissenter: reflections.dissenter || null,
          },
          demographicContext,
        }),
      );
      sessionStorage.setItem("aol_diagnostics_origin", "purpose_alignment");
    } catch {}
    
    try {
      const tensions = extractPurposeTensions(scored, answers);
      if (tensions.length > 0) {
        mergeAndSaveTensions(tensions, "purpose_alignment");
      }
    } catch {}

    // ═══════════════════════════════════════════════════════════════════════
    // UPGRADE 5: Run Tournament Architecture to validate result
    // ═══════════════════════════════════════════════════════════════════════
    try {
      const generativeSuggestion = `Based on your answers, your alignment score is ${scored.percent}% in the ${scored.coherenceBand} band. Your weakest domain is ${scored.weakestDomains[0] || "unknown"}. The pattern suggests ${scored.coherenceBand === "FRAGMENTED" ? "urgent structural intervention is needed" : "targeted correction in the weakest domain will produce compounding effects"}.`;
      
      const tournament = runTournament(
        scored,
        generativeSuggestion,
        answers,
        reflections,
        { role: demographicContext?.role || "unknown", industry: demographicContext?.industry || "unknown" }
      );
      setTournamentResult(tournament);
      
      track("tournament_completed", {
        verdict: tournament.arbiterVerdict,
        contradictions: tournament.contradictions.length,
        confidence: tournament.confidence,
      });
    } catch (error) {
      console.error("Tournament engine error:", error);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UPGRADE 1: Create execution trace for future tracking
    // ═══════════════════════════════════════════════════════════════════════
    try {
      const subjectId = getOrCreateSubjectId();
      const now = new Date().toISOString();
      const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const trace: ExecutionTrace = {
        contractId: subjectId,
        checkpoints: [{
          scheduledAt: now,
          type: "in_app",
          status: "sent",
          deliveredAt: now,
        }],
        microActions: [],
        currentProgress: 0,
        predictedCompletion: deadline,
        lastCheckinAt: now,
        nextCheckinAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      };
      saveExecutionTrace(trace);
      setExecutionTrace(trace);
    } catch (error) {
      console.error("Execution trace creation error:", error);
    }

    track("purpose_alignment_completed", {
      band: scored.coherenceBand,
      percent: scored.percent,
      weakest_domain: scored.weakestDomains[0] || "unknown",
      role: demographicContext?.role,
      industry: demographicContext?.industry,
      tournament_verdict: tournamentResult?.arbiterVerdict || "not_run",
    });
    
    onScored?.(scored, answers);
    
    try {
      await fetch("/api/purpose-alignment/assessments", {
        method: "POST", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result: scored, reflections, demographicContext }),
      });
      setStatus("success");
    } catch { 
      setStatus("error"); 
    }
  }

  function handleRestart() {
    setStage(0);
    setAnswers({});
    setResult(null);
    setStatus("idle");
    setDirection(1);
    setShowReflection(false);
    setShowDemographicCapture(true);
    setDemographicCompleted(false);
    setDemographicContext(null);
    setReflections({
      avoidedDecision: "",
      lastSevenDays: "",
      dissenter: "",
    });
    // Reset all upgrade state
    setExecutionTrace(null);
    setShowContractDashboard(false);
    setOrganizationContext(null);
    setShowOrganizationUI(false);
    setOrgInviteCode("");
    setOrgNameInput("");
    setShowBehavioralConnect(false);
    setTournamentResult(null);
    setShowPatternObservatory(false);
  }

  function handleDemographicComplete(data: { role: string; industry: string; teamSize: string; yearsInRole: string }) {
    setDemographicContext(data);
    setDemographicCompleted(true);
    setShowDemographicCapture(false);
    track("demographic_captured", { role: data.role, industry: data.industry });
  }

  // Show demographic capture first
  if (showDemographicCapture) {
    return <DemographicContextCapture onComplete={handleDemographicComplete} />;
  }

  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      {!isResult && stage === Math.floor(STAGE_DOMAINS.length / 2) && (
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", color: "rgba(252,165,165,0.30)", fontStyle: "italic", marginBottom: "1rem" }}>
          Most people don&apos;t see this until it&apos;s already costing them.
        </p>
      )}

      {!isResult && (
        <div style={{ marginBottom: "2rem" }}>
          <div className="flex items-center justify-between mb-2">
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
              Purpose Alignment Assessment
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.18em", color: "rgba(255,255,255,0.35)" }}>
              Stage {stage + 1} / {STAGE_DOMAINS.length}
            </span>
          </div>
          <div style={{ display: "flex", gap: "4px" }}>
            {STAGE_LABELS.map((label, i) => (
              <div key={i} style={{
                flex: 1, height: "2px",
                backgroundColor: i <= stage ? `${GOLD}80` : "rgba(255,255,255,0.07)",
                transition: "background-color 300ms ease",
              }} />
            ))}
          </div>
        </div>
      )}

      <div className={`grid gap-8 ${!isResult ? "lg:grid-cols-[1fr_280px]" : ""}`}>
        <div>
          <AnimatePresence mode="wait" custom={direction}>
            {showReflection && !isResult ? (
              <motion.div
                key="reflection-gate"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
              >
                <div style={{ marginBottom: "1.75rem" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.36em", textTransform: "uppercase", color: `${GOLD}80` }}>
                    Diagnostic Reflection
                  </span>
                  <h2 style={{
                    marginTop: "0.5rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "clamp(1.4rem, 2.5vw, 1.8rem)",
                    lineHeight: 1.1, color: "rgba(255,255,255,0.88)",
                  }}>
                    Three questions that change the reading.
                  </h2>
                  <p style={{
                    marginTop: "0.5rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.6,
                    color: "rgba(255,255,255,0.35)", fontStyle: "italic",
                  }}>
                    Your scores are recorded. These answers make the interpretation specific to you.
                  </p>
                </div>

                <div className="space-y-5">
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
                      What is the one decision you are currently avoiding?
                    </label>
                    <textarea
                      value={reflections.avoidedDecision}
                      onChange={(e) => setReflections((r) => ({ ...r, avoidedDecision: e.target.value }))}
                      rows={2}
                      placeholder="Name it directly. Not the topic — the decision."
                      style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.09)", padding: "10px 12px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.75)", resize: "none", outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
                      Describe your last 7 days in one sentence.
                    </label>
                    <textarea
                      value={reflections.lastSevenDays}
                      onChange={(e) => setReflections((r) => ({ ...r, lastSevenDays: e.target.value }))}
                      rows={2}
                      placeholder="Not what you planned. What actually happened."
                      style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.09)", padding: "10px 12px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.75)", resize: "none", outline: "none" }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
                      Who would disagree with your self-assessment, and why?
                    </label>
                    <textarea
                      value={reflections.dissenter}
                      onChange={(e) => setReflections((r) => ({ ...r, dissenter: e.target.value }))}
                      rows={2}
                      placeholder="Name the person. State what they would say."
                      style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.09)", padding: "10px 12px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.75)", resize: "none", outline: "none" }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 mt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <button type="button" onClick={() => setShowReflection(false)} className="inline-flex items-center gap-2" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", cursor: "pointer", background: "none", border: "none" }}>
                    <ArrowLeft style={{ width: "11px", height: "11px" }} /> Back to questions
                  </button>
                  <button
                    type="button"
                    onClick={advance}
                    className="inline-flex items-center gap-2.5 transition-all duration-300"
                    style={{ padding: "11px 24px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer" }}
                  >
                    Generate reading <ArrowRight style={{ width: "11px", height: "11px" }} />
                  </button>
                </div>
              </motion.div>
            ) : !isResult ? (
              <motion.div
                key={`stage-${stage}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -24 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div style={{ marginBottom: "1.75rem" }}>
                  <h2 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "clamp(1.5rem, 2.5vw, 2.0rem)",
                    lineHeight: 1.05, letterSpacing: "-0.022em",
                    color: "rgba(255,255,255,0.88)",
                  }}>
                    {STAGE_LABELS[stage]}
                  </h2>
                  <p style={{
                    marginTop: "0.65rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.70,
                    color: "rgba(255,255,255,0.38)", fontStyle: "italic",
                    maxWidth: "48ch",
                  }}>
                    {STAGE_INTROS[stage]}
                  </p>
                </div>

                <div className="space-y-4">
                  {currentQuestions.map(q => (
                    <DualAxisInput
                      key={q.id}
                      questionId={q.id}
                      statement={q.statement}
                      domain={q.domain}
                      answer={answers[q.id]}
                      onChange={(field, v) => updateAnswer(q.id, field, v)}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between pt-6 mt-6"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
                >
                  <button
                    type="button"
                    onClick={retreat}
                    disabled={stage === 0}
                    className="inline-flex items-center gap-2 transition-all duration-200"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: stage === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.38)",
                      cursor: stage === 0 ? "not-allowed" : "pointer",
                      background: "none", border: "none",
                    }}
                  >
                    <ArrowLeft style={{ width: "11px", height: "11px" }} />
                    Previous
                  </button>

                  <div style={{ textAlign: "center" }}>
                    {!stageAnswered && (
                      <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.5rem" }}>
                        Adjust each slider to continue
                      </p>
                    )}
                    <button
                      type="button"
                      onClick={advance}
                      disabled={!stageAnswered}
                      className="inline-flex items-center gap-2.5 transition-all duration-300"
                      style={{
                        padding: "11px 24px",
                        border: `1px solid ${stageAnswered ? `${GOLD}42` : "rgba(255,255,255,0.06)"}`,
                        backgroundColor: stageAnswered ? `${GOLD}10` : "rgba(255,255,255,0.01)",
                        color: stageAnswered ? `${GOLD}CC` : "rgba(255,255,255,0.18)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                        cursor: stageAnswered ? "pointer" : "not-allowed",
                      }}
                    >
                      {stage === STAGE_DOMAINS.length - 1 ? "Proceed to consequence" : "Continue to decision exposure"}
                      <ArrowRight style={{ width: "11px", height: "11px" }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.60 }}
              >
                <AuthorityResultSurface 
                  result={result} 
                  answers={answers} 
                  reflections={reflections}
                  demographicContext={demographicContext}
                  executionTrace={executionTrace}
                  setExecutionTrace={setExecutionTrace}
                  tournamentResult={tournamentResult}
                  behavioralConnections={behavioralConnections}
                  setBehavioralConnections={setBehavioralConnections}
                  organizationContext={organizationContext}
                  setOrganizationContext={setOrganizationContext}
                  orgNameInput={orgNameInput}
                  setOrgNameInput={setOrgNameInput}
                  orgInviteCode={orgInviteCode}
                  setOrgInviteCode={setOrgInviteCode}
                  showPatternObservatory={showPatternObservatory}
                  setShowPatternObservatory={setShowPatternObservatory}
                  isPremium={isPremium}
                  setIsPremium={setIsPremium}
                  onRestart={handleRestart}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {!isResult && (
          <div className="hidden lg:block">
            <div style={{ position: "sticky", top: "6rem" }}>
              <LiveProfileSidebar
                profile={liveProfile}
                totalAnswered={totalAnswered}
                totalQuestions={totalQuestions}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}