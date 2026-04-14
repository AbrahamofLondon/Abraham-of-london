/* eslint-disable @typescript-eslint/no-explicit-any */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";

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

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

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

const QUALIFIES = [
  "The decision carries institutional or financial consequence that survives a wrong answer.",
  "A structured diagnostic product has already been considered and is insufficient for the situation.",
  "The submitting operator has authority to act on the outcome or direct access to the decision sponsor.",
  "The matter cannot wait for a standard engagement cycle without compounding loss or exposure.",
];

const DOES_NOT_QUALIFY = [
  "Exploratory inquiries without a defined situation.",
  "Matters better handled through the diagnostic ladder.",
  "Advisory requests without operator authority or sponsor connection.",
];

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

  if (safeText(form.problemStatement).length < 100) {
    return "Problem Statement is insufficient. State the structural problem with more precision.";
  }

  if (safeText(form.symptoms).length < 80) {
    return "Observed Symptoms is too thin. Describe the operating reality in fuller detail.";
  }

  if (safeText(form.desiredOutcome).length < 50) {
    return "Desired Outcome is too vague. Name the decision-grade outcome required.";
  }

  if (safeText(form.currentConstraint).length < 30) {
    return "Current Constraint is too thin. Name the pressure materially obstructing movement.";
  }

  return null;
}

function routeMeta(route?: string | null) {
  switch (route) {
    case "STRATEGY":
      return {
        label: "Accepted",
        description: "The matter qualifies for direct strategic review.",
        ctaHref: "/contact?intent=strategy-room-mandate",
        ctaLabel: "Request private mandate review",
        border: "rgba(52,211,153,0.22)",
        bg: "rgba(52,211,153,0.06)",
        text: "rgba(110,231,183,0.90)",
      };
    case "REJECT":
      return {
        label: "Declined",
        description: "The declared matter does not justify escalation at this level.",
        ctaHref: "/diagnostics",
        ctaLabel: "See the diagnostic ladder",
        border: "rgba(248,113,113,0.22)",
        bg: "rgba(248,113,113,0.06)",
        text: "rgba(252,165,165,0.90)",
      };
    default:
      return {
        label: "Routed to diagnostics",
        description: "The signal is real, but structured diagnostic work should precede escalation.",
        ctaHref: "/diagnostics",
        ctaLabel: "Enter the diagnostic ladder",
        border: `${GOLD}35`,
        bg: `${GOLD}09`,
        text: `${GOLD}CC`,
      };
  }
}

function localSummary(canonical: CanonicalSectionsEnvelope | null) {
  const posture = canonical?.sections?.constitutionalPosture ?? null;
  const clarity = Number(posture?.clarityScore ?? 0);

  return {
    route: safeText(posture?.route, "DIAGNOSTIC"),
    confidence: Number.isFinite(clarity) ? Math.round(clarity) : 0,
    priority: safeText(posture?.priority, "QUALIFIED"),
    readinessTier: safeText(posture?.readinessTier, "EMERGING"),
    authorityType: safeText(posture?.authorityType, "UNCLEAR"),
    nextAction: safeText(canonical?.sections?.governedRecommendations?.nextAction, ""),
  };
}

