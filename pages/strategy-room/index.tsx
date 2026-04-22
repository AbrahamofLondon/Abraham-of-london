/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/strategy-room/index.tsx
// Design: Institutional Monumentalism — the highest-consequence page on the platform
// Three states: CHAMBER (pre-submission) → LOADING → VERDICT (post-submission)
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
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Lock,
  Clock3,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  STRATEGY_ROOM_FORM_SPEC,
  type ConstitutionalIntake,
} from "@/lib/decision/system-constitution";
import {
  trackConversion,
  trackFollowup,
} from "@/lib/strategy-room/client-trackers";
import type { CanonicalSectionsEnvelope } from "@/lib/decision/canonical-sections";
import { hasCanonicalSections } from "@/lib/decision/canonical-sections";
import {
  readConstitutionalThread,
  type ConstitutionalThread,
} from "@/lib/diagnostics/session-thread";
import InheritedThreadContext from "@/components/diagnostics/results/InheritedThreadContext";
import RecommendedPlaybooks from "@/components/diagnostics/results/RecommendedPlaybooks";
import TrajectoryLine from "@/components/diagnostics/results/TrajectoryLine";
import EngagementReadinessPanel from "@/components/diagnostics/results/EngagementReadinessPanel";
import { inferTrajectory, deriveEngagementReadiness } from "@/lib/diagnostics/prognosis";
import { matchPlaybooks } from "@/lib/playbooks/matcher";
import ThresholdProximityLine, {
  thresholdProximityText,
} from "@/components/diagnostics/results/ThresholdProximityLine";
import ProofCapturePrompt from "@/components/proof/ProofCapturePrompt";
import StrategyRoomConversionBridge from "@/components/strategy-room/StrategyRoomConversionBridge";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import {
  setCommercialAccessCookie,
  verifyCheckoutSessionForProduct,
} from "@/lib/server/billing/commercial-access";

// ─────────────────────────────────────────────────────────────────────────────
// DECISION AUTHORITY GATE
// ─────────────────────────────────────────────────────────────────────────────

