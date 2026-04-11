/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/consulting/strategy-room/index.tsx  (or pages/strategy-room.tsx — match your route)
// Design: Institutional Monumentalism — the highest-consequence page on the platform
// Three states: CHAMBER (pre-submission) → LOADING → VERDICT (post-submission)
// Typography: Cormorant Garamond display · JetBrains Mono data/labels
// Palette: #060609 base · #C9A96E softGold · sharp panels throughout

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  ChevronRight,
  Lock,
  Scale,
  ShieldCheck,
  Target,
  TriangleAlert,
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
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

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
        description: "The signal is sufficiently coherent for direct strategic engagement.",
        ctaHref: "/contact?intent=strategy-room-mandate",
        ctaLabel: "Request private mandate review",
        tone: "green" as const,
      };
    case "REJECT":
      return {
        label: "Foundational route",
        description: "The matter is not yet ready for premium escalation. Foundational work should precede it.",
        ctaHref: "/diagnostics/directional-integrity?source=strategy-room&entry=redirect&intent=foundational-correction",
        ctaLabel: "Start foundational diagnostic",
        tone: "red" as const,
      };
    default:
      return {
        label: "Diagnostic route",
        description: "The signal is real, but structural readiness is incomplete. Diagnostic correction is the appropriate next step.",
        ctaHref: "/diagnostics?source=strategy-room&entry=redirect&intent=diagnostic-escalation",
        ctaLabel: "Continue into diagnostics",
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

// ─────────────────────────────────────────────────────────────────────────────
// FORM ELEMENT STYLES
// ─────────────────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)",
  outline: "none",
  padding: "12px 14px",
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
  fontSize: "1rem",
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.80)",
  transition: "border-color 250ms ease, background-color 250ms ease",
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

