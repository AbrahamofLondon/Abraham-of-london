/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/strategy-room/index.tsx
// Design: Institutional Monumentalism — the highest-consequence page on the platform
// Three states: GATE (locked) -> ENTRY BRIEF (paid) -> EXECUTION CHAMBER (active)
// Typography: Cormorant Garamond display · JetBrains Mono data/labels
// Palette: #060609 base · #C9A96E softGold · sharp panels throughout

import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { trackStrategyRoomEntry, trackStrategyRoomConversion } from "@/lib/analytics/funnel";
import { track } from "@/lib/analytics/track";
import {
  trackStrategyGateView,
  trackStrategyAttempt,
  trackStrategyAllowed,
  trackStrategyBlocked,
} from "@/lib/analytics/journey-client";
import {
  ArrowRight,
  Clock3,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  STRATEGY_ROOM_FORM_SPEC,
  type ConstitutionalIntake,
} from "@/lib/decision/system-constitution";
import type { CanonicalSectionsEnvelope } from "@/lib/decision/canonical-sections";
import { hasCanonicalSections } from "@/lib/decision/canonical-sections";
import {
  readConstitutionalThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";
import StrategyRoomConversionBridge from "@/components/strategy-room/StrategyRoomConversionBridge";
import DecisionStateBanner from "@/components/strategy-room/DecisionStateBanner";
import DynamicConsequencePanel from "@/components/strategy-room/DynamicConsequencePanel";
import EscalationTriggerPanel from "@/components/strategy-room/EscalationTriggerPanel";
import AvoidancePatternNotice from "@/components/strategy-room/AvoidancePatternNotice";
import RetainerEntryGate from "@/components/strategy-room/RetainerEntryGate";
import AdvantagePathBlock from "@/components/strategy-room/AdvantagePathBlock";
import AIInterventionSuggestions from "@/components/strategy-room/AIInterventionSuggestions";
import CompetitivePositionSignal from "@/components/diagnostics/results/CompetitivePosition";
import { suggestInterventions } from "@/lib/diagnostics/ai-interventions";
import { evaluateRetainerQualification } from "@/lib/retainer/qualification";
import { assessAdvantageTerrain } from "@/lib/diagnostics/advantage-terrain";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { getProductAmountGbp, getProductDisplayPrice } from "@/lib/commercial/catalog";
import {
  setCommercialAccessCookie,
  verifyCheckoutSessionForProduct,
} from "@/lib/server/billing/commercial-access";
import CaseActiveBanner from "@/components/diagnostics/unified/CaseActiveBanner";
import FeedbackLoopBlock from "@/components/diagnostics/unified/FeedbackLoop";
import LimitationsBlock from "@/components/diagnostics/unified/LimitationsBlock";
import ExecutionFlow from "@/components/strategy-room/ExecutionFlow";
import AdmissionNotice from "@/components/product/AdmissionNotice";
import EvidenceStrengthMeter from "@/components/living/EvidenceStrengthMeter";
import CounselStatusPanel from "@/components/strategy-room/CounselStatusPanel";
import { evaluateCounselTrigger, deriveCounselStatus } from "@/lib/strategy-room/counsel-trigger";
import type { StrategyRoomState } from "@/lib/strategy-room/room-state-contract";
import { deriveEvidenceTierFromStages } from "@/lib/product/evidence-stage-contract";

// ─────────────────────────────────────────────────────────────────────────────
// DECISION AUTHORITY GATE
// ─────────────────────────────────────────────────────────────────────────────

function StrategyRoomGate() {
  const [directive, setDirective] = React.useState<{
    level: string; reason: string; requiredAction?: string; recommendedPath?: string; summary?: string;
  } | null>(null);
  const [upstreamInstrument, setUpstreamInstrument] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Detect upstream instrument or market context
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const instrumentId = params.get("instrumentResultId");
      if (instrumentId) setUpstreamInstrument(instrumentId);
    }

    try {
      const raw = sessionStorage.getItem("aol:tension-thread");
      if (!raw) return;
      const thread = JSON.parse(raw);
      if (!thread?.tensions?.length) return;

      // Dynamic import to avoid SSR issues
      import("@/lib/diagnostics/decision-authority").then(({ deriveDecisionDirective }) => {
        const d = deriveDecisionDirective(thread);
        if (d.level === "allow") {
          trackStrategyAllowed();
        } else if (d.level === "block") {
          trackStrategyBlocked(d.level);
        } else {
          trackStrategyBlocked(d.level);
        }
        if (d.level !== "allow") {
          setDirective(d);

          // Run consistency check in development
          if (process.env.NODE_ENV !== "production") {
            import("@/lib/diagnostics/narrative-engine").then(({ buildThreadNarrative }) => {
              import("@/lib/diagnostics/consistency-check").then(({ validateDiagnosticConsistency }) => {
                const narrative = buildThreadNarrative(thread);
                validateDiagnosticConsistency({ thread, directive: d, narrative });
              });
            });
          }
        }
      });
    } catch {}
  }, []);

  if (!directive) return null;

  const borderColor = directive.level === "block" ? "rgba(252,165,165,0.30)"
    : directive.level === "restrict" ? "rgba(252,165,165,0.22)"
    : `${GOLD}25`;
  const bgColor = directive.level === "block" ? "rgba(252,165,165,0.06)"
    : directive.level === "restrict" ? "rgba(252,165,165,0.04)"
    : `${GOLD}06`;
  const labelColor = directive.level === "block" ? "rgba(252,165,165,0.80)"
    : directive.level === "restrict" ? "rgba(252,165,165,0.70)"
    : `${GOLD}85`;
  const label = directive.level === "block" ? "System position: escalation not justified"
    : directive.level === "restrict" ? "System position: prerequisite required"
    : "System position: proceeding with structural warning";

  return (
    <div className="mx-auto max-w-6xl px-6 pt-8 lg:px-12">
      <div style={{ border: `1px solid ${borderColor}`, backgroundColor: bgColor, padding: "1.25rem 1.5rem" }}>
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: labelColor, marginBottom: "0.65rem" }}>
          {label}
        </div>
        <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.97rem", lineHeight: 1.68, color: "rgba(255,255,255,0.60)" }}>
          {directive.reason}
        </p>
        {directive.requiredAction && (
          <p style={{ marginTop: "0.65rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.60, color: "rgba(255,255,255,0.45)", fontStyle: "italic" }}>
            {directive.requiredAction}
          </p>
        )}
        {directive.recommendedPath && (directive.level === "restrict" || directive.level === "block") && (
          <div style={{ marginTop: "1rem" }}>
            <Link
              href={directive.recommendedPath}
              className="inline-flex items-center gap-2 transition-all duration-200"
              style={{
                padding: "8px 18px",
                border: `1px solid ${GOLD}35`,
                backgroundColor: `${GOLD}0D`,
                color: `${GOLD}BB`,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase",
              }}
            >
              {directive.level === "block" ? "Return to diagnostics" : "Address this first"}
              <ArrowRight style={{ width: "11px", height: "11px" }} />
            </Link>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/institutional" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Institutional mandate</Link>
              <Link href="/private-clients" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Private advisory</Link>
              <Link href="/contact" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Contact</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type SessionInitResponse = {
  success: boolean;
  sessionKey?: string;
  constitution?: {
    route: "REJECT" | "DIAGNOSTIC" | "STRATEGY";
    priority: string;
    temperature: string;
    orgState: string;
    readinessTier: string;
    authorityType: string;
    revenueBand: string;
    marketRiskBand: string;
  };
  error?: string;
};

type StrategyRoomPageProps = {
  hasPaidAccess: boolean;
  checkoutConfirmed?: boolean;
  checkoutCancelled?: boolean;
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const INITIAL_FORM: ConstitutionalIntake = {
  fullName: "",
  email: "",
  organisation: "",
  sector: "",
  revenueBand: "",
  authorityRole: "",
  authorityScope: "",
  urgencyWindow: "",
  problemStatement: "",
  symptoms: "",
  desiredOutcome: "",
  currentConstraint: "",
  marketExposure: "",
  boardInvolved: "",
};

const STORAGE_KEY = "aol_strategy_room_intake_v1";
const AUTOSAVE_MS = 700;

type DecisionLogStatus = "pending" | "executed" | "blocked";

type DecisionLogEntry = {
  id: string;
  text: string;
  status: DecisionLogStatus;
  blockReason: string;
  createdAt: string;
};

type StrategyEntryBrief = {
  decisionText: string;
  constraintText: string;
  costOfDelayText: string;
  ownerDomain: string;
  contradiction: string;
  contradictionSources: string[];
  confidenceLabel: string;
  missingFields: Array<keyof ConstitutionalIntake>;
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function formatTimeStamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildExecutionContext(
  thread: ConstitutionalThread | null,
  canonical: CanonicalSectionsEnvelope | null,
) {
  const posture = canonical ? localSummary(canonical) : null;
  const executive = thread?.executiveFindings as Record<string, unknown> | undefined;
  const failureModes = [
    ...(Array.isArray(thread?.failureModes) ? thread.failureModes : []),
    ...(Array.isArray(posture?.failureModes) ? posture.failureModes : []),
  ].map((item) => safeText(item)).filter(Boolean);
  const dominantCondition =
    failureModes[0] ||
    safeText(executive?.primaryConcern) ||
    safeText(executive?.route) ||
    safeText(posture?.orgState) ||
    "Authority and execution are not sufficiently ordered.";
  const escalationLevel =
    safeText(posture?.priority) ||
    safeText(executive?.readinessTier) ||
    "INTERVENTION REQUIRED";
  const directive =
    safeText(posture?.route) ||
    safeText(executive?.route) ||
    "STRATEGY";
  const consequence =
    posture?.nextAction ||
    "If ignored, decision drift compounds and the wrong intervention path becomes more likely.";

  return {
    escalationLevel,
    dominantCondition,
    consequence,
    directive,
  };
}

function evidenceGraphFrom(value: unknown): Record<string, unknown> {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const canonical = root.canonical && typeof root.canonical === "object"
    ? root.canonical as Record<string, unknown>
    : root;
  const graph = canonical.evidenceGraph && typeof canonical.evidenceGraph === "object"
    ? canonical.evidenceGraph as Record<string, unknown>
    : {};
  return graph;
}

function latestGraphDecisionObject(value: unknown): Record<string, unknown> | null {
  const graph = evidenceGraphFrom(value);
  const decisions = Array.isArray(graph.decisionObjects) ? graph.decisionObjects : [];
  const latest = [...decisions].reverse().find((item) => item && typeof item === "object");
  return latest ? latest as Record<string, unknown> : null;
}

function graphNodes(value: unknown): Array<Record<string, unknown>> {
  const graph = evidenceGraphFrom(value);
  return Array.isArray(graph.nodes)
    ? graph.nodes.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
}

function uniqueLabels(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function urgencyFromTemperature(value: string): string {
  if (value === "SCORCHING") return "IMMEDIATE";
  if (value === "HOT") return "NEAR_TERM";
  return "NEAR_TERM";
}

function buildStrategyEntryBrief(input: {
  thread: ConstitutionalThread | null;
  canonical: CanonicalSectionsEnvelope | null;
  executiveResult: unknown;
  form: ConstitutionalIntake;
}): StrategyEntryBrief {
  const graphSource = input.canonical || input.executiveResult || {};
  const decisionObject = latestGraphDecisionObject(graphSource);
  const nodes = graphNodes(graphSource);
  const contradictions = nodes.filter((node) => node.kind === "contradiction");
  const consequences = nodes.filter((node) => node.kind === "consequence" || node.kind === "exposure_estimate");
  const posture = input.canonical ? localSummary(input.canonical) : null;
  const context = buildExecutionContext(input.thread, input.canonical);

  const decisionText =
    safeText(decisionObject?.decisionText) ||
    safeText(input.thread?.executiveFindings?.nextAction) ||
    safeText(posture?.nextAction) ||
    "Execute the first governed intervention.";

  const constraintText =
    safeText(decisionObject?.constraintText) ||
    safeText(input.thread?.reflections?.shadowAuthority) ||
    safeText(input.form.currentConstraint) ||
    context.dominantCondition;

  const costOfDelayText =
    safeText(decisionObject?.costOfDelayText) ||
    safeText(consequences.at(-1)?.summary) ||
    safeText(consequences.at(-1)?.evidenceText) ||
    context.consequence;

  const ownerDomain =
    safeText(decisionObject?.stakeholderText) ||
    safeText(decisionObject?.affectedDomain) ||
    safeText(input.form.authorityRole) ||
    safeText(posture?.authorityType) ||
    safeText(input.thread?.authorityType) ||
    "Decision owner not confirmed";

  const contradiction =
    safeText(contradictions.at(-1)?.summary) ||
    safeText(contradictions.at(-1)?.label) ||
    uniqueLabels([...(input.thread?.failureModes ?? []), context.dominantCondition]).slice(0, 2).join(" / ") ||
    "The system has insufficient execution evidence to treat this as a solved condition.";

  const graphConfidence = Number(decisionObject?.confidence ?? contradictions.at(-1)?.confidence);
  const confidence = Number.isFinite(graphConfidence)
    ? Math.round(graphConfidence <= 1 ? graphConfidence * 100 : graphConfidence)
    : posture?.confidence ?? input.thread?.confidence ?? 0;

  const missingFields: Array<keyof ConstitutionalIntake> = [];
  (["fullName", "email", "organisation", "authorityRole", "authorityScope", "urgencyWindow"] as Array<keyof ConstitutionalIntake>)
    .forEach((field) => {
      if (!safeText(input.form[field])) missingFields.push(field);
    });
  if (!safeText(input.form.currentConstraint) && !safeText(decisionObject?.constraintText)) {
    missingFields.push("currentConstraint");
  }

  return {
    decisionText,
    constraintText,
    costOfDelayText,
    ownerDomain,
    contradiction,
    contradictionSources: uniqueLabels(contradictions.map((node) => safeText(node.sourceStage))).slice(0, 4),
    confidenceLabel: confidence ? `${confidence}%` : "Evidence limited",
    missingFields,
  };
}

function validateExecutionEntry(form: ConstitutionalIntake, brief: StrategyEntryBrief): string | null {
  const required: Array<keyof ConstitutionalIntake> = ["fullName", "email", "organisation", "authorityRole", "authorityScope", "urgencyWindow"];
  for (const field of required) {
    if (!safeText(form[field])) {
      const spec = STRATEGY_ROOM_FORM_SPEC.find((item) => item.name === field);
      return `${spec?.label || field} is required.`;
    }
  }
  if (!safeText(form.currentConstraint) && !safeText(brief.constraintText)) {
    return "Constraint clarification is required.";
  }
  return null;
}

function buildExecutionIntake(
  form: ConstitutionalIntake,
  brief: StrategyEntryBrief,
  canonical: CanonicalSectionsEnvelope | null,
  thread: ConstitutionalThread | null,
): ConstitutionalIntake {
  const posture = canonical ? localSummary(canonical) : null;
  return {
    ...form,
    sector: safeText(form.sector, "strategy execution"),
    revenueBand: safeText(form.revenueBand, "SMB"),
    authorityScope: safeText(form.authorityScope, safeText(posture?.authorityType, safeText(thread?.authorityType, "UNCLEAR"))),
    urgencyWindow: safeText(form.urgencyWindow, urgencyFromTemperature(safeText(posture?.temperature))),
    problemStatement: safeText(
      form.problemStatement,
      `${brief.decisionText}. Blocking condition: ${brief.constraintText}.`,
    ),
    symptoms: safeText(
      form.symptoms,
      `${brief.contradiction}. ${(thread?.failureModes ?? []).slice(0, 3).join(". ")}`,
    ),
    desiredOutcome: safeText(
      form.desiredOutcome,
      `Execute the required decision: ${brief.decisionText}.`,
    ),
    currentConstraint: safeText(form.currentConstraint, brief.constraintText),
    marketExposure: safeText(form.marketExposure, "MEDIUM"),
    boardInvolved: safeText(form.boardInvolved, brief.ownerDomain.toLowerCase().includes("board") ? "YES" : "UNCERTAIN"),
  };
}

function localSummary(canonical: CanonicalSectionsEnvelope | null) {
  const posture = canonical?.sections?.constitutionalPosture ?? null;
  const route    = safeText(posture?.route, "DIAGNOSTIC");
  const confidence = Number(posture?.clarityScore ?? 0);
  return {
    route,
    confidence: Number.isFinite(confidence) ? Math.round(confidence) : 0,
    priority:      safeText(posture?.priority,      "QUALIFIED"),
    readinessTier: safeText(posture?.readinessTier, "EMERGING"),
    authorityType: safeText(posture?.authorityType, "UNCLEAR"),
    temperature:   safeText(posture?.temperature,   "WARM"),
    orgState:      safeText(posture?.orgState,      "DRIFTING"),
    failureModes:  Array.isArray(posture?.failureModes)  ? posture.failureModes  : [],
    interventions: Array.isArray(posture?.requiredInterventions) ? posture.requiredInterventions : [],
    narrative:     safeText(posture?.narrativeSummary, ""),
    rationale:     Array.isArray(posture?.rationale) ? posture.rationale : [],
    nextAction:    safeText(canonical?.sections?.governedRecommendations?.nextAction, ""),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div className={soft
      ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
      : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent"
    } />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "8.5px",
        letterSpacing: "0.40em",
        textTransform: "uppercase",
        color: `${GOLD}BB`,
      }}>
        {children}
      </span>
    </div>
  );
}

function RouteStrip() {
  const items = [
    { label: "STRATEGY", color: GOLD },
    { label: "DIAGNOSTIC", color: "rgba(255,255,255,0.48)" },
    { label: "REJECT", color: "rgba(255,255,255,0.24)" },
  ];

  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      {items.map((item, index) => (
        <React.Fragment key={item.label}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: item.color,
            }}
          >
            {item.label}
          </span>
          {index < items.length - 1 ? (
            <span
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.16)",
              }}
            >
              ·
            </span>
          ) : null}
        </React.Fragment>
      ))}
    </div>
  );
}

