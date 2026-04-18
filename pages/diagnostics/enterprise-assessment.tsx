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
import { trackStageStart, trackDropoff } from "@/lib/analytics/funnel";
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

type EnterpriseReading = {
  band:          string;
  patternTitle:  string;
  primaryReading:string;
  dominantFailure:string | null;
  firstAction:   string;
  escalationNote:string;
  route:         "EXECUTIVE_REPORTING" | "STRATEGY_ROOM" | "WATCH";
};

function sectionPct(answers: Record<string, DiagnosticAnswerValue>, blockId: string): number {
  const vals: number[] = [0, 1, 2].map(i => answers[`${blockId}-${i}`] ?? 0).filter(v => v > 0);
  if (!vals.length) return 0;
  return Math.round((vals.reduce((s: number, v: number) => s + v, 0) / (vals.length * 5)) * 100);
}

function deriveReading(
  answers: Record<string, DiagnosticAnswerValue>,
  totalPct: number,
  teamAlignmentPct: number | null,
): EnterpriseReading {
  const scores: Record<string, number> = {};
  for (const b of BLOCKS) scores[b.id] = sectionPct(answers, b.id);

  const scoreMap = scores as Record<string, number>;
  const leadership = scoreMap["leadership"] ?? 0;
  const governance = scoreMap["governance"] ?? 0;
  const execution  = scoreMap["execution"]  ?? 0;
  const risk       = scoreMap["risk"]       ?? 0;
  const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0]!;

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
    patternTitle   = "Multi-domain institutional breakdown";
    primaryReading = `All four diagnostic domains are below threshold simultaneously. This pattern — leadership coherence (${leadership}%), governance reliability (${governance}%), execution consistency (${execution}%), and risk posture (${risk}%) — indicates that misalignment is not localised. It is structural and distributed. Individual interventions will not resolve this. The institution requires a constitutional-level reading before any strategic action is taken.`;
    firstAction    = "Pause discretionary strategic initiatives. Convene the executive decision-making group around one question only: what are the three decisions that must not be made until this diagnostic has produced a governed recommendation?";
    escalationNote = "Executive Reporting will produce the board-grade brief needed to govern this situation. Strategy Room engagement without that brief risks compounding the structural disorder.";
    route = "EXECUTIVE_REPORTING";

  } else if (govLeaderWeak) {
    patternTitle   = "Authority and governance co-failure";
    primaryReading = `Leadership coherence (${leadership}%) and governance reliability (${governance}%) are both below threshold. This combination is more serious than either alone. Authority is not being clearly exercised, and the structural systems designed to govern that authority are not functioning reliably. The institution is making consequential decisions without a clear sponsor or reliable governance frame. Execution and risk posture may appear functional, but they are carrying a hidden debt that will compound.`;
    firstAction    = "Map the last five significant institutional decisions: who decided, on what authority, with what governance process. If this exercise reveals ambiguity in more than two, the governance architecture requires formal reconstruction before strategic escalation.";
    escalationNote = "Executive Reporting will surface whether this is a localised leadership problem or a structural governance problem — the distinction determines the intervention.";
    route = "EXECUTIVE_REPORTING";

  } else if (execRiskWeak) {
    patternTitle   = "Execution drift with compounding risk exposure";
    primaryReading = `Execution variance (${execution}%) and institutional risk posture (${risk}%) are both below threshold. Leadership and governance may appear functional, but the operating layer is inconsistent and the cost of delay is rising. This pattern often precedes a board-level crisis — the surface reads stable while the operating reality drifts. When execution variance is high and risk posture is weak simultaneously, correction becomes harder with every passing cycle.`;
    firstAction    = "Produce a single-page operational reality map: where are the three highest-variance execution points in the institution right now, what is the specific consequence of inaction in each, and who holds decision authority to correct them? If this document cannot be produced in 48 hours, that is itself a governance finding.";
    escalationNote = "Executive Reporting will translate this operational reading into a board-grade priority stack and intervention sequence. Without that translation, execution correction risks being misrouted to the wrong level.";
    route = "EXECUTIVE_REPORTING";

  } else if (leaderWeak) {
    patternTitle   = "Leadership signal failure — executive layer incoherence";
    primaryReading = `Leadership coherence is at ${leadership}% — below the threshold where the executive layer can be relied upon to transmit consistent strategic signal. Governance, execution, and risk posture may show relative strength, but they are dependent on a coherent leadership signal that is currently not present. The organisation is functioning on institutional inertia rather than active leadership coherence. This is stable until it isn't.`;
    firstAction    = "Identify the three most important beliefs the leadership group holds about the institution's current condition. Test whether those beliefs are shared. The gap between individual leadership beliefs is the governance problem.";
    escalationNote = "Leadership coherence failure at the executive level warrants Executive Reporting as the immediate next step. A board-grade reading of the leadership condition is more useful than direct intervention without that reading.";
    route = totalPct >= 60 ? "WATCH" : "EXECUTIVE_REPORTING";

  } else if (govWeak) {
    patternTitle   = "Governance architecture failure";
    primaryReading = `Governance reliability is at ${governance}% — structures are not functioning as intended. Decision rights are unclear or inconsistently applied, escalation is happening at the wrong level, and the institutional architecture designed to maintain order is itself a source of friction. This is one of the most commercially costly conditions because it is self-reinforcing: weak governance makes every other intervention harder to land.`;
    firstAction    = "Map decision rights explicitly. For the top ten classes of institutional decision, document who has authority, who must be consulted, and who must be informed. Circulate this document to all executives and track the areas of disagreement — those disagreements are the governance problem made visible.";
    escalationNote = "Governance failure is the most common precursor to private mandate engagement. Executive Reporting will establish whether the governance architecture needs reconstruction or whether targeted correction is sufficient.";
    route = totalPct >= 65 ? "WATCH" : "EXECUTIVE_REPORTING";

  } else if (execWeak) {
    patternTitle   = "Execution consistency failure — operating layer drift";
    primaryReading = `Execution variance is at ${execution}% while leadership and governance show relative strength. This is the pattern of an institution where the strategic and structural layers are functioning but the operating layer is not translating intent into consistent action. Teams are reading different versions of priority. Operational signals are unreliable. Performance varies beyond acceptable bounds. This is the most correctable of the structural failure patterns — but only if addressed before it compounds.`;
    firstAction    = "Identify the highest-variance operating unit. Run a structured rapid diagnostic there — not a full assessment, a focused reading of three things: what do they believe the current priorities are, what do they believe success looks like this quarter, and what is stopping them from operating at full capacity. The answers will locate the translation failure.";
    escalationNote = "Execution drift at this level is typically resolved through a combination of governance clarification and operating cadence work. Executive Reporting will confirm whether the issue is contained or whether it reflects a deeper institutional pattern.";
    route = "WATCH";

  } else if (riskWeak) {
    patternTitle   = "Risk posture degradation — window for correction is narrowing";
    primaryReading = `Risk posture is at ${risk}% — trust in the institution is weakening, delay is increasing strategic cost, and political resistance to corrective action is building. Leadership, governance, and execution may appear functional, but the operating environment is shifting in ways that are reducing the available window for clean intervention. This is the final stage before reactive management replaces proactive governance.`;
    firstAction    = "Define the specific cost of inaction in the next 90 days: what becomes harder, more expensive, or politically impossible if nothing changes? Document this as a concrete consequence list, not as abstract risk language. That document is the basis for any board-level escalation.";
    escalationNote = "Risk posture degradation is often the final indicator before a board crisis. Executive Reporting will provide the governed interpretation needed to justify and sequence corrective action at the appropriate level.";
    route = totalPct >= 70 ? "WATCH" : "EXECUTIVE_REPORTING";

  } else if (band === "STABLE") {
    patternTitle   = "Institutional coherence — well above threshold";
    primaryReading = `All four diagnostic domains are reading above threshold: leadership coherence (${leadership}%), governance reliability (${governance}%), execution consistency (${execution}%), and risk posture (${risk}%). This is the pattern of an institution that is currently operating with structural coherence. The diagnostic ladder is not indicating a case for immediate intervention. The appropriate next question is whether this coherence will hold under the conditions anticipated in the next 12 months.`;
    firstAction    = "The most productive use of this reading is stress-testing: identify the three conditions under which this institutional coherence would be most likely to degrade, and verify whether governance, execution, and leadership are resilient to each.";
    escalationNote = "An institution reading STABLE in this assessment has the strongest basis for proactive strategic engagement. Executive Reporting can be used as a governing framework for strategic planning rather than crisis response.";
    route = "WATCH";

  } else {
    patternTitle   = "Watch condition — moderate structural pressure";
    primaryReading = `The enterprise reading is in the WATCH band (${totalPct}%). No single domain is critically weak, but the combination suggests that operating conditions are not as stable as they may appear. Institutions in this band are typically managing multiple sources of low-grade structural friction simultaneously — enough to slow execution without triggering a visible crisis. The risk is normalisation: the friction becomes the new baseline, making future correction harder.`;
    firstAction    = "Identify the institutional area where the friction is highest and the cost of continuing to absorb it is most visible. That is the diagnostic priority. The reading does not require immediate escalation, but it does require a named owner for the correction.";
    escalationNote = "A WATCH condition warrants continued diagnostic monitoring and preparation of an Executive Reporting brief as a precautionary measure. If scores degrade on re-assessment, Executive Reporting becomes the immediate next step.";
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

  return { band, patternTitle, primaryReading, dominantFailure, firstAction, escalationNote, route };
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
  outline: "none", padding: "10px 13px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
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
            style={{ flex: 1, padding: "8px 4px", textAlign: "center", border: `1px solid ${isActive ? `${GOLD}55` : "rgba(255,255,255,0.07)"}`, backgroundColor: isActive ? `${GOLD}12` : "rgba(255,255,255,0.01)", color: isActive ? GOLD : "rgba(255,255,255,0.30)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", fontWeight: isActive ? 600 : 400, cursor: "pointer", transition: "all 200ms ease" }}
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

function ResultSurface({ reading, sections, totalScore, maxScore, totalPct, teamAlignmentPct, submitResult, onSubmit, isSubmitting, onRevise }: {
  reading: EnterpriseReading; sections: SectionScore[]; totalScore: number; maxScore: number; totalPct: number;
  teamAlignmentPct: number | null; submitResult: DiagnosticSubmitResponse | null;
  onSubmit: () => void; isSubmitting: boolean; onRevise: () => void;
}) {
  const bc = bandColor(reading.band);
  const routeConfig = {
    EXECUTIVE_REPORTING: { href: "/diagnostics/executive-reporting/run", label: "Run Executive Reporting", border: `${GOLD}35`, bg: `${GOLD}0D`, text: `${GOLD}BB` },
    STRATEGY_ROOM:       { href: "/strategy-room", label: "Enter Strategy Room", border: "rgba(52,211,153,0.30)", bg: "rgba(52,211,153,0.07)", text: "rgba(110,231,183,0.90)" },
    WATCH:               { href: "/diagnostics/executive-reporting", label: "View Executive Reporting", border: "rgba(255,255,255,0.10)", bg: "rgba(255,255,255,0.02)", text: "rgba(255,255,255,0.55)" },
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
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Left */}
        <div className="space-y-5">
          {/* Structural reading */}
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, overflow: "hidden" }}>
            <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: `linear-gradient(to right, ${GOLD}08, transparent)` }}><Eyebrow>Structural reading</Eyebrow></div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.78, color: "rgba(255,255,255,0.70)" }}>{reading.primaryReading}</p>
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
            <Eyebrow>First structural action</Eyebrow>
            <p style={{ marginTop: "0.85rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.72, color: "rgba(255,255,255,0.72)" }}>{reading.firstAction}</p>
          </div>

          {/* Escalation */}
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.5rem" }}>
            <Eyebrow>Constitutional next move</Eyebrow>
            <p style={{ marginTop: "0.85rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.70, color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginBottom: "1.25rem" }}>{reading.escalationNote}</p>
            <div className="flex flex-wrap gap-3">
              <Link href={routeConfig.href} className="inline-flex items-center gap-2.5 transition-all duration-300"
                style={{ padding: "11px 22px", border: `1px solid ${routeConfig.border}`, backgroundColor: routeConfig.bg, color: routeConfig.text, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase" }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.80"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
              >
                {routeConfig.label} <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
              <button type="button" onClick={onRevise}
                style={{ padding: "11px 22px", border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "transparent", color: "rgba(255,255,255,0.28)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", cursor: "pointer" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.50)"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.28)"; }}
              >
                Revise answers
              </button>
            </div>
          </div>

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
  const [answers,     setAnswers]     = React.useState<Record<string, DiagnosticAnswerValue>>({});
  const [identity,    setIdentity]    = React.useState({ name: "", email: "", organisation: "", role: "", notes: "" });
  const [submitResult,setSubmitResult]= React.useState<DiagnosticSubmitResponse | null>(null);
  const [isSubmitting,setIsSubmitting]= React.useState(false);
  const [teamAlignmentPct, setTeamAlignmentPct] = React.useState<number | null>(null);
  const [subjectId, setSubjectId] = React.useState("");

  React.useEffect(() => {
    trackStageStart("enterprise");
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

  const allPrompts = BLOCKS.flatMap(b => b.prompts.map((_, i) => `${b.id}-${i}`));
  const answeredCount = allPrompts.filter(k => (answers[k] ?? 0) > 0).length;
  const complete = answeredCount === allPrompts.length;

  const answerList: DiagnosticAnswer[] = BLOCKS.flatMap(b =>
    b.prompts.map((prompt, i) => ({
      sectionId: b.id, questionId: `${b.id}-${i}`, prompt,
      value: (answers[`${b.id}-${i}`] ?? 3) as DiagnosticAnswerValue,
    }))
  ).filter(a => (answers[a.questionId] ?? 0) > 0);

  const totalScore = answerList.reduce((s, a) => s + a.value, 0);
  const maxScore   = allPrompts.length * 5;
  const totalPct   = complete ? Math.round((totalScore / maxScore) * 100) : 0;

  const sections: SectionScore[] = BLOCKS.map(b => ({
    id: b.id, title: b.title,
    pct: sectionPct(answers, b.id),
  }));

  const reading = React.useMemo(() =>
    complete ? deriveReading(answers, totalPct, teamAlignmentPct) : null,
    [answers, totalPct, teamAlignmentPct, complete]
  );

  function setAnswer(key: string, value: DiagnosticAnswerValue) {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }

  function advance(to: PagePhase) { window.scrollTo({ top: 0, behavior: "smooth" }); setPhase(to); }

  async function handleSubmit() {
    setIsSubmitting(true);
    const res = await submitDiagnostic({
      kind: "enterprise", version: "2026.1", source: "diagnostics", entry: "enterprise-assessment",
      intent: "enterprise-diagnostic", title: "Enterprise Assessment",
      respondent: { name: identity.name || null, email: identity.email || null, organisation: identity.organisation || null, role: identity.role || null },
      answers: answerList, notes: identity.notes || null,
      summary: { totalScore, maxScore, pct: totalPct, severity: severityFromPct(totalPct), band: bandFromPct(totalPct), sectionScores: BLOCKS.map(b => buildSectionScore({ sectionId: b.id, title: b.title, answers: answerList.filter(a => a.sectionId === b.id) })) },
      metadata: { ui: "enterprise-assessment", nextStepHref: reading?.route === "STRATEGY_ROOM" ? "/strategy-room" : "/diagnostics/executive-reporting", nextRoute: (reading?.route ?? "EXECUTIVE_REPORTING") as import("@/lib/diagnostics/types").DiagnosticRoute, teamAlignmentPct },
    });
    setSubmitResult(res);

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
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}90` }}>Team reality loaded — {teamAlignmentPct}%</span>
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
                      { label: "Respondent name", key: "name",         type: "text",  placeholder: "Full name" },
                      { label: "Email",           key: "email",        type: "email", placeholder: "email@org.com" },
                      { label: "Role",            key: "role",         type: "text",  placeholder: "Board chair, CEO, Director…" },
                      { label: "Organisation",    key: "organisation", type: "text",  placeholder: "Company or institution" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={labelStyle}>{f.label}</label>
                        <input type={f.type} value={identity[f.key as keyof typeof identity]} onChange={e => setIdentity(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle}
                          onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label style={labelStyle}>Initial observations (optional)</label>
                      <textarea value={identity.notes} onChange={e => setIdentity(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Where is institutional signal, governance reliability, or trust becoming unstable?" style={{ ...inputStyle, resize: "none", lineHeight: 1.75 }}
                        onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; }}
                      />
                    </div>
                  </div>

                  <button type="button" onClick={() => advance("instrument")} style={{ marginTop: "1.75rem", padding: "13px 28px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; }}
                  >
                    Begin instrument <ArrowRight style={{ width: "12px", height: "12px" }} />
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
                      <h2 style={{ marginTop: "1.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", lineHeight: 1.0, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)", marginBottom: "0.75rem" }}>Rate the institutional condition.</h2>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.70, color: "rgba(255,255,255,0.38)", fontStyle: "italic", maxWidth: "48ch", marginBottom: "2rem" }}>
                        Answer for the actual current condition — not aspirations. 1 = Strongly no. 5 = Strongly yes.
                      </p>

                      <div className="space-y-4">
                        {BLOCKS.map(block => {
                          const blockAnswered = [0, 1, 2].filter(i => (answers[`${block.id}-${i}`] ?? 0) > 0).length;
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
                                  const val = (answers[key] ?? 0) as DiagnosticAnswerValue | 0;
                                  return (
                                    <div key={key} style={{ padding: "1rem 1.5rem" }}>
                                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.60, color: "rgba(255,255,255,0.65)", marginBottom: "0.25rem" }}>{prompt}</p>
                                      <div className="flex justify-between">
                                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Strongly no</span>
                                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Strongly yes</span>
                                      </div>
                                      <ScoreSelector value={val} onChange={v => setAnswer(key, v)} />
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <button type="button" onClick={() => advance("identity")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", display: "flex", alignItems: "center", gap: "6px" }}>
                          <ArrowLeft style={{ width: "11px", height: "11px" }} /> Back
                        </button>
                        <div style={{ textAlign: "center" }}>
                          {!complete && <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.5rem" }}>Answer all 12 questions to generate the reading</p>}
                          <button type="button" onClick={() => complete && advance("result")} disabled={!complete}
                            style={{ padding: "11px 24px", border: `1px solid ${complete ? `${GOLD}42` : "rgba(255,255,255,0.06)"}`, backgroundColor: complete ? `${GOLD}10` : "rgba(255,255,255,0.01)", color: complete ? `${GOLD}CC` : "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: complete ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
                            onMouseEnter={e => { if (complete) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }}
                            onMouseLeave={e => { if (complete) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}
                          >
                            Generate enterprise reading <ArrowRight style={{ width: "11px", height: "11px" }} />
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
                  <ResultSurface reading={reading} sections={sections} totalScore={totalScore} maxScore={maxScore} totalPct={totalPct} teamAlignmentPct={teamAlignmentPct} submitResult={submitResult} onSubmit={handleSubmit} isSubmitting={isSubmitting} onRevise={() => advance("instrument")} />
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

