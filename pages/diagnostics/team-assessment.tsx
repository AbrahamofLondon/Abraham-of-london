// pages/diagnostics/team-assessment.tsx
// Design: Institutional Monumentalism
// The team assessment is the instrument that answers:
// "Does your team share your reality?"
//
// Architecture:
// Phase 1 — Identity: who is filling this in, what context
// Phase 2 — Leader perception: how leader rates team on 4 domains × 3 questions
// Phase 3 — Team reality: leader's estimate of how team would rate themselves
// Phase 4 — Result: gap analysis, fragility classification, escalation routing
//
// The gap between Phase 2 and Phase 3 is the diagnostic finding.
// The fragility engine (Bessel-corrected stddev) classifies variance.
// Result connects to Purpose Alignment if available in sessionStorage.
// Result routes to Enterprise Assessment with a specific structural finding.

import type { GetServerSideProps } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { trackStageStart, trackStageComplete, trackDropoff } from "@/lib/analytics/funnel";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Users,
  Activity,
  Scale,
  Shield,
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
import { calculateFragility } from "@/lib/alignment/fragility-logic";
import {
  readConstitutionalThread,
  mergeTeamFindingsIntoThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";
import { matchPlaybooks } from "@/lib/playbooks/matcher";
import InheritedThreadContext from "@/components/diagnostics/results/InheritedThreadContext";
import RecommendedPlaybooks from "@/components/diagnostics/results/RecommendedPlaybooks";
import TrajectoryLine from "@/components/diagnostics/results/TrajectoryLine";
import { inferTrajectory } from "@/lib/diagnostics/prognosis";
import ThresholdProximityLine, {
  thresholdProximityText,
} from "@/components/diagnostics/results/ThresholdProximityLine";

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";
const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

type Domain = {
  id: string; label: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  leaderPrefix: string; realityPrefix: string;
  prompts: [string, string, string];
};

const DOMAINS: Domain[] = [
  { id: "direction", label: "Direction & Priority", icon: Scale,
    leaderPrefix: "From my position, the team",
    realityPrefix: "Team members would say they",
    prompts: [
      "can state the current priority set with genuine consistency.",
      "organises day-to-day work around declared priorities rather than noise.",
      "is not carrying conflicting versions of what success looks like.",
    ],
  },
  { id: "execution", label: "Execution Integrity", icon: Activity,
    leaderPrefix: "From my position, the team",
    realityPrefix: "Team members would say they",
    prompts: [
      "moves work with clear ownership rather than diffusion of accountability.",
      "converts meetings and decisions into measurable action.",
      "produces visible progress, not just activity.",
    ],
  },
  { id: "trust", label: "Trust & Communication", icon: Shield,
    leaderPrefix: "From my position, the team",
    realityPrefix: "Team members would say they",
    prompts: [
      "surfaces important tensions without avoidance or political calculation.",
      "communicates in ways that reduce ambiguity rather than multiply it.",
      "maintains trust strong enough that correction can happen without paralysis.",
    ],
  },
  { id: "authority", label: "Authority & Escalation", icon: Users,
    leaderPrefix: "From my position, the team",
    realityPrefix: "Team members would say they",
    prompts: [
      "operates with decision rights clear enough to reduce unnecessary drag.",
      "escalates at the correct level and correct speed.",
      "receives leadership intervention that helps them move rather than making them dependent.",
    ],
  },
];

type Phase = "identity" | "leader" | "reality" | "result";
type ScoreMap = Record<string, DiagnosticAnswerValue>;
type IdentityForm = {
  respondentName: string; respondentEmail: string; respondentRole: string;
  organisation: string; teamName: string; teamSize: string; notes: string;
};

type DomainGap = {
  domain: string; label: string;
  leaderPct: number; realityPct: number;
  gap: number; gapSeverity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
};

type GapReading = {
  title: string; pattern: string;
  urgentDomain: string | null; firstAction: string; escalationNote: string;
  route: "ENTERPRISE" | "STRATEGY_ROOM" | "WATCH";
};

function qKey(phase: "leader" | "reality", domainId: string, idx: number) {
  return `${phase}_${domainId}_${idx}`;
}

function domainPct(scores: ScoreMap, phase: "leader" | "reality", domainId: string): number {
  const vals: number[] = [0, 1, 2].map(i => (scores[qKey(phase, domainId, i)] ?? 0) as number);
  const answered = vals.filter(v => v > 0);
  if (!answered.length) return 0;
  return Math.round((answered.reduce((s, v) => s + v, 0) / (answered.length * 5)) * 100);
}

function gapSeverity(gap: number): DomainGap["gapSeverity"] {
  const abs = Math.abs(gap);
  if (abs >= 30) return "CRITICAL";
  if (abs >= 20) return "HIGH";
  if (abs >= 10) return "MEDIUM";
  return "LOW";
}

function buildGaps(ls: ScoreMap, rs: ScoreMap): DomainGap[] {
  return DOMAINS.map(d => {
    const lp = domainPct(ls, "leader", d.id);
    const rp = domainPct(rs, "reality", d.id);
    const gap = lp - rp;
    return { domain: d.id, label: d.label, leaderPct: lp, realityPct: rp, gap, gapSeverity: gapSeverity(gap) };
  });
}

function deriveGapReading(gaps: DomainGap[], overallLeader: number, overallReality: number, purposePct: number | null): GapReading {
  const overallGap = overallLeader - overallReality;
  const criticalGaps = gaps.filter(g => g.gapSeverity === "CRITICAL");
  const highGaps = gaps.filter(g => g.gapSeverity === "HIGH");
  const largestGap = [...gaps].sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];
  const urgentDomain = largestGap && Math.abs(largestGap.gap) >= 10 ? largestGap.label : null;
  const trustGap = gaps.find(g => g.domain === "trust");
  const authorityGap = gaps.find(g => g.domain === "authority");
  const executionGap = gaps.find(g => g.domain === "execution");

  let title = ""; let pattern = ""; let firstAction = ""; let escalationNote = "";
  let route: GapReading["route"] = "WATCH";

  const hasSignalFailure = trustGap && Math.abs(trustGap.gap) >= 20;
  const hasAuthorityBlindspot = authorityGap && authorityGap.gap >= 20;
  const hasExecutionDisconnect = executionGap && executionGap.gap >= 20;

  if (criticalGaps.length >= 2) {
    title = "Systemic coherence strain";
    pattern = `${criticalGaps.length} of 4 domains show critical divergence between leadership perception and team reality. That means judgment is being made from a map the operating layer does not share, which turns ordinary decisions into structural risk. The threshold from local variance into constitutional strain has already been crossed. The next move is enterprise-level reading, not another round of team exhortation.`;
    firstAction = "Before any intervention, gather unfiltered direct reports from 3-5 team members on each domain — individually, not in a group. The goal is to verify whether the perception gap is accurate signal or whether team self-assessment is deflated by a psychological safety problem.";
    escalationNote = "The gap is too wide and too distributed to treat as a contained team issue. The Enterprise Assessment tests whether this strain is local or already embedded in the wider institutional structure.";
    route = "ENTERPRISE";
  } else if (hasSignalFailure) {
    title = "Trust no longer load-bearing";
    pattern = `The trust domain shows a ${Math.abs(trustGap!.gap)}-point divergence between leadership reading and team reality. When trust stops carrying load, signal quality collapses first and correction weakens soon after. The threshold has been crossed from ordinary tension into signal failure. The next move is to restore honest transmission before widening intervention.`;
    firstAction = "Initiate a structured individual conversation with each team member — not a team meeting — focused on: 'What would you change about how decisions get made here?' Anonymise the responses and look for patterns, not individuals.";
    escalationNote = "A trust gap at this level usually means the leader is no longer receiving load-bearing signal. The Enterprise Assessment will test whether that condition is confined to this team or distributed across layers.";
    route = criticalGaps.length >= 1 ? "ENTERPRISE" : "WATCH";
  } else if (hasAuthorityBlindspot) {
    title = "Authority not sufficiently ordered";
    pattern = `The authority domain gap is ${authorityGap!.gap} points. Leadership believes authority is ordered, but the team does not experience it that way in practice. That creates motion without alignment: decisions appear clear at the top and ambiguous at the operating edge. The threshold has not failed at intent but at structural transmission. The next move is to make authority visible in the system, not just assumed by the leader.`;
    firstAction = "Conduct a decision rights audit: for the last 10 significant decisions, map who actually decided, who needed to approve, and who was informed. Compare that map with what the team would draw. The gap is the structural problem.";
    escalationNote = "Authority ambiguity at this level becomes recurring friction if it is left unordered. If the same pattern appears across teams, it becomes a governance problem rather than a local one.";
    route = "WATCH";
  } else if (hasExecutionDisconnect) {
    title = "Motion without alignment";
    pattern = `The execution domain shows a ${executionGap!.gap}-point gap. Leadership is reading movement, while the team is living inside diffusion and weak ownership. That is a coherence problem, not an effort problem: motion is present, but it is not carrying the intended order. The threshold has shifted from execution strain into structural drag. The next move is to re-anchor ownership to outcome rather than activity.`;
    firstAction = "For the next two weeks, require each team member to submit a single-sentence statement of the one measurable outcome they are responsible for. Review against stated priorities. The mismatches show where ownership has not actually been established.";
    escalationNote = "Execution strain of this kind hardens into culture if it persists. If it repeats across cycles, the correction must be structural rather than motivational.";
    route = "WATCH";
  } else if (overallGap <= -15) {
    title = "Readiness suppressed by deflation";
    pattern = `The team rates itself lower than leadership on ${gaps.filter(g => g.gap < -5).length} domains. This is not the usual inflation pattern; it suggests readiness is being held below its actual capacity by deflation, caution, or learned dependency. The threshold issue here is not discipline but under-loaded confidence. The next move is to restore evidence-backed trust in capability before asking for more initiative.`;
    firstAction = "Begin explicitly naming specific evidence of effective execution — not general praise, but specific factual instances: 'The decision on X was correct and here is why.' Specific positive evidence corrects deflation; generic encouragement does not.";
    escalationNote = "Deflation can be corrected locally when it is named early. If it appears across multiple teams, the issue is no longer cultural mood but leadership environment.";
    route = "WATCH";
  } else if (overallGap >= 5 && criticalGaps.length === 0 && highGaps.length <= 1) {
    title = "Manageable variance under watch";
    pattern = `The overall gap of ${overallGap} points remains inside the range of manageable variance between leadership and execution. The system is not disordered, but there is enough divergence in ${urgentDomain ?? "the most exposed domain"} to justify watchfulness. The threshold for escalation has not been crossed. The next move is disciplined monitoring rather than forceful intervention.`;
    firstAction = "Run a quarterly structured check-in where each team member rates the four domains independently before the team meeting. Use the aggregate to track whether the gap is narrowing or widening.";
    escalationNote = "Repeat the reading in 60-90 days to see whether variance is narrowing or hardening. If the gap widens, the next correct move is Enterprise Assessment.";
    route = "WATCH";
  } else {
    title = "Coherent team signal";
    pattern = `Leadership and team reality are reading close enough to the same condition that signal remains usable. That does not mean there is no strain, only that the system is still coherent enough to correct itself without distortion. The threshold is currently on the ordered side of risk. The next move is to test whether this coherence holds under greater pressure.`;
    firstAction = "The next useful diagnostic question is whether this alignment holds under pressure. Run the same assessment after a period of significant change, resource constraint, or strategic shift.";
    escalationNote = "A coherent team can justify enterprise testing if leadership wants to know whether this ordering extends beyond one unit. The point is not escalation for its own sake, but verification under wider pressure.";
    route = "WATCH";
  }

  if (purposePct !== null) {
    const leaderAligned = purposePct >= 62;
    if (!leaderAligned && overallGap > 15) {
      pattern += ` Your Purpose Alignment score of ${purposePct}% indicates personal drift alongside the team perception gap. The team cannot have more clarity than its leadership.`;
    } else if (leaderAligned && overallGap > 25) {
      pattern += ` Your Purpose Alignment score of ${purposePct}% indicates personal clarity. The gap is therefore not a clarity problem — it is a transmission problem. Clear individual direction is not reaching the operating layer.`;
    }
  }

  return { title, pattern, urgentDomain, firstAction, escalationNote, route };
}

