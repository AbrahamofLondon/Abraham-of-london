import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SaveCaseConversionPanel from "@/components/product/SaveCaseConversionPanel";
import SurfaceBoundaryPanel from "@/components/product/SurfaceBoundaryPanel";
import { track } from "@/lib/analytics/track";
import { trackLaunch } from "@/lib/analytics/client-launch-events";
import {
  buildDecisionDelaySendToSelfPayload,
  computeDecisionDelayExposure,
  type DecisionState,
  type ExposureType,
  type EstimateConfidence,
  type DecisionDelayExposureResult,
} from "@/lib/tools/decision-delay-exposure-calculator";
import { buildDelayCalculatorCarryForwardPayload } from "@/lib/product/session-case-continuity";
import CommercialExposurePanel from "@/components/diagnostics/CommercialExposurePanel";
import type { CommercialExposure } from "@/components/diagnostics/CommercialExposurePanel";

// ─── Design tokens ────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function GoldDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}28 20%, ${GOLD}28 80%, transparent 100%)`,
        margin: "56px 0",
      }}
    />
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: `${GOLD}80`,
        marginBottom: "8px",
      }}
    >
      {children}
    </p>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#EAEAEA",
  padding: "10px 12px",
  ...mono,
  fontSize: "13px",
  outline: "none",
  boxSizing: "border-box",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: "pointer",
  appearance: "none",
};

// ─── Exposure band card ───────────────────────────────────────────────────────

