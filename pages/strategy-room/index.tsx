/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/consulting/strategy-room/index.tsx  (or pages/strategy-room.tsx — match your route)
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
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Lock,
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
import {
  hasCommercialAccessCookie,
  setCommercialAccessCookie,
  verifyCheckoutSessionForProduct,
} from "@/lib/server/billing/commercial-access";

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

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function safeText(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
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
  const hasExecutiveReportingContext = Boolean(thread?.executiveFindings);

  // Track entry
  React.useEffect(() => {
    trackStrategyRoomEntry();
    if (checkoutConfirmed) {
      track("strategy_room_checkout_returned_success", {
        stage: "strategy-room",
      });
    }
  }, []);

  React.useEffect(() => {
    setThread(readConstitutionalThread());
    setThreadLoaded(true);
  }, []);

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
          <div className="mx-auto max-w-7xl px-6 py-24 lg:px-12">
            {checkoutCancelled && (
              <div
                className="mb-6 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-5"
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-amber-200/75">
                  Checkout cancelled
                </p>
                <p className="mt-2 text-sm leading-6 text-white/58">
                  No payment was taken. Strategy Room remains available when the decision requires intervention.
                </p>
              </div>
            )}
            <StrategyRoomConversionBridge
              price={395}
              checkoutPriceCode="strategy_room"
              originPath="/strategy-room"
              ctaHref="/strategy-room"
              primaryCtaLabel="Continue to Strategy Room criteria"
              title="Strategy Room is for decisions with real consequence."
              description="Executive Reporting gives the interpretation. Strategy Room exists when the decision now requires governed intervention, constraint removal, and action logic. Not for exploratory use."
            />
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

  async function initDecisionSession(intake: ConstitutionalIntake) {
    const res = await fetch("/api/strategy-room/session/init", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intake }),
    });
    const data: SessionInitResponse = await res.json();
    if (!res.ok || !data.success || !data.sessionKey) {
      throw new Error(data.error || "Failed to initialize decision session.");
    }
    return data.sessionKey;
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

  return (
    <Layout
      title="Strategy Room | Abraham of London"
      description="Governed constitutional intelligence for founders, executives, and boards. Not a booking form — a qualified advisory gate."
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
            <section>
              <div className="mx-auto max-w-6xl px-6 lg:px-12">
                <div className="py-20 lg:py-24">
                  <Eyebrow>STRATEGY ROOM · QUALIFIED INTERVENTION ENTRY</Eyebrow>
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
                    Only when consequence is real.
                  </h1>
                  <p
                    style={{
                      marginTop: "1rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1rem",
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.48)",
                      maxWidth: "56ch",
                    }}
                  >
                    Strategy Room is the escalation layer for live decisions under
                    material consequence. It turns a constitutional reading into
                    governed intervention logic. Not exploratory. Not theoretical.
                  </p>
                  {hasExecutiveReportingContext && (
                    <div
                      className="mt-5 max-w-3xl"
                      style={{
                        border: `1px solid ${GOLD}22`,
                        backgroundColor: `${GOLD}07`,
                        padding: "1rem 1.25rem",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: `${GOLD}A0`,
                          marginBottom: "0.45rem",
                        }}
                      >
                        Executive Reporting handoff
                      </div>
                      <p
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.98rem",
                          lineHeight: 1.6,
                          color: "rgba(255,255,255,0.62)",
                        }}
                      >
                        Your Executive Reporting result suggests this now requires intervention:
                        {` ${thread?.executiveFindings?.route ?? "STRATEGY"} · ${thread?.executiveFindings?.readinessTier ?? "decision-ready"}`}.
                      </p>
                    </div>
                  )}
                  {checkoutConfirmed && (
                    <div
                      className="mt-5 max-w-3xl"
                      style={{
                        border: `1px solid ${GOLD}22`,
                        backgroundColor: `${GOLD}07`,
                        padding: "1rem 1.25rem",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          fontSize: "7px",
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: `${GOLD}A0`,
                        }}
                      >
                        Strategy Room access confirmed · continue to intervention intake
                      </div>
                    </div>
                  )}
                  {thread && (
                    <div className="mt-6 max-w-3xl">
                      <InheritedThreadContext thread={thread} title="Inherited journey context" />
                    </div>
                  )}
                  {threadLoaded && !thread && (
                    <div
                      className="mt-6 grid gap-4 md:grid-cols-2"
                      style={{ maxWidth: "56rem" }}
                    >
                      <div
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: "rgba(255,255,255,0.018)",
                          padding: "1rem 1.25rem",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: `${GOLD}A0`,
                            marginBottom: "0.55rem",
                          }}
                        >
                          You are entering at the intervention layer
                        </div>
                        <p
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.96rem",
                            lineHeight: 1.6,
                            color: "rgba(255,255,255,0.52)",
                          }}
                        >
                          This surface is designed for live institutional decisions. If you have
                          not completed the diagnostic ladder, the system will still assess your
                          situation, but you are entering without accumulated stage context.
                        </p>
                      </div>
                      <div
                        style={{
                          border: "1px solid rgba(255,255,255,0.08)",
                          backgroundColor: "rgba(255,255,255,0.018)",
                          padding: "1rem 1.25rem",
                        }}
                      >
                        <div
                          style={{
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                            fontSize: "7px",
                            letterSpacing: "0.28em",
                            textTransform: "uppercase",
                            color: "rgba(255,255,255,0.34)",
                            marginBottom: "0.55rem",
                          }}
                        >
                          Best for
                        </div>
                        <div
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "0.94rem",
                            lineHeight: 1.7,
                            color: "rgba(255,255,255,0.48)",
                          }}
                        >
                          <div>• when the decision is already real</div>
                          <div>• when cost of delay is material</div>
                          <div>• when generic advice is no longer enough</div>
                        </div>
                      </div>
                    </div>
                  )}
                  <RouteStrip />
                  <div
                    className="mt-8"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                    }}
                  >
                    Required: Strategic context · Authority signal · Problem articulation · £395 entry
                  </div>
                </div>
              </div>
            </section>
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
  const hasCookie = hasCommercialAccessCookie(ctx.req.headers.cookie, "strategy_room");
  if (hasCookie) {
    return { props: { hasPaidAccess: true, checkoutConfirmed: ctx.query.checkout === "success" } };
  }

  if (ctx.query.checkout === "success") {
    try {
      const valid = await verifyCheckoutSessionForProduct(ctx.query.session_id, "strategy_room");
      if (valid && typeof ctx.query.session_id === "string") {
        setCommercialAccessCookie(ctx, "strategy_room", ctx.query.session_id);
        return { props: { hasPaidAccess: true, checkoutConfirmed: true } };
      }
    } catch {
      // Keep the page on the paid entry surface if session verification fails.
    }
  }

  return {
    props: {
      hasPaidAccess: false,
      checkoutCancelled: ctx.query.checkout === "cancelled",
    },
  };
};