function StrategyRoomGate() {
  const [directive, setDirective] = React.useState<{
    level: string; reason: string; requiredAction?: string; recommendedPath?: string; summary?: string;
  } | null>(null);

  React.useEffect(() => {
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

type RecommendationItem = {
  id?: string;
  title?: string;
  href?: string | null;
  kind?: string;
  score?: number;
  reasons?: string[];
};

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";
const AMBER = "#F59E0B";

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

function validateForm(form: ConstitutionalIntake): string | null {
  for (const field of STRATEGY_ROOM_FORM_SPEC) {
    const value = form[field.name];
    if (field.required && !String(value || "").trim()) {
      return `${field.label} is required.`;
    }
  }
  if (form.problemStatement.trim().length < 100) {
    return "Problem Statement is insufficient. State the structural problem with more precision.";
  }
  if (form.symptoms.trim().length < 80) {
    return "Observed Symptoms is too thin. Describe the operating reality in fuller detail.";
  }
  if (form.desiredOutcome.trim().length < 50) {
    return "Desired Outcome is too vague. Name the decision-grade outcome required.";
  }
  if (form.currentConstraint.trim().length < 30) {
    return "Current Constraint is too thin. Name the pressure materially obstructing movement.";
  }
  return null;
}

function routeMeta(route?: string | null) {
  switch (route) {
    case "STRATEGY":
      return {
        label: "Strategy route",
        description: "The signal is sufficiently ordered for direct strategic engagement.",
        ctaHref: "/contact?intent=strategy-room-mandate",
        ctaLabel: "Request private mandate review",
        tone: "green" as const,
      };
    case "REJECT":
      return {
        label: "Foundational route",
        description: "The matter is carrying strain, but not in a form ordered enough for premium escalation.",
        ctaHref: "/diagnostics/directional-integrity?source=strategy-room&entry=redirect&intent=foundational-correction",
        ctaLabel: "Start foundational diagnostic",
        tone: "red" as const,
      };
    default:
      return {
        label: "Diagnostic route",
        description: "The signal is real, but readiness and authority are not yet ordered enough for direct intervention.",
        ctaHref: "/diagnostics?source=strategy-room&entry=redirect&intent=diagnostic-escalation",
        ctaLabel: "Start the Diagnostic",
        tone: "gold" as const,
      };
  }
}

function toneColors(tone: "green" | "red" | "gold") {
  switch (tone) {
    case "green": return { border: "rgba(52,211,153,0.22)", bg: "rgba(52,211,153,0.06)", text: "rgba(110,231,183,0.90)" };
    case "red":   return { border: "rgba(248,113,113,0.22)", bg: "rgba(248,113,113,0.06)", text: "rgba(252,165,165,0.90)" };
    default:      return { border: `${GOLD}35`, bg: `${GOLD}09`, text: `${GOLD}CC` };
  }
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

function recommendations(canonical: CanonicalSectionsEnvelope | null): RecommendationItem[] {
  const raw = canonical?.sections?.governedRecommendations?.recommendations ?? [];
  return Array.isArray(raw) ? (raw as RecommendationItem[]) : [];
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
  const interventions = (posture?.interventions.length ? posture.interventions : [
    "Stabilise the decision owner and confirm intervention authority.",
    "Define the first constrained move and execute it before expanding scope.",
    "Record the decision outcome and move unresolved blockage into escalation.",
  ]).slice(0, 5);

  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-7xl px-6 py-8 lg:px-12">
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
                      <span style={{ color: "rgba(255,255,255,0.72)" }}>Expected effect:</span> ambiguity collapses into a named action path.
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
// CHAMBER HERO — the proposition before the form
// ─────────────────────────────────────────────────────────────────────────────



// ─────────────────────────────────────────────────────────────────────────────
// INTAKE FORM
// ─────────────────────────────────────────────────────────────────────────────

type IntakeFormProps = {
  form: ConstitutionalIntake;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearDraft: () => void;
  isSubmitting: boolean;
  error: string;
  draftSaved: boolean;
};

function IntakeForm({ form, onChange, onSubmit, onClearDraft, isSubmitting, error, draftSaved }: IntakeFormProps) {
  // Group fields for visual rhythm
  const identityFields  = STRATEGY_ROOM_FORM_SPEC.slice(0, 5);   // fullName, email, org, sector, revenue
  const authorityFields = STRATEGY_ROOM_FORM_SPEC.slice(5, 8);   // authorityRole, authorityScope, urgency
  const substanceFields = STRATEGY_ROOM_FORM_SPEC.slice(8, 12);  // problemStatement, symptoms, outcome, constraint
  const contextFields   = STRATEGY_ROOM_FORM_SPEC.slice(12);     // marketExposure, boardInvolved

  function renderField(field: typeof STRATEGY_ROOM_FORM_SPEC[0]) {
    const value = form[field.name] || "";
    const id = `sr-${String(field.name)}`;

    return (
      <div key={String(field.name)}>
        <label htmlFor={id} style={labelStyle}>
          {field.label}
          {field.required && (
            <span style={{ marginLeft: "0.4rem", color: `${GOLD}80` }}>*</span>
          )}
        </label>

        {field.type === "textarea" ? (
          <textarea
            id={id}
            name={String(field.name)}
            value={value}
            onChange={onChange}
            rows={5}
            placeholder={field.placeholder}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.75 }}
          />
        ) : field.type === "select" ? (
          <select
            id={id}
            name={String(field.name)}
            value={value}
            onChange={onChange}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
          >
            <option value="" style={{ backgroundColor: "rgb(6 6 9)" }}>Select…</option>
            {(field.options || []).map(opt => (
              <option key={opt.value} value={opt.value} style={{ backgroundColor: "rgb(6 6 9)" }}>
                {opt.label}
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
            style={inputStyle}
          />
        )}

        {field.helpText && (
          <p style={{
            marginTop: "0.5rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "0.85rem",
            lineHeight: 1.60,
            color: "rgba(255,255,255,0.28)",
          }}>
            {field.helpText}
          </p>
        )}
      </div>
    );
  }

  function FieldGroup({ label, fields, cols = 1 }: { label: string; fields: typeof STRATEGY_ROOM_FORM_SPEC; cols?: 1 | 2 }) {
    return (
      <div>
        {/* Group header */}
        <div style={{ marginBottom: "1.25rem" }}>
          <GoldRule soft />
          <div style={{ marginTop: "1.25rem" }}>
            <Eyebrow>{label}</Eyebrow>
          </div>
        </div>
        <div className={cols === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
          {fields.map(renderField)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-4xl px-6 py-8 lg:px-12 lg:py-10">

        <form onSubmit={onSubmit} noValidate>
          <div className="space-y-10">

            <FieldGroup label="Identity" fields={identityFields} cols={2} />
            <FieldGroup label="Authority" fields={authorityFields} cols={2} />
            <FieldGroup label="The matter" fields={substanceFields} />
            <FieldGroup label="Context" fields={contextFields} cols={2} />

          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: "2rem",
              padding: "1.25rem 1.5rem",
              border: "1px solid rgba(248,113,113,0.22)",
              backgroundColor: "rgba(248,113,113,0.05)",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.85rem",
            }}>
              <AlertTriangle style={{ width: "14px", height: "14px", color: "rgba(252,165,165,0.80)", flexShrink: 0, marginTop: "2px" }} />
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "0.97rem",
                lineHeight: 1.65,
                color: "rgba(252,165,165,0.85)",
              }}>
                {error}
              </p>
            </div>
          )}

          {/* Submit */}
          <div style={{ marginTop: "2.5rem" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group w-full inline-flex items-center justify-center gap-3 transition-all duration-300"
              style={{
                padding: "14px 20px",
                border: `1px solid ${isSubmitting ? "rgba(255,255,255,0.07)" : `${AMBER}42`}`,
                backgroundColor: "transparent",
                color: isSubmitting ? "rgba(255,255,255,0.25)" : AMBER,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  const el = e.currentTarget;
                  el.style.borderColor = `${AMBER}65`;
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  const el = e.currentTarget;
                  el.style.borderColor = `${AMBER}42`;
                }
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 animate-spin border border-current border-t-transparent" style={{ borderRadius: "50%" }} />
                  Assessing constitutional signal…
                </>
              ) : (
                <>
                  Submit for constitutional diagnosis
                  <ArrowRight style={{ width: "13px", height: "13px" }} />
                </>
              )}
            </button>

            <div style={{
              marginTop: "1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1rem",
            }}>
              <button
                type="button"
                onClick={onClearDraft}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Clear draft
              </button>
              <span style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.16)",
              }}>
                {draftSaved ? "Draft saved" : "Autosave active"}
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VERDICT — the constitutional outcome
// ─────────────────────────────────────────────────────────────────────────────

type VerdictProps = {
  canonical: CanonicalSectionsEnvelope;
  onMarkDiagnosticStarted: () => void;
  onMarkStrategyAccepted: () => void;
  thread: ConstitutionalThread | null;
};

function Verdict({ canonical, onMarkDiagnosticStarted, onMarkStrategyAccepted, thread }: VerdictProps) {
  const posture = localSummary(canonical);
  const recs    = recommendations(canonical);
  const route   = routeMeta(posture.route);
  const tc      = toneColors(route.tone);
  const matchedPlaybooks = thread
    ? matchPlaybooks({
        route: "STRATEGY_ROOM",
        readiness: posture.readinessTier,
        failureModes: [...thread.failureModes, ...posture.failureModes],
        dominantDomains: [],
        authorityType: posture.authorityType,
        teamFragility: thread.teamFindings?.fragilityStatus ?? null,
        enterprisePattern: thread.enterpriseFindings?.patternTitle ?? null,
      })
    : [];

  const readinessNum = ({ FRAGILE: 25, EMERGING: 40, STABILIZING: 55, EXECUTION_READY: 75, SOVEREIGN: 90 } as Record<string, number>)[posture.readinessTier] ?? 50;
  const clarityScore = posture.confidence ?? 50;
  const trajectory = inferTrajectory(clarityScore, readinessNum, posture.failureModes ?? []);
  const rawPosture = canonical?.sections?.constitutionalPosture as Record<string, unknown> | undefined;
  const engagementReadiness = deriveEngagementReadiness({
    revenueBand: String(rawPosture?.revenueBand ?? ""),
    problemStatement: "",
    urgencyWindow: posture.temperature === "SCORCHING" ? "IMMEDIATE" : posture.temperature === "HOT" ? "NEAR_TERM" : "MID_TERM",
    authorityScope: posture.authorityType,
    boardInvolved: undefined,
  });

  // Metric display
  function MetricRow({ label, value }: { label: string; value: string }) {
    return (
      <div className="flex items-center justify-between gap-4 py-2.5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "6.5px",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.65)",
        }}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-12 lg:py-20">

        {/* Verdict header */}
        <div className="mb-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
          <div>
            <Eyebrow>Constitutional verdict</Eyebrow>
            <h2 style={{
              marginTop: "1.25rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.028em",
              color: "rgba(255,255,255,0.92)",
            }}>
              The system has read the signal.
            </h2>
            {posture.narrative && (
              <p style={{
                marginTop: "1rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                lineHeight: 1.72,
                color: "rgba(255,255,255,0.45)",
                maxWidth: "56ch",
                fontStyle: "italic",
              }}>
                {posture.narrative}
              </p>
            )}
          </div>
        </div>

        <GoldRule soft />

        {/* Main verdict grid */}
        <div className="grid gap-6 mt-10 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Left — route reading + narrative + interventions */}
          <div className="space-y-5">
            {thread && (
              <InheritedThreadContext thread={thread} title="Journey context" />
            )}

            <TrajectoryLine trajectory={trajectory} />
            <EngagementReadinessPanel readiness={engagementReadiness} />
            <ProofCapturePrompt
              sourceStage="strategy_room"
              routeResultType={posture.route}
              mode="paid"
              isPaidStage
            />

            {/* Route reading panel */}
            <div style={{
              border: `1px solid ${tc.border}`,
              backgroundColor: tc.bg,
              padding: "1.75rem 2rem",
            }}>
              <div style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.40em",
                textTransform: "uppercase",
                color: tc.text,
                opacity: 0.85,
                marginBottom: "1rem",
              }}>
                Route reading
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.08rem",
                lineHeight: 1.72,
                color: "rgba(255,255,255,0.72)",
                marginBottom: "1.5rem",
              }}>
                {route.description}
              </p>
              <ThresholdProximityLine
                text={thresholdProximityText({
                  label: "Clarity",
                  value: posture.confidence,
                  thresholdLabel: "STRATEGY",
                  threshold: 65,
                })}
              />
              {posture.nextAction && (
                <p style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.95rem",
                  lineHeight: 1.65,
                  color: "rgba(255,255,255,0.45)",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                  paddingTop: "1.1rem",
                  fontStyle: "italic",
                }}>
                  {posture.nextAction}
                </p>
              )}
            </div>

            {/* Failure modes */}
            {posture.failureModes.length > 0 && (
              <div style={{
                border: "1px solid rgba(252,165,165,0.12)",
                backgroundColor: "rgba(252,165,165,0.03)",
                padding: "1.5rem 1.75rem",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: "rgba(252,165,165,0.65)",
                  marginBottom: "1rem",
                }}>
                  Identified failure modes
                </div>
                <div className="space-y-2.5">
                  {posture.failureModes.slice(0, 5).map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <AlertTriangle style={{ width: "12px", height: "12px", color: "rgba(252,165,165,0.60)", flexShrink: 0, marginTop: "3px" }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.97rem",
                        lineHeight: 1.60,
                        color: "rgba(255,255,255,0.60)",
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required interventions */}
            {posture.interventions.length > 0 && (
              <div style={{
                border: `1px solid ${GOLD}18`,
                backgroundColor: `${GOLD}06`,
                padding: "1.5rem 1.75rem",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.40em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                  marginBottom: "1rem",
                }}>
                  Required interventions
                </div>
                <div className="space-y-2.5">
                  {posture.interventions.slice(0, 5).map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckSquare style={{ width: "12px", height: "12px", color: `${GOLD}80`, flexShrink: 0, marginTop: "3px" }} />
                      <span style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.97rem",
                        lineHeight: 1.60,
                        color: "rgba(255,255,255,0.62)",
                      }}>
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <RecommendedPlaybooks playbooks={matchedPlaybooks} />

            <Link
              href={route.ctaHref}
              onClick={() => {
                if (posture.route === "STRATEGY") void onMarkStrategyAccepted();
                else void onMarkDiagnosticStarted();
              }}
              className="inline-flex items-center gap-2 pt-2 transition-all hover:underline"
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: route.tone === "gold" ? AMBER : tc.text,
              }}
            >
              {route.ctaLabel}
              <ArrowRight style={{ width: "11px", height: "11px" }} />
            </Link>
          </div>

          {/* Right — posture metrics + recommendations */}
          <div className="space-y-5">

            {/* Constitutional posture */}
            <div style={{
              border: "1px solid rgba(255,255,255,0.07)",
              backgroundColor: LIFT,
            }}>
              <div style={{
                padding: "0.85rem 1.25rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <span style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.22)",
                }}>
                  Constitutional posture
                </span>
              </div>
              <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                <MetricRow label="Route"          value={posture.route} />
                <MetricRow label="Org state"      value={posture.orgState} />
                <MetricRow label="Readiness tier" value={posture.readinessTier} />
                <MetricRow label="Authority"      value={posture.authorityType} />
                <MetricRow label="Priority"       value={posture.priority} />
                <MetricRow label="Temperature"    value={posture.temperature} />
                <MetricRow label="Clarity score"  value={`${posture.confidence}`} />
              </div>
            </div>

            {/* Governed recommendations */}
            {recs.length > 0 && (
              <div style={{
                border: `1px solid ${GOLD}18`,
                backgroundColor: `${GOLD}06`,
              }}>
                <div style={{
                  padding: "0.85rem 1.25rem",
                  borderBottom: `1px solid ${GOLD}12`,
                }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                  }}>
                    Governed recommendations
                  </span>
                </div>
                <div className="divide-y" style={{ borderColor: `${GOLD}10` }}>
                  {recs.slice(0, 4).map((item, idx) => (
                    <div key={`${item.id ?? item.title ?? "rec"}-${idx}`}
                      style={{ padding: "1rem 1.25rem" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.97rem",
                            lineHeight: 1.45,
                            color: "rgba(255,255,255,0.78)",
                            marginBottom: "0.35rem",
                          }}>
                            {safeText(item.title, "Governed recommendation")}
                          </p>
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "6.5px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.25)",
                          }}>
                            {safeText(item.kind, "asset")}
                          </span>
                        </div>
                        {typeof item.score === "number" && (
                          <span style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "9px",
                            color: `${GOLD}AA`,
                            flexShrink: 0,
                          }}>
                            {Math.round(item.score)}
                          </span>
                        )}
                      </div>

                      {Array.isArray(item.reasons) && item.reasons.length > 0 && (
                        <div style={{ marginTop: "0.6rem" }}>
                          {item.reasons.slice(0, 2).map((reason) => (
                            <p key={reason} style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.85rem",
                              lineHeight: 1.55,
                              color: "rgba(255,255,255,0.38)",
                            }}>
                              — {reason}
                            </p>
                          ))}
                        </div>
                      )}

                      {item.href && (
                        <Link href={item.href}
                          className="inline-flex items-center gap-1.5 mt-2.5 transition-opacity hover:opacity-75"
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7.5px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: `${GOLD}AA`,
                          }}
                        >
                          Open asset <ArrowRight style={{ width: "10px", height: "10px" }} />
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rationale */}
            {posture.rationale.length > 0 && (
              <div style={{
                border: "1px solid rgba(255,255,255,0.05)",
                backgroundColor: "rgba(255,255,255,0.01)",
                padding: "1.25rem",
              }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.36em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                  marginBottom: "0.85rem",
                }}>
                  Scoring rationale
                </div>
                <div className="space-y-1.5">
                  {posture.rationale.slice(0, 8).map((item) => (
                    <p key={item} style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.12em",
                      color: "rgba(255,255,255,0.25)",
                      lineHeight: 1.55,
                    }}>
                      {item}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [sessionKey,  setSessionKey]  = React.useState<string | null>(null);
  const [draftSaved,  setDraftSaved]  = React.useState(false);
  const [thread, setThread] = React.useState<ConstitutionalThread | null>(null);
  const [threadLoaded, setThreadLoaded] = React.useState(false);
  const [decisionLog, setDecisionLog] = React.useState<DecisionLogEntry[]>([]);
  const [showAccessTransition, setShowAccessTransition] = React.useState(checkoutConfirmed);
  const [executionSessionId, setExecutionSessionId] = React.useState<string | null>(null);
  const [persistError, setPersistError] = React.useState<string | null>(null);
  const hasExecutiveReportingContext = Boolean(thread?.executiveFindings);

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
    setThreadLoaded(true);
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

  if (!hasPaidAccess) {
    return (
      <Layout
        title="Strategy Room | Abraham of London"
        description="The governed intervention layer for live institutional decisions where consequence is already real."
        canonicalUrl="/strategy-room"
        fullWidth
        headerTransparent
      >
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <main style={{ backgroundColor: VOID, minHeight: "100vh", color: "white" }}>

          {/* ── SYSTEM POSITION — decision authority gating ── */}
          <StrategyRoomGate />

          <div className="mx-auto max-w-6xl px-6 lg:px-12">
            <div className="py-20 lg:py-24">

              {checkoutCancelled && (
                <div
                  className="mb-8"
                  style={{
                    border: "1px solid rgba(252,165,165,0.18)",
                    backgroundColor: "rgba(252,165,165,0.04)",
                    padding: "1rem 1.25rem",
                  }}
                >
                  <div style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.32em",
                    textTransform: "uppercase",
                    color: "rgba(252,165,165,0.70)",
                    marginBottom: "0.45rem",
                  }}>
                    Checkout cancelled
                  </div>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    color: "rgba(255,255,255,0.45)",
                  }}>
                    No payment was taken. Strategy Room remains available when the decision requires intervention.
                  </p>
                </div>
              )}

              {/* ── 1) OPENING ── */}
              <Eyebrow>Escalation Environment</Eyebrow>
              <h1
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "clamp(2.5rem, 6vw, 4rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.03em",
                  color: "rgba(255,255,255,0.92)",
                  maxWidth: "48ch",
                  fontStyle: "italic",
                }}
              >
                This is where decisions are executed when delay is no longer viable.
              </h1>
              <p
                style={{
                  marginTop: "1rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.48)",
                  maxWidth: "50ch",
                }}
              >
                Entry is governed by evidence, not request.
              </p>

              <GoldRule soft />

              {/* ── PAST PASSIVE ANALYSIS ── */}
              <div className="mt-10">
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.75rem" }}>
                  You are past the point of passive analysis
                </div>
                <div className="space-y-1.5" style={{ maxWidth: "44rem" }}>
                  {[
                    "The condition is active",
                    "Delay compounds the exposure",
                    "Partial action increases risk",
                  ].map((item) => (
                    <div key={item} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)" }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── THIS IS NOT AN UPGRADE ── */}
              <div className="mt-8" style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.85rem 1rem", maxWidth: "44rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.45rem" }}>
                  This is not an upgrade
                </div>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.40)" }}>
                  Strategy Room is system-routed. It exists because the diagnostic evidence determined that intervention is required. This is not optional assessment.
                </p>
              </div>

              <GoldRule soft />

              {/* ── WHAT THIS IS ── */}
              <div className="mt-10">
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.40)", marginBottom: "0.75rem" }}>
                  The system removes ambiguity from action.
                </p>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem" }}>
                  Execution value
                </div>
                <div className="grid gap-3 md:grid-cols-2" style={{ maxWidth: "44rem" }}>
                  {["Decision compression", "Decision sequencing", "Constraint navigation", "Authority resolution"].map((item) => (
                    <div key={item} style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.018)", padding: "0.65rem 0.85rem" }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", color: "rgba(255,255,255,0.55)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── WHAT THIS IS NOT ── */}
              <div className="mt-8">
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.45)", marginBottom: "0.75rem" }}>
                  Exclusions
                </div>
                <div className="space-y-1.5" style={{ maxWidth: "44rem" }}>
                  {["No advisory dependency", "No open-ended assessment", "No passive reporting surface"].map((item) => (
                    <div key={item} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.35)", paddingLeft: "0.75rem", position: "relative" }}>
                      <span style={{ position: "absolute", left: 0, color: "rgba(252,165,165,0.30)" }}>&mdash;</span>{item}
                    </div>
                  ))}
                </div>
              </div>

              <GoldRule soft />

              {/* ── WHAT HAPPENS NEXT ── */}
              <div className="mt-10">
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem" }}>
                  What happens next
                </div>
                <div className="space-y-1.5" style={{ maxWidth: "44rem" }}>
                  {[
                    "Controlled execution environment with structured intake",
                    "Defined intervention path based on scored condition",
                    "Action against identified constraints with governed sequencing",
                  ].map((item) => (
                    <div key={item} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.50)" }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── IF YOU DO NOTHING ── */}
              <div className="mt-8">
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.35)", marginBottom: "0.5rem" }}>
                  Most organisations stop here.
                </p>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.75rem" }}>
                  If you do nothing
                </div>
                <div className="space-y-1.5" style={{ maxWidth: "44rem" }}>
                  {[
                    "The condition persists under its current trajectory",
                    "Exposure compounds with each decision cycle that passes without intervention",
                    "The window for effective action narrows until the system chooses for you",
                  ].map((item) => (
                    <div key={item} style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(252,165,165,0.50)" }}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <GoldRule soft />

              {/* ── COMMERCIAL FRAMING ── */}
              <div className="mt-10">
                <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}06`, padding: "1.25rem", maxWidth: "44rem" }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.5rem" }}>
                    Intervention logic is now required.
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}90` }}>
                    &pound;395 &mdash; execution environment
                  </div>
                  <p style={{ marginTop: "0.55rem", fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.40)" }}>
                    At this stage, the cost of error exceeds the cost of intervention.
                  </p>
                </div>
              </div>

              {/* ── AUTHORITY TRANSFER + CTA ── */}
              <div className="mt-6" style={{ maxWidth: "44rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.75rem" }}>
                  The system has already determined that intervention is required.
                </div>
                <StrategyRoomConversionBridge
                  price={395}
                  checkoutPriceCode="strategy_room"
                  originPath="/strategy-room"
                  ctaHref="/strategy-room"
                  primaryCtaLabel="Enter execution environment"
                  title=""
                  description=""
                />
                <div className="mt-2" style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.78rem", color: "rgba(255,255,255,0.22)" }}>
                  Structured intake. Governed sequencing. No open-ended engagement.
                </div>
              </div>

              {/* What this prevents */}
              <div className="mt-8">
                <div style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: "rgba(252,165,165,0.45)",
                  marginBottom: "0.65rem",
                }}>
                  What this prevents
                </div>
                <div className="space-y-1.5" style={{ maxWidth: "44rem" }}>
                  {[
                    "Misdirected intervention that targets symptoms instead of structure",
                    "Escalation without evidence that burns credibility for future need",
                    "Fragmented execution where multiple parties act without coordination",
                  ].map((item) => (
                    <div
                      key={item}
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.88rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.38)",
                        paddingLeft: "0.75rem",
                        position: "relative",
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, color: "rgba(252,165,165,0.30)" }}>&middot;</span>
                      {item}
                    </div>
                  ))}
                </div>
                <div
                  className="mt-3"
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.85rem",
                    color: "rgba(255,255,255,0.30)",
                    fontStyle: "italic",
                  }}
                >
                  The cost of error exceeds the cost of intervention.
                </div>
              </div>

              <div
                className="mt-6"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.18)",
                }}
              >
                Entry is gated by evidence, not request
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
    setSessionKey(null);
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
    const validationError = validateForm(form);
    if (validationError) { setError(validationError); return; }

    setError("");
    setIsSubmitting(true);
    setCanonical(null);
    setSessionKey(null);

    try {
      const nextSessionKey = await initDecisionSession(form);
      setSessionKey(nextSessionKey);

      const guidanceRes = await fetch("/api/decision/guidance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intake: form,
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
            email: form.email || null,
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

  async function handleResubmit() {
    if (!sessionKey || !canonical) return;
    const posture = canonical.sections.constitutionalPosture;
    await trackFollowup({
      sessionKey, routeAfter: "DIAGNOSTIC", readinessTierAfter: "EMERGING",
      authorityTypeAfter: posture.authorityType, clarityDelta: 0.35, authorityDelta: 0.15,
      convertedAfterGuidance: false,
      metadata: { action: "resubmit_requested", previousConstitution: posture },
      canonical,
    });
    setCanonical(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleMarkDiagnosticStarted() {
    if (!sessionKey || !canonical) return;
    const posture = canonical.sections.constitutionalPosture;
    await trackConversion({ sessionKey, conversionType: "diagnostic_started", metadata: { source: "strategy_room_result", constitution: posture }, canonical });
    await trackFollowup({ sessionKey, routeAfter: "DIAGNOSTIC", readinessTierAfter: "EMERGING", authorityTypeAfter: posture.authorityType, clarityDelta: 0.4, authorityDelta: 0.2, convertedAfterGuidance: true, metadata: { action: "diagnostic_started", constitutionalSource: true }, canonical });
  }

  async function handleMarkStrategyAccepted() {
    if (!sessionKey || !canonical) return;
    const posture = canonical.sections.constitutionalPosture;
    await trackConversion({ sessionKey, conversionType: "strategy_path_accepted", metadata: { source: "strategy_room_result", constitution: posture }, canonical });
    await trackFollowup({ sessionKey, routeAfter: "STRATEGY", readinessTierAfter: posture.readinessTier, authorityTypeAfter: posture.authorityType, clarityDelta: 0.2, authorityDelta: 0.1, convertedAfterGuidance: true, metadata: { action: "strategy_path_accepted", constitutionalSource: true }, canonical });
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
                Reading the constitutional signal…
              </div>
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "1.05rem",
                color: "rgba(255,255,255,0.30)",
                fontStyle: "italic",
              }}>
                The system is assessing mandate fit, authority, and readiness.
              </p>
            </div>
          </div>
        )}

        {/* ── STATE: VERDICT ─────────────────────────────────────────────── */}
        {!isSubmitting && canonical && (
          <>
            <ExecutionEntryState thread={thread} canonical={canonical} checkoutConfirmed={checkoutConfirmed} />
            <FirstActionPrompt />
            <ExecutionDecisionFrame canonical={canonical} thread={thread} />
            <InterventionStack canonical={canonical} />
            <ConstraintMap canonical={canonical} />
            <DecisionLog
              entries={decisionLog}
              onAdd={addDecisionLogEntry}
              onStatusChange={updateDecisionLogStatus}
              onBlockReasonChange={updateDecisionBlockReason}
            />
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
            <Verdict
              canonical={canonical}
              onMarkDiagnosticStarted={handleMarkDiagnosticStarted}
              onMarkStrategyAccepted={handleMarkStrategyAccepted}
              thread={thread}
            />
          </>
        )}

        {/* ── STATE: CHAMBER (pre-submission) ────────────────────────────── */}
        {!isSubmitting && !canonical && (
          <>
            {/* ── SYSTEM POSITION — decision authority gating ── */}
            <StrategyRoomGate />
            <ExecutionEntryState thread={thread} canonical={canonical} checkoutConfirmed={checkoutConfirmed} />
            <FirstActionPrompt />
            <ExecutionDecisionFrame canonical={canonical} thread={thread} />
            <InterventionStack canonical={canonical} />
            <ConstraintMap canonical={canonical} />
            <DecisionLog
              entries={decisionLog}
              onAdd={addDecisionLogEntry}
              onStatusChange={updateDecisionLogStatus}
              onBlockReasonChange={updateDecisionBlockReason}
            />
            <ExitStates />
            <IntakeForm
              form={form}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onClearDraft={clearDraft}
              isSubmitting={isSubmitting}
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