function ExecutionEntryState({
  thread,
  canonical,
  checkoutConfirmed,
}: {
  thread: ConstitutionalThread | null;
  canonical: CanonicalSectionsEnvelope | null;
  checkoutConfirmed?: boolean;
}) {
  const context = buildExecutionContext(thread, canonical);
  const metrics = [
    { label: "Escalation level", value: context.escalationLevel },
    { label: "Dominant condition", value: context.dominantCondition },
    { label: "Ignored consequence", value: context.consequence },
    { label: "Directive", value: context.directive },
  ];

  return (
    <section style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        {checkoutConfirmed && (
          <div
            className="mb-4"
            style={{
              border: `1px solid ${GOLD}24`,
              backgroundColor: "rgba(0,0,0,0.72)",
              padding: "0.85rem 1rem",
            }}
          >
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px",
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
            }}>
              Access granted. Execution environment ready.
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <div>
            <Eyebrow>Execution Environment</Eyebrow>
            <h1 style={{
              marginTop: "1rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 4.2vw, 3.35rem)",
              lineHeight: 0.98,
              letterSpacing: "-0.02em",
              color: "rgba(255,255,255,0.92)",
            }}>
              Execution begins now.
            </h1>
            <p style={{
              marginTop: "0.85rem",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              lineHeight: 1.7,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.64)",
              maxWidth: "58ch",
            }}>
              The system has determined that action—not analysis—is required.
            </p>
            <p style={{
              marginTop: "0.5rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.88rem",
              lineHeight: 1.55,
              color: "rgba(252,165,165,0.35)",
              fontStyle: "italic",
              maxWidth: "52ch",
            }}>
              In an AI-accelerated environment, stagnation is negative movement. This condition compounds whether or not you act.
            </p>
            <p style={{
              marginTop: "0.35rem",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.12em",
              color: "rgba(255,255,255,0.18)",
            }}>
              Every decision is evaluated against cost, speed, and competitive position.
            </p>
            <p style={{
              marginTop: "0.25rem",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "6.5px",
              letterSpacing: "0.10em",
              color: "rgba(255,255,255,0.13)",
            }}>
              Decisions are evaluated against an AI-accelerated market baseline.
            </p>
          </div>

          <div
            className="grid gap-px sm:grid-cols-2"
            style={{ border: "1px solid rgba(255,255,255,0.11)", backgroundColor: "rgba(255,255,255,0.08)" }}
          >
            {metrics.map((metric) => (
              <div
                key={metric.label}
                style={{ backgroundColor: "rgb(5 6 8)", padding: "0.95rem 1rem", minHeight: "76px" }}
              >
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "6.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.28)",
                  marginBottom: "0.45rem",
                }}>
                  {metric.label}
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  lineHeight: 1.55,
                  color: metric.label === "Ignored consequence" ? "rgba(252,165,165,0.82)" : "rgba(255,255,255,0.72)",
                }}>
                  {metric.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function FirstActionPrompt() {
  return (
    <div
      className="mx-auto max-w-7xl px-6 pt-6 lg:px-12"
      style={{ backgroundColor: VOID }}
    >
      <div className="grid gap-px md:grid-cols-2" style={{ border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}20` }}>
        <div style={{ backgroundColor: "rgb(5 6 8)", padding: "1rem 1.25rem" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: `${GOLD}AA`,
            marginBottom: "0.55rem",
          }}>
            First action prompt
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.65, color: "rgba(255,255,255,0.72)" }}>
            Start with the first intervention. Do not optimise. Execute.
          </p>
        </div>
        <div style={{ backgroundColor: "rgb(5 6 8)", padding: "1rem 1.25rem" }}>
          <div style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7px",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(252,165,165,0.72)",
            marginBottom: "0.55rem",
          }}>
            System constraint
          </div>
          <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.65, color: "rgba(255,255,255,0.72)" }}>
            Only act on what is defined here. Deviation introduces risk.
          </p>
        </div>
      </div>
    </div>
  );
}

function CompactEntryField({
  field,
  value,
  onChange,
}: {
  field: typeof STRATEGY_ROOM_FORM_SPEC[0];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}) {
  const id = `sr-entry-${String(field.name)}`;
  return (
    <div>
      <label htmlFor={id} style={labelStyle}>
        {field.name === "currentConstraint" ? "Constraint clarification" : field.label}
      </label>
      {field.type === "textarea" ? (
        <textarea
          id={id}
          name={String(field.name)}
          value={value}
          onChange={onChange}
          rows={3}
          placeholder={field.placeholder}
          style={{ ...inputStyle, resize: "none", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px" }}
        />
      ) : field.type === "select" ? (
        <select
          id={id}
          name={String(field.name)}
          value={value}
          onChange={onChange}
          style={{ ...inputStyle, appearance: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px" }}
        >
          <option value="" style={{ backgroundColor: "rgb(6 6 9)" }}>Select...</option>
          {(field.options || []).map((option) => (
            <option key={option.value} value={option.value} style={{ backgroundColor: "rgb(6 6 9)" }}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          id={id}
          name={String(field.name)}
          type={field.type}
          value={value}
          onChange={onChange}
          placeholder={field.placeholder}
          style={{ ...inputStyle, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px" }}
        />
      )}
    </div>
  );
}

function EntryBrief({
  brief,
  form,
  onChange,
  onSubmit,
  onClearDraft,
  error,
  draftSaved,
}: {
  brief: StrategyEntryBrief;
  form: ConstitutionalIntake;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearDraft: () => void;
  error: string;
  draftSaved: boolean;
}) {
  const visibleFields = brief.missingFields
    .map((name) => STRATEGY_ROOM_FORM_SPEC.find((field) => field.name === name))
    .filter((field): field is typeof STRATEGY_ROOM_FORM_SPEC[0] => Boolean(field));

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-6xl px-6 py-10 lg:px-12">
        <div className="mb-7">
          <Eyebrow>Entry brief</Eyebrow>
          <h1 style={{
            marginTop: "1rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(2rem, 4vw, 3rem)",
            lineHeight: 1,
            color: "rgba(255,255,255,0.92)",
          }}>
            Decision locked. Execution not yet begun.
          </h1>
        </div>

        <div className="grid gap-px lg:grid-cols-[1.15fr_0.85fr]" style={{ border: "1px solid rgba(255,255,255,0.11)", backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div style={{ backgroundColor: "rgb(5 6 8)", padding: "1.2rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "0.75rem" }}>
              Decision to be executed
            </div>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", lineHeight: 1.7, color: "rgba(255,255,255,0.82)" }}>
              {brief.decisionText}
            </p>
            <div className="mt-5 grid gap-px sm:grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
              {[
                ["Constraint", brief.constraintText],
                ["Cost of delay", brief.costOfDelayText],
                ["Owner domain", brief.ownerDomain],
              ].map(([label, value]) => (
                <div key={label} style={{ backgroundColor: "rgb(5 6 8)", padding: "0.85rem" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.45rem" }}>
                    {label}
                  </div>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", lineHeight: 1.55, color: label === "Cost of delay" ? "rgba(252,165,165,0.76)" : "rgba(255,255,255,0.58)" }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: "rgb(5 6 8)", padding: "1.2rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.74)", marginBottom: "0.75rem" }}>
              Contradiction snapshot
            </div>
            <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.65, color: "rgba(255,255,255,0.72)" }}>
              {brief.contradiction}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {(brief.contradictionSources.length ? brief.contradictionSources : ["strategy_room"]).map((source) => (
                <span key={source} style={{ border: "1px solid rgba(255,255,255,0.10)", padding: "0.32rem 0.45rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.36)" }}>
                  {source.replace(/_/g, " ")}
                </span>
              ))}
              <span style={{ border: `1px solid ${GOLD}24`, padding: "0.32rem 0.45rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                Confidence {brief.confidenceLabel}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={onSubmit} noValidate className="mt-8">
          <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgb(5 6 8)", padding: "1.2rem" }}>
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}AA`, marginBottom: "0.5rem" }}>
                  What the system still needs
                </div>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.6, color: "rgba(255,255,255,0.46)" }}>
                  Only missing execution inputs are requested. Captured evidence is not repeated.
                </p>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                {draftSaved ? "Draft saved" : "Autosave active"}
              </span>
            </div>

            {visibleFields.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleFields.map((field) => (
                  <CompactEntryField
                    key={String(field.name)}
                    field={field}
                    value={String(form[field.name] || "")}
                    onChange={onChange}
                  />
                ))}
              </div>
            ) : (
              <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}06`, padding: "0.85rem 1rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                No further execution inputs required.
              </div>
            )}

            {error && (
              <div style={{ marginTop: "1rem", border: "1px solid rgba(248,113,113,0.22)", backgroundColor: "rgba(248,113,113,0.05)", padding: "0.85rem 1rem" }}>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(252,165,165,0.80)" }}>
                  {error}
                </span>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2"
                style={{ border: `1px solid ${GOLD}45`, backgroundColor: `${GOLD}10`, color: GOLD, padding: "0.8rem 1.05rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase" }}
              >
                Begin execution session
                <ArrowRight style={{ width: "12px", height: "12px" }} />
              </button>
              <button
                type="button"
                onClick={onClearDraft}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}
              >
                Clear entry
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}

function ExecutionDecisionFrame({
  canonical,
  thread,
}: {
  canonical: CanonicalSectionsEnvelope | null;
  thread: ConstitutionalThread | null;
}) {
  const context = buildExecutionContext(thread, canonical);
  const posture = canonical ? localSummary(canonical) : null;
  const constraints = [
    context.consequence,
    safeText(posture?.authorityType) ? `Authority state: ${posture?.authorityType}` : "",
    safeText(posture?.readinessTier) ? `Readiness: ${posture?.readinessTier}` : "",
  ].filter(Boolean);

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div className="grid gap-px lg:grid-cols-3" style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.08)" }}>
          {[
            ["Condition", context.dominantCondition],
            ["Required decision", posture?.nextAction || "Select and execute the first governed intervention."],
            ["Constraints (non-negotiable)", constraints.join(" · ") || "No undefined intervention outside the system frame."],
          ].map(([label, value]) => (
            <div key={label} style={{ backgroundColor: "rgb(5 6 8)", padding: "1.15rem 1.25rem" }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                color: label === "Constraints (non-negotiable)" ? "rgba(252,165,165,0.68)" : `${GOLD}90`,
                marginBottom: "0.65rem",
              }}>
                {label}
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.65, color: "rgba(255,255,255,0.68)" }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function inferFriction(index: number, item: string): "LOW" | "MEDIUM" | "HIGH" {
  const value = item.toLowerCase();
  if (value.includes("board") || value.includes("authority") || value.includes("escalat")) return "HIGH";
  if (value.includes("constraint") || value.includes("governance") || index > 1) return "MEDIUM";
  return "LOW";
}

function ExecutionFrictionBadge({ level }: { level: "LOW" | "MEDIUM" | "HIGH" }) {
  const color =
    level === "HIGH" ? "rgba(252,165,165,0.86)" :
    level === "MEDIUM" ? `${GOLD}CC` :
    "rgba(110,231,183,0.86)";
  return (
    <span style={{
      border: `1px solid ${color.replace("0.86", "0.28").replace("CC", "45")}`,
      color,
      padding: "0.25rem 0.45rem",
      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
      fontSize: "6.5px",
      letterSpacing: "0.22em",
    }}>
      {level}
    </span>
  );
}

function InterventionStack({
  canonical,
}: {
  canonical: CanonicalSectionsEnvelope | null;
}) {
  const posture = canonical ? localSummary(canonical) : null;
  const requiredDecision = posture?.nextAction || "Execute the required decision.";
  const interventions = (posture?.interventions.length ? posture.interventions : [
    "Stabilise the decision owner and confirm intervention authority.",
    "Define the first constrained move and execute it before expanding scope.",
    "Record the decision outcome and move unresolved blockage into escalation.",
  ]).slice(0, 5);

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <p style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.12em",
          color: "rgba(252,165,165,0.30)",
          marginBottom: "0.5rem",
        }}>
          Every delay cycle increases cost and reduces decision advantage.
        </p>
        <div style={{
          border: "1px solid rgba(255,255,255,0.10)",
          backgroundColor: "rgb(5 6 8)",
        }}>
          <div style={{
            padding: "0.9rem 1.1rem",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.34em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
            }}>
              Intervention stack
            </span>
            <span style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.30)",
            }}>
              Execute in order
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {interventions.map((item, index) => {
              const friction = inferFriction(index, item);
              return (
                <div key={`${item}-${index}`} className="grid gap-4 p-4 lg:grid-cols-[48px_1fr_1fr]">
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "10px",
                    color: `${GOLD}AA`,
                  }}>
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <ExecutionFrictionBadge level={friction} />
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                        Execution friction
                      </span>
                    </div>
                    <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.65, color: "rgba(255,255,255,0.76)" }}>
                      <span style={{ color: `${GOLD}AA` }}>Intent:</span> {item}
                    </p>
                    <p style={{ marginTop: "0.45rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", lineHeight: 1.6, color: "rgba(255,255,255,0.50)" }}>
                      <span style={{ color: "rgba(255,255,255,0.72)" }}>Decision link:</span> this step exists to unblock: {requiredDecision}
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    {[
                      ["Risk if ignored", "Delay compounds and stakeholders improvise around the unresolved condition."],
                      ["Urgency", index === 0 ? "Immediate" : "After prior step is logged"],
                      ["Dependency", index === 0 ? "Named owner" : "Previous step completed or blocked"],
                      ["Failure signal", "Owner cannot execute, evidence is contested, or constraint remains unchanged."],
                    ].map(([label, value]) => (
                      <div key={label} style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: "0.7rem" }}>
                        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                          {label}
                        </div>
                        <div style={{ marginTop: "0.2rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", lineHeight: 1.5, color: label === "Risk if ignored" ? "rgba(252,165,165,0.72)" : "rgba(255,255,255,0.52)" }}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function ConstraintMap({
  canonical,
}: {
  canonical: CanonicalSectionsEnvelope | null;
}) {
  const posture = canonical ? localSummary(canonical) : null;
  const constraints = [
    safeText(posture?.authorityType) || "Authority boundary unresolved",
    safeText(posture?.orgState) || "Operating state unstable",
    safeText(posture?.temperature) || "Decision temperature elevated",
  ];

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div className="grid gap-px md:grid-cols-3" style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.08)" }}>
          {constraints.map((constraint, index) => (
            <div key={`${constraint}-${index}`} style={{ backgroundColor: "rgb(5 6 8)", padding: "1rem 1.15rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.70)", marginBottom: "0.75rem" }}>
                Blocking constraint
              </div>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.6, color: "rgba(255,255,255,0.70)" }}>
                {constraint}
              </p>
              <div style={{ marginTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: "0.75rem" }}>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", lineHeight: 1.55, color: "rgba(255,255,255,0.48)" }}>
                  <span style={{ color: `${GOLD}AA` }}>Workaround required:</span> assign a temporary owner and decision boundary.
                </p>
                <p style={{ marginTop: "0.45rem", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", lineHeight: 1.55, color: "rgba(252,165,165,0.68)" }}>
                  If unresolved → escalation.
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DecisionLog({
  entries,
  onAdd,
  onStatusChange,
  onBlockReasonChange,
}: {
  entries: DecisionLogEntry[];
  onAdd: (text: string) => void;
  onStatusChange: (id: string, status: DecisionLogStatus) => void;
  onBlockReasonChange: (id: string, reason: string) => void;
}) {
  const [draft, setDraft] = React.useState("");

  function submitDecision(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  }

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgb(2 3 5)" }}>
          <div style={{
            padding: "0.9rem 1.1rem",
            borderBottom: "1px solid rgba(255,255,255,0.09)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.34em", textTransform: "uppercase", color: `${GOLD}AA` }}>
              Decision log
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.30)" }}>
              Pending · Executed · Blocked
            </span>
          </div>

          <form onSubmit={submitDecision} className="grid gap-3 p-4 md:grid-cols-[1fr_auto]">
            <input
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Log the decision made from the first intervention"
              style={{
                ...inputStyle,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                backgroundColor: "rgba(255,255,255,0.025)",
              }}
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2"
              style={{
                border: `1px solid ${GOLD}45`,
                backgroundColor: `${GOLD}10`,
                color: GOLD,
                padding: "0.7rem 1rem",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
              }}
            >
              Log decision
              <ArrowRight style={{ width: "11px", height: "11px" }} />
            </button>
          </form>

          <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
            {entries.length === 0 ? (
              <div className="p-4" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.65, color: "rgba(255,255,255,0.42)" }}>
                No decision logged. The environment is not active until the first decision is recorded.
              </div>
            ) : entries.map((entry) => (
              <div key={entry.id} className="grid gap-3 p-4 lg:grid-cols-[150px_1fr_170px] lg:items-start">
                <div className="flex items-center gap-2" style={{ color: "rgba(255,255,255,0.38)" }}>
                  <Clock3 style={{ width: "12px", height: "12px" }} />
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase" }}>
                    {formatTimeStamp(entry.createdAt)}
                  </span>
                </div>
                <div>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", lineHeight: 1.65, color: "rgba(255,255,255,0.74)" }}>
                    {entry.text}
                  </p>
                  {entry.status === "blocked" && (
                    <input
                      value={entry.blockReason}
                      onChange={(event) => onBlockReasonChange(entry.id, event.target.value)}
                      placeholder="Reason for block is mandatory"
                      style={{
                        ...inputStyle,
                        marginTop: "0.75rem",
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "7.5px",
                        borderColor: entry.blockReason.trim() ? "rgba(255,255,255,0.14)" : "rgba(252,165,165,0.45)",
                        backgroundColor: "rgba(252,165,165,0.035)",
                      }}
                    />
                  )}
                </div>
                <select
                  value={entry.status}
                  onChange={(event) => onStatusChange(entry.id, event.target.value as DecisionLogStatus)}
                  style={{
                    ...inputStyle,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    backgroundColor: "rgb(2 3 5)",
                  }}
                >
                  <option value="pending" style={{ backgroundColor: "rgb(2 3 5)" }}>pending</option>
                  <option value="executed" style={{ backgroundColor: "rgb(2 3 5)" }}>executed</option>
                  <option value="blocked" style={{ backgroundColor: "rgb(2 3 5)" }}>blocked</option>
                </select>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function EscalationTriggers({ entries }: { entries: DecisionLogEntry[] }) {
  const blocked = entries.filter((entry) => entry.status === "blocked").length;
  const triggers = [
    "First move not logged inside the active execution window.",
    "Constraint unresolved after a recorded attempt.",
    "Decision blocked without a valid reason.",
  ];

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-7xl px-6 py-6 lg:px-12">
        <div style={{ border: "1px solid rgba(252,165,165,0.16)", backgroundColor: "rgb(5 6 8)" }}>
          <div style={{ padding: "0.85rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.76)" }}>
              Escalation triggers
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: blocked ? "rgba(252,165,165,0.72)" : "rgba(255,255,255,0.28)" }}>
              {blocked ? `${blocked} blocked` : "Armed"}
            </span>
          </div>
          <div className="grid gap-px md:grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.07)" }}>
            {triggers.map((trigger) => (
              <div key={trigger} style={{ backgroundColor: "rgb(5 6 8)", padding: "0.9rem 1rem" }}>
                <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7.5px", lineHeight: 1.55, color: "rgba(255,255,255,0.62)" }}>
                  {trigger}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ExitStates() {
  const exits = [
    { label: "Stabilised", classification: "Condition contained. Execution holds.", action: "Re-enter if condition resurfaces.", color: "rgba(110,231,183,0.70)" },
    { label: "Monitoring", classification: "Condition managed but not resolved.", action: "System continues to track trajectory.", color: `${GOLD}90` },
    { label: "Further intervention", classification: "Current path insufficient. Escalation required.", action: "Re-enter with updated evidence.", color: "rgba(252,165,165,0.70)" },
  ];

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
        <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginBottom: "0.65rem" }}>
          Exit classification
        </div>
        <div className="grid gap-px md:grid-cols-3" style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.08)" }}>
          {exits.map((exit) => (
            <div key={exit.label} style={{ backgroundColor: "rgb(5 6 8)", padding: "0.85rem 1rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: exit.color, fontWeight: 700, marginBottom: "0.35rem" }}>
                {exit.label}
              </div>
              <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", lineHeight: 1.45, color: "rgba(255,255,255,0.45)" }}>
                {exit.classification}
              </p>
              <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", marginTop: "0.3rem" }}>
                {exit.action}
              </p>
            </div>
          ))}
        </div>
        <p style={{
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontWeight: 300,
          fontSize: "0.85rem",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.20)",
          fontStyle: "italic",
          marginTop: "1rem",
          textAlign: "center",
        }}>
          This is where the decision is enforced and the outcome is measured.
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FORM ELEMENT STYLES
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "transparent",
  border: "1px solid rgba(255,255,255,0.09)",
  outline: "none",
  padding: "10px 12px",
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
  fontSize: "1rem",
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.80)",
  transition: "border-color 250ms ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.55rem",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "7.5px",
  letterSpacing: "0.36em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.28)",
};

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function StrategyRoomPage({
  hasPaidAccess,
  checkoutConfirmed = false,
  checkoutCancelled = false,
}: StrategyRoomPageProps) {
  const [form,        setForm]        = React.useState<ConstitutionalIntake>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error,       setError]       = React.useState("");
  const [canonical,   setCanonical]   = React.useState<CanonicalSectionsEnvelope | null>(null);
  const [draftSaved,  setDraftSaved]  = React.useState(false);
  const [thread, setThread] = React.useState<ConstitutionalThread | null>(null);
  const [decisionLog, setDecisionLog] = React.useState<DecisionLogEntry[]>([]);
  const [showAccessTransition, setShowAccessTransition] = React.useState(checkoutConfirmed);
  const [executionSessionId, setExecutionSessionId] = React.useState<string | null>(null);
  const [persistError, setPersistError] = React.useState<string | null>(null);
  const [executiveResult, setExecutiveResult] = React.useState<unknown>(null);
  const [showExecutionFlow, setShowExecutionFlow] = React.useState(false);
  const [executionFlowComplete, setExecutionFlowComplete] = React.useState(false);
  const executionRecordSessionIdRef = React.useRef(
    `qual_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
  );

  // Enforcement state — reactive system visibility
  const [enforcement, setEnforcement] = React.useState<{
    decisionState: string;
    escalationLevel: number;
    avoidanceCount: number;
    repeatedPatternLabel?: string | null;
    consequence?: { currentExposure: number; previousExposure?: number | null; baseRisk?: number | null; timePenalty?: number | null; failurePenalty?: number | null };
    escalationTriggers: Array<{ triggerType: string; message: string; createdAt?: string }>;
    directive?: string | null;
  } | null>(null);

  // Fetch enforcement state when execution session exists
  const fetchEnforcementState = React.useCallback(async () => {
    if (!executionSessionId) return;
    try {
      const res = await fetch(`/api/strategy-room/execution/${executionSessionId}/state`);
      const data = await res.json();
      if (data.ok) {
        setEnforcement({
          decisionState: data.state ?? "PENDING",
          escalationLevel: data.escalationLevel ?? 0,
          avoidanceCount: data.avoidanceCount ?? 0,
          repeatedPatternLabel: data.repeatedPatternLabel ?? null,
          consequence: data.consequence ?? undefined,
          escalationTriggers: data.triggers ?? [],
          directive: data.directive ?? null,
        });
      }
    } catch { /* non-blocking */ }
  }, [executionSessionId]);

  React.useEffect(() => {
    fetchEnforcementState();
  }, [fetchEnforcementState]);

  // Track entry
  React.useEffect(() => {
    trackStrategyRoomEntry();
    trackStrategyGateView();
    // Behavioural tracking
    const { trackHesitation, trackExitAfterCtaView } = require("@/lib/analytics/hesitation");
    const cleanH = trackHesitation({ page: "strategy_room", idleTimeout: 10000 });
    const cleanE = trackExitAfterCtaView("strategy_room", "[data-sr-cta]");
    const cleanups = [cleanH, cleanE];
    if (checkoutConfirmed) {
      track("strategy_room_checkout_returned_success", {
        stage: "strategy-room",
      });
    }
    return () => { cleanups.forEach((fn) => fn()); };
  }, []);

  React.useEffect(() => {
    setThread(readConstitutionalThread());
    try {
      const raw = window.sessionStorage.getItem("executive-report-result");
      if (raw) setExecutiveResult(JSON.parse(raw));
    } catch {
      setExecutiveResult(null);
    }
  }, []);

  React.useEffect(() => {
    if (!checkoutConfirmed) return;
    const timer = window.setTimeout(() => setShowAccessTransition(false), 1200);
    return () => window.clearTimeout(timer);
  }, [checkoutConfirmed]);

  // Load draft
  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConstitutionalIntake;
      setForm({ ...INITIAL_FORM, ...parsed });
    } catch { /* ignore */ }
  }, []);

  // Autosave
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        setDraftSaved(true);
        window.setTimeout(() => setDraftSaved(false), 900);
      } catch { /* ignore */ }
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(timer);
  }, [form]);

  const entryBrief = React.useMemo(
    () => buildStrategyEntryBrief({ thread, canonical, executiveResult, form }),
    [thread, canonical, executiveResult, form],
  );

  if (!hasPaidAccess) {
    return (
      <Layout
        title="Strategy Room | Abraham of London"
        description="Execution environment. The system has determined that intervention is required."
        canonicalUrl="/strategy-room"
        fullWidth
        headerTransparent
      >
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main style={{ backgroundColor: VOID, minHeight: "100vh", color: "white" }}>

          <StrategyRoomGate />

          <div className="mx-auto max-w-5xl px-6 lg:px-12">
            <div className="py-20 lg:py-24">

              {checkoutCancelled && (
                <div className="mb-6" style={{ border: "1px solid rgba(252,165,165,0.18)", backgroundColor: "rgba(252,165,165,0.04)", padding: "0.85rem 1rem" }}>
                  <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(252,165,165,0.60)" }}>Session cancelled. No payment taken.</span>
                </div>
              )}

              {/* ── STATE 1: MINIMAL HARD GATE ── */}
              <Eyebrow>Execution Environment</Eyebrow>
              <h1 style={{
                marginTop: "1rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(2rem, 5vw, 3rem)",
                lineHeight: 0.98,
                color: "rgba(255,255,255,0.92)",
                maxWidth: "36ch",
              }}>
                The analysis is over. Now you either act or drift.
              </h1>

              <p style={{
                marginTop: "1rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "0.95rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.40)",
                maxWidth: "48ch",
              }}>
                This locks the decision, assigns ownership, and tracks whether it actually happens.
                If you are not ready to act, do not enter.
              </p>

              <div className="mt-4 grid gap-px grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.04)", maxWidth: "36rem" }}>
                {["Decision sequencing", "Constraint removal", "Execution verification"].map((item) => (
                  <div key={item} style={{ backgroundColor: VOID, padding: "0.65rem 0.85rem" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* ── ExecutionFlow qualification gate (pre-payment) ── */}
              {!executionFlowComplete && (
                <div className="mt-8" style={{ maxWidth: "36rem" }}>
                  {!showExecutionFlow ? (
                    <button
                      type="button"
                      onClick={() => { setShowExecutionFlow(true); track("strategy_room_execution_flow_started"); }}
                      style={{
                        padding: "14px 28px",
                        border: `1px solid ${GOLD}50`,
                        backgroundColor: `${GOLD}10`,
                        color: `${GOLD}CC`,
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        fontSize: "9px",
                        letterSpacing: "0.20em",
                        textTransform: "uppercase",
                        cursor: "pointer",
                      }}
                    >
                      Qualify for execution
                    </button>
                  ) : (
                    <ExecutionFlow
                      inheritedDecision={thread?.summary?.title ?? null}
                      inheritedBlocker={thread?.summary?.narrative ?? null}
                      inheritedConsequence={null}
                      onComplete={(record) => {
                        setExecutionFlowComplete(true);
                        setShowExecutionFlow(false);
                        track("strategy_room_execution_flow_completed", {
                          hasDecision: Boolean(record?.decision),
                          hasAuthority: Boolean(record?.authority),
                          hasFirstAction: Boolean(record?.firstAction),
                        });
                        // Persist the locked decision record
                        if (record) {
                          fetch("/api/strategy-room/execution-record", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              sessionId: executionRecordSessionIdRef.current,
                              decision: record.decision,
                              authority: record.authority,
                              conflictResolved: record.conflictResolution,
                              firstAction: record.firstAction,
                              timeline: record.consequence,
                              owner: record.authority,
                              createdAt: record.completedAt,
                              evidenceSource: "execution_flow",
                              email: form.email || undefined,
                            }),
                          }).catch(() => {});
                        }
                      }}
                    />
                  )}
                </div>
              )}

              {/* Decision-weight price framing */}
              <div className="mt-8 space-y-4" style={{ maxWidth: "36rem" }}>
                <div style={{ border: "1px solid rgba(255,255,255,0.08)", padding: "1.25rem" }}>
                  <p style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    If this decision slips another 30 days, it becomes:
                  </p>
                  <ul className="mt-2 space-y-1 text-sm" style={{ color: "rgba(252,165,165,0.55)" }}>
                    <li>• Harder to escalate</li>
                    <li>• More politically expensive</li>
                    <li>• Less reversible</li>
                  </ul>
                </div>

                <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}06`, padding: "1.25rem" }}>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", color: "rgba(255,255,255,0.50)" }}>
                        One delayed escalation vs {getProductDisplayPrice("strategy_room")}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", marginTop: "0.25rem" }}>
                        This is not the cost of the system. This is the cost of forcing the decision.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Disqualification + cost anchor */}
              <div className="mt-6" style={{ maxWidth: "36rem" }}>
                <div style={{ border: "1px solid rgba(252,165,165,0.15)", backgroundColor: "rgba(252,165,165,0.03)", padding: "1rem" }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(252,165,165,0.60)", fontStyle: "italic" }}>
                    If this decision is not already costing you something measurable — do not enter.
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <StrategyRoomConversionBridge
                  price={getProductAmountGbp("strategy_room")}
                  checkoutPriceCode="strategy_room"
                  originPath="/strategy-room"
                  ctaHref="/strategy-room"
                  primaryCtaLabel="Force the decision"
                  title=""
                  description=""
                />
              </div>

              <div className="mt-3" style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.15)" }}>
                Structured intake. Governed sequencing. No open-ended engagement.
              </div>

              <div className="mt-8" style={{ maxWidth: "36rem" }}>
                <LimitationsBlock assessmentType="enterprise" customLimitations={["This environment forces the decision. It cannot make the decision for you.", "It tracks whether action is taken. It does not guarantee the action is correct.", "Execution verification requires honest reporting. The system detects avoidance but cannot prevent it."]} />
                <div className="mt-4">
                  <FeedbackLoopBlock assessmentType="strategy" />
                </div>
              </div>
            </div>
          </div>
        </main>
      </Layout>
    );
  }
  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function clearDraft() {
    setForm(INITIAL_FORM);
    setCanonical(null);
    setError("");
    try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }

  async function addDecisionLogEntry(text: string) {
    setPersistError(null);
    if (!executionSessionId) {
      setPersistError("Execution session is not yet persisted. Submit the Strategy Room intake before logging decisions.");
      return;
    }

    try {
      const response = await fetch(`/api/strategy-room/execution/${executionSessionId}/decisions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision: text }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok || !data.decision?.id) {
        throw new Error(data.error || "Decision persistence failed.");
      }
      const entry: DecisionLogEntry = {
        id: data.decision.id,
        text: data.decision.text ?? data.decision.decision,
        status: data.decision.status,
        blockReason: data.decision.blockReason ?? "",
        createdAt: data.decision.createdAt,
      };
      setDecisionLog((prev) => [entry, ...prev]);
      track("strategy_room_decision_logged", {
        has_canonical: Boolean(canonical),
        entry_count: decisionLog.length + 1,
      });
      // Refresh enforcement state after decision logged
      fetchEnforcementState();
    } catch (error) {
      setPersistError(error instanceof Error ? error.message : "Decision persistence failed.");
    }
  }

  async function updateDecisionLogStatus(id: string, status: DecisionLogStatus) {
    const current = decisionLog.find((entry) => entry.id === id);
    if (!current || !executionSessionId) {
      setPersistError("Execution session persistence is unavailable. Status was not changed.");
      return;
    }

    if (status === "blocked" && !current.blockReason.trim()) {
      setDecisionLog((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, status, blockReason: entry.blockReason } : entry,
        ),
      );
      setPersistError("Reason for block is mandatory. Add the reason to persist blocked status.");
      return;
    }

    setDecisionLog((prev) =>
      prev.map((entry) =>
        entry.id === id
          ? {
              ...entry,
              status,
              blockReason: status === "blocked" ? entry.blockReason : "",
            }
          : entry,
      ),
    );
    setPersistError(null);
    track("strategy_room_decision_status_changed", { status });

    try {
      const response = await fetch(`/api/strategy-room/execution/${executionSessionId}/decisions`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId: id, status, reason: current.blockReason }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || "Decision update failed.");
      // Refresh enforcement state after status change
      fetchEnforcementState();
    } catch (error) {
      setDecisionLog((prev) =>
        prev.map((entry) =>
          entry.id === id ? { ...entry, status: current.status, blockReason: current.blockReason } : entry,
        ),
      );
      setPersistError(error instanceof Error ? error.message : "Decision update failed.");
    }
  }

  function updateDecisionBlockReason(id: string, reason: string) {
    setDecisionLog((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, blockReason: reason } : entry,
      ),
    );
    if (!executionSessionId || !reason.trim()) return;
    const current = decisionLog.find((entry) => entry.id === id);
    if (current?.status !== "blocked") return;
    fetch(`/api/strategy-room/execution/${executionSessionId}/decisions`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decisionId: id, status: "blocked", reason }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error || "Block reason persistence failed.");
        setPersistError(null);
      })
      .catch((error) => {
        setPersistError(error instanceof Error ? error.message : "Block reason persistence failed.");
      });
  }

  async function initDecisionSession(intake: ConstitutionalIntake) {
    trackStrategyAttempt();

    // Include cross-stage tension thread if available
    let tensionThread = null;
    try {
      const raw = sessionStorage.getItem("aol:tension-thread");
      if (raw) tensionThread = JSON.parse(raw);
    } catch {}

    const res = await fetch("/api/strategy-room/session/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake, tensionThread }),
    });
    const data = await res.json();

    // Handle server-side decision authority enforcement
    if (res.status === 403 && data?.directive) {
      const d = data.directive;
      const msg = d.level === "block"
        ? `Escalation denied: ${d.reason || "structural condition does not support strategic intervention."}`
        : `Progression restricted: ${d.reason || "prerequisite conditions must be addressed first."}`;
      throw new Error(msg);
    }

    if (!res.ok || !data.success || !data.sessionKey) {
      throw new Error(data.error || "Failed to initialize decision session.");
    }
    return (data as SessionInitResponse).sessionKey!;
  }

  async function logRecommendationImpressions(nextSessionKey: string, envelope: CanonicalSectionsEnvelope) {
    const recs = envelope.sections?.governedRecommendations?.recommendations || [];
    if (!Array.isArray(recs) || !recs.length) return;
    await fetch("/api/strategy-room/session/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionKey: nextSessionKey,
        recommendations: recs.map((item: any, idx: number) => ({
          assetId: item?.id,
          assetTitle: item?.title,
          assetHref: item?.href ?? null,
          assetKind: item?.kind,
          rank: idx + 1,
          matchScore: item?.score,
          metadataConfidence: null,
          reasons: Array.isArray(item?.reasons) ? item.reasons : [],
        })),
        canonicalSnapshot: envelope,
      }),
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const executionIntake = buildExecutionIntake(form, entryBrief, canonical, thread);
    const validationError = validateExecutionEntry(executionIntake, entryBrief);
    if (validationError) { setError(validationError); return; }

    setError("");
    setIsSubmitting(true);
    setCanonical(null);

    try {
      const nextSessionKey = await initDecisionSession(executionIntake);

      const guidanceRes = await fetch("/api/decision/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: executionIntake,
          options: { assetLimit: 6, minAssetScore: 18, source: "strategy-room" },
        }),
      });

      const raw = await guidanceRes.json();
      if (!guidanceRes.ok) throw new Error(raw?.error || "Decision guidance generation failed.");

      const nextCanonical = raw?.canonical ?? raw?.jsonPayload ?? raw;
      if (!hasCanonicalSections(nextCanonical)) {
        throw new Error("Canonical sections payload missing from guidance API.");
      }

      setCanonical(nextCanonical);
      trackStrategyRoomConversion();
      await logRecommendationImpressions(nextSessionKey, nextCanonical);

      // Create server-persisted execution session for decision log
      try {
        const execRes = await fetch("/api/strategy-room/execution", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            strategyRoomSessionId: nextSessionKey,
            email: executionIntake.email || null,
            canonicalSnapshot: nextCanonical,
          }),
        });
        const execData = await execRes.json();
        if (execData.ok && execData.id) {
          setExecutionSessionId(execData.id);
          const saved = await fetch(`/api/strategy-room/execution/${execData.id}/decisions`);
          const savedData = await saved.json();
          if (saved.ok && savedData.ok && Array.isArray(savedData.decisions)) {
            setDecisionLog(savedData.decisions.map((entry: any) => ({
              id: String(entry.id),
              text: String(entry.text ?? entry.decision ?? ""),
              status: entry.status as DecisionLogStatus,
              blockReason: String(entry.blockReason ?? entry.notes ?? ""),
              createdAt: String(entry.createdAt ?? new Date().toISOString()),
            })));
          }
        } else {
          throw new Error(execData.error || "Execution session persistence failed.");
        }
      } catch (execError) {
        setPersistError(execError instanceof Error ? execError.message : "Execution session persistence failed.");
      }

      try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (hasPaidAccess && showAccessTransition) {
    return (
      <Layout
        title="Strategy Room | Abraham of London"
        description="A governed execution environment for decisions that cannot remain theoretical."
        canonicalUrl="/strategy-room"
        fullWidth
        headerTransparent
      >
        <main style={{ backgroundColor: VOID, minHeight: "100vh", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            border: `1px solid ${GOLD}28`,
            backgroundColor: "rgb(2 3 5)",
            padding: "1.2rem 1.4rem",
          }}>
            <div style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
            }}>
              Access granted. Execution environment ready.
            </div>
          </div>
        </main>
      </Layout>
    );
  }

  return (
    <Layout
      title="Strategy Room | Abraham of London"
      description="A governed execution environment for decisions that cannot remain theoretical."
      canonicalUrl="/strategy-room"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: VOID, minHeight: "100vh", color: "white" }}>

        {/* ── STATE: LOADING ─────────────────────────────────────────────── */}
        {isSubmitting && (
          <div style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: VOID,
          }}>
            <div className="relative z-10 text-center">
              <div className="h-5 w-5 animate-spin border border-current border-t-transparent mx-auto mb-6"
                style={{ borderColor: `${GOLD}80`, borderTopColor: "transparent", borderRadius: "50%" }}
              />
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: `${GOLD}90`,
                marginBottom: "0.85rem",
              }}>
                Preparing execution environment...
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                color: "rgba(255,255,255,0.30)",
                fontStyle: "italic",
              }}>
                The system is binding the decision, constraint, and intervention path.
              </p>
            </div>
          </div>
        )}

        {/* ── STATE 3: EXECUTION CHAMBER ─────────────────────────────────── */}
        {!isSubmitting && canonical && (
          <>
            <div className="mx-auto max-w-7xl px-6 lg:px-12 pt-4">
              <CaseActiveBanner caseReference={executionSessionId ?? `SR-${Date.now().toString(36).toUpperCase()}`} committed assessmentType="strategy" />
            </div>

            <ExecutionEntryState thread={thread} canonical={canonical} checkoutConfirmed={checkoutConfirmed} />

            {/* ── ADMISSION + EVIDENCE + COUNSEL STATUS (derived from room state) ── */}
            <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
              <div style={{ display: "grid", gap: "8px", marginBottom: "8px" }}>
                <AdmissionNotice
                  status="ADMITTED"
                  surface="Strategy Room"
                  evidenceTier={enforcement ? deriveEvidenceTierFromStages(Object.keys(canonical?.sections ?? {}).length) : undefined}
                  authorityStatus={enforcement?.directive ?? null}
                  caseId={executionSessionId ?? null}
                  compact
                />
                {enforcement && (
                  <EvidenceStrengthMeter
                    level={deriveEvidenceTierFromStages(Object.keys(canonical?.sections ?? {}).length)}
                    stagesCompleted={Object.keys(canonical?.sections ?? {}).length || 0}
                  />
                )}
                {(() => {
                  // Derive counsel status from real room state via the counsel trigger engine
                  const roomState: StrategyRoomState = {
                    sessionId: executionSessionId ?? "",
                    caseId: executionSessionId ?? "",
                    decisionId: null,
                    admissionStatus: "ADMITTED",
                    decisionStatement: String((canonical?.sections as any)?.decisionSpace?.decisionStatement ?? (canonical?.sections as any)?.decision ?? ""),
                    evidenceTier: deriveEvidenceTierFromStages(Object.keys(canonical?.sections ?? {}).length),
                    authorityStatus: enforcement?.directive ?? null,
                    consequence: enforcement?.consequence ? {
                      score: enforcement.consequence.currentExposure,
                      trend: enforcement.consequence.currentExposure >= 75 ? "ESCALATING" : "STABLE",
                      currentExposure: enforcement.consequence.currentExposure,
                      previousExposure: enforcement.consequence.previousExposure ?? null,
                    } : null,
                    avoidance: enforcement?.avoidanceCount ? {
                      count: enforcement.avoidanceCount,
                      pattern: enforcement.repeatedPatternLabel ?? null,
                    } : null,
                    escalation: enforcement?.escalationTriggers?.length ? {
                      triggers: enforcement.escalationTriggers,
                      currentLevel: String(enforcement.escalationLevel),
                    } : null,
                    execution: { state: "ACTIVE", requiredActions: [] },
                    retainer: null,
                  };
                  const counselResult = evaluateCounselTrigger(roomState);
                  const counselStatus = deriveCounselStatus(counselResult);
                  return (
                    <CounselStatusPanel
                      status={counselStatus}
                      reasons={counselResult.reasons.map(String)}
                      explanation={counselResult.explanation}
                      repairActions={counselResult.repairActions}
                      compact
                    />
                  );
                })()}
              </div>
            </div>

            <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
              <DecisionStateBanner
                state={enforcement?.decisionState ?? "PENDING"}
                escalationLevel={enforcement?.escalationLevel ?? 0}
              />
            </div>

            <FirstActionPrompt />
            <ExecutionDecisionFrame canonical={canonical} thread={thread} />

            <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
              <DynamicConsequencePanel
                currentExposure={enforcement?.consequence?.currentExposure ?? 0}
                previousExposure={enforcement?.consequence?.previousExposure ?? null}
                baseRisk={enforcement?.consequence?.baseRisk ?? null}
                timePenalty={enforcement?.consequence?.timePenalty ?? null}
                failurePenalty={enforcement?.consequence?.failurePenalty ?? null}
              />
            </div>

            <InterventionStack canonical={canonical} />
            <ConstraintMap canonical={canonical} />

            <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
              <AvoidancePatternNotice
                avoidanceCount={enforcement?.avoidanceCount ?? 0}
                repeatedPatternLabel={enforcement?.repeatedPatternLabel ?? null}
              />
            </div>

            <DecisionLog
              entries={decisionLog}
              onAdd={addDecisionLogEntry}
              onStatusChange={updateDecisionLogStatus}
              onBlockReasonChange={updateDecisionBlockReason}
            />

            <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
              <EscalationTriggerPanel triggers={enforcement?.escalationTriggers ?? []} />
            </div>

            {/* Advantage path — where the organisation can move ahead */}
            {(() => {
              const adv = assessAdvantageTerrain({
                velocityGapPercent: 40,
                aiClassification: "AI_LAG",
                contradictionCount: enforcement?.escalationTriggers?.length ?? 0,
                resolvedContradictionCount: decisionLog.filter((d: any) => d.status === "executed").length,
                sector: "professional_services",
                competitorAIAdoption: true,
                activeDomains: [],
                revenueBand: "",
              });
              return (
                <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
                  <CompetitivePositionSignal position={adv.competitivePosition} />
                  <AdvantagePathBlock data={adv} />
                  <AIInterventionSuggestions suggestions={suggestInterventions({
                    aiExposureLevel: "HIGH",
                    forwardTerrainState: "SHIFTING",
                    contradictionCount: enforcement?.escalationTriggers?.length ?? 0,
                    velocityGapPercent: 40,
                    hasMultiStakeholder: false,
                    competitivePosition: adv.competitivePosition,
                  })} />
                </div>
              );
            })()}

            {/* Retainer gate — appears only when condition qualifies */}
            {(() => {
              const q = evaluateRetainerQualification({
                persistingContradictions: enforcement?.escalationTriggers
                  ?.filter((t) => t.triggerType === "contradiction_persists" || t.triggerType === "repeated_avoidance")
                  .map((t) => t.message) ?? [],
                recurringPatterns: enforcement?.repeatedPatternLabel ? [enforcement.repeatedPatternLabel] : [],
                stakeholderContradictions: [],
                longitudinalClassification: enforcement?.decisionState === "ESCALATED" ? "recurring" : undefined,
              });
              return q.qualifies ? (
                <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
                  <RetainerEntryGate qualification={q} />
                </div>
              ) : null;
            })()}

            {enforcement?.directive && (
              <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
                <div style={{ border: "1px solid rgba(252,165,165,0.25)", backgroundColor: "rgba(252,165,165,0.04)", padding: "0.75rem 1rem" }}>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(252,165,165,0.60)" }}>System directive</div>
                  <p style={{ marginTop: "0.2rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(252,165,165,0.50)" }}>{enforcement.directive}</p>
                </div>
              </div>
            )}

            <EscalationTriggers entries={decisionLog} />
            {persistError && (
              <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
                <div style={{
                  border: "1px solid rgba(252,165,165,0.20)",
                  backgroundColor: "rgba(252,165,165,0.04)",
                  padding: "0.65rem 1rem",
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    color: "rgba(252,165,165,0.70)",
                  }}>
                    {persistError}
                  </span>
                </div>
              </div>
            )}

            {/* Trajectory feedback from decision log */}
            {decisionLog.length > 0 && (() => {
              const executed = decisionLog.filter((d) => d.status === "executed").length;
              const blocked = decisionLog.filter((d) => d.status === "blocked").length;
              const total = decisionLog.length;
              const execRate = total > 0 ? executed / total : 0;
              const blockRate = total > 0 ? blocked / total : 0;
              const traj = execRate > 0.6 ? "ASCENDING" : blockRate > 0.4 ? "DETERIORATING" : execRate > 0.3 ? "STAGNANT" : "FRAGILE";
              const trajColor = traj === "ASCENDING" ? "rgba(110,231,183,0.70)" : traj === "DETERIORATING" ? "rgba(252,165,165,0.70)" : traj === "FRAGILE" ? "rgba(253,186,116,0.70)" : "rgba(255,255,255,0.40)";
              return (
                <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.75rem" }}>
                  <div className="flex items-center gap-3">
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
                      Execution trajectory
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.10em", color: trajColor, fontWeight: 700 }}>
                      {traj}
                    </span>
                    {executed > 0 && (
                      <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", color: "rgba(255,255,255,0.22)" }}>
                        {executed}/{total} executed
                      </span>
                    )}
                  </div>
                  {execRate > 0.5 && (
                    <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.82rem", color: "rgba(110,231,183,0.55)", marginTop: "0.3rem", fontStyle: "italic" }}>
                      The condition is responding to intervention.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Constraint line */}
            <div className="mx-auto max-w-7xl px-6 lg:px-12" style={{ paddingBottom: "0.5rem" }}>
              <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "6.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.30)" }}>
                Deviation from the intervention path introduces risk.
              </div>
            </div>

            <ExitStates />
          </>
        )}

        {/* ── STATE 2: ENTRY BRIEF ───────────────────────────────────────── */}
        {!isSubmitting && !canonical && (
          <>
            <StrategyRoomGate />
            <EntryBrief
              brief={entryBrief}
              form={form}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onClearDraft={clearDraft}
              error={error}
              draftSaved={draftSaved}
            />
          </>
        )}

        <section>
          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-10">
              <Link
                href="/"
                className="inline-flex items-center gap-2 transition-all hover:underline"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                Back to home
              </Link>
            </div>
          </div>
        </section>

      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<StrategyRoomPageProps> = async (ctx) => {
  let email: string | null =
    typeof ctx.query.email === "string" ? ctx.query.email.trim().toLowerCase() : null;
  let userId: string | null = null;

  try {
    const { resolveIdentity } = await import("@/lib/auth/resolve-identity");
    const cookieHeader = ctx.req.headers.cookie ?? "";
    const headers = new Headers();
    headers.set("cookie", cookieHeader);
    if (ctx.req.headers.host) headers.set("host", ctx.req.headers.host);
    const fakeReq = new Request(`http://${ctx.req.headers.host ?? "localhost"}${ctx.req.url}`, { headers });
    const identity = await resolveIdentity(fakeReq as any);
    email = identity.email ?? email;
    userId = identity.subjectId ?? null;
  } catch {
    // unauthenticated access may still resolve by explicit email entitlement
  }

  let checkoutConfirmed = false;
  if (ctx.query.checkout === "success") {
    try {
      const valid = await verifyCheckoutSessionForProduct(ctx.query.session_id, "strategy_room");
      if (valid && typeof ctx.query.session_id === "string") {
        checkoutConfirmed = true;
        // Set short-lived cookie for immediate return-access smoothing
        setCommercialAccessCookie(ctx, "strategy_room", ctx.query.session_id);
      }
    } catch {
      // Keep the page on the paid entry surface if session verification fails.
    }
  }

  const entitlement = await resolveCanonicalEntitlement({
    userId,
    email,
    slug: "strategy-room.entry",
  });

  return {
    props: {
      hasPaidAccess: entitlement.granted || checkoutConfirmed,
      checkoutConfirmed,
      checkoutCancelled: ctx.query.checkout === "cancelled",
    },
  };
};
