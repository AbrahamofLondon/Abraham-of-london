// components/assessments/ConstitutionalDiagnosticSuite.tsx
// Design: Institutional Monumentalism
// The constitutional diagnostic is the entry gate to the entire product ladder.
// It uses a serious scoring engine (evaluateConstitutionalRoute) that produces
// STRATEGY / DIAGNOSTIC / REJECT routes with confidence scores, disqualifiers,
// and recommended interventions.
//
// What was rebuilt:
// 1. "use client" directive removed (Pages Router)
// 2. All rounded-* classes removed — sharp panel system throughout
// 3. Question instrument: design tokens, Cormorant statement text, gold resonance rail
// 4. Verdict surface: full constitutional reading — not just a route badge
//    - Named disqualifiers that triggered
//    - Posture and readiness classification
//    - Recommended interventions from the engine
//    - Scoring rationale as a transparent log
//    - Conditional escalation routing with structural justification
// 5. Amber-500 CTAs replaced with platform-standard buttons

import * as React from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  AlertTriangle,
  CheckSquare,
  ChevronRight,
  Shield,
} from "lucide-react";
import {
  evaluateConstitutionalRoute,
  type ConstitutionalDecision,
  type AuthorityType,
  type OrgPosture,
  type ReadinessTier,
} from "@/lib/constitution/rules";
import {
  saveConstitutionalThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";
import { matchPlaybooks } from "@/lib/playbooks/matcher";
import RecommendedPlaybooks from "@/components/diagnostics/results/RecommendedPlaybooks";
import TrajectoryLine from "@/components/diagnostics/results/TrajectoryLine";
import DiagnosticFeedback from "@/components/diagnostics/results/DiagnosticFeedback";
import { inferTrajectory } from "@/lib/diagnostics/prognosis";

function readinessNumeric(tier: string): number {
  const map: Record<string, number> = { FRAGILE: 25, EMERGING: 40, STABILIZING: 55, EXECUTION_READY: 75, SOVEREIGN: 90 };
  return map[tier] ?? 50;
}
import ThresholdProximityLine, {
  thresholdProximityText,
} from "@/components/diagnostics/results/ThresholdProximityLine";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const LIFT = "rgb(10 14 20)";
const VOID = "rgb(3 3 5)";

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type Likert = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
type Answer = { resonance: Likert; certainty: Likert };

type Question = {
  id: string;
  text: string;
  domain: "coherence" | "authority" | "environment" | "execution" | "trust" | "friction" | "stakes" | "pattern" | "pressure";
  reverse?: boolean;
};

const QUESTIONS: readonly Question[] = [
  { id: "q1",  text: "If you followed the money and the calendar for the last quarter, you would see exactly what this organisation actually values — and it matches what leadership says.", domain: "coherence" },
  { id: "q2",  text: "Everyone knows who has the final say — and that person actually decides.", domain: "authority" },
  { id: "q3",  text: "The environment has changed faster than the organisation has adapted.", domain: "environment", reverse: true },
  { id: "q4",  text: "If you asked ten people in the organisation what the actual priority is right now, you would get at least three different answers.", domain: "execution", reverse: true },
  { id: "q5",  text: "The people doing the work believe that leadership understands what it is actually asking of them.", domain: "trust" },
  { id: "q6",  text: "Things that should be simple keep getting slowed down from the inside.", domain: "friction", reverse: true },
  { id: "q7",  text: "There is one person who is clearly responsible for this decision — and they have the authority to make it.", domain: "authority" },
  { id: "q8",  text: "There is a specific decision in front of us right now where getting it wrong would cost something we cannot recover easily.", domain: "stakes" },
  { id: "q9",  text: "The last time we tried to fix this, the fix itself failed — and we still have not addressed why.", domain: "pattern", reverse: true },
  { id: "q10", text: "Outside forces — market, regulators, competitors — are making this impossible to ignore.", domain: "pressure" },
] as const;

const DOMAIN_LABELS: Record<Question["domain"], string> = {
  coherence:   "Strategic coherence",
  authority:   "Decision authority",
  environment: "Environmental shift",
  execution:   "Execution quality",
  trust:       "Trust condition",
  friction:    "Operating friction",
  stakes:      "Consequence weight",
  pattern:     "Prior correction history",
  pressure:    "External pressure",
};

// ─────────────────────────────────────────────────────────────────────────────
// SCORING ENGINE (client-side, mirrors the backend)
// ─────────────────────────────────────────────────────────────────────────────

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function pct(v: number) {
  return clamp(Math.round(v * 10), 0, 100);
}

function certaintyWeight(v: Likert) {
  return clamp(0.45 + v / 18, 0.45, 1);
}

function classifyAuthorityType(score: number): AuthorityType {
  if (score >= 70) return "DIRECT";
  if (score >= 45) return "PROXY";
  return "UNCLEAR";
}

function classifyPosture(coherence: number, friction: number, trust: number, governance: number): OrgPosture {
  const red = [coherence < 35, friction >= 70, trust < 35, governance < 35].filter(Boolean).length;
  if (red >= 3) return "DISORDERED";
  if (coherence < 45 || friction >= 60) return "MISALIGNED";
  if (coherence < 65 || governance < 60) return "DRIFTING";
  return "ORDERED";
}

function classifyReadiness(authority: number, coherence: number, trust: number, readiness: number, governance: number): ReadinessTier {
  const composite = (authority + coherence + trust + readiness + governance) / 5;
  if (composite < 35) return "FRAGILE";
  if (composite < 50) return "EMERGING";
  if (composite < 68) return "STABILIZING";
  if (composite < 85) return "EXECUTION_READY";
  return "SOVEREIGN";
}

type DerivedScores = {
  authority: number; coherence: number; trust: number;
  pressure: number; friction: number; seriousness: number;
  governance: number; narrative: number; interventionReadiness: number;
  severity: number; failureModeCount: number;
  authorityType: AuthorityType; posture: OrgPosture; readinessTier: ReadinessTier;
};

function buildDecision(answers: Record<string, Answer>): {
  decision: ConstitutionalDecision | null;
  scores: DerivedScores | null;
  routeHref: string;
} {
  const buckets: Record<string, number[]> = {};

  for (const q of QUESTIONS) {
    const answer = answers[q.id];
    if (!answer) continue;
    const base = q.reverse ? 10 - answer.resonance : answer.resonance;
    const scored = base * certaintyWeight(answer.certainty);
    (buckets[q.domain] ||= []).push(scored);
  }

  const avg = (items: number[]) => items.length ? items.reduce((a, b) => a + b, 0) / items.length : 5;

  const authority = pct(avg(buckets.authority || []));
  const coherence = pct(avg(buckets.coherence || []));
  const trust = pct(avg(buckets.trust || []));
  const pressure = pct(avg([...(buckets.pressure || []), ...(buckets.stakes || []), ...(buckets.environment || [])]));
  const friction = pct(avg([...(buckets.friction || []), ...(buckets.execution || []), ...(buckets.pattern || [])]));

  const seriousness = clamp(Math.round((pressure + friction + authority) / 3), 0, 100);
  const governance  = clamp(Math.round((coherence + trust + authority) / 3), 0, 100);
  const narrative   = clamp(Math.round((coherence + trust + authority) / 3), 0, 100);
  const interventionReadiness = clamp(Math.round((authority + coherence + trust + (100 - friction)) / 4), 0, 100);

  let failureModeCount = 0;
  if (coherence < 50) failureModeCount++;
  if (authority < 50) failureModeCount++;
  if (trust < 50) failureModeCount++;
  if (friction >= 60) failureModeCount++;
  if (pressure >= 70) failureModeCount++;

  const severity = clamp(
    Math.round(((100 - coherence) / 10 + (100 - authority) / 10 + friction / 10 + pressure / 12) / 4),
    0, 10,
  );

  const authorityType  = classifyAuthorityType(authority);
  const posture        = classifyPosture(coherence, friction, trust, governance);
  const readinessTier  = classifyReadiness(authority, coherence, trust, interventionReadiness, governance);

  const decision = evaluateConstitutionalRoute({
    clarityScore: coherence,
    authorityType,
    readinessTier,
    posture,
    failureModeCount,
    failureModeSeverity: severity,
    narrativeCoherence: narrative,
    interventionReadiness,
    seriousnessScore: seriousness,
    governanceDiscipline: governance,
    trustCondition: trust,
    mandateFit: seriousness >= 30,
    operatorKey: "public_constitutional_diagnostic",
    operatorOverrideRequested: false,
  });

  const routeHref =
    decision.route === "STRATEGY"
      ? "/strategy-room"
      : decision.route === "DIAGNOSTIC"
        ? "/diagnostics/executive-reporting"
        : "/diagnostics";

  const scores: DerivedScores = {
    authority, coherence, trust, pressure, friction,
    seriousness, governance, narrative, interventionReadiness,
    severity, failureModeCount, authorityType, posture, readinessTier,
  };

  return { decision, scores, routeHref };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
    } />
  );
}

