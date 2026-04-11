/* eslint-disable @typescript-eslint/no-explicit-any */
// components/alignment/PurposeAlignmentAssessment.tsx
// Design: Institutional Monumentalism
// This assessment earns its place in the product ladder by delivering
// a diagnostic reading that feels specific to this person's exact
// score pattern — not a generic band label.
//
// Key architectural changes from v1:
// 1. Three-stage grouped flow with clear purpose per stage
// 2. Result surface: pattern-specific reading derived from lowest-scoring
//    statements, not just domain labels
// 3. Certainty gap analysis: where resonance >> certainty = unexamined assumption
//    where certainty >> resonance = acknowledged problem
// 4. Statement-level specificity: the result names the actual statements
//    that drove the diagnosis
// 5. Escalation close routes to the correct next product based on result

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Shield,
  Target,
  Activity,
  Heart,
  Landmark,
  AlertTriangle,
  CheckSquare,
  Lock,
} from "lucide-react";

import {
  PURPOSE_ALIGNMENT_QUESTIONS,
  ALIGNMENT_DOMAIN_ORDER,
  ALIGNMENT_DOMAIN_LABELS,
} from "@/lib/alignment/checklist";
import { scorePurposeProfile } from "@/lib/alignment/scoring";
import type {
  AlignmentDomain,
  DualAxisAnswer,
  PurposeProfileResult,
  DomainProfile,
  CoherenceBand,
} from "@/lib/alignment/types";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const LIFT = "rgb(10 14 20)";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const STAGE_DOMAINS: AlignmentDomain[][] = [
  ["identity", "decision"],
  ["environment", "behaviour"],
  ["emotional_order", "legacy"],
];

const STAGE_LABELS = [
  "Identity & Decision Integrity",
  "Environment & Behaviour",
  "Internal Order & Legacy",
];

const STAGE_INTROS = [
  "These two domains reveal whether you are operating from a coherent mandate or from accumulated momentum. Answer for the reality of the past 90 days — not your aspirations.",
  "Your environment and your daily behaviour either reinforce your direction or quietly erode it. This stage surfaces the gap between what you say you value and what you actually do.",
  "Emotional order is the foundation beneath every strategic decision. Legacy orientation reveals whether you are building or just moving. Answer precisely.",
];

const DOMAIN_ICONS: Record<AlignmentDomain, React.ComponentType<{ style?: React.CSSProperties }>> = {
  identity:        Shield,
  decision:        Target,
  environment:     Activity,
  behaviour:       CheckSquare,
  emotional_order: Heart,
  legacy:          Landmark,
};