function ExposureBand({
  period,
  formatted,
  intensity,
}: {
  period: string;
  formatted: string;
  intensity: number; // 0..1 for gold opacity
}) {
  return (
    <div
      style={{
        borderLeft: `2px solid ${GOLD}${Math.round(intensity * 80).toString(16).padStart(2, "0")}`,
        paddingLeft: "18px",
        paddingTop: "4px",
        paddingBottom: "4px",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}90`,
        }}
      >
        {period}
      </p>
      <p
        style={{
          ...mono,
          fontSize: "22px",
          letterSpacing: "0.04em",
          color: "#EAEAEA",
          marginTop: "4px",
        }}
      >
        {formatted}
      </p>
    </div>
  );
}

function ReadingField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.30)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          ...mono,
          fontSize: "14px",
          letterSpacing: "0.05em",
          color: "#F5F5F5",
        }}
      >
        {value}
      </p>
    </div>
  );
}

function ReadingParagraph({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: "16px" }}>
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.30)",
          marginBottom: "6px",
        }}
      >
        {label}
      </p>
      <p
        style={{
          ...serif,
          fontSize: "16px",
          lineHeight: 1.7,
          color: "rgba(255,255,255,0.68)",
        }}
      >
        {children}
      </p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormState = {
  decisionLabel: string;
  decisionState: DecisionState;
  weeklyCostRaw: string;
  delayWeeksRaw: string;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
};

const DEFAULT_FORM: FormState = {
  decisionLabel: "",
  decisionState: "not_yet_decided",
  weeklyCostRaw: "",
  delayWeeksRaw: "",
  exposureType: "revenue",
  estimateConfidence: "rough",
};

const CALCULATOR_STORAGE_KEY = "aol_decision_delay_exposure";

type CalculatorPersisted = {
  weeklyCost: number;
  delayWeeks: number;
  decisionState: DecisionState;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
  calculatedAt: string;
};

function persistCalculatorResult(
  weeklyCost: number,
  delayWeeks: number,
  decisionState: DecisionState,
  exposureType: ExposureType,
  estimateConfidence: EstimateConfidence,
): void {
  try {
    const data: CalculatorPersisted = {
      weeklyCost,
      delayWeeks,
      decisionState,
      exposureType,
      estimateConfidence,
      calculatedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(CALCULATOR_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // sessionStorage unavailable
  }
}

export default function DecisionDelayExposurePage() {
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = React.useState<DecisionDelayExposureResult | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    track("decision_delay_exposure_page_view");
    // Restore persisted calculator values on mount
    try {
      const raw = sessionStorage.getItem(CALCULATOR_STORAGE_KEY);
      if (raw) {
        const persisted: CalculatorPersisted = JSON.parse(raw);
        if (persisted && typeof persisted.weeklyCost === "number") {
          setForm((prev) => ({
            ...prev,
            weeklyCostRaw: String(persisted.weeklyCost),
            delayWeeksRaw: String(persisted.delayWeeks),
            decisionState: persisted.decisionState ?? "not_yet_decided",
            exposureType: persisted.exposureType,
            estimateConfidence: persisted.estimateConfidence,
          }));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const weeklyCost = parseFloat(form.weeklyCostRaw) || 0;
    const delayWeeks = parseFloat(form.delayWeeksRaw) || 0;

    const calculated = computeDecisionDelayExposure({
      weeklyCost,
      delayWeeks,
      decisionState: form.decisionState,
      exposureType: form.exposureType,
      estimateConfidence: form.estimateConfidence,
    });

    // Persist calculator inputs for carry-forward
    persistCalculatorResult(
      weeklyCost,
      delayWeeks,
      form.decisionState,
      form.exposureType,
      form.estimateConfidence,
    );

    // Adoption instrumentation
    trackLaunch("calculator_completed", "decision_delay_calculator");
    track("calculator_completed", {
      exposure_type: form.exposureType,
      estimate_confidence: form.estimateConfidence,
      decision_state: form.decisionState,
    });

    // Track without raw user text
    track("decision_delay_exposure_calculated", {
      exposure_type: form.exposureType,
      estimate_confidence: form.estimateConfidence,
      delay_weeks: delayWeeks,
      has_label: form.decisionLabel.trim().length > 0 ? "yes" : "no",
    });

    setResult(calculated);
    setSubmitted(true);
  }

  function handleReset() {
    setForm(DEFAULT_FORM);
    setResult(null);
    setSubmitted(false);
    try {
      sessionStorage.removeItem(CALCULATOR_STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  const isValid =
    form.weeklyCostRaw.trim() !== "" &&
    !isNaN(parseFloat(form.weeklyCostRaw));

  return (
    <Layout
      title="Decision Delay Exposure Instrument"
      description="Estimate the financial drag, structural consequence, and governance pressure created by a deferred decision. Scenario estimates only — not financial advice."
      canonicalUrl="/tools/decision-delay-exposure"
    >
      <Head>
        <meta name="robots" content="index,follow" />
      </Head>

      <main
        style={{
          backgroundColor: "#030305",
          minHeight: "100vh",
          color: "#F5F5F5",
          paddingTop: "120px",
          paddingBottom: "96px",
        }}
      >
        <div style={{ maxWidth: "620px", margin: "0 auto", padding: "0" }}>

          {/* ─── Header ─────────────────────────────────────────────────── */}
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: `${GOLD}70`,
              marginBottom: "24px",
            }}
          >
            Tools · Decision Delay Exposure
          </p>

          <h1
            style={{
              ...serif,
              fontSize: "clamp(28px, 5vw, 44px)",
              lineHeight: 1.1,
              color: "#F5F5F5",
              marginBottom: "16px",
            }}
          >
            Decision Delay Exposure Instrument
          </h1>

          <p
            style={{
              ...serif,
              fontSize: "17px",
              lineHeight: 1.75,
              color: "rgba(255,255,255,0.55)",
              marginBottom: "40px",
            }}
          >
            Estimate the financial drag, structural consequence, and governance pressure created by a deferred decision.
            Scenario estimates only — not financial advice.
          </p>

          <SurfaceBoundaryPanel
            surfaceType="PUBLIC_INSTRUMENT"
            recordCreated="No governed case or retained decision record is created by this estimate."
            systemReads={[
              "Stated financial exposure",
              "Decision state",
              "Delay duration and governance pressure",
            ]}
            nextAction={{ label: "Run the Fast Diagnostic", href: "/diagnostics/fast" }}
            secondaryAction={{ label: "Open Decision Centre", href: "/decision-centre" }}
          />

          <GoldDivider />

          {/* ─── Form ───────────────────────────────────────────────────── */}
          {!submitted && (
            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

                <div>
                  <FieldLabel>Decision being delayed (optional)</FieldLabel>
                  <input
                    name="decisionLabel"
                    type="text"
                    value={form.decisionLabel}
                    onChange={handleChange}
                    placeholder="e.g. Whether to restructure the leadership team"
                    style={inputStyle}
                    autoComplete="off"
                  />
                  <p
                    style={{
                      ...mono,
                      fontSize: "7px",
                      letterSpacing: "0.14em",
                      color: "rgba(255,255,255,0.22)",
                      marginTop: "6px",
                    }}
                  >
                    Used for display only. Not stored or transmitted.
                  </p>
                </div>

                <div>
                  <FieldLabel>What best describes the decision?</FieldLabel>
                  <select
                    name="decisionState"
                    value={form.decisionState}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="not_yet_decided">Not yet decided</option>
                    <option value="decided_not_executed">Decided but not executed</option>
                    <option value="repeatedly_revisited">Repeatedly revisited</option>
                    <option value="blocked_by_authority">Blocked by authority</option>
                    <option value="blocked_by_evidence">Blocked by evidence</option>
                    <option value="blocked_by_stakeholder_alignment">Blocked by stakeholder alignment</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Weekly cost of delay (£)</FieldLabel>
                  <input
                    name="weeklyCostRaw"
                    type="number"
                    min="0"
                    step="1"
                    value={form.weeklyCostRaw}
                    onChange={handleChange}
                    placeholder="e.g. 5000"
                    style={inputStyle}
                    required
                  />
                  <p
                    style={{
                      ...mono,
                      fontSize: "7px",
                      letterSpacing: "0.14em",
                      color: "rgba(255,255,255,0.22)",
                      marginTop: "6px",
                    }}
                  >
                    Estimated cost per week while the decision remains open.
                  </p>
                </div>

                <div>
                  <FieldLabel>Weeks already delayed (optional)</FieldLabel>
                  <input
                    name="delayWeeksRaw"
                    type="number"
                    min="0"
                    step="1"
                    value={form.delayWeeksRaw}
                    onChange={handleChange}
                    placeholder="e.g. 3"
                    style={inputStyle}
                  />
                </div>

                <div>
                  <FieldLabel>Exposure type</FieldLabel>
                  <select
                    name="exposureType"
                    value={form.exposureType}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="revenue">Revenue</option>
                    <option value="operating_cost">Operating cost</option>
                    <option value="compliance">Compliance</option>
                    <option value="opportunity">Opportunity</option>
                    <option value="reputation">Reputation</option>
                    <option value="execution">Execution</option>
                  </select>
                </div>

                <div>
                  <FieldLabel>Estimate confidence</FieldLabel>
                  <select
                    name="estimateConfidence"
                    value={form.estimateConfidence}
                    onChange={handleChange}
                    style={selectStyle}
                  >
                    <option value="rough">Rough — order of magnitude only</option>
                    <option value="known">Known — based on actual data</option>
                    <option value="board_estimate">Board estimate — formally agreed figure</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!isValid}
                  style={{
                    padding: "14px 28px",
                    backgroundColor: isValid ? GOLD : "rgba(201,169,110,0.25)",
                    color: isValid ? "#0B0B0B" : "rgba(255,255,255,0.30)",
                    border: "none",
                    cursor: isValid ? "pointer" : "not-allowed",
                    ...mono,
                    fontSize: "9px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                    fontWeight: 600,
                    minHeight: "44px",
                    transition: "background-color 0.2s",
                    alignSelf: "flex-start",
                  }}
                >
                  Generate exposure reading
                </button>
              </div>
            </form>
          )}

          {/* ─── Result ─────────────────────────────────────────────────── */}
          {submitted && result && (
            <div>
              {form.decisionLabel && (
                <div
                  style={{
                    borderLeft: `2px solid ${GOLD}30`,
                    paddingLeft: "18px",
                    marginBottom: "40px",
                  }}
                >
                  <p
                    style={{
                      ...mono,
                      fontSize: "7px",
                      letterSpacing: "0.20em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.28)",
                      marginBottom: "6px",
                    }}
                  >
                    Decision
                  </p>
                  <p
                    style={{
                      ...serif,
                      fontSize: "17px",
                      lineHeight: 1.6,
                      color: "rgba(255,255,255,0.80)",
                      fontStyle: "italic",
                    }}
                  >
                    &ldquo;{form.decisionLabel}&rdquo;
                  </p>
                </div>
              )}

              {/* Governed reading */}
              <section
                style={{
                  border: `1px solid ${GOLD}30`,
                  backgroundColor: `${GOLD}07`,
                  padding: "24px",
                  marginBottom: "40px",
                }}
              >
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: `${GOLD}70`,
                    marginBottom: "12px",
                  }}
                >
                  Decision Exposure Reading
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "18px",
                    marginBottom: "24px",
                  }}
                >
                  <ReadingField label="Decision State" value={result.decisionStateLabel} />
                  <ReadingField label="30-day exposure" value={result.thirtyDayFormatted} />
                  <ReadingField label="Governance Pressure" value={result.governancePressureBand} />
                  <ReadingField label="Record status" value={result.recordStatus} />
                </div>
                <ReadingParagraph label="Financial exposure">
                  {result.financialExposure}
                </ReadingParagraph>
                <ReadingParagraph label="Structural exposure">
                  {result.structuralExposure}
                </ReadingParagraph>
                <ReadingParagraph label="Governance exposure">
                  {result.governanceExposure}
                </ReadingParagraph>
                <ReadingParagraph label="Required next move">
                  {result.requiredNextMove}
                </ReadingParagraph>
                <p
                  style={{
                    ...serif,
                    fontSize: "16px",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.72)",
                    marginTop: "20px",
                  }}
                >
                  <span style={{ color: "#F5F5F5" }}>
                    Governance Pressure: {result.governancePressureBand}.
                  </span>{" "}
                  {result.governancePressureExplanation}
                </p>
              </section>

              {/* Exposure bands */}
              <section style={{ marginBottom: "40px" }}>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                    marginBottom: "24px",
                  }}
                >
                  Scenario exposure timeline — at current weekly rate
                </p>
                <div style={{ display: "grid", gap: "20px" }}>
                  <ExposureBand period="7 days" formatted={result.sevenDayFormatted} intensity={0.45} />
                  <ExposureBand period="30 days" formatted={result.thirtyDayFormatted} intensity={0.65} />
                  <ExposureBand period="90 days" formatted={result.ninetyDayFormatted} intensity={0.90} />
                </div>
              </section>

              {/* Commercial exposure — user-reported basis since user supplied weekly cost */}
              {(() => {
                const weeklyCost = parseFloat(form.weeklyCostRaw) || 0;
                const delayWeeks = parseFloat(form.delayWeeksRaw) || 0;
                const hasUserCost = weeklyCost > 0;
                if (!hasUserCost) return null;
                const costToDate =
                  delayWeeks > 0
                    ? `£${(weeklyCost * delayWeeks).toLocaleString("en-GB", { maximumFractionDigits: 0 })}`
                    : null;
                const exposure: CommercialExposure = {
                  costToDate,
                  avoidableThirtyDayExposure: result.thirtyDayFormatted,
                  basis: "USER_REPORTED",
                  disclaimer: result.disclaimer,
                };
                return (
                  <div style={{ marginBottom: "40px" }}>
                    <CommercialExposurePanel exposure={exposure} />
                  </div>
                );
              })()}

              {/* What the system sees */}
              <section
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  padding: "24px",
                  marginBottom: "32px",
                }}
              >
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                    marginBottom: "12px",
                  }}
                >
                  What the system sees
                </p>
                <ReadingParagraph label="Signal">{result.whatSystemSees.signal}</ReadingParagraph>
                <ReadingParagraph label="Likely pressure point">
                  {result.whatSystemSees.likelyPressurePoint}
                </ReadingParagraph>
                <ReadingParagraph label="Governance move">
                  {result.whatSystemSees.governanceMove}
                </ReadingParagraph>
              </section>

              {/* Exposure statement */}
              <section style={{ marginBottom: "32px" }}>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.22em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.30)",
                    marginBottom: "12px",
                  }}
                >
                  Scenario estimate
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "16px",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {result.exposureStatement}
                </p>
              </section>

              {/* CTA */}
              <section style={{ marginBottom: "40px" }}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
                  <Link
                    href={result.ctaHref}
                    style={{
                      display: "inline-block",
                      padding: "14px 28px",
                      backgroundColor: GOLD,
                      color: "#0B0B0B",
                      textDecoration: "none",
                      ...mono,
                      fontSize: "9px",
                      letterSpacing: "0.20em",
                      textTransform: "uppercase",
                      fontWeight: 600,
                      minHeight: "44px",
                    }}
                  >
                    Run the Fast Diagnostic
                  </Link>
                  <a
                    href="#save-exposure-estimate"
                    style={{
                      display: "inline-block",
                      padding: "13px 20px",
                      border: `1px solid ${GOLD}45`,
                      color: `${GOLD}DD`,
                      textDecoration: "none",
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                      minHeight: "44px",
                      boxSizing: "border-box",
                    }}
                  >
                    Save this exposure estimate
                  </a>
                  <a
                    href="#send-to-self"
                    style={{
                      display: "inline-block",
                      padding: "13px 0",
                      color: "rgba(255,255,255,0.42)",
                      textDecoration: "none",
                      ...mono,
                      fontSize: "8px",
                      letterSpacing: "0.18em",
                      textTransform: "uppercase",
                    }}
                  >
                    Send to self
                  </a>
                </div>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.28)",
                    marginTop: "10px",
                  }}
                >
                  Preserve continuity only when it is earned: diagnose first, save when you need the case retained.
                </p>
              </section>

              {/* Disclaimer */}
              <section
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  paddingTop: "24px",
                  marginBottom: "32px",
                }}
              >
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.22)",
                    lineHeight: 1.75,
                  }}
                >
                  {result.disclaimer}
                </p>
              </section>

              {/* Reset */}
              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: "none",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "rgba(255,255,255,0.35)",
                  padding: "10px 20px",
                  cursor: "pointer",
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  minHeight: "44px",
                }}
              >
                Run another calculation
              </button>

              {/* Record boundary */}
              <section
                style={{
                  marginTop: "32px",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.015)",
                  padding: "16px 20px",
                }}
              >
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.28)",
                    marginBottom: "6px",
                  }}
                >
                  Record status: {result.recordStatus}
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "14px",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.40)",
                  }}
                >
                  {result.recordBoundary}
                </p>
              </section>

              {/* Send to self */}
              <div id="send-to-self">
                <SendToSelfCalculator
                  weeklyCost={parseFloat(form.weeklyCostRaw) || 0}
                  delayWeeks={parseFloat(form.delayWeeksRaw) || 0}
                  exposureType={form.exposureType}
                  result={result}
                />
              </div>

              <div id="save-exposure-estimate" style={{ marginTop: "16px" }}>
                <SaveCaseConversionPanel
                  payload={buildDelayCalculatorCarryForwardPayload({
                    weeklyCost: parseFloat(form.weeklyCostRaw) || 0,
                    delayWeeks: parseFloat(form.delayWeeksRaw) || 0,
                    decisionState: form.decisionState,
                    exposureType: form.exposureType,
                    estimateConfidence: form.estimateConfidence,
                  })}
                  surface="decision_delay"
                  evidenceState="basic"
                />
              </div>
            </div>
          )}

          <GoldDivider />

          {/* ─── Footer context ──────────────────────────────────────────── */}
          <section>
            <p
              style={{
                ...serif,
                fontSize: "15px",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.35)",
                fontStyle: "italic",
              }}
            >
              This instrument is a public entry surface within the Abraham of London decision-governance system.
              It does not require an account, does not store your optional decision text, and does not produce financial advice.
              All figures are scenario estimates derived from your stated inputs.
            </p>
          </section>

          <GoldDivider />

          {/* ─── Related surfaces ──────────────────────────────────────────── */}
          <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.01)", padding: "1rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.75rem" }}>
              Next steps
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/diagnostics/fast"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}
              >
                Run the Fast Diagnostic
              </Link>
              <Link
                href="/provenance/sample-export"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}AA`, border: `1px solid ${GOLD}25`, padding: "0.4rem 0.8rem", textDecoration: "none" }}
              >
                View sample provenance summary
              </Link>
            </div>
          </section>

        </div>
      </main>
    </Layout>
  );
}

