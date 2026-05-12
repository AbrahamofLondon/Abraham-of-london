"use client";

import * as React from "react";

import type {
  OutcomeVerificationContext,
  OutcomeVerificationRequest,
} from "@/lib/product/outcome-verification-contract";

type Props = {
  context?: OutcomeVerificationContext | null;
  token?: string | null;
  onRecorded?: (payload: unknown) => void;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type FormState = OutcomeVerificationRequest;

const initialState: FormState = {
  token: null,
  checkpointId: null,
  caseId: null,
  journeyId: null,
  strategyRoomSessionId: null,
  executiveRunId: null,
  didAct: "YES",
  changedState: "IMPROVED",
  whatChanged: "",
  evidenceSummary: "",
  systemDiagnosisAccuracy: "ACCURATE",
  requiredMoveUsefulness: "USEFUL",
  rememberNote: "",
};

export function OutcomeVerificationPanel({ context, token, onRecorded }: Props) {
  const [form, setForm] = React.useState<FormState>({
    ...initialState,
    token: token ?? null,
    checkpointId: context?.checkpointId ?? null,
    caseId: context?.caseId ?? null,
    journeyId: context?.journeyId ?? null,
    strategyRoomSessionId: context?.strategyRoomSessionId ?? null,
    executiveRunId: context?.executiveRunId ?? null,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [recorded, setRecorded] = React.useState<{ calibration?: { accuracyScore?: number; predictionError?: number } | null; evidencePosture?: string } | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setForm((current) => ({
      ...current,
      token: token ?? current.token ?? null,
      checkpointId: context?.checkpointId ?? current.checkpointId ?? null,
      caseId: context?.caseId ?? current.caseId ?? null,
      journeyId: context?.journeyId ?? current.journeyId ?? null,
      strategyRoomSessionId: context?.strategyRoomSessionId ?? current.strategyRoomSessionId ?? null,
      executiveRunId: context?.executiveRunId ?? current.executiveRunId ?? null,
    }));
  }, [context, token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/outcomes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error || "Outcome verification failed.");
      }
      setRecorded({ calibration: data.calibration ?? null, evidencePosture: data.evidencePosture ?? null });
      onRecorded?.(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Outcome verification failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (recorded) {
    const accuracyScore = recorded.calibration?.accuracyScore;
    const calibrationLabel = accuracyScore != null
      ? accuracyScore >= 0.8 ? "High accuracy confirmed"
        : accuracyScore >= 0.5 ? "Partial accuracy recorded"
        : "Accuracy below threshold — finding logged for pattern calibration"
      : null;
    return (
      <section style={{ border: "1px solid rgba(201,169,110,0.20)", background: "rgba(201,169,110,0.03)", padding: "1.1rem" }}>
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
          Outcome Verification — Recorded
        </p>
        <p className="mt-3 text-sm text-white/70">Verification written to institutional record. This evidence is now carried into Decision Centre, Return Brief, and Retained Oversight.</p>
        <div className="mt-4 space-y-2">
          {calibrationLabel && (
            <div style={{ borderLeft: "2px solid rgba(110,231,183,0.40)", paddingLeft: "0.85rem" }}>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(110,231,183,0.60)", marginBottom: "0.25rem" }}>Signal calibration</p>
              <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>{calibrationLabel}</p>
            </div>
          )}
          {recorded.evidencePosture && (
            <div style={{ borderLeft: "2px solid rgba(201,169,110,0.25)", paddingLeft: "0.85rem" }}>
              <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.50)", marginBottom: "0.25rem" }}>Evidence posture</p>
              <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.45)" }}>{recorded.evidencePosture.replace(/_/g, " ").toLowerCase()}</p>
            </div>
          )}
          <div style={{ borderLeft: "2px solid rgba(255,255,255,0.10)", paddingLeft: "0.85rem" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginBottom: "0.25rem" }}>What this contributes</p>
            <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)" }}>
              Your verification feeds into signal accuracy tracking, pattern calibration, and the outcome loop that governs future recommendations. Where accuracy was confirmed, this strengthens the evidence posture for similar conditions. Where accuracy was disputed, the system records a correction signal.
            </p>
          </div>
        </div>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.18)", marginTop: "0.75rem" }}>
          Governed · Outcome verification written · Evidence posture updated
        </p>
      </section>
    );
  }

  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.02)", padding: "1.1rem" }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(201,169,110,0.82)" }}>
            Outcome Verification
          </p>
          <h2 className="mt-2 text-lg text-white">Verify what changed.</h2>
          <p className="mt-2 text-sm text-white/60">
            This writes durable follow-up evidence. It does not claim a verified outcome unless evidence is actually provided.
          </p>
        </div>
        {context?.checkpointTitle ? (
          <div style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.38)", textAlign: "right" }}>
            <div>{context.checkpointTitle}</div>
            {context.dueAt ? <div className="mt-1">Checkpoint due {new Date(context.dueAt).toLocaleDateString("en-GB")}</div> : null}
          </div>
        ) : null}
      </div>
      <div style={{ borderLeft: "2px solid rgba(201,169,110,0.20)", paddingLeft: "0.85rem", marginTop: "1rem", marginBottom: "0.5rem" }}>
        <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(201,169,110,0.50)", marginBottom: "0.25rem" }}>What a verification contributes</p>
        <p style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.38)" }}>
          Accurate outcome data calibrates the system's signal accuracy, updates the institutional record, and strengthens the evidence posture for similar cases. Disputed findings are logged as correction signals and inform future recommendations.
        </p>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <Field label="Did you act?">
          <Select
            value={form.didAct}
            onChange={(value) => setForm((current) => ({ ...current, didAct: value as FormState["didAct"] }))}
            options={[
              ["YES", "Yes"],
              ["PARTIAL", "Partially"],
              ["NO", "No"],
              ["BLOCKED", "Blocked"],
            ]}
          />
        </Field>

        <Field label="What changed?">
          <Select
            value={form.changedState}
            onChange={(value) => setForm((current) => ({ ...current, changedState: value as FormState["changedState"] }))}
            options={[
              ["IMPROVED", "Improved"],
              ["UNCHANGED", "Unchanged"],
              ["WORSENED", "Worsened"],
              ["UNKNOWN", "Too early to tell"],
            ]}
          />
        </Field>

        <Field label="What changed in reality?">
          <textarea
            required
            value={form.whatChanged}
            onChange={(event) => setForm((current) => ({ ...current, whatChanged: event.target.value }))}
            rows={4}
            className="w-full border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            placeholder="Describe the condition now. What moved, what did not, and what became clearer?"
          />
        </Field>

        <Field label="What evidence shows it changed?">
          <textarea
            value={form.evidenceSummary ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, evidenceSummary: event.target.value }))}
            rows={3}
            className="w-full border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            placeholder="Meeting outcome, written confirmation, operating result, blocked dependency, or other evidence."
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Was the system's diagnosis accurate?">
            <Select
              value={form.systemDiagnosisAccuracy}
              onChange={(value) => setForm((current) => ({ ...current, systemDiagnosisAccuracy: value as FormState["systemDiagnosisAccuracy"] }))}
              options={[
                ["ACCURATE", "Accurate"],
                ["PARTIAL", "Partially accurate"],
                ["INACCURATE", "Inaccurate"],
              ]}
            />
          </Field>

          <Field label="Was the required move useful?">
            <Select
              value={form.requiredMoveUsefulness}
              onChange={(value) => setForm((current) => ({ ...current, requiredMoveUsefulness: value as FormState["requiredMoveUsefulness"] }))}
              options={[
                ["USEFUL", "Useful"],
                ["PARTIAL", "Partially useful"],
                ["NOT_USEFUL", "Not useful"],
              ]}
            />
          </Field>
        </div>

        <Field label="What should the system remember?">
          <textarea
            value={form.rememberNote ?? ""}
            onChange={(event) => setForm((current) => ({ ...current, rememberNote: event.target.value }))}
            rows={2}
            className="w-full border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
            placeholder="Memory worth carrying forward into Decision Centre, Return Brief, Oversight, or counsel."
          />
        </Field>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center border border-[#C9A96E]/45 bg-[#C9A96E]/10 px-4 py-3 text-xs uppercase tracking-[0.24em] text-[#C9A96E] disabled:opacity-60"
          style={mono}
        >
          {submitting ? "Recording..." : "Record Outcome"}
        </button>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>
        {label}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-white/10 bg-white/5 px-3 py-3 text-sm text-white outline-none"
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
  );
}

export default OutcomeVerificationPanel;