// Route colours
function routeColor(route: string): { border: string; bg: string; text: string } {
  switch (route) {
    case "STRATEGY":   return { border: "rgba(52,211,153,0.25)", bg: "rgba(52,211,153,0.06)", text: "rgba(110,231,183,0.90)" };
    case "REJECT":     return { border: "rgba(248,113,113,0.25)", bg: "rgba(248,113,113,0.06)", text: "rgba(252,165,165,0.90)" };
    default:           return { border: `${GOLD}30`, bg: `${GOLD}08`, text: `${GOLD}CC` };
  }
}

// Posture colour
function postureColor(posture: string): string {
  switch (posture) {
    case "ORDERED":     return "rgba(110,231,183,0.75)";
    case "DRIFTING":    return `${GOLD}CC`;
    case "MISALIGNED":  return "rgba(253,186,116,0.85)";
    default:            return "rgba(252,165,165,0.85)";
  }
}

// Readiness colour
function readinessColor(tier: string): string {
  switch (tier) {
    case "SOVEREIGN":       return "rgba(110,231,183,0.90)";
    case "EXECUTION_READY": return "rgba(110,231,183,0.70)";
    case "STABILIZING":     return `${GOLD}CC`;
    case "EMERGING":        return "rgba(253,186,116,0.80)";
    default:                return "rgba(252,165,165,0.80)";
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VERDICT READING — what the constitutional engine found
// ─────────────────────────────────────────────────────────────────────────────

function verdictNarrative(decision: ConstitutionalDecision, scores: DerivedScores): string {
  const { route } = decision;
  const { posture, readinessTier, authorityType, coherence, trust, friction, governance } = scores;

  // Identify the central tension for mirror-back
  const tensions: string[] = [];
  if (coherence > 60 && friction >= 55) tensions.push("high coherence on paper but visible execution friction");
  if (trust > 60 && authorityType !== "DIRECT") tensions.push("trust present but authority unclear — people trust the mission but not who decides");
  if (scores.pressure >= 65 && coherence < 50) tensions.push("intense external pressure on a system that is not internally coherent");
  if (governance > 60 && friction >= 55) tensions.push("governance intent is present but the operating reality contradicts it");
  const tensionLine = tensions.length > 0
    ? ` The central tension: ${tensions[0]}.`
    : "";

  if (route === "STRATEGY") {
    return `The constitutional reading is clear: this system can bear direct strategic engagement. Coherence reads at ${coherence}%, authority is ${authorityType.toLowerCase()}, and the posture (${posture.toLowerCase()}) is stable enough to carry intervention without losing judgment.${tensionLine} The next move is structured strategy — not further clarification.`;
  }

  if (route === "REJECT") {
    if (decision.disqualifiersTriggered.some(d => /clarity|coherence/i.test(d))) {
      return `This is not a strategy problem yet — it is a coherence problem. Coherence reads at ${coherence}%, which means the signal has not been reduced to a stable form. Pressure may be real, but pressure without coherence displaces judgment rather than sharpening it.${tensionLine} The next move is clarification: make the problem nameable before attempting to solve it.`;
    }
    if (decision.disqualifiersTriggered.some(d => /authority/i.test(d))) {
      return `The problem may be real but there is no one who can carry the decision. Authority reads as ${authorityType.toLowerCase()}. A matter can be serious and still remain constitutionally unready if no single person has both the responsibility and the power to act.${tensionLine} The next move is to establish who decides — then re-enter.`;
    }
    if (decision.disqualifiersTriggered.some(d => /seriousness|mandate/i.test(d))) {
      return `The signal reads as exploratory rather than consequential. There may be concern, but it has not yet reached the threshold where the cost of inaction is material.${tensionLine} The next move is foundational diagnostic work — the system needs to confirm whether this is a real structural problem or a passing discomfort.`;
    }
    return `Multiple constitutional thresholds are failing simultaneously. This usually means the disorder is in purpose, authority, or coherence — not a single defect but a systemic condition. Coherence: ${coherence}%. Trust: ${trust}%. Governance: ${governance}%.${tensionLine} The next move is diagnostic correction before escalation.`;
  }

  // DIAGNOSTIC
  if (authorityType === "UNCLEAR") {
    return `The strain is real — coherence reads at ${coherence}% and trust at ${trust}%. But authority is unclear, which means no one can cleanly carry the judgment this situation requires.${tensionLine} This is not an importance problem. It is a governance problem. The next move is diagnostic work that separates authority confusion from the underlying structural issue.`;
  }
  if (posture === "DISORDERED" || posture === "MISALIGNED") {
    return `The posture reads as ${posture.toLowerCase()}. The system is carrying constitutional strain, and consequence may already be material. But strain at this level distorts correction if it is rushed — fixing a disordered system requires more precision than fixing a drifting one.${tensionLine} The next move is formal diagnosis before any escalation.`;
  }
  if (readinessTier === "FRAGILE" || readinessTier === "EMERGING") {
    return `Readiness is ${readinessTier.toLowerCase()}. The system can register that something is wrong, but it cannot yet bear heavy intervention without creating new friction.${tensionLine} The consequence is visible. The capacity to absorb correction is not. The next move is preparation through the diagnostic layer — build the capacity, then apply the pressure.`;
  }
  return `The system is carrying a genuine signal. Coherence: ${coherence}%. Trust: ${trust}%. The reading is below strategy threshold but close.${tensionLine} There is enough order to proceed with diagnostic refinement — the question now is whether one more pass reveals the conditions for escalation, or confirms that this level of intervention is sufficient.`;
}

function buildFailureModes(decision: ConstitutionalDecision, scores: DerivedScores): string[] {
  const modes: string[] = [];
  if (scores.coherence < 50) modes.push("STRUCTURAL_MISALIGNMENT");
  if (scores.authorityType !== "DIRECT") modes.push("AUTHORITY_BLINDSPOT");
  if (scores.trust < 50) modes.push("TRUST_EROSION");
  if (scores.friction >= 60) modes.push("EXECUTION_DRIFT");
  if (scores.pressure >= 70) modes.push("RISK_POSTURE_DEGRADATION");
  if (scores.failureModeCount >= 3 || decision.route === "REJECT") {
    modes.push("SYSTEMIC_BREAKDOWN");
  }
  if (decision.disqualifiersTriggered.some((item) => /trust|signal/i.test(item))) {
    modes.push("SIGNAL_FAILURE");
  }
  return Array.from(new Set(modes));
}

function extractConstitutionalTensions(decision: ConstitutionalDecision, scores: DerivedScores): import("@/lib/diagnostics/tension-thread").TensionSignal[] {
  const signals: import("@/lib/diagnostics/tension-thread").TensionSignal[] = [];
  const src = "constitutional" as const;

  if (decision.route === "REJECT") {
    signals.push({ domain: "constitutional", signal: "structural_failure", severity: "high", source: src, evidence: `Constitutional route: REJECT. Multiple thresholds failing. Coherence: ${scores.coherence}%, Trust: ${scores.trust}%.` });
  }

  if (scores.trust > 60 && scores.authorityType === "UNCLEAR") {
    signals.push({ domain: "authority", signal: "trust_asymmetry", severity: "medium", source: src, evidence: `Trust reads at ${scores.trust}% but authority is UNCLEAR — people trust the mission but not who decides.` });
  }

  if (scores.coherence > 55 && scores.friction >= 55) {
    signals.push({ domain: "execution", signal: "execution_drift", severity: "medium", source: src, evidence: `Coherence at ${scores.coherence}% but friction at ${scores.friction}% — governance intent is present but execution contradicts it.` });
  }

  if (scores.pressure >= 65 && scores.coherence < 50) {
    signals.push({ domain: "risk", signal: "unmanaged_risk", severity: "high", source: src, evidence: `High pressure (${scores.pressure}%) on a system with low coherence (${scores.coherence}%) — consequence is building without adequate clarity.` });
  }

  // Recursive failure: pattern domain flagged
  if (decision.disqualifiersTriggered.some(d => /pattern|correction/i.test(d))) {
    signals.push({ domain: "pattern", signal: "recursive_failure", severity: "medium", source: src, evidence: "Previous correction attempts failed for structural reasons — the root cause has not been addressed." });
  }

  return signals;
}

function buildConstitutionalThread(
  decision: ConstitutionalDecision,
  scores: DerivedScores,
  routeHref: string,
): ConstitutionalThread {
  const failureModes = buildFailureModes(decision, scores);
  const narrative = verdictNarrative(decision, scores);

  return {
    source: "constitutional-diagnostic",
    createdAt: new Date().toISOString(),
    route: decision.route,
    routeHref,
    confidence: Math.round(decision.confidence * 100),
    posture: scores.posture,
    readinessTier: scores.readinessTier,
    authorityType: scores.authorityType,
    domainScores: {
      coherence: scores.coherence,
      authority: scores.authority,
      trust: scores.trust,
      pressure: scores.pressure,
      friction: scores.friction,
      seriousness: scores.seriousness,
      governance: scores.governance,
    },
    failureModes,
    recommendedInterventions: decision.recommendedInterventions,
    rationale: decision.rationale,
    summary: {
      title: `${decision.route} constitutional reading`,
      narrative,
      whatThisStageTests:
        "This stage tests whether the problem is structurally clear enough, sponsored enough, and orderly enough to justify escalation.",
    },
    bridge: {
      teamAssessment: {
        prompts: [
          "Where does leadership believe authority sits, and where does the team experience it?",
          "Which stated priorities are not reaching operating reality?",
          "Where is trust weak enough to distort signal quality?",
        ],
        hypotheses: [
          scores.authorityType !== "DIRECT"
            ? "Authority is likely being experienced differently across layers."
            : "Authority may be clearer than execution transmission.",
          scores.coherence < 60
            ? "Strategic language and operational reality are likely diverging."
            : "The main issue may be translation rather than intent.",
        ],
      },
      enterpriseAssessment: {
        watchpoints: [
          "Leadership coherence across layers",
          "Governance reliability under pressure",
          "Execution variance across units",
        ],
        rationale:
          "The enterprise stage tests whether the constitutional signal is local to one team or distributed through the institution.",
      },
      strategyRoom: {
        summary: narrative,
        route: decision.route,
        escalationAllowed: decision.route === "STRATEGY",
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// ESCALATION ROUTING CONFIG
// ─────────────────────────────────────────────────────────────────────────────

function routeConfig(route: string, scores: DerivedScores) {
  switch (route) {
    case "STRATEGY":
      return {
        label:         "Strategy Route",
        destination:   "Strategy Room",
        href:          "/strategy-room",
        note:          "The signal warrants direct private advisory engagement.",
        secondaryHref: "/diagnostics/executive-reporting",
        secondaryLabel:"Executive Reporting",
      };
    case "REJECT":
      return {
        label:         "Foundational Route",
        destination:   "Diagnostic Ladder",
        href:          "/diagnostics",
        note:          "Foundational clarification precedes any premium escalation.",
        secondaryHref: null,
        secondaryLabel: null,
      };
    default:
      return {
        label:         "Diagnostic Route",
        destination:   "Executive Reporting",
        href:          "/diagnostics/executive-reporting",
        note:          scores.authorityType === "UNCLEAR"
          ? "Establish authority clarity before escalating to private advisory."
          : "Diagnostic clarification will sharpen the constitutional case for private engagement.",
        secondaryHref: "/strategy-room",
        secondaryLabel: "Strategy Room (pending diagnostic)",
      };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function ConstitutionalDiagnosticSuite() {
  const [index,   setIndex]   = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, Answer>>({});
  const [verdict, setVerdict] = React.useState(false);
  const [reading, setReading] = React.useState(false);
  const [readingText, setReadingText] = React.useState("");

  const current        = QUESTIONS[index]!;
  const currentAnswer  = answers[current.id] || { resonance: 5 as Likert, certainty: 5 as Likert };
  const answeredCount  = Object.keys(answers).length;
  const complete       = answeredCount === QUESTIONS.length;
  const progress       = Math.round((answeredCount / QUESTIONS.length) * 100);

  const { decision, scores, routeHref } = React.useMemo(() => buildDecision(answers), [answers]);
  const thread = React.useMemo(
    () => (decision && scores ? buildConstitutionalThread(decision, scores, routeHref) : null),
    [decision, routeHref, scores],
  );
  const matchedPlaybooks = React.useMemo(
    () =>
      thread
        ? matchPlaybooks({
            route: "CONSTITUTIONAL",
            readiness: thread.readinessTier,
            failureModes: thread.failureModes,
            dominantDomains: ["coherence", "authority", "trust", "friction"],
            authorityType: thread.authorityType,
          })
        : [],
    [thread],
  );

  // Fire stage-complete event once when verdict is shown
  const completeFired = React.useRef(false);
  const resultViewStart = React.useRef<number>(0);
  React.useEffect(() => {
    if (verdict && !completeFired.current) {
      completeFired.current = true;
      resultViewStart.current = Date.now();
      if (thread) saveConstitutionalThread(thread);
      // Extract and merge tension signals into cross-stage thread
      if (decision && scores) {
        try {
          const tensions = extractConstitutionalTensions(decision, scores);
          if (tensions.length > 0) {
            const { mergeAndSaveTensions: mergeTensions } = require("@/lib/diagnostics/thread-engine");
            mergeTensions(tensions, "constitutional");
          }
        } catch {}
      }
      import("@/lib/analytics/funnel").then(({ trackStageComplete }) => {
        const outcome = decision.route === "REJECT" ? "reject" as const
          : decision.route === "STRATEGY" ? "strategy" as const
          : "diagnostic" as const;
        trackStageComplete("constitutional", outcome, routeHref);
      }).catch(() => {});
    }
  }, [verdict, decision.route, routeHref, thread]);

  // Track result engagement depth — fire on unmount or page leave
  React.useEffect(() => {
    if (!verdict) return;
    const handleUnload = () => {
      if (resultViewStart.current) {
        track("result_engagement", {
          stage: "constitutional",
          time_on_result_ms: Date.now() - resultViewStart.current,
          route: decision.route,
        });
      }
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      handleUnload();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [verdict, decision.route]);

  function revealVerdict() {
    if (verdict || reading) return;
    setReading(true);
    const lines = [
      "Reading where your answers converge.",
      "Testing whether this is a coherence problem, a trust problem, or a pressure problem.",
      "Separating the visible symptom from the structural strain beneath it.",
    ];
    let i = 0;
    setReadingText(lines[0]!);
    const interval = setInterval(() => {
      i++;
      if (i < lines.length) {
        setReadingText(lines[i]!);
      } else {
        clearInterval(interval);
        setReading(false);
        setVerdict(true);
      }
    }, 900);
  }

  function setResonance(v: number) {
    setAnswers(prev => {
      const existing = prev[current.id] ?? { resonance: 5 as Likert, certainty: 5 as Likert };
      return { ...prev, [current.id]: { ...existing, resonance: v as Likert } };
    });
  }
  function setCertainty(v: number) {
    setAnswers(prev => {
      const existing = prev[current.id] ?? { resonance: 5 as Likert, certainty: 5 as Likert };
      return { ...prev, [current.id]: { ...existing, certainty: v as Likert } };
    });
  }

  const rc = routeColor(decision?.route ?? "DIAGNOSTIC");

  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <AnimatePresence mode="wait">

        {/* ── INSTRUMENT ─────────────────────────────────────────────── */}
        {!verdict && (
          <motion.div key="instrument"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.50 }}
          >
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] py-12">

              {/* Left — question instrument */}
              <div className="space-y-6">
                {/* Progress strip */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px", letterSpacing: "0.34em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}>
                      Constitutional diagnostic
                    </span>
                    <span style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px", letterSpacing: "0.18em",
                      color: "rgba(255,255,255,0.38)",
                    }}>
                      {answeredCount} / {QUESTIONS.length}
                    </span>
                  </div>
                  <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                    <motion.div
                      style={{ height: "100%", backgroundColor: `${GOLD}80` }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                </div>

                {/* Question card */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`q-${index}`}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.30 }}
                    style={{
                      border: "1px solid rgba(255,255,255,0.07)",
                      backgroundColor: LIFT,
                    }}
                  >
                    {/* Card header */}
                    <div style={{
                      padding: "0.85rem 1.5rem",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase",
                        color: "rgba(255,255,255,0.22)",
                      }}>
                        {DOMAIN_LABELS[current.domain]}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.20em",
                        color: "rgba(255,255,255,0.20)",
                      }}>
                        {index + 1} / {QUESTIONS.length}
                      </span>
                    </div>

                    {/* Statement */}
                    <div style={{ padding: "1.75rem 1.5rem" }}>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "clamp(1.1rem, 1.8vw, 1.45rem)",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.85)",
                        marginBottom: "1.75rem",
                      }}>
                        {current.text}
                      </p>

                      {/* Resonance rail */}
                      <div style={{ marginBottom: "1.25rem" }}>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase",
                            color: `${GOLD}90`,
                          }}>
                            How true is this?
                          </span>
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "8px", color: `${GOLD}CC`,
                          }}>
                            {currentAnswer.resonance}/10
                          </span>
                        </div>
                        <input
                          type="range" min={0} max={10} step={1}
                          value={currentAnswer.resonance}
                          onChange={e => setResonance(Number(e.target.value))}
                          style={{ width: "100%", height: "2px", cursor: "pointer", accentColor: GOLD }}
                        />
                        <div className="flex justify-between mt-1">
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Not true</span>
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Completely true</span>
                        </div>
                      </div>

                      {/* Certainty rail */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase",
                            color: "rgba(110,231,183,0.70)",
                          }}>
                            How sure are you?
                          </span>
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "8px", color: "rgba(110,231,183,0.85)",
                          }}>
                            {currentAnswer.certainty}/10
                          </span>
                        </div>
                        <input
                          type="range" min={0} max={10} step={1}
                          value={currentAnswer.certainty}
                          onChange={e => setCertainty(Number(e.target.value))}
                          style={{ width: "100%", height: "2px", cursor: "pointer", accentColor: "rgb(110,231,183)" }}
                        />
                        <div className="flex justify-between mt-1">
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Uncertain</span>
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Certain</span>
                        </div>
                      </div>
                    </div>

                    {/* Navigation */}
                    <div style={{
                      padding: "1rem 1.5rem",
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}>
                      <button
                        type="button"
                        onClick={() => setIndex(v => Math.max(0, v - 1))}
                        disabled={index === 0}
                        style={{
                          background: "none", border: "none",
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
                          color: index === 0 ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.35)",
                          cursor: index === 0 ? "not-allowed" : "pointer",
                        }}
                      >
                        Previous
                      </button>

                      {index < QUESTIONS.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => setIndex(v => v + 1)}
                          className="inline-flex items-center gap-2 transition-all duration-300"
                          style={{
                            padding: "9px 20px",
                            border: `1px solid ${GOLD}42`,
                            backgroundColor: `${GOLD}10`,
                            color: `${GOLD}CC`,
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
                            cursor: "pointer",
                          }}
                          onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; }}
                          onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; }}
                        >
                          Next <ArrowRight style={{ width: "11px", height: "11px" }} />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => complete && revealVerdict()}
                          disabled={!complete}
                          className="inline-flex items-center gap-2 transition-all duration-300"
                          style={{
                            padding: "9px 20px",
                            border: `1px solid ${complete ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.06)"}`,
                            backgroundColor: complete ? "rgba(52,211,153,0.08)" : "rgba(255,255,255,0.01)",
                            color: complete ? "rgba(110,231,183,0.90)" : "rgba(255,255,255,0.18)",
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase",
                            cursor: complete ? "pointer" : "not-allowed",
                          }}
                        >
                          {complete ? "Reveal verdict" : "Answer all questions"}
                          <ArrowRight style={{ width: "11px", height: "11px" }} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right — live readout */}
              <div>
                <div style={{ position: "sticky", top: "6rem" }} className="space-y-4">
                  {/* Live constitutional signal */}
                  <div style={{ border: `1px solid ${rc.border}`, backgroundColor: rc.bg }}>
                    <div style={{ padding: "0.85rem 1.25rem", borderBottom: `1px solid ${rc.border}`, opacity: 0.70 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7px", letterSpacing: "0.38em", textTransform: "uppercase",
                        color: rc.text,
                      }}>
                        Live constitutional signal
                      </span>
                    </div>
                    <div style={{ padding: "1.25rem" }}>
                      <div style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "3rem", lineHeight: 1,
                        color: rc.text, marginBottom: "0.35rem",
                      }}>
                        {decision?.route ?? "…"}
                      </div>
                      <div style={{
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px", letterSpacing: "0.20em",
                        color: "rgba(255,255,255,0.35)",
                      }}>
                        {decision ? `${Math.round(decision.confidence * 100)}% confidence` : "Awaiting signal"}
                      </div>
                    </div>
                  </div>

                  {/* Domain scores */}
                  {scores && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                      <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        <Eyebrow>Domain scores</Eyebrow>
                      </div>
                      <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                        {[
                          { label: "Coherence",    value: scores.coherence },
                          { label: "Authority",    value: scores.authority },
                          { label: "Trust",        value: scores.trust },
                          { label: "Pressure",     value: scores.pressure },
                          { label: "Friction",     value: 100 - scores.friction }, // inverse
                          { label: "Seriousness",  value: scores.seriousness },
                          { label: "Governance",   value: scores.governance },
                        ].map(({ label, value }) => {
                          const barColor = value >= 65 ? "rgba(110,231,183,0.65)" : value >= 40 ? `${GOLD}80` : "rgba(252,165,165,0.65)";
                          return (
                            <div key={label} style={{ marginBottom: "0.85rem" }}>
                              <div className="flex items-center justify-between mb-1">
                                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                                  {label}
                                </span>
                                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", color: barColor }}>
                                  {value}
                                </span>
                              </div>
                              <div style={{ height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                                <motion.div
                                  style={{ height: "100%", backgroundColor: barColor }}
                                  animate={{ width: `${Math.max(2, value)}%` }}
                                  transition={{ duration: 0.5 }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Posture & Readiness */}
                  {scores && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.008)", padding: "1rem 1.25rem" }}>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Posture</span>
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.14em", color: postureColor(scores.posture) }}>{scores.posture}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Readiness</span>
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.14em", color: readinessColor(scores.readinessTier) }}>{scores.readinessTier}</span>
                      </div>
                    </div>
                  )}

                  {/* Complete CTA */}
                  {complete && (
                    <button
                      type="button"
                      onClick={() => revealVerdict()}
                      className="w-full inline-flex items-center justify-center gap-2 transition-all duration-300"
                      style={{
                        padding: "12px 20px",
                        border: "1px solid rgba(52,211,153,0.35)",
                        backgroundColor: "rgba(52,211,153,0.08)",
                        color: "rgba(110,231,183,0.90)",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                      onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "rgba(52,211,153,0.55)"; el.style.backgroundColor = "rgba(52,211,153,0.12)"; }}
                      onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(52,211,153,0.35)"; el.style.backgroundColor = "rgba(52,211,153,0.08)"; }}
                    >
                      Reveal constitutional verdict <ArrowRight style={{ width: "11px", height: "11px" }} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── READING TRANSITION ─────────────────────────────────────────── */}
        {reading && (
          <motion.div
            key="reading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-20 text-center"
          >
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.32em",
              textTransform: "uppercase",
              color: `${GOLD}90`,
              marginBottom: "1.5rem",
            }}>
              Constitutional reading
            </div>
            <motion.p
              key={readingText}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.15rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.55)",
                fontStyle: "italic",
                maxWidth: "36ch",
                margin: "0 auto",
              }}
            >
              {readingText}
            </motion.p>
          </motion.div>
        )}

        {/* ── VERDICT ────────────────────────────────────────────────────── */}
        {verdict && decision && scores && (
          <motion.div key="verdict"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="py-12 space-y-6">
              {/* Verdict headline */}
              <div style={{ border: `1px solid ${rc.border}`, backgroundColor: rc.bg, padding: "2rem" }}>
                <Eyebrow>Constitutional verdict</Eyebrow>
                <div className="flex items-end justify-between gap-4 flex-wrap mt-4">
                  <div>
                    <div style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300, fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                      lineHeight: 1, letterSpacing: "-0.040em", color: rc.text,
                    }}>
                      {decision.route}
                    </div>
                    <div style={{
                      marginTop: "0.5rem",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase",
                      color: "rgba(255,255,255,0.38)",
                    }}>
                      {Math.round(decision.confidence * 100)}% constitutional confidence
                    </div>
                    <ThresholdProximityLine
                      text={thresholdProximityText({
                        label: "Coherence",
                        value: scores.coherence,
                        thresholdLabel: decision.route === "REJECT" ? "DIAGNOSTIC" : "STRATEGY",
                        threshold: decision.route === "REJECT"
                          ? decision.thresholds.diagnosticThreshold
                          : decision.thresholds.strategyThreshold,
                      })}
                    />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", flexShrink: 0 }}>
                    {[
                      { label: "Posture",    value: scores.posture,      color: postureColor(scores.posture) },
                      { label: "Readiness",  value: scores.readinessTier, color: readinessColor(scores.readinessTier) },
                      { label: "Authority",  value: scores.authorityType, color: scores.authorityType === "DIRECT" ? "rgba(110,231,183,0.80)" : scores.authorityType === "PROXY" ? `${GOLD}CC` : "rgba(252,165,165,0.80)" },
                      { label: "Governance", value: `${scores.governance}%`, color: scores.governance >= 65 ? "rgba(110,231,183,0.75)" : scores.governance >= 40 ? `${GOLD}BB` : "rgba(252,165,165,0.75)" },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ textAlign: "right" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{label}</div>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.12em", color, marginTop: "2px" }}>{value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <TrajectoryLine trajectory={inferTrajectory(scores.coherence, readinessNumeric(scores.readinessTier), decision.disqualifiersTriggered || [])} />

              {/* Cross-stage tension narrative — shows only if prior stages exist */}
              {(() => {
                try {
                  const { readTensionThread } = require("@/lib/diagnostics/tension-thread");
                  const { buildThreadNarrative } = require("@/lib/diagnostics/narrative-engine");
                  const tt = readTensionThread();
                  if (tt && tt.stagesCompleted.length >= 2) {
                    const narrative = buildThreadNarrative(tt);
                    if (narrative) {
                      return (
                        <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}06`, padding: "1.25rem 1.5rem" }}>
                          <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.85rem" }}>
                            What is becoming clear
                          </div>
                          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.72, color: "rgba(255,255,255,0.62)" }}>
                            {narrative}
                          </p>
                        </div>
                      );
                    }
                  }
                } catch {}
                return null;
              })()}

              <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
                {/* Left */}
                <div className="space-y-5">
                  {/* Constitutional reading */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, overflow: "hidden" }}>
                    <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: `linear-gradient(to right, ${GOLD}08, transparent)` }}>
                      <Eyebrow>Constitutional reading</Eyebrow>
                    </div>
                    <div style={{ padding: "1.5rem" }}>
                      <p style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.78,
                        color: "rgba(255,255,255,0.70)",
                      }}>
                        {verdictNarrative(decision, scores)}
                      </p>
                    </div>
                  </div>

                  {/* Disqualifiers — if any triggered */}
                  {decision.disqualifiersTriggered.length > 0 && (
                    <div style={{ border: "1px solid rgba(252,165,165,0.18)", backgroundColor: "rgba(252,165,165,0.04)", padding: "1.25rem 1.5rem" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(252,165,165,0.60)", marginBottom: "0.85rem" }}>
                        Constitutional disqualifiers triggered
                      </div>
                      <div className="space-y-2">
                        {decision.disqualifiersTriggered.map(d => (
                          <div key={d} className="flex items-start gap-2.5">
                            <AlertTriangle style={{ width: "11px", height: "11px", color: "rgba(252,165,165,0.60)", flexShrink: 0, marginTop: "3px" }} />
                            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.55, color: "rgba(255,255,255,0.60)" }}>
                              {d}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommended interventions */}
                  {decision.recommendedInterventions.length > 0 && (
                    <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}07`, padding: "1.25rem 1.5rem" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.38em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.85rem" }}>
                        Recommended interventions
                      </div>
                      <div className="space-y-2.5">
                        {decision.recommendedInterventions.map(iv => (
                          <div key={iv} className="flex items-start gap-2.5">
                            <CheckSquare style={{ width: "11px", height: "11px", color: `${GOLD}80`, flexShrink: 0, marginTop: "3px" }} />
                            <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.55, color: "rgba(255,255,255,0.62)" }}>
                              {iv}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <RecommendedPlaybooks playbooks={matchedPlaybooks} />

                  <DiagnosticFeedback stage="constitutional" routeResultType={decision.route} />

                  {/* Escalation routing */}
                  {(() => {
                    const rc2 = routeConfig(decision.route, scores);
                    const tc  = routeColor(decision.route);
                    return (
                      <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.5rem" }}>
                        <Eyebrow>Constitutional next move</Eyebrow>
                        <p style={{ marginTop: "0.85rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.70, color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginBottom: "1.25rem" }}>
                          {rc2.note}
                        </p>
                        <p style={{ marginBottom: "1rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
                          Next: Team Assessment tests whether leadership and team are operating from the same reality.
                        </p>
                        <div className="flex flex-wrap gap-3">
                          <Link href={rc2.href}
                            className="inline-flex items-center gap-2.5 transition-all duration-300"
                            style={{ padding: "11px 22px", border: `1px solid ${tc.border}`, backgroundColor: tc.bg, color: tc.text, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase" }}
                            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.opacity = "0.80"; }}
                            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.opacity = "1"; }}
                          >
                            {rc2.destination} <ArrowRight style={{ width: "11px", height: "11px" }} />
                          </Link>
                          {rc2.secondaryHref && (
                            <Link href={rc2.secondaryHref}
                              className="inline-flex items-center gap-2.5 transition-all duration-300"
                              style={{ padding: "11px 22px", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", color: "rgba(255,255,255,0.40)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase" }}
                              onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "rgba(255,255,255,0.65)"; el.style.borderColor = "rgba(255,255,255,0.16)"; }}
                              onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.color = "rgba(255,255,255,0.40)"; el.style.borderColor = "rgba(255,255,255,0.08)"; }}
                            >
                              {rc2.secondaryLabel} <ChevronRight style={{ width: "11px", height: "11px" }} />
                            </Link>
                          )}
                          <button type="button" onClick={() => setVerdict(false)}
                            style={{ padding: "11px 22px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "transparent", color: "rgba(255,255,255,0.22)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", cursor: "pointer" }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)"; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.22)"; }}
                          >
                            Review answers
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Right — scoring log */}
                <div className="space-y-4">
                  {/* Constitutional posture */}
                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                    <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <Eyebrow>Constitutional posture</Eyebrow>
                    </div>
                    <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                      {[
                        { label: "Route",         value: decision.route,       color: rc.text },
                        { label: "Posture",        value: scores.posture,        color: postureColor(scores.posture) },
                        { label: "Readiness",      value: scores.readinessTier,  color: readinessColor(scores.readinessTier) },
                        { label: "Authority",      value: scores.authorityType,  color: scores.authorityType === "DIRECT" ? "rgba(110,231,183,0.80)" : scores.authorityType === "PROXY" ? `${GOLD}CC` : "rgba(252,165,165,0.80)" },
                        { label: "Coherence",      value: `${scores.coherence}%`,  color: undefined },
                        { label: "Trust",          value: `${scores.trust}%`,      color: undefined },
                        { label: "Governance",     value: `${scores.governance}%`, color: undefined },
                        { label: "Seriousness",    value: `${scores.seriousness}%`,color: undefined },
                        { label: "Failure modes",  value: `${scores.failureModeCount}`, color: undefined },
                        { label: "Confidence",     value: `${Math.round(decision.confidence * 100)}%`, color: undefined },
                        { label: "Post. weight",   value: `${decision.postureWeight.toFixed(2)}`, color: undefined },
                        { label: "Read. weight",   value: `${decision.readinessWeight.toFixed(2)}`, color: undefined },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="flex items-center justify-between gap-3 py-2"
                          style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                            {label}
                          </span>
                          <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.10em", color: color ?? "rgba(255,255,255,0.58)" }}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rationale log */}
                  {decision.rationale.length > 0 && (
                    <div style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.005)", padding: "1.25rem" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.85rem" }}>
                        Scoring rationale
                      </div>
                      <div className="space-y-1.5">
                        {decision.rationale.map(r => (
                          <p key={r} style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.10em", lineHeight: 1.65, color: "rgba(255,255,255,0.25)" }}>
                            — {r}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