function SendToSelfCalculator({
  weeklyCost,
  delayWeeks,
  exposureType,
  result,
}: {
  weeklyCost: number;
  delayWeeks: number;
  exposureType: ExposureType;
  result: DecisionDelayExposureResult;
}) {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSend() {
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    const payload = buildDecisionDelaySendToSelfPayload({
      weeklyCost,
      delayWeeks,
      exposureType,
      result,
    });
    setStatus("sending");
    try {
      const response = await fetch("/api/tools/send-to-self", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmed,
          source: "decision_delay_calculator",
          content: payload,
        }),
      });
      const json = await response.json();
      if (json.ok) {
        setStatus("sent");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <section style={{ marginTop: "16px", borderLeft: `2px solid rgba(110,231,183,0.25)`, backgroundColor: "rgba(110,231,183,0.02)", padding: "12px 16px" }}>
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(110,231,183,0.55)" }}>
          Sent. Check your inbox.
        </p>
        <p style={{ ...serif, fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginTop: "4px" }}>
          This does not create a governed case. To carry this forward, run the Fast Diagnostic.
        </p>
      </section>
    );
  }

  return (
    <section style={{ marginTop: "16px", border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "14px 18px" }}>
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "8px" }}>
        Send to self
      </p>
      <p style={{ ...serif, fontSize: "13px", lineHeight: 1.6, color: "rgba(255,255,255,0.40)", marginBottom: "10px" }}>
        We will send this result to the email you provide. This does not create a governed case unless you create an account.
      </p>
      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          placeholder="your@email.com"
          autoComplete="email"
          style={{
            flex: 1,
            padding: "10px 12px",
            border: "1px solid rgba(255,255,255,0.10)",
            backgroundColor: "transparent",
            color: "rgba(255,255,255,0.80)",
            ...mono,
            fontSize: "12px",
            outline: "none",
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={status === "sending" || !email.trim()}
          style={{
            padding: "10px 16px",
            border: `1px solid ${GOLD}40`,
            backgroundColor: `${GOLD}10`,
            color: `${GOLD}CC`,
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            cursor: status === "sending" ? "wait" : "pointer",
            opacity: status === "sending" ? 0.7 : 1,
            flexShrink: 0,
            minHeight: "40px",
          }}
        >
          {status === "sending" ? "Sending..." : "Send"}
        </button>
      </div>
      {status === "error" && (
        <p style={{ marginTop: "8px", fontSize: "12px", color: "rgba(252,165,165,0.55)" }}>
          Could not send. Try again later.
        </p>
      )}
      <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.16)", marginTop: "8px" }}>
        No marketing. No account created. One email only.
      </p>
    </section>
  );
}