function GoldRule({ soft = false }: { soft?: boolean }) {
  return <div className={soft ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"} />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.40em", textTransform: "uppercase", color: `${GOLD}BB` }}>
        {children}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", backgroundColor: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)", outline: "none",
  minHeight: "44px", padding: "10px 13px", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.80)",
  transition: "border-color 250ms ease, background-color 250ms ease",
};

const labelStyle: React.CSSProperties = {
  display: "block", marginBottom: "0.45rem",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase",
  color: "rgba(255,255,255,0.26)",
};

const SCORE_LABELS: Record<DiagnosticAnswerValue, string> = {
  1: "Strongly disagree", 2: "Disagree", 3: "Mixed", 4: "Agree", 5: "Strongly agree",
};

function ScoreSelector({ value, onChange, accent = "gold" }: {
  value: DiagnosticAnswerValue | 0;
  onChange: (v: DiagnosticAnswerValue) => void;
  accent?: "gold" | "slate";
}) {
  return (
    <div className="flex gap-1.5 mt-3">
      {([1, 2, 3, 4, 5] as DiagnosticAnswerValue[]).map(n => {
        const isActive = value === n;
        const ac = accent === "gold"
          ? { border: `${GOLD}55`, bg: `${GOLD}12`, text: GOLD }
          : { border: "rgba(148,163,184,0.40)", bg: "rgba(148,163,184,0.08)", text: "rgba(203,213,225,0.90)" };
        return (
          <button key={n} type="button" onClick={() => onChange(n)} title={SCORE_LABELS[n]}
            style={{
              flex: 1, minHeight: "44px", padding: "8px 4px", textAlign: "center",
              border: `1px solid ${isActive ? ac.border : "rgba(255,255,255,0.07)"}`,
              backgroundColor: isActive ? ac.bg : "rgba(255,255,255,0.01)",
              color: isActive ? ac.text : "rgba(255,255,255,0.30)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "9px", fontWeight: isActive ? 600 : 400,
              cursor: "pointer", transition: "all 200ms ease",
            }}
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

function QuestionBlock({ domain, phase, scores, onScore }: {
  domain: Domain; phase: "leader" | "reality"; scores: ScoreMap;
  onScore: (key: string, value: DiagnosticAnswerValue) => void;
}) {
  const Icon = domain.icon;
  const prefix = phase === "leader" ? domain.leaderPrefix : domain.realityPrefix;
  const answered = [0, 1, 2].filter(idx => (scores[qKey(phase, domain.id, idx)] ?? 0) > 0).length;
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.062)", backgroundColor: "rgb(5 5 7)" }}>
      <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
        <div className="flex items-center gap-2.5">
          <Icon style={{ width: "14px", height: "14px", color: `${GOLD}90` }} />
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", color: "rgba(255,255,255,0.80)" }}>{domain.label}</span>
        </div>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.26em", textTransform: "uppercase", color: answered === 3 ? "rgba(110,231,183,0.60)" : "rgba(255,255,255,0.18)" }}>{answered}/3</span>
      </div>
      <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
        {domain.prompts.map((prompt, idx) => {
          const key = qKey(phase, domain.id, idx);
          const val = (scores[key] ?? 0) as DiagnosticAnswerValue | 0;
          return (
            <div key={key} style={{ padding: "1rem 1.5rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.60, color: "rgba(255,255,255,0.65)" }}>
                <span style={{ color: "rgba(255,255,255,0.30)", marginRight: "0.35rem" }}>{prefix}</span>{prompt}
              </p>
              <div className="flex items-center justify-between mt-1 mb-1">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Strongly disagree</span>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Strongly agree</span>
              </div>
              <ScoreSelector value={val} onChange={v => onScore(key, v)} accent={phase === "reality" ? "slate" : "gold"} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultSurface({ gaps, reading, overallLeader, overallReality, fragility, purposePct, submitResult, onSubmit, isSubmitting, constitutionalThread = null, matchedPlaybooks = [] }: {
  gaps: DomainGap[]; reading: GapReading; overallLeader: number; overallReality: number;
  fragility: ReturnType<typeof calculateFragility>; purposePct: number | null;
  submitResult: DiagnosticSubmitResponse | null; onSubmit: () => void; isSubmitting: boolean;
  constitutionalThread?: ConstitutionalThread | null;
  matchedPlaybooks?: ReturnType<typeof matchPlaybooks>;
}) {
  const overallGap = overallLeader - overallReality;
  const gapAbs = Math.abs(overallGap);
  const rc = {
    ENTERPRISE:    { border: `${GOLD}30`, bg: `${GOLD}08`, text: `${GOLD}CC`, label: "Enterprise Assessment required" },
    STRATEGY_ROOM: { border: "rgba(52,211,153,0.25)", bg: "rgba(52,211,153,0.06)", text: "rgba(110,231,183,0.90)", label: "Strategy Room indicated" },
    WATCH:         { border: "rgba(255,255,255,0.09)", bg: "rgba(255,255,255,0.02)", text: "rgba(255,255,255,0.55)", label: "Monitor and verify" },
  }[reading.route];

  function MRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-center justify-between gap-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.60)" }}>{value}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Headline */}
      <div style={{ border: `1px solid ${rc.border}`, backgroundColor: rc.bg, padding: "2rem" }}>
        <Eyebrow>Team assessment result</Eyebrow>
        <div className="flex items-end justify-between gap-4 mt-4 flex-wrap">
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.5rem, 3vw, 2.5rem)", lineHeight: 1.0, letterSpacing: "-0.022em", color: "rgba(255,255,255,0.92)" }}>{reading.title}</h2>
            <div style={{ marginTop: "0.6rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.30em", textTransform: "uppercase", color: rc.text, opacity: 0.90 }}>{rc.label}</div>
            <ThresholdProximityLine
              text={thresholdProximityText({
                label: "Overall gap",
                value: gapAbs,
                thresholdLabel: gapAbs >= 30 ? "CRITICAL" : "ENTERPRISE",
                threshold: gapAbs >= 30 ? 30 : 20,
              })}
            />
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "3.5rem", lineHeight: 1, color: gapAbs >= 25 ? "rgba(252,165,165,0.85)" : gapAbs >= 12 ? `${GOLD}CC` : "rgba(110,231,183,0.80)" }}>
              {overallGap > 0 ? "+" : ""}{overallGap}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>Overall gap</div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
        {/* Left */}
        <div className="space-y-5">
          {constitutionalThread && (
            <>
              <InheritedThreadContext
                thread={constitutionalThread}
                title="Inherited constitutional signal"
              />
              <TrajectoryLine trajectory={inferTrajectory(
                constitutionalThread.domainScores.coherence,
                ({ FRAGILE: 25, EMERGING: 40, STABILIZING: 55, EXECUTION_READY: 75, SOVEREIGN: 90 } as Record<string, number>)[constitutionalThread.readinessTier] ?? 50,
                constitutionalThread.failureModes,
              )} />
            </>
          )}

          {/* Pattern reading */}
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, overflow: "hidden" }}>
            <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)", background: `linear-gradient(to right, ${GOLD}08, transparent)` }}><Eyebrow>Structural reading</Eyebrow></div>
            <div style={{ padding: "1.5rem" }}>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.05rem", lineHeight: 1.78, color: "rgba(255,255,255,0.70)" }}>{reading.pattern}</p>
            </div>
          </div>

          {/* Domain gaps */}
          <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgb(5 5 7)" }}>
            <div style={{ padding: "0.85rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}><Eyebrow>Perception gaps by domain</Eyebrow></div>
            <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
              {gaps.map(g => {
                const gc = g.gapSeverity === "CRITICAL" ? "rgba(252,165,165,0.80)" : g.gapSeverity === "HIGH" ? "rgba(253,186,116,0.80)" : g.gapSeverity === "MEDIUM" ? `${GOLD}BB` : "rgba(110,231,183,0.70)";
                return (
                  <div key={g.domain} style={{ padding: "1rem 1.5rem" }}>
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", color: "rgba(255,255,255,0.72)" }}>{g.label}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.4rem", lineHeight: 1, color: gc, flexShrink: 0 }}>{g.gap > 0 ? "+" : ""}{g.gap}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}80`, minWidth: "60px" }}>Leader {g.leaderPct}%</span>
                        <div style={{ flex: 1, height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <motion.div style={{ height: "100%", width: `${Math.max(2, g.leaderPct)}%`, backgroundColor: `${GOLD}80` }} animate={{ width: `${Math.max(2, g.leaderPct)}%` }} transition={{ duration: 0.6 }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(148,163,184,0.70)", minWidth: "60px" }}>Team {g.realityPct}%</span>
                        <div style={{ flex: 1, height: "2px", backgroundColor: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                          <motion.div style={{ height: "100%", width: `${Math.max(2, g.realityPct)}%`, backgroundColor: "rgba(148,163,184,0.55)" }} animate={{ width: `${Math.max(2, g.realityPct)}%` }} transition={{ duration: 0.6, delay: 0.1 }} />
                        </div>
                      </div>
                    </div>
                    {g.gapSeverity !== "LOW" && <p style={{ marginTop: "0.5rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: gc, opacity: 0.80 }}>{g.gapSeverity} gap</p>}
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

          <RecommendedPlaybooks playbooks={matchedPlaybooks} />

          {/* Escalation */}
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)", padding: "1.5rem" }}>
            <Eyebrow>Next layer — escalation rationale</Eyebrow>
            <p style={{ marginTop: "0.85rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1.02rem", lineHeight: 1.70, color: "rgba(255,255,255,0.45)", fontStyle: "italic", marginBottom: "1.25rem" }}>{reading.escalationNote}</p>
            <p style={{ marginBottom: "1rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
              Next: Enterprise Assessment stress-tests governance, execution, and recent decision quality.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/diagnostics/enterprise-assessment"
                className="inline-flex items-center gap-2.5 transition-all duration-300"
                style={{ padding: "11px 22px", border: `1px solid ${GOLD}35`, backgroundColor: `${GOLD}0D`, color: `${GOLD}BB`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase" }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}55`; el.style.backgroundColor = `${GOLD}14`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}35`; el.style.backgroundColor = `${GOLD}0D`; }}
              >
                Enterprise Assessment <ArrowRight style={{ width: "11px", height: "11px" }} />
              </Link>
            </div>
          </div>

          {/* Submit */}
          <div style={{ border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.008)", padding: "1.25rem" }}>
            {!submitResult ? (
              <div className="flex items-center justify-between gap-4">
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.28)", fontStyle: "italic" }}>Submit to save a diagnostic record and receive a reference.</p>
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
            <div style={{ padding: "0.75rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Assessment metrics</span>
            </div>
            <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
              <MRow label="Leader perception" value={`${overallLeader}%`} />
              <MRow label="Team reality"      value={`${overallReality}%`} />
              <MRow label="Overall gap"       value={`${overallGap > 0 ? "+" : ""}${overallGap} pts`} />
              <MRow label="Fragility"         value={fragility.status} />
              <MRow label="Fragility score"   value={`${fragility.score} stddev`} />
              <MRow label="Route"             value={reading.route.replace("_", " ")} />
              {purposePct !== null && <MRow label="Personal alignment" value={`${purposePct}%`} />}
            </div>
          </div>

          <div style={{ border: `1px solid ${fragility.status === "FRACTURED" ? "rgba(252,165,165,0.22)" : fragility.status === "VOLATILE" ? `${GOLD}25` : "rgba(110,231,183,0.18)"}`, backgroundColor: "rgba(255,255,255,0.01)", padding: "1.25rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: fragility.status === "FRACTURED" ? "rgba(252,165,165,0.60)" : fragility.status === "VOLATILE" ? `${GOLD}90` : "rgba(110,231,183,0.60)", marginBottom: "0.65rem" }}>
              Internal fragility — {fragility.status.toLowerCase()}
            </div>
            <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.65, color: "rgba(255,255,255,0.50)" }}>{fragility.description}</p>
          </div>

          {purposePct !== null && (
            <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}05`, padding: "1.25rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.36em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.65rem" }}>Purpose alignment context</div>
              <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "2rem", lineHeight: 1, color: GOLD, marginBottom: "0.25rem" }}>{purposePct}%</div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.60, color: "rgba(255,255,255,0.38)" }}>
                {purposePct >= 62 ? overallGap > 20 ? "Personal clarity is high. The team gap is a transmission problem, not a clarity problem." : "Personal alignment is strong. Team alignment is broadly consistent." : overallGap > 15 ? "Personal drift combined with team perception gap. The team cannot have more clarity than its leadership." : "Personal alignment gap exists. Address it before expecting team alignment to improve."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamAssessmentPage() {
  const [phase, setPhase]       = React.useState<Phase>("identity");
  const [identity, setIdentity] = React.useState<IdentityForm>({ respondentName: "", respondentEmail: "", respondentRole: "", organisation: "", teamName: "", teamSize: "", notes: "" });
  const [leaderScores, setLeaderScores]   = React.useState<ScoreMap>({});
  const [realityScores, setRealityScores] = React.useState<ScoreMap>({});
  const [submitResult, setSubmitResult]   = React.useState<DiagnosticSubmitResponse | null>(null);
  const [isSubmitting, setIsSubmitting]   = React.useState(false);
  const [direction,    setDirection]      = React.useState(1);
  const [purposePct,   setPurposePct]     = React.useState<number | null>(null);
  const [subjectId,    setSubjectId]      = React.useState("");
  const [constitutionalThread, setConstitutionalThread] = React.useState<ConstitutionalThread | null>(null);

  React.useEffect(() => {
    trackStageStart("team");
    const handleUnload = () => trackDropoff("team");
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("purpose-alignment-result");
      if (raw) {
        const p = JSON.parse(raw);
        if (typeof p?.percent === "number") setPurposePct(p.percent);
        if (typeof p?.subjectId === "string") setSubjectId(p.subjectId);
      }
    } catch { /* ignore */ }
  }, []);

  React.useEffect(() => {
    setConstitutionalThread(readConstitutionalThread());
  }, []);

  function setLS(key: string, v: DiagnosticAnswerValue) { setLeaderScores(prev => ({ ...prev, [key]: v })); }
  function setRS(key: string, v: DiagnosticAnswerValue) { setRealityScores(prev => ({ ...prev, [key]: v })); }

  function leaderComplete() { return DOMAINS.every(d => [0, 1, 2].every(idx => (leaderScores[qKey("leader", d.id, idx)] ?? 0) > 0)); }
  function realityComplete() { return DOMAINS.every(d => [0, 1, 2].every(idx => (realityScores[qKey("reality", d.id, idx)] ?? 0) > 0)); }

  function ovPct(p: "leader" | "reality"): number {
    const scores = p === "leader" ? leaderScores : realityScores;
    const all: number[] = DOMAINS.flatMap(d => [0, 1, 2].map(idx => (scores[qKey(p, d.id, idx)] ?? 0) as number));
    const ans = all.filter(v => v > 0);
    if (!ans.length) return 0;
    return Math.round((ans.reduce((s, v) => s + v, 0) / (ans.length * 5)) * 100);
  }

  const gaps         = React.useMemo(() => buildGaps(leaderScores, realityScores), [leaderScores, realityScores]);
  const overallLeader  = ovPct("leader");
  const overallReality = ovPct("reality");
  const fragility    = React.useMemo(() => calculateFragility(gaps.map(g => g.realityPct)), [gaps]);
  const reading      = React.useMemo(() => deriveGapReading(gaps, overallLeader, overallReality, purposePct), [gaps, overallLeader, overallReality, purposePct]);
  const matchedPlaybooks = React.useMemo(
    () =>
      matchPlaybooks({
        route: "TEAM",
        readiness: constitutionalThread?.readinessTier ?? "EMERGING",
        failureModes: [
          ...(constitutionalThread?.failureModes ?? []),
          ...(gaps.some((gap) => gap.domain === "trust" && Math.abs(gap.gap) >= 20) ? ["SIGNAL_FAILURE", "TRUST_EROSION"] : []),
          ...(gaps.some((gap) => gap.domain === "authority" && gap.gap >= 20) ? ["AUTHORITY_BLINDSPOT"] : []),
          ...(gaps.some((gap) => gap.domain === "execution" && gap.gap >= 20) ? ["EXECUTION_DRIFT"] : []),
          ...(gaps.filter((gap) => gap.gapSeverity === "CRITICAL").length >= 2 ? ["SYSTEMIC_BREAKDOWN"] : []),
          ...(overallLeader - overallReality <= -15 ? ["CULTURAL_DEFLATION"] : []),
        ],
        dominantDomains: gaps
          .filter((gap) => gap.gapSeverity !== "LOW")
          .map((gap) => gap.domain),
        authorityType: constitutionalThread?.authorityType ?? null,
      }),
    [constitutionalThread, gaps, overallLeader, overallReality],
  );

  function advance(to: Phase) { setDirection(1); window.scrollTo({ top: 0, behavior: "smooth" }); setPhase(to); }
  function retreat(to: Phase) { setDirection(-1); window.scrollTo({ top: 0, behavior: "smooth" }); setPhase(to); }

  async function handleSubmit() {
    setIsSubmitting(true);
    const criticalGaps = gaps.filter((gap) => gap.gapSeverity === "CRITICAL");
    const answers: DiagnosticAnswer[] = [
      ...DOMAINS.flatMap(d => [0, 1, 2].map(idx => ({ sectionId: d.id, questionId: qKey("leader", d.id, idx), prompt: `[Leader] ${d.leaderPrefix} ${d.prompts[idx]}`, value: (leaderScores[qKey("leader", d.id, idx)] ?? 3) as DiagnosticAnswerValue }))),
      ...DOMAINS.flatMap(d => [0, 1, 2].map(idx => ({ sectionId: d.id, questionId: qKey("reality", d.id, idx), prompt: `[Reality] ${d.realityPrefix} ${d.prompts[idx]}`, value: (realityScores[qKey("reality", d.id, idx)] ?? 3) as DiagnosticAnswerValue }))),
    ];
    const totalScore = answers.reduce((s, a) => s + a.value, 0);
    const maxScore   = answers.length * 5;
    const pct        = Math.round((totalScore / maxScore) * 100);
    const res = await submitDiagnostic({
      kind: "team-alignment", version: "2026.2", source: "diagnostics", entry: "team-assessment",
      intent: "team-alignment-diagnostic", title: "Team Assessment — Perception Gap Analysis",
      respondent: { name: identity.respondentName || null, email: identity.respondentEmail || null, organisation: identity.organisation || null, role: identity.respondentRole || null },
      answers, notes: identity.notes || null,
      summary: { totalScore, maxScore, pct, severity: severityFromPct(pct), band: bandFromPct(pct), sectionScores: DOMAINS.map(d => buildSectionScore({ sectionId: d.id, title: d.label, answers: answers.filter(a => a.sectionId === d.id) })) },
      metadata: { ui: "team-assessment", teamName: identity.teamName || null, nextStepHref: "/diagnostics/enterprise-assessment", nextRoute: reading.route === "ENTERPRISE" ? "ENTERPRISE" : "TEAM", overallLeader, overallReality, overallGap: overallLeader - overallReality, fragilityStatus: fragility.status, purposeAlignmentPct: purposePct },
    });
    setSubmitResult(res);
    trackStageComplete("team", "diagnostic", "/diagnostics/enterprise-assessment");

    // Write team findings back into the constitutional thread
    mergeTeamFindingsIntoThread({
      completedAt: new Date().toISOString(),
      fragilityStatus: fragility.status,
      fragilityScore: fragility.score,
      dominantGapDomains: criticalGaps.map(g => g.domain),
      overallGap: Math.round(overallLeader - overallReality),
      patternTitle: reading.title,
      escalationRoute: reading.route,
      narrative: reading.pattern.slice(0, 300),
    });

    // Handoff to /diagnostics/enterprise-assessment (reads `team-assessment-result`
    // and extracts `overallReality` + related metrics). Canonical chain per
    // CLAUDE_SESSION_LOG.md section 4: purpose-alignment-result → team-assessment-result
    // → enterprise-assessment-result → executive-report-result → strategy-room-result.
    try {
      sessionStorage.setItem(
        "team-assessment-result",
        JSON.stringify({
          ...(res || {}),
          overallReality,
          overallLeader,
          overallGap: overallLeader - overallReality,
          fragilityStatus: fragility.status,
          totalScore,
          maxScore,
          pct,
          subjectId,
          nextRoute: reading.route === "ENTERPRISE" ? "ENTERPRISE" : "TEAM",
          purposeAlignmentPct: purposePct,
        }),
      );
    } catch {
      /* sessionStorage unavailable (private mode / SSR) — handoff degrades gracefully */
    }

    setIsSubmitting(false);
  }

  return (
    <Layout title="Team Assessment | Abraham of London" description="Perception gap analysis across leadership and team reality. The instrument that reveals whether your team shares your map." canonicalUrl="/diagnostics/team-assessment" fullWidth headerTransparent>
      <Head><meta name="robots" content="index,follow" /></Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* Hero — identity phase only */}
        {phase === "identity" && (
          <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute" style={{ right: "-5%", top: "-15%", width: "500px", height: "500px", borderRadius: "50%", background: `radial-gradient(ellipse at center, ${GOLD}08 0%, transparent 65%)`, filter: "blur(140px)" }} />
              <div className="absolute inset-x-0 bottom-0 h-32" style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }} />
              <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
            </div>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}20, transparent)` }} />

            <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
              <div className="pt-32 md:pt-40 pb-12">
                <div className="flex items-center gap-2 mb-10">
                  <Link href="/diagnostics" className="transition-opacity hover:opacity-70" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    <span className="flex items-center gap-1.5"><ArrowLeft style={{ width: "10px", height: "10px" }} /> Diagnostics</span>
                  </Link>
                  <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Team Assessment</span>
                </div>

                <div className="grid gap-14 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
                  <div>
                    <Eyebrow>Layer 02 · Perception gap analysis</Eyebrow>
                    <h1 style={{ marginTop: "1.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(2.5rem, 6vw, 5.5rem)", lineHeight: 0.90, letterSpacing: "-0.042em", color: "rgba(255,255,255,0.94)" }}>
                      Does your team<br /><span style={{ color: "rgba(255,255,255,0.28)" }}>share your map?</span>
                    </h1>
                    <p style={{ marginTop: "1.5rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1rem, 1.4vw, 1.18rem)", lineHeight: 1.72, color: "rgba(255,255,255,0.42)", maxWidth: "48ch" }}>
                      One leader's perception is not evidence. This instrument measures the gap between how you read the team and how the team reads itself. That gap is the structural finding.
                    </p>
                    {purposePct !== null && (
                      <div style={{ marginTop: "1.25rem", padding: "0.85rem 1.25rem", border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}07`, display: "inline-flex", alignItems: "center", gap: "0.75rem" }}>
                        <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}90` }}>Purpose alignment loaded — {purposePct}%</span>
                      </div>
                    )}
                    {constitutionalThread && (
                      <div style={{ marginTop: "1rem", padding: "0.95rem 1.25rem", border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", marginBottom: "0.45rem" }}>
                          Inherited constitutional route
                        </div>
                        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(255,255,255,0.54)" }}>
                          {constitutionalThread.summary.narrative}
                        </p>
                        {constitutionalThread.bridge.teamAssessment.hypotheses.length > 0 && (
                          <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.58, color: "rgba(255,255,255,0.40)", fontStyle: "italic" }}>
                            This stage is testing whether {String(constitutionalThread.bridge.teamAssessment.hypotheses[0] ?? "the inherited hypothesis").charAt(0).toLowerCase() + String(constitutionalThread.bridge.teamAssessment.hypotheses[0] ?? "the inherited hypothesis").slice(1)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT, padding: "1.5rem" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "1rem" }}>Position in ladder</div>
                    {[
                      { label: "01 Purpose Alignment", done: true, active: false },
                      { label: "02 Team Assessment",   done: false, active: true },
                      { label: "03 Enterprise",        done: false, active: false },
                      { label: "04 Executive Reporting",done: false, active: false },
                    ].map(item => (
                      <div key={item.label} style={{ padding: "0.55rem 0.85rem", marginBottom: "0.35rem", border: `1px solid ${item.active ? `${GOLD}22` : "transparent"}`, backgroundColor: item.active ? `${GOLD}08` : "transparent", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: item.active ? `${GOLD}CC` : item.done ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.15)", textDecoration: item.done ? "line-through" : "none" }}>
                        {item.label}
                      </div>
                    ))}
                    <div style={{ marginTop: "1rem", padding: "0.75rem 0.85rem", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.35rem" }}>Output</div>
                      <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.45)" }}>Perception gap analysis, fragility index, escalation routing</p>
                    </div>
                    {constitutionalThread?.bridge.teamAssessment.prompts?.length ? (
                      <div style={{ marginTop: "1rem", padding: "0.75rem 0.85rem", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90`, marginBottom: "0.35rem" }}>Focus prompts</div>
                        {constitutionalThread.bridge.teamAssessment.prompts.slice(0, 2).map((prompt) => (
                          <p key={prompt} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.84rem", lineHeight: 1.55, color: "rgba(255,255,255,0.42)", marginTop: "0.35rem" }}>
                            {prompt}
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

        {/* Progress strip */}
        {phase !== "identity" && (
          <div style={{ backgroundColor: "rgba(0,0,0,0.50)", borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 50 }}>
            <div className="mx-auto max-w-7xl px-6 lg:px-12">
              <div className="flex items-center gap-3 py-3">
                {(["leader", "reality", "result"] as const).map((p, i) => {
                  const isCurrent = phase === p;
                  const order = ["leader", "reality", "result"];
                  const isDone = order.indexOf(phase) > order.indexOf(p);
                  return (
                    <React.Fragment key={p}>
                      {i > 0 && <div style={{ width: "20px", height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />}
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: isCurrent ? `${GOLD}CC` : isDone ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.18)" }}>
                        {p === "leader" ? "Leader perception" : p === "reality" ? "Team reality" : "Gap analysis"}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="mx-auto max-w-7xl px-6 lg:px-12">
          <AnimatePresence mode="wait">

            {phase === "identity" && (
              <motion.div key="identity" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.50 }}>
                <div className="py-14 max-w-2xl">
                  <Eyebrow>Step 1 — Identity</Eyebrow>
                  <h2 style={{ marginTop: "1.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", lineHeight: 1.0, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>Tell us about the team.</h2>
                  <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.70, color: "rgba(255,255,255,0.38)", fontStyle: "italic" }}>This context shapes how the result is interpreted. The team name and size inform the gap analysis.</p>

                  <div className="grid gap-4 mt-8 sm:grid-cols-2">
                    {[
                      { label: "Your name", key: "respondentName", type: "text", placeholder: "Full name" },
                      { label: "Email", key: "respondentEmail", type: "email", placeholder: "email@org.com" },
                      { label: "Your role", key: "respondentRole", type: "text", placeholder: "Founder, CEO, Director…" },
                      { label: "Organisation", key: "organisation", type: "text", placeholder: "Company or institution" },
                      { label: "Team / unit name", key: "teamName", type: "text", placeholder: "Leadership team, ops, product…" },
                      { label: "Approximate team size", key: "teamSize", type: "number", placeholder: "Number of members" },
                    ].map(f => (
                      <div key={f.key}>
                        <label style={labelStyle}>{f.label}</label>
                        <input type={f.type} value={identity[f.key as keyof IdentityForm]} onChange={e => setIdentity(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} style={inputStyle}
                          onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)"; }}
                          onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)"; }}
                        />
                      </div>
                    ))}
                    <div className="sm:col-span-2">
                      <label style={labelStyle}>Initial observations (optional)</label>
                      <textarea value={identity.notes} onChange={e => setIdentity(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder="Where are you seeing drift, friction, or execution weakness?" style={{ ...inputStyle, resize: "none", lineHeight: 1.75 }}
                        onFocus={e => { e.currentTarget.style.borderColor = `${GOLD}35`; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)"; e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)"; }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "2rem", padding: "1.25rem", border: "1px solid rgba(255,255,255,0.05)", backgroundColor: "rgba(255,255,255,0.008)" }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.90rem", lineHeight: 1.65, color: "rgba(255,255,255,0.32)", fontStyle: "italic" }}>
                      This assessment runs two phases: first you rate the team as you perceive it. Then you estimate how team members would rate themselves on the same dimensions. The gap between these two phases is the diagnostic finding.
                    </p>
                  </div>

                  <button type="button" onClick={() => advance("leader")} style={{ marginTop: "1.75rem", padding: "13px 28px", border: `1px solid ${GOLD}42`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
                    onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; }}
                    onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; }}
                  >
                    Begin: Leader perception <ArrowRight style={{ width: "12px", height: "12px" }} />
                  </button>
                </div>
              </motion.div>
            )}

            {phase === "leader" && (
              <motion.div key="leader" initial={{ opacity: 0, x: direction * 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.40 }}>
                <div className="py-14">
                  <Eyebrow>Phase 1 — Leader perception</Eyebrow>
                  <h2 style={{ marginTop: "1.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", lineHeight: 1.0, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>Rate the team as you see it.</h2>
                  <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.70, color: "rgba(255,255,255,0.38)", fontStyle: "italic", maxWidth: "48ch" }}>Answer from your genuine current observation — not your aspirations. The honest read is the diagnostic instrument.</p>

                  <div className="space-y-4 mt-8">
                    {DOMAINS.map(d => <QuestionBlock key={d.id} domain={d} phase="leader" scores={leaderScores} onScore={setLS} />)}
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <button type="button" onClick={() => retreat("identity")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ArrowLeft style={{ width: "11px", height: "11px" }} /> Back
                    </button>
                    <div style={{ textAlign: "center" }}>
                      {!leaderComplete() && <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.5rem" }}>Answer all 12 questions to continue</p>}
                      <button type="button" onClick={() => leaderComplete() && advance("reality")} disabled={!leaderComplete()} style={{ padding: "11px 24px", border: `1px solid ${leaderComplete() ? `${GOLD}42` : "rgba(255,255,255,0.06)"}`, backgroundColor: leaderComplete() ? `${GOLD}10` : "rgba(255,255,255,0.01)", color: leaderComplete() ? `${GOLD}CC` : "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: leaderComplete() ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
                        onMouseEnter={e => { if (leaderComplete()) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }}
                        onMouseLeave={e => { if (leaderComplete()) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}
                      >
                        Continue the Assessment <ArrowRight style={{ width: "11px", height: "11px" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "reality" && (
              <motion.div key="reality" initial={{ opacity: 0, x: direction * 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.40 }}>
                <div className="py-14">
                  <Eyebrow>Phase 2 — Team reality</Eyebrow>
                  <h2 style={{ marginTop: "1.25rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "clamp(1.6rem, 2.5vw, 2.2rem)", lineHeight: 1.0, letterSpacing: "-0.020em", color: "rgba(255,255,255,0.88)" }}>How would your team rate themselves?</h2>
                  <p style={{ marginTop: "0.75rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.70, color: "rgba(255,255,255,0.38)", fontStyle: "italic", maxWidth: "52ch" }}>Your best estimate of how team members would score themselves if asked individually and anonymously. The gap between Phase 1 and Phase 2 is the finding.</p>
                  <div style={{ marginTop: "1rem", padding: "0.85rem 1.25rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.01)" }}>
                    <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.60, color: "rgba(255,255,255,0.32)", fontStyle: "italic" }}>
                      Do not rate how you wish they would respond. Rate how you genuinely believe they would respond if asked directly and without consequence. The honest estimate is the diagnostic instrument.
                    </p>
                  </div>

                  <div className="space-y-4 mt-8">
                    {DOMAINS.map(d => <QuestionBlock key={d.id} domain={d} phase="reality" scores={realityScores} onScore={setRS} />)}
                  </div>

                  <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <button type="button" onClick={() => retreat("leader")} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <ArrowLeft style={{ width: "11px", height: "11px" }} /> Back
                    </button>
                    <div style={{ textAlign: "center" }}>
                      {!realityComplete() && <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", marginBottom: "0.5rem" }}>Answer all 12 questions to generate the gap analysis</p>}
                      <button type="button" onClick={() => realityComplete() && advance("result")} disabled={!realityComplete()} style={{ padding: "11px 24px", border: `1px solid ${realityComplete() ? `${GOLD}42` : "rgba(255,255,255,0.06)"}`, backgroundColor: realityComplete() ? `${GOLD}10` : "rgba(255,255,255,0.01)", color: realityComplete() ? `${GOLD}CC` : "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8.5px", letterSpacing: "0.28em", textTransform: "uppercase", cursor: realityComplete() ? "pointer" : "not-allowed", display: "inline-flex", alignItems: "center", gap: "0.75rem" }}
                        onMouseEnter={e => { if (realityComplete()) { const el = e.currentTarget; el.style.borderColor = `${GOLD}65`; el.style.backgroundColor = `${GOLD}18`; } }}
                        onMouseLeave={e => { if (realityComplete()) { const el = e.currentTarget; el.style.borderColor = `${GOLD}42`; el.style.backgroundColor = `${GOLD}10`; } }}
                      >
                        Generate gap analysis <ArrowRight style={{ width: "11px", height: "11px" }} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {phase === "result" && (
              <motion.div key="result" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
                <div className="py-14">
                  <ResultSurface gaps={gaps} reading={reading} overallLeader={overallLeader} overallReality={overallReality} fragility={fragility} purposePct={purposePct} submitResult={submitResult} onSubmit={handleSubmit} isSubmitting={isSubmitting} constitutionalThread={constitutionalThread} matchedPlaybooks={matchedPlaybooks} />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Ladder close — identity phase */}
        {phase === "identity" && (
          <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
            <div className="mx-auto max-w-7xl px-6 py-10 lg:px-12">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="h-px w-6" style={{ background: `linear-gradient(to right, ${GOLD}30, transparent)` }} />
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>Layer 02 of 04</span>
                </div>
                <div className="flex items-center gap-4">
                  <Link href="/diagnostics" className="transition-opacity hover:opacity-70" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Diagnostic ladder</Link>
                  <Link href="/diagnostics/enterprise-assessment" className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>
                    Enterprise Assessment <ChevronRight style={{ width: "10px", height: "10px" }} />
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