const BAND_CONFIG: Record<CoherenceBand, {
  border: string; bg: string; text: string; label: string; reading: string;
}> = {
  SOVEREIGN: {
    border: "rgba(52,211,153,0.25)", bg: "rgba(52,211,153,0.06)", text: "rgba(110,231,183,0.90)",
    label: "Sovereign",
    reading: "Operating at sovereign alignment. Identity, decisions, and behaviour are coherent with stated direction.",
  },
  ALIGNED: {
    border: `${GOLD}30`, bg: `${GOLD}08`, text: `${GOLD}CC`,
    label: "Aligned",
    reading: "Alignment is functional but not unconditional. Specific drift areas are compounding quietly.",
  },
  DRIFTING: {
    border: "rgba(251,146,60,0.25)", bg: "rgba(251,146,60,0.06)", text: "rgba(253,186,116,0.90)",
    label: "Drifting",
    reading: "Meaningful gaps between stated purpose and operational reality. Drift is structural, not circumstantial.",
  },
  FRAGMENTED: {
    border: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.06)", text: "rgba(252,165,165,0.90)",
    label: "Fragmented",
    reading: "Alignment has broken down across multiple domains. Strategic action without reconstruction will compound the problem.",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PATTERN ANALYSIS ENGINE
// The core of what makes this assessment worth the price.
// Instead of generic band text, we read the specific pattern of scores
// and produce a diagnosis tied to what the person actually answered.
// ─────────────────────────────────────────────────────────────────────────────

type ScoredStatement = {
  id:        string;
  domain:    AlignmentDomain;
  statement: string;
  resonance: number;
  certainty: number;
  weighted:  number;
  gap:       number; // resonance - certainty: positive = confident low, negative = uncertain about something
};

type PatternReading = {
  primaryPattern:  string;
  patternTitle:    string;
  urgentStatement: string | null;
  uncertaintyNote: string | null;
  firstAction:     string;
  escalationNote:  string;
};

function derivePatternReading(
  answers: Record<string, DualAxisAnswer>,
  result: PurposeProfileResult,
): PatternReading {
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

  // Find statements where certainty >> resonance (acknowledged problem: they know it's bad)
  const acknowledgedProblems = scored
    .filter(s => s.resonance < 5 && s.certainty >= 6)
    .sort((a, b) => a.resonance - b.resonance);

  // Find statements where resonance >> certainty (unexamined assumption: low resonance but low certainty too)
  const unexaminedWeakness = scored
    .filter(s => s.resonance <= 5 && s.certainty <= 4)
    .sort((a, b) => a.weighted - b.weighted);

  const weakestDomain = result.weakestDomains[0];
  const secondWeakest  = result.weakestDomains[1];

  // Pattern: where are both weakness domains?
  const bothDrifting  = result.domainProfiles.filter(d => d.percent < 40).length;
  const highVariance  = result.domainProfiles.some(d => d.percent >= 70) &&
                        result.domainProfiles.some(d => d.percent < 40);

  // Primary pattern reading — specific to the combination of weakest domains
  let primaryPattern = "";
  let patternTitle   = "";

  if (weakestDomain === "identity" || weakestDomain === "decision") {
    if (weakestDomain === "identity" && secondWeakest === "decision") {
      patternTitle   = "Mandate without architecture";
      primaryPattern = "Both Identity and Decision Integrity are below baseline. This is not a performance problem — it is a direction problem. Decisions are being made, but not from a coherent centre. The downstream effect will be misalignment between what you say matters and where time and resource actually go.";
    } else if (weakestDomain === "identity") {
      patternTitle   = "Unclear mandate driving downstream confusion";
      primaryPattern = "Identity & Mandate is your lowest domain. This is the root layer of the alignment stack — everything downstream is affected by clarity here. Weak scores in Identity typically surface as difficulty prioritising, overcommitment, and decisions that feel right individually but do not cohere over time.";
    } else {
      patternTitle   = "Principled intent, pressure-driven execution";
      primaryPattern = "Decision Integrity is your lowest domain while Identity shows relative strength. This is the pattern of someone who knows what they stand for but is not yet translating that into consistent decision architecture. The gap between stated values and recent decisions is the structural problem.";
    }
  } else if (weakestDomain === "environment" || weakestDomain === "behaviour") {
    if (weakestDomain === "environment" && secondWeakest === "behaviour") {
      patternTitle   = "Environmental drag producing behavioural erosion";
      primaryPattern = "Both Environmental Alignment and Operational Behaviour are below baseline. The environment is not reinforcing your direction — and the behavioural evidence confirms it. This combination means that even clear intention will struggle to hold because the operating conditions are producing friction faster than discipline can absorb it.";
    } else if (weakestDomain === "environment") {
      patternTitle   = "Environment working against direction";
      primaryPattern = "Your lowest domain is Environmental Alignment. The relationships, inputs, and operating contexts around you are not reinforcing your stated direction. This is a structural problem, not a motivation problem. You cannot consistently outperform an environment that is working against you.";
    } else {
      patternTitle   = "Declared priorities not reflected in daily operation";
      primaryPattern = "Operational Behaviour is your weakest domain. The calendar, habits, and measurable output are not tracking with stated purpose. This is the most observable form of misalignment — it shows up in how time is spent, not just in what is believed. It is also the most correctable, once the identity layer is stable.";
    }
  } else if (weakestDomain === "emotional_order") {
    patternTitle   = "Internal instability constraining strategic capacity";
    primaryPattern = "Emotional & Internal Order is your lowest domain. Under-regulation here costs more than it appears — reactive decisions under pressure, over-dependence on external validation, and slow recovery from disruption are compounding costs that do not appear on any report but determine the quality of everything else.";
  } else if (weakestDomain === "legacy") {
    patternTitle   = "Operating in the immediate at the expense of the structural";
    primaryPattern = "Legacy Orientation is your lowest domain. The current operating posture is weighted toward managing the present rather than building a structure that outlasts it. This is not a character deficiency — it is a sequencing problem. But without correction, tactical competence will continue to substitute for strategic architecture.";
  } else {
    patternTitle   = "Distributed misalignment across multiple domains";
    primaryPattern = "Misalignment is distributed across domains rather than concentrated in one. This pattern is harder to correct than single-domain weakness because there is no single root cause. The work is sequential: stabilise Identity first, then Decision Integrity, then the operational domains.";
  }

  // High variance pattern override
  if (highVariance) {
    primaryPattern += " The significant gap between your strongest and weakest domains indicates that alignment is situational rather than structural — performing well in some contexts while operating from misalignment in others.";
  }

  // Urgent statement (the one lowest-weighted answered statement)
  let urgentStatement: string | null = null;
  if (lowest && lowest.weighted < 3) {
    urgentStatement = `"${lowest.statement}" — scored ${lowest.resonance}/10 resonance with ${lowest.certainty}/10 certainty. This is your sharpest signal.`;
  }

  // Uncertainty note (when low resonance meets low certainty — the person isn't sure how bad it is)
  let uncertaintyNote: string | null = null;
  if (unexaminedWeakness.length > 0 && acknowledgedProblems.length === 0) {
    const q = unexaminedWeakness[0]!;
    uncertaintyNote = `You scored low on "${q.statement}" with low certainty in your assessment. This is a signal worth examining — uncertainty about a core domain is often more consequential than confident weakness, because it cannot be corrected until it is seen clearly.`;
  } else if (acknowledgedProblems.length > 0) {
    const q = acknowledgedProblems[0]!;
    uncertaintyNote = `You scored "${q.statement}" at ${q.resonance}/10 with ${q.certainty}/10 certainty — meaning this is a clearly acknowledged weakness, not a blind spot. That clarity is an asset. Acknowledged problems can be corrected; unexamined ones compound.`;
  }

  // First concrete action — domain-specific, not generic
  const actionMap: Record<AlignmentDomain, string> = {
    identity:        "Rewrite your current mandate in one sentence. Not what you want it to be — what it actually is, evidenced by how your last 30 days have been spent. Then identify one commitment that contradicts it.",
    decision:        "Retrieve the last five decisions of consequence you made in the past 60 days. For each one, note whether it was made from principle or from pressure. The pattern is the diagnosis.",
    environment:     "List every regular input — relationships, information sources, recurring meetings — that produced confusion, doubt, or diffusion of focus in the last quarter. Remove the highest-cost one.",
    behaviour:       "Open your calendar for the last two weeks and mark every block that directly served your stated long-term outcomes. Everything else is the gap between intention and operation.",
    emotional_order: "Track your response time and decision quality under stress for seven consecutive days. Do not attempt to change anything yet — the first step is accurate observation, not correction.",
    legacy:          "Name the one structure — not a goal, a structure — that you are building which must outlast your current season. If you cannot name it, that is the diagnosis.",
  };

  const firstAction = actionMap[weakestDomain ?? "identity"];

  // Escalation note based on band
  let escalationNote = "";
  if (result.coherenceBand === "FRAGMENTED" || result.coherenceBand === "DRIFTING") {
    escalationNote = "The Constitutional Diagnostic will surface whether this misalignment extends into the operating structure of the organisation — or whether it is contained at the individual level. Run it before taking strategic action.";
  } else if (result.coherenceBand === "ALIGNED") {
    escalationNote = "The Team Assessment will verify whether your alignment translates across the people carrying your organisation's direction. Individual alignment that does not propagate is a governance problem.";
  } else {
    escalationNote = "At sovereign alignment, the Team Assessment surfaces whether the people around you are operating at the same standard — or whether there is a gap between your clarity and the organisation's execution.";
  }

  return { primaryPattern, patternTitle, urgentStatement, uncertaintyNote, firstAction, escalationNote };
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

  // Weighted score colour
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
      {/* Statement */}
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
        {/* Weighted score indicator */}
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

      {/* Two rails */}
      <div className="space-y-5 pl-5">
        {/* Resonance */}
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

        {/* Certainty */}
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
      {/* Progress */}
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

      {/* Live domain scores */}
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
            Your live purpose profile builds as you answer. Begin the first stage to see your domains take shape.
          </p>
        </div>
      )}

      {/* Scoring explanation */}
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
// RESULT SURFACE
// ─────────────────────────────────────────────────────────────────────────────

