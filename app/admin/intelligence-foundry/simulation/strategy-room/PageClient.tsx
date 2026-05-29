// app/admin/intelligence-foundry/simulation/strategy-room/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SimulationShell } from "@/components/research/SimulationShell";
import { FindingsList } from "@/components/research/FindingsList";
import { FormulaInspector } from "@/components/research/FormulaInspector";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

type ScoreBreakdown = {
  total: number;
  max: number;
  threshold: number;
  gatesPassed: boolean;
  components: Record<string, number>;
  failureReasons: string[];
};

const AUTHORITY_OPTIONS = [
  { value: "Yes, fully", label: "Yes, fully" },
  { value: "Yes, with board approval", label: "Yes, with board approval" },
  { value: "No", label: "No" },
];

const YES_NO_OPTIONS = [
  { value: "Yes", label: "Yes" },
  { value: "No", label: "No" },
];

const DEFAULT_FORM = {
  authority: { role: "Chief Executive", hasAuthority: "Yes, fully" as const, mandate: "Full board mandate to resolve the growth ceiling decision and restructure the executive team within Q3." },
  decision: { statement: "We must decide whether to restructure the leadership team and delegate full P&L ownership to regional directors within the next 90 days, or pause expansion until the current authority structure is resolved.", type: "structural", stuckReasons: "Authority ambiguity, Board alignment uncertainty, Resource conflicts" },
  constraints: { avoidedTradeOff: "Cannot trade governance clarity for short-term revenue. The cost of authority ambiguity now exceeds the risk of restructuring.", unacceptableOutcome: "Another 90 days of drift without a named decision owner." },
  timeCost: { costOfDelay: "£30k/month in execution overhead, Senior talent attrition risk", affected: "Leadership team and regional directors", breaksFirst: "Regional director confidence breaks first." },
  readiness: { readyForUnpleasantDecision: "Yes" as "Yes" | "No", willingAccountability: "Yes" as "Yes" | "No", whyNow: "The board has set a Q3 milestone. We are 60 days from it and the authority question is unresolved." },
  declarationAccepted: true,
};