function ChamberHero() {
  const pillars = [
    {
      icon: ShieldCheck,
      title: "Qualified access",
      body: "Strong signals escalate immediately. Weak signals receive governed correction before any escalation.",
    },
    {
      icon: Target,
      title: "Matched guidance",
      body: "Recommendations surface by constitutional fit — not generic content or ambient noise.",
    },
    {
      icon: Lock,
      title: "Advisory discipline",
      body: "Strategy access is earned, not casually claimed. Bandwidth is protected by design.",
    },
    {
      icon: Scale,
      title: "Constitutional routing",
      body: "The system reads authority, clarity, and readiness before deciding the appropriate next move.",
    },
  ];

  return (
    <div style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-x-0 overflow-hidden" style={{ height: "100%", maxHeight: "600px" }}>
        <div className="absolute" style={{
          left: "-5%", top: "-10%",
          width: "700px", height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(ellipse at center, ${GOLD}09 0%, ${GOLD}03 30%, transparent 65%)`,
          filter: "blur(140px)",
        }} />
        <div className="absolute" style={{
          right: "0%", top: "5%",
          width: "450px", height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle at center, rgba(255,255,255,0.022) 0%, transparent 65%)",
          filter: "blur(120px)",
        }} />
        <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
      </div>

      {/* Top gold rule */}
      <div className="absolute inset-x-0 top-0 h-px" style={{
        background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)`,
      }} />

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-12">
        <div className="pt-36 md:pt-44 lg:pt-52 pb-20 md:pb-24">

          {/* Label */}
          <Eyebrow>Strategy Room · Constitutional Gate</Eyebrow>

          {/* Title */}
          <h1 style={{
            marginTop: "1.5rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(2.8rem, 6.5vw, 6.5rem)",
            lineHeight: 0.90,
            letterSpacing: "-0.048em",
            color: "rgba(255,255,255,0.94)",
            maxWidth: "18ch",
          }}>
            Not a booking form.
            <br />
            <span style={{ color: "rgba(255,255,255,0.28)" }}>
              A governed advisory chamber.
            </span>
          </h1>

          {/* Description */}
          <p style={{
            marginTop: "1.75rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(1rem, 1.4vw, 1.22rem)",
            lineHeight: 1.75,
            color: "rgba(255,255,255,0.42)",
            maxWidth: "50ch",
          }}>
            This is where serious operators stop browsing and start declaring
            the real problem. The room exists to test mandate fit, consequence
            weight, authority, readiness, and whether private work is justified now.
          </p>

          {/* Pillars */}
          <div className="grid gap-4 mt-12 sm:grid-cols-2 xl:grid-cols-4">
            {pillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="transition-all duration-400"
                  style={{
                    border: "1px solid rgba(255,255,255,0.062)",
                    backgroundColor: "rgba(255,255,255,0.015)",
                    padding: "1.5rem 1.75rem",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = `${GOLD}20`;
                    el.style.backgroundColor = "rgba(255,255,255,0.025)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLDivElement;
                    el.style.borderColor = "rgba(255,255,255,0.062)";
                    el.style.backgroundColor = "rgba(255,255,255,0.015)";
                  }}
                >
                  <Icon style={{ width: "18px", height: "18px", color: `${GOLD}AA`, marginBottom: "1.25rem" }} />
                  <h3 style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.10rem",
                    color: "rgba(255,255,255,0.82)",
                    marginBottom: "0.6rem",
                  }}>
                    {p.title}
                  </h3>
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.88rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.38)",
                  }}>
                    {p.body}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Threshold note */}
          <div style={{
            marginTop: "2rem",
            padding: "1.25rem 1.5rem",
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.01)",
            display: "flex",
            alignItems: "flex-start",
            gap: "0.85rem",
          }}>
            <TriangleAlert style={{ width: "14px", height: "14px", color: `${GOLD}80`, flexShrink: 0, marginTop: "2px" }} />
            <p style={{
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "0.92rem",
              lineHeight: 1.65,
              color: "rgba(255,255,255,0.45)",
            }}>
              Submitting here does not guarantee acceptance. It guarantees a
              more serious reading than a contact form will ever produce.
              Weak signals are redirected — not escalated.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

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
            onFocus={e => {
              e.currentTarget.style.borderColor = `${GOLD}35`;
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
            }}
          />
        ) : field.type === "select" ? (
          <select
            id={id}
            name={String(field.name)}
            value={value}
            onChange={onChange}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
            onFocus={e => {
              e.currentTarget.style.borderColor = `${GOLD}35`;
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
            }}
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
            onFocus={e => {
              e.currentTarget.style.borderColor = `${GOLD}35`;
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
            }}
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
    <div style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-12 lg:py-20">

        {/* Form header */}
        <div className="mb-10">
          <Eyebrow>Mandate qualification</Eyebrow>
          <h2 style={{
            marginTop: "1.25rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
            lineHeight: 1.0,
            letterSpacing: "-0.025em",
            color: "rgba(255,255,255,0.92)",
          }}>
            Present the matter clearly.
          </h2>
          <p style={{
            marginTop: "0.85rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontWeight: 300,
            fontSize: "1.02rem",
            lineHeight: 1.72,
            color: "rgba(255,255,255,0.38)",
            maxWidth: "48ch",
          }}>
            Thin answers weaken the constitutional reading. Serious operators
            speak plainly about consequence.
          </p>
        </div>

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
                padding: "16px 28px",
                border: `1px solid ${isSubmitting ? "rgba(255,255,255,0.07)" : `${GOLD}42`}`,
                backgroundColor: isSubmitting ? "rgba(255,255,255,0.02)" : `${GOLD}10`,
                color: isSubmitting ? "rgba(255,255,255,0.25)" : `${GOLD}CC`,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
              onMouseEnter={e => {
                if (!isSubmitting) {
                  const el = e.currentTarget;
                  el.style.borderColor = `${GOLD}65`;
                  el.style.backgroundColor = `${GOLD}18`;
                }
              }}
              onMouseLeave={e => {
                if (!isSubmitting) {
                  const el = e.currentTarget;
                  el.style.borderColor = `${GOLD}42`;
                  el.style.backgroundColor = `${GOLD}10`;
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
  onResubmit: () => void;
  onMarkDiagnosticStarted: () => void;
  onMarkStrategyAccepted: () => void;
};

function Verdict({ canonical, onResubmit, onMarkDiagnosticStarted, onMarkStrategyAccepted }: VerdictProps) {
  const posture = localSummary(canonical);
  const recs    = recommendations(canonical);
  const route   = routeMeta(posture.route);
  const tc      = toneColors(route.tone);

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

          {/* Route badge */}
          <div style={{
            padding: "6px 16px",
            border: `1px solid ${tc.border}`,
            backgroundColor: tc.bg,
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px",
            letterSpacing: "0.36em",
            textTransform: "uppercase",
            color: tc.text,
            whiteSpace: "nowrap",
            alignSelf: "flex-start",
            marginTop: "1.6rem",
          }}>
            {route.label}
          </div>
        </div>

        <GoldRule soft />

        {/* Main verdict grid */}
        <div className="grid gap-6 mt-10 lg:grid-cols-[1.2fr_0.8fr]">

          {/* Left — route reading + narrative + interventions */}
          <div className="space-y-5">

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

            {/* CTA row */}
            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={route.ctaHref}
                onClick={() => {
                  if (posture.route === "STRATEGY") void onMarkStrategyAccepted();
                  else void onMarkDiagnosticStarted();
                }}
                className="group inline-flex items-center gap-2.5 transition-all duration-300"
                style={{
                  padding: "12px 24px",
                  border: `1px solid ${tc.border}`,
                  backgroundColor: tc.bg,
                  color: tc.text,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                }}
              >
                {route.ctaLabel}
                <ArrowRight style={{ width: "12px", height: "12px" }} />
              </Link>

              <button
                type="button"
                onClick={onResubmit}
                className="inline-flex items-center gap-2.5 transition-all duration-300"
                style={{
                  padding: "12px 24px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  color: "rgba(255,255,255,0.42)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.color = "rgba(255,255,255,0.65)"; }}
                onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = "rgba(255,255,255,0.08)"; el.style.color = "rgba(255,255,255,0.42)"; }}
              >
                Refine and resubmit
                <ChevronRight style={{ width: "12px", height: "12px" }} />
              </button>
            </div>
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

export default function StrategyRoomPage() {
  const [form,        setForm]        = React.useState<ConstitutionalIntake>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error,       setError]       = React.useState("");
  const [canonical,   setCanonical]   = React.useState<CanonicalSectionsEnvelope | null>(null);
  const [sessionKey,  setSessionKey]  = React.useState<string | null>(null);
  const [draftSaved,  setDraftSaved]  = React.useState(false);

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
      canonicalUrl="/consulting/strategy-room"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>

        {/* Breadcrumb — always visible */}
        <div style={{
          position: "absolute",
          top: "1.25rem",
          left: "1.5rem",
          zIndex: 60,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
        }}>
          <Link
            href="/diagnostics"
            className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
            style={{
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "8px",
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
            }}
          >
            <ArrowLeft style={{ width: "11px", height: "11px" }} />
            Diagnostics
          </Link>
          <span style={{ color: "rgba(255,255,255,0.12)" }}>/</span>
          <span style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.18)",
          }}>
            Strategy Room
          </span>
        </div>

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
            <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.018 }}>
              <div style={GRAIN} className="absolute inset-0" />
            </div>
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
              onResubmit={handleResubmit}
              onMarkDiagnosticStarted={handleMarkDiagnosticStarted}
              onMarkStrategyAccepted={handleMarkStrategyAccepted}
            />

            {/* Verdict escalation close */}
            <section style={{ backgroundColor: BASE, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="mx-auto max-w-5xl px-6 py-12 lg:px-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD}35, transparent)` }} />
                  <p style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.98rem",
                    lineHeight: 1.70,
                    color: "rgba(255,255,255,0.28)",
                    fontStyle: "italic",
                    maxWidth: "44ch",
                  }}>
                    If you believe the diagnosis is incomplete, refine and
                    resubmit. The system reads what you declare, not what
                    you imply.
                  </p>
                  <button
                    type="button"
                    onClick={handleResubmit}
                    style={{
                      marginTop: "0.5rem",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.30em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                      transition: "color 250ms ease",
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.50)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.22)")}
                  >
                    Refine and resubmit
                  </button>
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── STATE: CHAMBER (pre-submission) ────────────────────────────── */}
        {!isSubmitting && !canonical && (
          <>
            <ChamberHero />
            <IntakeForm
              form={form}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onClearDraft={clearDraft}
              isSubmitting={isSubmitting}
              error={error}
              draftSaved={draftSaved}
            />

            {/* Pre-submission close */}
            <section style={{ backgroundColor: VOID, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="mx-auto max-w-5xl px-6 py-10 lg:px-12">
                <div className="flex flex-col items-center gap-3 text-center">
                  <GoldRule soft />
                  <p style={{
                    marginTop: "0.75rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "0.92rem",
                    lineHeight: 1.68,
                    color: "rgba(255,255,255,0.22)",
                    fontStyle: "italic",
                    maxWidth: "44ch",
                  }}>
                    The diagnostic ladder exists for readers who are not yet
                    ready to declare their matter formally.
                  </p>
                  <Link
                    href="/diagnostics"
                    className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.20)",
                    }}
                  >
                    Enter the diagnostic ladder
                    <ChevronRight style={{ width: "10px", height: "10px" }} />
                  </Link>
                </div>
              </div>
            </section>
          </>
        )}

      </div>
    </Layout>
  );
}