function ResultSurface({
  result,
  answers,
  onRestart,
}: {
  result:    PurposeProfileResult;
  answers:   Record<string, DualAxisAnswer>;
  onRestart: () => void;
}) {
  const pattern = derivePatternReading(answers, result);
  const bc = BAND_CONFIG[result.coherenceBand];

  // Determine escalation path
  const escalationPath = result.coherenceBand === "FRAGMENTED" || result.coherenceBand === "DRIFTING"
    ? { href: "/diagnostics/constitutional-diagnostic", label: "Constitutional Diagnostic", note: "Required before strategic action." }
    : result.coherenceBand === "ALIGNED"
      ? { href: "/diagnostics/team-assessment", label: "Team Assessment", note: "Test whether your alignment propagates." }
      : { href: "/diagnostics/team-assessment", label: "Team Assessment", note: "Verify organisational translation of alignment." };

  return (
    <div className="space-y-6">

      {/* Score headline */}
      <div style={{ border: `1px solid ${bc.border}`, backgroundColor: bc.bg, padding: "2rem" }}>
        <Eyebrow>Purpose alignment result</Eyebrow>
        <div className="flex items-end justify-between gap-4 mt-4">
          <div>
            <div style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300, fontSize: "clamp(3rem, 6vw, 5rem)", lineHeight: 1,
              letterSpacing: "-0.04em", color: bc.text,
            }}>
              {result.percent}%
            </div>
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.36em", textTransform: "uppercase",
              color: bc.text, opacity: 0.85, marginTop: "0.4rem",
            }}>
              {bc.label}
            </div>
          </div>
          {/* Domain mini-grid */}
          <div className="grid grid-cols-3 gap-2">
            {result.domainProfiles.map(dp => {
              const c = dp.percent >= 65 ? "rgba(110,231,183,0.70)"
                      : dp.percent >= 40 ? `${GOLD}AA`
                      : "rgba(252,165,165,0.70)";
              return (
                <div key={dp.domain} style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.2rem", lineHeight: 1, color: c }}>
                    {dp.percent}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginTop: "2px" }}>
                    {dp.domain.replace("_", " ").split(" ")[0]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <p style={{ marginTop: "1rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)", fontStyle: "italic" }}>
          {bc.reading}
        </p>
      </div>

      {/* PATTERN READING — the primary diagnostic value */}
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, overflow: "hidden" }}>
        <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: `linear-gradient(to right, ${GOLD}08, transparent)` }}>
          <Eyebrow>Pattern reading — {pattern.patternTitle}</Eyebrow>
        </div>
        <div style={{ padding: "1.5rem" }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.78,
            color: "rgba(255,255,255,0.70)",
          }}>
            {pattern.primaryPattern}
          </p>

          {pattern.urgentStatement && (
            <div style={{ marginTop: "1.25rem", padding: "1rem 1.25rem", border: `1px solid ${bc.border}`, backgroundColor: bc.bg }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: bc.text, marginBottom: "0.55rem" }}>
                Sharpest signal
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.65)", fontStyle: "italic" }}>
                {pattern.urgentStatement}
              </p>
            </div>
          )}

          {pattern.uncertaintyNote && (
            <div style={{ marginTop: "1rem", padding: "1rem 1.25rem", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.02)" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.55rem" }}>
                Certainty note
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)" }}>
                {pattern.uncertaintyNote}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FIRST CONCRETE ACTION */}
      <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}07`, padding: "1.5rem" }}>
        <Eyebrow>First action — this week</Eyebrow>
        <p style={{
          marginTop: "0.85rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72,
          color: "rgba(255,255,255,0.72)",
        }}>
          {pattern.firstAction}
        </p>
        <p style={{
          marginTop: "0.75rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.60,
          color: "rgba(255,255,255,0.35)", fontStyle: "italic",
        }}>
          This is a structural action, not a motivational one. Do it once and record what you find — not to feel better, but to have accurate data.
        </p>
      </div>

      {/* DOMAIN BREAKDOWN */}
      <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgb(5 5 7)" }}>
        <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          <Eyebrow>Domain breakdown</Eyebrow>
        </div>
        <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          {result.domainProfiles
            .sort((a, b) => a.percent - b.percent)
            .map(dp => {
              const Icon = DOMAIN_ICONS[dp.domain];
              const pctColor = dp.percent >= 65 ? "rgba(110,231,183,0.75)"
                             : dp.percent >= 40 ? `${GOLD}BB`
                             : "rgba(252,165,165,0.75)";
              const gapNote = dp.resonance > dp.certainty + 3
                ? "High resonance, low certainty — examine the assumption."
                : dp.certainty > dp.resonance + 3
                  ? "Known weakness — clear on the problem, not yet on the solution."
                  : null;
              return (
                <div key={dp.domain} style={{ padding: "1rem 1.5rem" }}>
                  <div className="flex items-start gap-3">
                    <Icon style={{ width: "14px", height: "14px", color: `${GOLD}70`, flexShrink: 0, marginTop: "3px" }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3 mb-1.5">
                        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", color: "rgba(255,255,255,0.75)" }}>
                          {dp.label}
                        </span>
                        <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.5rem", lineHeight: 1, color: pctColor, flexShrink: 0 }}>
                          {dp.percent}%
                        </span>
                      </div>
                      <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: gapNote ? "0.5rem" : 0 }}>
                        <div style={{ height: "100%", width: `${Math.max(2, dp.percent)}%`, backgroundColor: pctColor, transition: "width 600ms ease" }} />
                      </div>
                      {gapNote && (
                        <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)" }}>
                          {gapNote}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ESCALATION */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.5rem" }}>
        <Eyebrow>Next step in the diagnostic ladder</Eyebrow>
        <p style={{
          marginTop: "0.85rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.70,
          color: "rgba(255,255,255,0.45)", fontStyle: "italic",
          marginBottom: "1.25rem",
        }}>
          {pattern.escalationNote}
        </p>
        <div className="flex flex-wrap gap-3">
          <a href={escalationPath.href}
            className="group inline-flex items-center gap-2.5 transition-all duration-300"
            style={{
              padding: "11px 22px",
              border: `1px solid ${GOLD}35`,
              backgroundColor: `${GOLD}0D`,
              color: `${GOLD}BB`,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}55`; el.style.backgroundColor = `${GOLD}14`; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}35`; el.style.backgroundColor = `${GOLD}0D`; }}
          >
            {escalationPath.label}
            <ArrowRight style={{ width: "11px", height: "11px" }} />
          </a>
          <button
            type="button"
            onClick={onRestart}
            style={{
              padding: "11px 22px",
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: "transparent",
              color: "rgba(255,255,255,0.28)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
              cursor: "pointer",
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.color = "rgba(255,255,255,0.50)"; }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.color = "rgba(255,255,255,0.28)"; }}
          >
            Reassess
          </button>
        </div>
        <p style={{ marginTop: "0.75rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.14)" }}>
          {escalationPath.note}
        </p>
      </div>
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
  const [stage,     setStage]     = React.useState(0);
  const [answers,   setAnswers]   = React.useState<Record<string, DualAxisAnswer>>({});
  const [result,    setResult]    = React.useState<PurposeProfileResult | null>(null);
  const [status,    setStatus]    = React.useState<"idle" | "loading" | "success" | "error">("idle");
  const [direction, setDirection] = React.useState(1);

  const isResult       = stage === STAGE_DOMAINS.length;
  const currentDomains = isResult ? [] : STAGE_DOMAINS[stage]!;
  const currentQuestions = PURPOSE_ALIGNMENT_QUESTIONS.filter(q => currentDomains.includes(q.domain));

  const totalAnswered  = Object.keys(answers).length;
  const totalQuestions = PURPOSE_ALIGNMENT_QUESTIONS.length;

  // All questions on this stage have been touched (any answer value is valid including default 5)
  // We require the user to explicitly move the slider at least once
  const stageAnswered  = currentQuestions.every(q => answers[q.id] !== undefined);

  const liveProfile = React.useMemo(() => {
    if (totalAnswered === 0) return null;
    return scorePurposeProfile({ answers });
  }, [answers, totalAnswered]);

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
      setDirection(1); setStage(s => s + 1);
    } else {
      handleComplete();
    }
  }

  function retreat() {
    if (stage > 0) { setDirection(-1); setStage(s => s - 1); }
  }

  async function handleComplete() {
    setStatus("loading");
    const scored = scorePurposeProfile({ answers });
    setResult(scored);
    setDirection(1);
    setStage(STAGE_DOMAINS.length);
    try { sessionStorage.setItem("purpose-alignment-result", JSON.stringify(scored)); } catch {}
    onScored?.(scored, answers);
    try {
      await fetch("/api/purpose-alignment/assessments", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, result: scored }),
      });
      setStatus("success");
    } catch { setStatus("error"); }
  }

  function handleRestart() {
    setStage(0); setAnswers({}); setResult(null); setStatus("idle"); setDirection(1);
  }

  return (
    <div style={{ position: "relative", minHeight: "600px" }}>
      {/* Stage progress strip */}
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

        {/* Main panel */}
        <div>
          <AnimatePresence mode="wait" custom={direction}>
            {!isResult ? (
              <motion.div
                key={`stage-${stage}`}
                custom={direction}
                initial={{ opacity: 0, x: direction * 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -24 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                {/* Stage header */}
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

                {/* Questions */}
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

                {/* Navigation */}
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
                      onMouseEnter={e => { if (stageAnswered) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }}
                      onMouseLeave={e => { if (stageAnswered) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}
                    >
                      {stage === STAGE_DOMAINS.length - 1 ? "Complete assessment" : "Continue"}
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
                <ResultSurface result={result} answers={answers} onRestart={handleRestart} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Sidebar — only during intake stages */}
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