export default function StrategyRoomSimulatorPage() {
  const [form, setForm] = React.useState(DEFAULT_FORM);
  const [useWeakFixture, setUseWeakFixture] = React.useState(false);
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [formulaSteps, setFormulaSteps] = React.useState<FormulaStep[]>([]);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [score, setScore] = React.useState<ScoreBreakdown | null>(null);
  const [limitations, setLimitations] = React.useState<string[]>([]);
  const [functionsCalled, setFunctionsCalled] = React.useState<string[]>([]);
  const [stagesNotCalled, setStagesNotCalled] = React.useState<string[]>([]);
  const [running, setRunning] = React.useState(false);
  const [hasOutput, setHasOutput] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setSaveMsg(null);

    const payload = useWeakFixture
      ? { useWeakFixture: true }
      : {
          authority: {
            role: form.authority.role,
            hasAuthority: form.authority.hasAuthority,
            mandate: form.authority.mandate,
          },
          decision: {
            statement: form.decision.statement,
            type: form.decision.type,
            stuckReasons: form.decision.stuckReasons.split(",").map((s) => s.trim()).filter(Boolean),
          },
          constraints: {
            avoidedTradeOff: form.constraints.avoidedTradeOff,
            unacceptableOutcome: form.constraints.unacceptableOutcome,
          },
          timeCost: {
            costOfDelay: form.timeCost.costOfDelay.split(",").map((s) => s.trim()).filter(Boolean),
            affected: form.timeCost.affected,
            breaksFirst: form.timeCost.breaksFirst,
          },
          readiness: {
            readyForUnpleasantDecision: form.readiness.readyForUnpleasantDecision,
            willingAccountability: form.readiness.willingAccountability,
            whyNow: form.readiness.whyNow,
          },
          declarationAccepted: form.declarationAccepted,
        };

    try {
      const res = await fetch("/api/admin/intelligence-foundry/engines/strategy-room/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Engine run failed");
        setRunning(false);
        return;
      }

      setFindings(data.findings ?? []);
      setFormulaSteps(data.formulaSteps ?? []);
      setSummary(data.summary ?? null);
      setScore(data.score ?? null);
      setLimitations(data.limitations ?? []);
      setFunctionsCalled(data.productionFunctionsCalled ?? []);
      setStagesNotCalled(data.pipelineStagesNotCalled ?? []);
      setHasOutput(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    }

    setRunning(false);
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/admin/intelligence-foundry/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Strategy Room Simulation — ${new Date().toLocaleString("en-GB")}`,
          slug: `sr-sim-${Date.now()}`,
          runType: "SCENARIO",
          module: "scenario-workbench",
          moduleVersion: "1.0.0",
          inputJson: JSON.stringify({ form, useWeakFixture }),
          outputJson: JSON.stringify({ findings, summary, score }),
          findingsJson: JSON.stringify(findings),
          severity: findings.some((f) => f.severity === "CRITICAL")
            ? "CRITICAL"
            : findings.some((f) => f.severity === "HIGH")
              ? "HIGH"
              : findings.some((f) => f.severity === "MEDIUM")
                ? "MEDIUM"
                : "INFO",
          status: "COMPLETE",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSaveMsg(`Saved as ResearchRun: ${data.run?.id ?? "unknown"}`);
      } else {
        setSaveMsg(`Save failed: ${data.error ?? "unknown"}`);
      }
    } catch (err) {
      setSaveMsg(`Save error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  };

  const resetForm = () => {
    setForm(DEFAULT_FORM);
    setUseWeakFixture(false);
    setFindings([]);
    setFormulaSteps([]);
    setSummary(null);
    setScore(null);
    setLimitations([]);
    setFunctionsCalled([]);
    setStagesNotCalled([]);
    setHasOutput(false);
    setSaveMsg(null);
    setError(null);
  };

  const scoreColor = score
    ? score.total >= score.threshold
      ? "text-emerald-400"
      : score.total >= score.threshold / 2
        ? "text-amber-400"
        : "text-red-400"
    : "text-white/40";

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Strategy Room Simulator</h1>
        <p className="text-sm text-white/35 max-w-xl">
          Dry-run the Strategy Room intake scoring and gate evaluation against synthetic inputs.
          Runs real production logic: 8-component weighted scoring, authority gates, and decision directive derivation.
          No intake is archived. No notifications sent.
        </p>
        <p className="mt-1 text-xs text-amber-400/40 font-mono">
          Dry-run only. No session is created. No case records mutated.
        </p>
      </div>

      <SimulationShell
        title="Strategy Room — Intake Gate"
        moduleId="scenario-workbench"
        engineStatus="PRODUCTION_CALLABLE"
        onRun={handleRun}
        onSave={handleSave}
        running={running}
        hasOutput={hasOutput}
        inputsSlot={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Fixture Mode</p>
              <button onClick={resetForm} className="text-[10px] text-white/25 hover:text-white/45 font-mono">
                Reset
              </button>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setUseWeakFixture(false)}
                className={`rounded border px-2 py-1 text-[10px] font-mono transition-colors ${!useWeakFixture ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" : "border-white/10 text-white/25"}`}
              >
                Strong (passes threshold)
              </button>
              <button
                onClick={() => setUseWeakFixture(true)}
                className={`rounded border px-2 py-1 text-[10px] font-mono transition-colors ${useWeakFixture ? "border-red-500/30 text-red-400 bg-red-500/5" : "border-white/10 text-white/25"}`}
              >
                Weak (authority=No, below threshold)
              </button>
            </div>

            {!useWeakFixture && (
              <div className="space-y-3">
                {/* Authority */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Authority</p>
                  <select
                    value={form.authority.hasAuthority}
                    onChange={(e) => setForm((f) => ({ ...f, authority: { ...f.authority, hasAuthority: e.target.value as typeof f.authority.hasAuthority } }))}
                    className="w-full rounded border border-white/10 bg-[#0d0d0d] px-2 py-1.5 text-xs text-white/60 focus:outline-none"
                  >
                    {AUTHORITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Decision statement */}
                <div className="space-y-1">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Decision statement</p>
                  <textarea
                    rows={3}
                    value={form.decision.statement}
                    onChange={(e) => setForm((f) => ({ ...f, decision: { ...f.decision, statement: e.target.value } }))}
                    className="w-full rounded border border-white/10 bg-[#0d0d0d] px-2 py-1.5 text-xs text-white/60 focus:outline-none resize-none"
                  />
                  <p className="text-[9px] text-white/20">{form.decision.statement.length} chars (weak: 60, strong: 220)</p>
                </div>

                {/* Readiness */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-white/20">Ready for unpleasant decision?</p>
                    <select
                      value={form.readiness.readyForUnpleasantDecision}
                      onChange={(e) => setForm((f) => ({ ...f, readiness: { ...f.readiness, readyForUnpleasantDecision: e.target.value as "Yes" | "No" } }))}
                      className="w-full rounded border border-white/10 bg-[#0d0d0d] px-2 py-1.5 text-xs text-white/60 focus:outline-none"
                    >
                      {YES_NO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-mono text-white/20">Willing accountability?</p>
                    <select
                      value={form.readiness.willingAccountability}
                      onChange={(e) => setForm((f) => ({ ...f, readiness: { ...f.readiness, willingAccountability: e.target.value as "Yes" | "No" } }))}
                      className="w-full rounded border border-white/10 bg-[#0d0d0d] px-2 py-1.5 text-xs text-white/60 focus:outline-none"
                    >
                      {YES_NO_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Declaration */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.declarationAccepted}
                    onChange={(e) => setForm((f) => ({ ...f, declarationAccepted: e.target.checked }))}
                    className="accent-amber-500"
                  />
                  <span className="text-[10px] text-white/40">Declaration accepted</span>
                </label>
              </div>
            )}
          </div>
        }
        outputsSlot={
          findings.length > 0 ? (
            <div className="space-y-4">
              {summary && (
                <div className="rounded-lg border border-white/8 bg-white/3 p-3">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20 mb-1">Summary</p>
                  <p className="text-sm text-white/70">{summary}</p>
                </div>
              )}

              {score && (
                <div className="rounded-lg border border-white/8 bg-white/3 p-3 space-y-2">
                  <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Intake Score</p>
                  <div className="flex items-end gap-2">
                    <span className={`text-2xl font-semibold font-mono ${scoreColor}`}>
                      {score.total}
                    </span>
                    <span className="text-xs text-white/30 font-mono mb-0.5">
                      / {score.max} (threshold {score.threshold})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {Object.entries(score.components).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px] font-mono">
                        <span className="text-white/30">{k}</span>
                        <span className={v === 0 ? "text-red-400/70" : "text-white/50"}>{v}</span>
                      </div>
                    ))}
                  </div>
                  {score.failureReasons.length > 0 && (
                    <div className="border-t border-white/8 pt-2 space-y-1">
                      {score.failureReasons.map((r) => (
                        <p key={r} className="text-[10px] text-amber-400/50">· {r}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <FindingsList findings={findings} />
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">Run the engine to see gate decision and score.</p>
          )
        }
        checksSlot={
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={form.declarationAccepted || useWeakFixture ? "text-emerald-400" : "text-red-400"}>
                {form.declarationAccepted || useWeakFixture ? "✓" : "✗"}
              </span>
              <span className="text-white/50">Declaration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={!useWeakFixture ? "text-emerald-400" : "text-red-400"}>
                {!useWeakFixture ? "✓" : "✗"}
              </span>
              <span className="text-white/50">Authority (strong fixture)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={form.decision.statement.length >= 60 || useWeakFixture ? "text-emerald-400" : "text-amber-400"}>
                {form.decision.statement.length >= 60 || useWeakFixture ? "✓" : "~"}
              </span>
              <span className="text-white/50">Decision precision</span>
            </div>
          </div>
        }
        formulaSlot={
          <FormulaInspector
            mode="hybrid"
            findings={findings}
            formulaSteps={formulaSteps}
            title="Intake Scoring Trace"
          />
        }
        actionsSlot={
          saveMsg ? (
            <p className="text-[11px] text-white/40 font-mono">{saveMsg}</p>
          ) : (
            <p className="text-[11px] text-white/20 italic">Run and save to capture a ResearchRun.</p>
          )
        }
      />

      {/* Limitation banner */}
      {hasOutput && limitations.length > 0 && (
        <div className="rounded-xl border border-amber-500/15 bg-amber-500/5 p-5 space-y-4">
          <p className="text-[10px] font-mono uppercase tracking-wider text-amber-400/60">
            Adapter Scope — What This Simulator Covers
          </p>

          {functionsCalled.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase text-emerald-400/50 tracking-wider mb-1">
                Production functions called
              </p>
              {functionsCalled.map((fn) => (
                <p key={fn} className="text-[11px] font-mono text-emerald-400/70 pl-2">✓ {fn}</p>
              ))}
            </div>
          )}

          {stagesNotCalled.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase text-white/20 tracking-wider mb-1">
                Pipeline stages not called
              </p>
              {stagesNotCalled.map((fn) => (
                <p key={fn} className="text-[11px] font-mono text-white/25 pl-2">— {fn}</p>
              ))}
            </div>
          )}

          <div className="space-y-1 border-t border-white/8 pt-3">
            <p className="text-[9px] font-mono uppercase text-white/20 tracking-wider mb-1">Limitations</p>
            {limitations.map((l) => (
              <p key={l} className="text-[11px] text-amber-400/50 pl-2">· {l}</p>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}
