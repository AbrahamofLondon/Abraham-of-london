/**
 * components/product/OutcomeContributionPanel.tsx
 *
 * Opt-in outcome contribution panel. Shown after a case has been active
 * for sufficient time and a decision has been made.
 *
 * Rules:
 * - Contribution is always explicitly opt-in.
 * - Clear explanation of what is stored (anonymised outcome shape only).
 * - No contribution is made without the user selecting an outcome.
 * - User can retract within 30 days.
 * - Always shows the anonymisation statement before the form.
 *
 * Usage:
 *   <OutcomeContributionPanel caseId={c.caseId} />
 *
 * Placement:
 * - Decision Centre case detail (when case has been open for 30+ days
 *   and no contribution exists)
 */

"use client";

import * as React from "react";
import {
  type OutcomeContributionState,
  type OutcomeContributionTimeToActBand,
} from "@/lib/product/outcome-contribution-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Props ────────────────────────────────────────────────────────────────────

export type OutcomeContributionPanelProps = {
  caseId: string;
  /** If true, the panel is collapsed by default and user must expand */
  collapsed?: boolean;
};

// ─── Form state ───────────────────────────────────────────────────────────────

type FormState = {
  outcomeState: OutcomeContributionState | "";
  timeToAct: OutcomeContributionTimeToActBand | "";
  findingAccurate: boolean | null;
  recommendationUseful: boolean | null;
};

const DEFAULT_FORM: FormState = {
  outcomeState: "",
  timeToAct: "",
  findingAccurate: null,
  recommendationUseful: null,
};

// ─── Label maps ───────────────────────────────────────────────────────────────

const OUTCOME_LABELS: Record<OutcomeContributionState, string> = {
  IMPROVED: "The condition improved",
  RESOLVED: "The condition was fully resolved",
  UNCHANGED: "No meaningful change",
  WORSENED: "The condition worsened",
  ABANDONED: "I did not pursue the governed process",
};

const TIME_LABELS: Record<OutcomeContributionTimeToActBand, string> = {
  IMMEDIATE: "Within 1 week",
  SHORT: "1–4 weeks",
  MEDIUM: "1–3 months",
  LONG: "3+ months",
  DID_NOT_ACT: "I did not act",
};

// ─── Option row ───────────────────────────────────────────────────────────────

function RadioRow<T extends string>({
  options,
  labels,
  value,
  onChange,
}: {
  options: T[];
  labels: Record<T, string>;
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {options.map((opt) => (
        <label
          key={opt}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <input
            type="radio"
            checked={value === opt}
            onChange={() => onChange(opt)}
            style={{ accentColor: GOLD, flexShrink: 0 }}
          />
          <span
            style={{
              ...serif,
              fontSize: "0.9rem",
              color: value === opt ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.48)",
              lineHeight: 1.4,
            }}
          >
            {labels[opt]}
          </span>
        </label>
      ))}
    </div>
  );
}

