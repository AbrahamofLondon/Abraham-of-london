import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import { track } from "@/lib/analytics/track";
import {
  computeDecisionDelayExposure,
  type ExposureType,
  type EstimateConfidence,
  type DecisionDelayExposureResult,
} from "@/lib/tools/decision-delay-exposure-calculator";

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

// ─── Page ─────────────────────────────────────────────────────────────────────

type FormState = {
  decisionLabel: string;
  weeklyCostRaw: string;
  delayWeeksRaw: string;
  exposureType: ExposureType;
  estimateConfidence: EstimateConfidence;
};

const DEFAULT_FORM: FormState = {
  decisionLabel: "",
  weeklyCostRaw: "",
  delayWeeksRaw: "",
  exposureType: "revenue",
  estimateConfidence: "rough",
};

export default function DecisionDelayExposurePage() {
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [result, setResult] = React.useState<DecisionDelayExposureResult | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    track("decision_delay_exposure_page_view");
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
      exposureType: form.exposureType,
      estimateConfidence: form.estimateConfidence,
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
  }

  const isValid =
    form.weeklyCostRaw.trim() !== "" &&
    !isNaN(parseFloat(form.weeklyCostRaw));

  return (
    <Layout
      title="Decision Delay Exposure Calculator"
      description="Estimate the financial and structural cost of a deferred decision. No sign-up required. Scenario estimates only."
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
        <div style={{ maxWidth: "620px", margin: "0 auto", padding: "0 24px" }}>

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
            Decision delay exposure calculator
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
            Convert decision delay into estimated financial and structural exposure.
            No account required. Scenario estimates only — not financial advice.
          </p>

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
                  Calculate exposure
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
                  Scenario exposure — at current weekly rate
                </p>
                <div style={{ display: "grid", gap: "20px" }}>
                  <ExposureBand period="7 days" formatted={result.sevenDayFormatted} intensity={0.45} />
                  <ExposureBand period="30 days" formatted={result.thirtyDayFormatted} intensity={0.65} />
                  <ExposureBand period="90 days" formatted={result.ninetyDayFormatted} intensity={0.90} />
                </div>
              </section>

              {/* Exposure statement */}
              <section
                style={{
                  border: `1px solid ${GOLD}18`,
                  backgroundColor: `${GOLD}05`,
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
                    color: `${GOLD}70`,
                    marginBottom: "12px",
                  }}
                >
                  Exposure assessment
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "16px",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  {result.exposureStatement}
                </p>
              </section>

              {/* Structural consequence */}
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
                  Structural consequence
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "16px",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  {result.structuralConsequence}
                </p>
              </section>

              {/* Recommended next move */}
              <section
                style={{
                  border: "1px solid rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.02)",
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
                    color: "rgba(255,255,255,0.28)",
                    marginBottom: "12px",
                  }}
                >
                  Recommended next move
                </p>
                <p
                  style={{
                    ...serif,
                    fontSize: "16px",
                    lineHeight: 1.75,
                    color: "rgba(255,255,255,0.72)",
                  }}
                >
                  {result.recommendedNextMove}
                </p>
              </section>

              {/* CTA */}
              <section style={{ marginBottom: "40px" }}>
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
                  Identify what is blocking the decision →
                </Link>
                <p
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.28)",
                    marginTop: "10px",
                  }}
                >
                  Fast Diagnostic · No sign-up required
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
              This calculator is a public entry surface within the Abraham of London decision-governance system.
              It does not require an account, does not store your inputs, and does not produce financial advice.
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
