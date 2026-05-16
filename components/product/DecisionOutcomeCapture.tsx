/**
 * components/product/DecisionOutcomeCapture.tsx
 *
 * Outcome signal capture component.
 *
 * Shown after: case save, Return Brief, Strategy Room follow-ups,
 * stale alerts, case marked resolved, outcome verification,
 * Executive Report delivery.
 *
 * Asks:
 *   "What happened with this decision?"
 *   "What was the main blocker?"
 *   "What would have made this decision easier?" (optional free text)
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

export type OutcomeSignal =
  | "ACTED"
  | "DELAYED"
  | "BLOCKED"
  | "ABANDONED"
  | "RESOLVED"
  | "WORSENED"
  | "NEEDS_REOPEN";

export type OutcomeBlocker =
  | "AUTHORITY_UNCLEAR"
  | "EVIDENCE_INSUFFICIENT"
  | "STAKEHOLDER_RESISTANCE"
  | "BUDGET_CHANGED"
  | "TIMING_CHANGED"
  | "CAPACITY_MISSING"
  | "RISK_INCREASED"
  | "OTHER";

type DecisionOutcomeCaptureProps = {
  /** The case ID this outcome is for */
  caseId: string;
  /** The surface that triggered this capture */
  source: string;
  /** Called after successful submission */
  onSubmitted?: (signal: OutcomeSignal) => void;
  /** Optional: pre-fill signal (e.g. from context) */
  initialSignal?: OutcomeSignal | null;
};

export default function DecisionOutcomeCapture({
  caseId,
  source,
  onSubmitted,
  initialSignal,
}: DecisionOutcomeCaptureProps) {
  const [signal, setSignal] = React.useState<OutcomeSignal | null>(initialSignal ?? null);
  const [blocker, setBlocker] = React.useState<OutcomeBlocker | null>(null);
  const [freeText, setFreeText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit() {
    if (!signal) return;
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/cases/outcome-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          source,
          signal,
          blocker: blocker ?? undefined,
          freeText: freeText.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(data.error ?? "Submission failed");
      }
      setSubmitted(true);
      onSubmitted?.(signal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div
        style={{
          border: "1px solid rgba(110,231,183,0.20)",
          backgroundColor: "rgba(110,231,183,0.04)",
          padding: "16px",
        }}
      >
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(110,231,183,0.70)",
          }}
        >
          Outcome recorded
        </p>
        <p
          style={{
            fontSize: "13px",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.50)",
            marginTop: "6px",
          }}
        >
          Thank you. This signal improves the governed record and helps the system recognise patterns across cases.
        </p>
      </div>
    );
  }

  const SIGNALS: { value: OutcomeSignal; label: string }[] = [
    { value: "ACTED", label: "I acted" },
    { value: "DELAYED", label: "I delayed" },
    { value: "BLOCKED", label: "I am blocked" },
    { value: "ABANDONED", label: "I abandoned it" },
    { value: "RESOLVED", label: "It resolved" },
    { value: "WORSENED", label: "It got worse" },
    { value: "NEEDS_REOPEN", label: "It needs to be reopened" },
  ];

  const BLOCKERS: { value: OutcomeBlocker; label: string }[] = [
    { value: "AUTHORITY_UNCLEAR", label: "Authority was unclear" },
    { value: "EVIDENCE_INSUFFICIENT", label: "Evidence was insufficient" },
    { value: "STAKEHOLDER_RESISTANCE", label: "Stakeholders resisted" },
    { value: "BUDGET_CHANGED", label: "Budget changed" },
    { value: "TIMING_CHANGED", label: "Timing changed" },
    { value: "CAPACITY_MISSING", label: "Capacity was missing" },
    { value: "RISK_INCREASED", label: "Risk increased" },
    { value: "OTHER", label: "Other" },
  ];

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: "20px",
      }}
    >
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: `${GOLD}88`,
          marginBottom: "16px",
        }}
      >
        Decision outcome
      </p>

      {/* Question 1: What happened */}
      <p
        style={{
          ...serif,
          fontSize: "1rem",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.75)",
          marginBottom: "12px",
        }}
      >
        What happened with this decision?
      </p>
      <div
        style={{
          display: "grid",
          gap: "6px",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          marginBottom: "20px",
        }}
      >
        {SIGNALS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => {
              setSignal(s.value);
              setBlocker(null);
            }}
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: signal === s.value ? "#0A0A0A" : "rgba(255,255,255,0.45)",
              backgroundColor: signal === s.value ? GOLD : "rgba(255,255,255,0.04)",
              border: signal === s.value ? `1px solid ${GOLD}` : "1px solid rgba(255,255,255,0.08)",
              padding: "10px 14px",
              cursor: "pointer",
              textAlign: "center",
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Question 2: Blocker (only if signal is DELAYED, BLOCKED, ABANDONED, WORSENED) */}
      {signal &&
        ["DELAYED", "BLOCKED", "ABANDONED", "WORSENED"].includes(signal) && (
          <>
            <p
              style={{
                ...serif,
                fontSize: "1rem",
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.75)",
                marginBottom: "12px",
              }}
            >
              What was the main blocker?
            </p>
            <div
              style={{
                display: "grid",
                gap: "6px",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                marginBottom: "20px",
              }}
            >
              {BLOCKERS.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setBlocker(b.value)}
                  style={{
                    ...mono,
                    fontSize: "7px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color:
                      blocker === b.value ? "#0A0A0A" : "rgba(255,255,255,0.40)",
                    backgroundColor:
                      blocker === b.value
                        ? GOLD
                        : "rgba(255,255,255,0.03)",
                    border:
                      blocker === b.value
                        ? `1px solid ${GOLD}`
                        : "1px solid rgba(255,255,255,0.06)",
                    padding: "8px 12px",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </>
        )}

      {/* Question 3: Free text */}
      <p
        style={{
          ...serif,
          fontSize: "0.95rem",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.65)",
          marginBottom: "8px",
        }}
      >
        What would have made this decision easier?
      </p>
      <textarea
        value={freeText}
        onChange={(e) => setFreeText(e.target.value)}
        placeholder="Optional improvement feedback only. Do not include names, confidential client details, or sensitive personal information."
        rows={2}
        style={{
          width: "100%",
          backgroundColor: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "rgba(255,255,255,0.70)",
          padding: "10px 14px",
          fontSize: "13px",
          lineHeight: 1.6,
          fontFamily: "inherit",
          resize: "vertical",
          marginBottom: "16px",
          boxSizing: "border-box",
        }}
      />

      {/* Submit */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!signal || submitting}
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: !signal || submitting ? "rgba(255,255,255,0.20)" : "#0A0A0A",
            backgroundColor:
              !signal || submitting ? "rgba(255,255,255,0.06)" : GOLD,
            padding: "10px 20px",
            border: "none",
            cursor: !signal || submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting..." : "Record outcome"}
        </button>
        {error && (
          <p
            style={{
              fontSize: "11px",
              lineHeight: 1.5,
              color: "rgba(252,165,165,0.70)",
            }}
          >
            {error}
          </p>
        )}
      </div>

      <p
        style={{
          marginTop: "12px",
          fontSize: "10px",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.20)",
        }}
      >
        Structured outcome signals are anonymised and used to improve pattern recognition across governed cases. Optional feedback is not attached to benchmark context or decision-vector logic.
      </p>
    </div>
  );
}