function BoolRow({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div style={{ display: "flex", gap: "12px" }}>
      {(["Yes", "No"] as const).map((label) => {
        const boolVal = label === "Yes";
        const selected = value === boolVal;
        return (
          <label key={label} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
            <input
              type="radio"
              checked={selected}
              onChange={() => onChange(boolVal)}
              style={{ accentColor: GOLD }}
            />
            <span
              style={{
                ...serif,
                fontSize: "0.9rem",
                color: selected ? "rgba(255,255,255,0.80)" : "rgba(255,255,255,0.45)",
              }}
            >
              {label}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function OutcomeContributionPanel({
  caseId,
  collapsed = true,
}: OutcomeContributionPanelProps) {
  const [expanded, setExpanded] = React.useState(!collapsed);
  const [form, setForm] = React.useState<FormState>(DEFAULT_FORM);
  const [status, setStatus] = React.useState<"idle" | "submitting" | "done" | "error">("idle");
  const [contributionId, setContributionId] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const isValid = form.outcomeState !== "" && form.timeToAct !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    setStatus("submitting");
    setErrorMessage(null);

    try {
      const res = await fetch("/api/cases/contribute-outcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          outcomeState: form.outcomeState,
          timeToAct: form.timeToAct,
          findingAccurate: form.findingAccurate,
          recommendationUseful: form.recommendationUseful,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage((json as { error?: string }).error ?? "Contribution failed");
        return;
      }

      setStatus("done");
      setContributionId((json as { contributionId?: string }).contributionId ?? null);
    } catch {
      setStatus("error");
      setErrorMessage("Network error — could not submit contribution.");
    }
  }

  if (status === "done") {
    return (
      <section
        style={{
          border: `1px solid ${GOLD}22`,
          backgroundColor: `${GOLD}04`,
          padding: "1rem 1.1rem",
        }}
        aria-label="Outcome contribution"
      >
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.20em",
            textTransform: "uppercase",
            color: `${GOLD}88`,
            marginBottom: "0.4rem",
          }}
        >
          Contribution recorded
        </p>
        <p
          style={{
            ...serif,
            fontSize: "0.9rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.55)",
          }}
        >
          Thank you. Your outcome has been recorded anonymously. It will contribute to benchmark context once the pool reaches 50 contributions.
        </p>
        {contributionId && (
          <p
            style={{
              ...mono,
              fontSize: "6.5px",
              letterSpacing: "0.10em",
              color: "rgba(255,255,255,0.20)",
              marginTop: "0.5rem",
            }}
          >
            Contribution ref: {contributionId} · You can retract this within 30 days from your data rights settings.
          </p>
        )}
      </section>
    );
  }

  return (
    <section
      style={{
        border: "1px solid rgba(255,255,255,0.07)",
        backgroundColor: "rgba(255,255,255,0.015)",
        padding: "1rem 1.1rem",
      }}
      aria-label="Outcome contribution"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.28)",
              marginBottom: "0.2rem",
            }}
          >
            Optional · Contribute your outcome
          </p>
          <p
            style={{
              ...serif,
              fontSize: "0.88rem",
              lineHeight: 1.5,
              color: "rgba(255,255,255,0.40)",
            }}
          >
            Help build the benchmark pool. Fully anonymised — no identifying information is stored.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            background: "none",
            border: `1px solid rgba(255,255,255,0.10)`,
            color: "rgba(255,255,255,0.35)",
            padding: "0.35rem 0.7rem",
            cursor: "pointer",
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            flexShrink: 0,
            marginLeft: "1rem",
          }}
        >
          {expanded ? "Hide" : "Contribute"}
        </button>
      </div>

      {expanded && (
        <form onSubmit={handleSubmit} noValidate style={{ marginTop: "1rem" }}>
          {/* Anonymisation statement */}
          <div
            style={{
              border: "1px solid rgba(255,255,255,0.06)",
              backgroundColor: "rgba(255,255,255,0.01)",
              padding: "0.65rem 0.85rem",
              marginBottom: "1.25rem",
            }}
          >
            <p
              style={{
                ...mono,
                fontSize: "6.5px",
                letterSpacing: "0.10em",
                lineHeight: 1.7,
                color: "rgba(255,255,255,0.28)",
              }}
            >
              What is stored: your outcome state, time-to-act band, and accuracy ratings only.
              Your case ID, email, organisation, and decision text are not included.
              Contributions can be retracted within 30 days. The benchmark pool requires 50
              contributions before any aggregate data is shown.
            </p>
          </div>

          {/* Outcome state */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "0.65rem",
              }}
            >
              What happened to the condition?
            </p>
            <RadioRow
              options={["IMPROVED", "RESOLVED", "UNCHANGED", "WORSENED", "ABANDONED"] as OutcomeContributionState[]}
              labels={OUTCOME_LABELS}
              value={form.outcomeState}
              onChange={(v) => setForm((f) => ({ ...f, outcomeState: v }))}
            />
          </div>

          {/* Time to act */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "0.65rem",
              }}
            >
              How quickly did you act?
            </p>
            <RadioRow
              options={["IMMEDIATE", "SHORT", "MEDIUM", "LONG", "DID_NOT_ACT"] as OutcomeContributionTimeToActBand[]}
              labels={TIME_LABELS}
              value={form.timeToAct}
              onChange={(v) => setForm((f) => ({ ...f, timeToAct: v }))}
            />
          </div>

          {/* Finding accuracy */}
          <div style={{ marginBottom: "1rem" }}>
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "0.5rem",
              }}
            >
              Was the system finding accurate? <span style={{ color: "rgba(255,255,255,0.18)" }}>(optional)</span>
            </p>
            <BoolRow
              value={form.findingAccurate}
              onChange={(v) => setForm((f) => ({ ...f, findingAccurate: v }))}
            />
          </div>

          {/* Recommendation usefulness */}
          <div style={{ marginBottom: "1.25rem" }}>
            <p
              style={{
                ...mono,
                fontSize: "7px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
                marginBottom: "0.5rem",
              }}
            >
              Was the recommendation useful? <span style={{ color: "rgba(255,255,255,0.18)" }}>(optional)</span>
            </p>
            <BoolRow
              value={form.recommendationUseful}
              onChange={(v) => setForm((f) => ({ ...f, recommendationUseful: v }))}
            />
          </div>

          {/* Error */}
          {status === "error" && (
            <p
              style={{
                ...mono,
                fontSize: "8px",
                color: "rgba(255,120,120,0.75)",
                marginBottom: "0.75rem",
              }}
            >
              {errorMessage ?? "Submission failed. Please try again."}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!isValid || status === "submitting"}
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              padding: "0.55rem 1.1rem",
              border: isValid ? `1px solid ${GOLD}44` : "1px solid rgba(255,255,255,0.08)",
              backgroundColor: isValid ? `${GOLD}0C` : "transparent",
              color: isValid ? `${GOLD}CC` : "rgba(255,255,255,0.22)",
              cursor: isValid && status !== "submitting" ? "pointer" : "not-allowed",
              opacity: status === "submitting" ? 0.7 : 1,
            }}
          >
            {status === "submitting" ? "Recording…" : "Submit anonymously"}
          </button>

          <p
            style={{
              ...mono,
              fontSize: "6.5px",
              letterSpacing: "0.10em",
              color: "rgba(255,255,255,0.18)",
              marginTop: "0.6rem",
            }}
          >
            Fully anonymised. Retractable within 30 days. No marketing. Not a testimonial.
          </p>
        </form>
      )}
    </section>
  );
}