function GoldRule() {
  return <div className="h-px w-full" style={{ backgroundColor: "rgba(255,255,255,0.10)" }} />;
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}CC`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)",
  outline: "none",
  padding: "12px 14px",
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
  fontSize: "0.98rem",
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.80)",
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

function QualificationBlock() {
  return (
    <section style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="mx-auto max-w-5xl px-6 lg:px-12">
        <div className="py-10 lg:py-12">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <div className="mb-5">
                <Eyebrow>What qualifies a matter for this room</Eyebrow>
              </div>
              <div className="space-y-3">
                {QUALIFIES.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div style={{ width: "4px", height: "4px", marginTop: "8px", backgroundColor: `${GOLD}70`, flexShrink: 0 }} />
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "13px",
                        lineHeight: 1.65,
                        color: "rgba(255,255,255,0.62)",
                      }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="mb-5">
                <div className="flex items-center gap-3">
                  <span className="h-5 w-px" style={{ backgroundColor: "rgba(252,165,165,0.35)" }} />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7.5px",
                      letterSpacing: "0.40em",
                      textTransform: "uppercase",
                      color: "rgba(252,165,165,0.68)",
                    }}
                  >
                    What does not qualify
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                {DOES_NOT_QUALIFY.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div style={{ width: "4px", height: "4px", marginTop: "8px", backgroundColor: "rgba(252,165,165,0.40)", flexShrink: 0 }} />
                    <p
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "13px",
                        lineHeight: 1.65,
                        color: "rgba(255,255,255,0.38)",
                        fontStyle: "italic",
                      }}
                    >
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type IntakeFormProps = {
  form: ConstitutionalIntake;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClearDraft: () => void;
  isSubmitting: boolean;
  error: string;
  draftSaved: boolean;
};

function IntakeForm({
  form,
  onChange,
  onSubmit,
  onClearDraft,
  isSubmitting,
  error,
  draftSaved,
}: IntakeFormProps) {
  const identityFields = STRATEGY_ROOM_FORM_SPEC.slice(0, 5);
  const authorityFields = STRATEGY_ROOM_FORM_SPEC.slice(5, 8);
  const substanceFields = STRATEGY_ROOM_FORM_SPEC.slice(8, 12);
  const contextFields = STRATEGY_ROOM_FORM_SPEC.slice(12);

  function renderField(field: (typeof STRATEGY_ROOM_FORM_SPEC)[number]) {
    const value = form[field.name] || "";
    const id = `sr-${String(field.name)}`;

    return (
      <div key={String(field.name)}>
        <label htmlFor={id} style={labelStyle}>
          {field.label}
          {field.required && <span style={{ marginLeft: "0.4rem", color: `${GOLD}80` }}>*</span>}
        </label>

        {field.type === "textarea" ? (
          <textarea
            id={id}
            name={String(field.name)}
            value={value}
            onChange={onChange}
            rows={5}
            placeholder={field.placeholder}
            style={{ ...inputStyle, resize: "none", lineHeight: 1.65 }}
          />
        ) : field.type === "select" ? (
          <select
            id={id}
            name={String(field.name)}
            value={value}
            onChange={onChange}
            style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
          >
            <option value="" style={{ backgroundColor: "rgb(6 6 9)" }}>
              Select…
            </option>
            {(field.options || []).map((opt) => (
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
      </div>
    );
  }

  function FieldGroup({ label, fields, cols = 1 }: { label: string; fields: typeof STRATEGY_ROOM_FORM_SPEC; cols?: 1 | 2 }) {
    return (
      <div>
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ marginBottom: "0.85rem" }}>
            <Eyebrow>{label}</Eyebrow>
          </div>
          <GoldRule />
        </div>
        <div className={cols === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>{fields.map(renderField)}</div>
      </div>
    );
  }

  return (
    <section style={{ backgroundColor: BASE, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        <div className="py-10 lg:py-12">
          <form onSubmit={onSubmit} className="space-y-8">
            <FieldGroup label="Identity" fields={identityFields} cols={2} />
            <FieldGroup label="Authority" fields={authorityFields} cols={1} />
            <FieldGroup label="Declared matter" fields={substanceFields} cols={1} />
            <FieldGroup label="Context" fields={contextFields} cols={2} />

            {error && (
              <div style={{ border: "1px solid rgba(248,113,113,0.25)", backgroundColor: "rgba(248,113,113,0.06)", padding: "0.9rem 1rem" }}>
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.12em",
                    color: "rgba(252,165,165,0.86)",
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {error}
                </p>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  padding: "12px 18px",
                  border: `1px solid ${GOLD}34`,
                  backgroundColor: `${GOLD}0A`,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: `${GOLD}CC`,
                  opacity: isSubmitting ? 0.6 : 1,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                }}
              >
                {isSubmitting ? "Submitting…" : "Submit for review"}
              </button>

              <button
                type="button"
                onClick={onClearDraft}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.09)",
                  padding: "12px 18px",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.5px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.34)",
                  cursor: "pointer",
                }}
              >
                Clear draft
              </button>

              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: draftSaved ? `${GOLD}A0` : "rgba(255,255,255,0.20)",
                }}
              >
                {draftSaved ? "Draft saved" : "Local draft active"}
              </span>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

function ReviewProcessBlock() {
  return (
    <section style={{ backgroundColor: VOID }}>
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        <div className="py-8 lg:py-10">
          <div className="space-y-1">
            <div
              style={{
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "8px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.28)",
                lineHeight: 1.9,
              }}
            >
              <div>Submissions are reviewed within the active review window.</div>
              <div>Route outcomes: accepted / routed to diagnostics / declined.</div>
              <div>Only qualified matters proceed beyond this chamber.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Verdict({
  canonical,
  onResubmit,
  onMarkDiagnosticStarted,
  onMarkStrategyAccepted,
}: {
  canonical: CanonicalSectionsEnvelope;
  onResubmit: () => Promise<void>;
  onMarkDiagnosticStarted: () => Promise<void>;
  onMarkStrategyAccepted: () => Promise<void>;
}) {
  const summary = localSummary(canonical);
  const route = routeMeta(summary.route);

  return (
    <section style={{ backgroundColor: VOID, minHeight: "100vh" }}>
      <div className="mx-auto max-w-4xl px-6 lg:px-12">
        <div className="py-16 lg:py-20">
          <div className="mb-8">
            <Eyebrow>Route determination</Eyebrow>
            <h1
              style={{
                marginTop: "1rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                color: "rgba(255,255,255,0.92)",
                maxWidth: "18ch",
              }}
            >
              {route.description}
            </h1>
          </div>

          <div style={{ border: `1px solid ${route.border}`, backgroundColor: route.bg, padding: "1.1rem 1.2rem" }}>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: route.text, marginBottom: "0.35rem" }}>
                  Outcome
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.82)" }}>
                  {route.label}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginBottom: "0.35rem" }}>
                  Readiness
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "1rem", lineHeight: 1.55, color: "rgba(255,255,255,0.72)" }}>
                  {summary.readinessTier} · {summary.authorityType}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "1rem", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: LIFT, padding: "1rem 1.2rem" }}>
            <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginBottom: "0.35rem" }}>
              Next action
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300, fontSize: "0.98rem", lineHeight: 1.65, color: "rgba(255,255,255,0.72)" }}>
              {summary.nextAction || route.description}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={route.ctaHref}
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-80"
              onClick={summary.route === "DIAGNOSTIC" ? () => { void onMarkDiagnosticStarted(); } : summary.route === "STRATEGY" ? () => { void onMarkStrategyAccepted(); } : undefined}
              style={{
                padding: "12px 18px",
                border: `1px solid ${route.border}`,
                backgroundColor: route.bg,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: route.text,
              }}
            >
              {route.ctaLabel}
              <ArrowRight style={{ width: "11px", height: "11px" }} />
            </Link>

            <button
              type="button"
              onClick={() => { void onResubmit(); }}
              style={{
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.09)",
                padding: "12px 18px",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.34)",
                cursor: "pointer",
              }}
            >
              Submit another matter
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function StrategyRoomPage() {
  const [form, setForm] = React.useState<ConstitutionalIntake>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [canonical, setCanonical] = React.useState<CanonicalSectionsEnvelope | null>(null);
  const [sessionKey, setSessionKey] = React.useState<string | null>(null);
  const [draftSaved, setDraftSaved] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ConstitutionalIntake;
      setForm({ ...INITIAL_FORM, ...parsed });
    } catch {}
  }, []);

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
        setDraftSaved(true);
        window.setTimeout(() => setDraftSaved(false), 900);
      } catch {}
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [form]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function clearDraft() {
    setForm(INITIAL_FORM);
    setCanonical(null);
    setSessionKey(null);
    setError("");
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {}
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

  async function logRecommendationImpressions(
    nextSessionKey: string,
    envelope: CanonicalSectionsEnvelope,
  ) {
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
    if (validationError) {
      setError(validationError);
      return;
    }

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
      if (!guidanceRes.ok) {
        throw new Error(raw?.error || "Decision guidance generation failed.");
      }

      const nextCanonical = raw?.canonical ?? raw?.jsonPayload ?? raw;
      if (!hasCanonicalSections(nextCanonical)) {
        throw new Error("Canonical sections payload missing from guidance API.");
      }

      setCanonical(nextCanonical);
      await logRecommendationImpressions(nextSessionKey, nextCanonical);

      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}

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
      sessionKey,
      routeAfter: "DIAGNOSTIC",
      readinessTierAfter: "EMERGING",
      authorityTypeAfter: posture.authorityType,
      clarityDelta: 0.35,
      authorityDelta: 0.15,
      convertedAfterGuidance: false,
      metadata: {
        action: "resubmit_requested",
        previousConstitution: posture,
      },
      canonical,
    });

    setCanonical(null);
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleMarkDiagnosticStarted() {
    if (!sessionKey || !canonical) return;

    const posture = canonical.sections.constitutionalPosture;

    await trackConversion({
      sessionKey,
      conversionType: "diagnostic_started",
      metadata: { source: "strategy_room_result", constitution: posture },
      canonical,
    });

    await trackFollowup({
      sessionKey,
      routeAfter: "DIAGNOSTIC",
      readinessTierAfter: "EMERGING",
      authorityTypeAfter: posture.authorityType,
      clarityDelta: 0.4,
      authorityDelta: 0.2,
      convertedAfterGuidance: true,
      metadata: {
        action: "diagnostic_started",
        constitutionalSource: true,
      },
      canonical,
    });
  }

  async function handleMarkStrategyAccepted() {
    if (!sessionKey || !canonical) return;

    const posture = canonical.sections.constitutionalPosture;

    await trackConversion({
      sessionKey,
      conversionType: "strategy_path_accepted",
      metadata: { source: "strategy_room_result", constitution: posture },
      canonical,
    });

    await trackFollowup({
      sessionKey,
      routeAfter: "STRATEGY",
      readinessTierAfter: posture.readinessTier,
      authorityTypeAfter: posture.authorityType,
      clarityDelta: 0.2,
      authorityDelta: 0.1,
      convertedAfterGuidance: true,
      metadata: {
        action: "strategy_path_accepted",
        constitutionalSource: true,
      },
      canonical,
    });
  }

  return (
    <Layout
      title="Strategy Room | Abraham of London"
      description="Governed constitutional intelligence for founders, executives, and boards. A controlled intake chamber for consequential matters."
      canonicalUrl="/consulting/strategy-room"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        {!isSubmitting && canonical ? (
          <Verdict
            canonical={canonical}
            onResubmit={handleResubmit}
            onMarkDiagnosticStarted={handleMarkDiagnosticStarted}
            onMarkStrategyAccepted={handleMarkStrategyAccepted}
          />
        ) : null}

        {!isSubmitting && !canonical ? (
          <>
            <section style={{ backgroundColor: VOID, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="mx-auto max-w-5xl px-6 lg:px-12">
                <div className="py-14 lg:py-16">
                  <Eyebrow>Strategy Room · Controlled Intake</Eyebrow>
                  <h1
                    style={{
                      marginTop: "1rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
                      lineHeight: 1.04,
                      letterSpacing: "-0.03em",
                      color: "rgba(255,255,255,0.92)",
                      maxWidth: "22ch",
                    }}
                  >
                    Reserved for situations where a structured product is insufficient and consequence is material.
                  </h1>
                  <div style={{ marginTop: "1.5rem" }}>
                    <GoldRule />
                  </div>
                </div>
              </div>
            </section>

            <QualificationBlock />
            <IntakeForm
              form={form}
              onChange={handleChange}
              onSubmit={handleSubmit}
              onClearDraft={clearDraft}
              isSubmitting={isSubmitting}
              error={error}
              draftSaved={draftSaved}
            />
            <ReviewProcessBlock />
          </>
        ) : null}

        {isSubmitting ? (
          <section style={{ backgroundColor: VOID, minHeight: "100vh" }}>
            <div className="mx-auto max-w-4xl px-6 lg:px-12">
              <div className="py-24 lg:py-28">
                <Eyebrow>Submission in review</Eyebrow>
                <div
                  style={{
                    marginTop: "1rem",
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.48)",
                  }}
                >
                  The system is reading authority, consequence, and route.
                </div>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </Layout>
  );
}
