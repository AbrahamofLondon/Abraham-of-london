// app/admin/intelligence-foundry/simulation/executive-reporting/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SimulationShell } from "@/components/research/SimulationShell";
import { FindingsList } from "@/components/research/FindingsList";
import { FormulaInspector } from "@/components/research/FormulaInspector";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Types mirroring API response ────────────────────────────────────────────

type ExecutiveReportState = "ORDERED" | "MISALIGNED" | "DISORDERED";

type Narrative = {
  headline: string;
  summary: string;
  mandate: string;
};

type OGRComputed = {
  integrationTax: number;
  velocityMultiplier: number;
  resonanceAlpha: number;
  sovereignCertainty: number;
  isAuthorizedToExecute: boolean;
};

type ResonanceSummary = {
  averageDissonance: number;
  domainCount: number;
  totalResponses: number;
  weakestDomain: string | null;
  strongestDomain: string | null;
  isDisordered: boolean;
};

type HCDAggregate = {
  averageDelta: number;
  overallBurnoutIndex: number;
  criticalCount: number;
  elevatedCount: number;
  criticalDomains: string[];
  totalReplacementCost: number;
  riskScore: string;
};

type FinancialExposure = {
  replacementCost: number;
  executionLoss: number;
  totalExposure: number;
};

// ─── Fixture options ──────────────────────────────────────────────────────────

const FIXTURE_OPTIONS = [
  {
    value: "disordered",
    label: "Disordered — high dissonance, critical HCD risk",
    desc: "averageDissonance ≈ 65%. Leadership burnout critical. Not authorized.",
    payload: { useDisorderedFixture: true },
  },
  {
    value: "misaligned",
    label: "Misaligned — moderate dissonance, not authorized",
    desc: "averageDissonance ≈ 16%. Moderate HCD. Sovereign certainty ~67%.",
    payload: { useMisalignedFixture: true },
  },
  {
    value: "ordered",
    label: "Ordered — low dissonance, execution verified",
    desc: "averageDissonance ≈ 3%. Low HCD risk. Sovereign certainty ~92%.",
    payload: { useOrderedFixture: true },
  },
];

// ─── State styling ────────────────────────────────────────────────────────────

const STATE_CHIP: Record<ExecutiveReportState, string> = {
  DISORDERED: "bg-red-500/15 text-red-300 border border-red-500/20",
  MISALIGNED: "bg-amber-400/12 text-amber-300 border border-amber-400/20",
  ORDERED: "bg-emerald-400/12 text-emerald-300 border border-emerald-400/20",
};

const STATE_PANEL: Record<ExecutiveReportState, string> = {
  DISORDERED: "border-red-500/15 bg-red-500/4",
  MISALIGNED: "border-amber-400/15 bg-amber-400/4",
  ORDERED: "border-emerald-400/15 bg-emerald-400/4",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExecutiveReportingSimulatorPage() {
  const [fixture, setFixture] = React.useState<string>("disordered");
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [formulaSteps, setFormulaSteps] = React.useState<FormulaStep[]>([]);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [state, setState] = React.useState<ExecutiveReportState | null>(null);
  const [narrative, setNarrative] = React.useState<Narrative | null>(null);
  const [ogr, setOgr] = React.useState<OGRComputed | null>(null);
  const [resonance, setResonance] = React.useState<ResonanceSummary | null>(null);
  const [hcdAggregate, setHcdAggregate] = React.useState<HCDAggregate | null>(null);
  const [financialExposure, setFinancialExposure] = React.useState<FinancialExposure | null>(null);
  const [priorityStack, setPriorityStack] = React.useState<string[]>([]);
  const [failureModes, setFailureModes] = React.useState<string[]>([]);
  const [limitations, setLimitations] = React.useState<string[]>([]);
  const [promotionReqs, setPromotionReqs] = React.useState<string[]>([]);
  const [functionsCalled, setFunctionsCalled] = React.useState<string[]>([]);
  const [stagesNotCalled, setStagesNotCalled] = React.useState<string[]>([]);
  const [running, setRunning] = React.useState(false);
  const [hasOutput, setHasOutput] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const selectedFixture = FIXTURE_OPTIONS.find((f) => f.value === fixture) ?? FIXTURE_OPTIONS[0]!;

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setSaveMsg(null);

    try {
      const res = await fetch(
        "/api/admin/intelligence-foundry/engines/executive-reporting/run",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedFixture.payload),
        },
      );

      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Engine run failed");
        setRunning(false);
        return;
      }

      setFindings(data.findings ?? []);
      setFormulaSteps(data.formulaSteps ?? []);
      setSummary(data.summary ?? null);
      setState(data.state ?? null);
      setNarrative(data.narrative ?? null);
      setOgr(data.ogr ?? null);
      setResonance(data.resonance ?? null);
      setHcdAggregate(data.hcdAggregate ?? null);
      setFinancialExposure(data.financialExposure ?? null);
      setPriorityStack(data.priorityStack ?? []);
      setFailureModes(data.failureModes ?? []);
      setLimitations(data.limitations ?? []);
      setPromotionReqs(data.promotionRequirements ?? []);
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
          title: `Executive Reporting Simulation — ${new Date().toLocaleString("en-GB")}`,
          slug: `er-sim-${Date.now()}`,
          runType: "SCENARIO",
          module: "scenario-workbench",
          moduleVersion: "2.0.0",
          inputJson: JSON.stringify({ fixture }),
          outputJson: JSON.stringify({ findings, summary, state }),
          findingsJson: JSON.stringify(findings),
          severity: findings.some((f) => f.severity === "CRITICAL")
            ? "CRITICAL"
            : findings.some((f) => f.severity === "HIGH")
              ? "HIGH"
              : findings.some((f) => f.severity === "MEDIUM")
                ? "MEDIUM"
                : "INFO",
          status: "COMPLETED",
          requiresOwnerDecision: false,
          driftDetected: false,
          humanReviewRequired: false,
          schemaVersion: "1.0.0",
        }),
      });
      const data = await res.json();
      setSaveMsg(
        data.ok ? "Saved to Research Run Vault" : `Save failed: ${data.error ?? "unknown"}`,
      );
    } catch {
      setSaveMsg("Save failed: network error");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <Link
          href="/admin/intelligence-foundry"
          className="text-[11px] text-white/25 hover:text-white/45 font-mono"
        >
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">
          Executive Reporting Simulator
        </h1>
        <p className="text-sm text-white/35 max-w-xl">
          Dry-run executive report generation. Calls{" "}
          <code className="text-white/50 text-xs">buildExecutiveReport()</code> from real production
          logic: resonance telemetry, HCD delta analysis, OGR manifest, state classification, and
          financial exposure. No data persisted.
        </p>
        <p className="mt-1 text-xs text-amber-400/40 font-mono">
          Dry-run only. Synthetic fixtures. No executive reports persisted.
        </p>
      </div>

      <SimulationShell
        title="Executive Reporting — Intelligence Brief"
        moduleId="executive-reporting"
        engineStatus="PRODUCTION_CALLABLE"
        onRun={handleRun}
        onSave={hasOutput ? handleSave : undefined}
        running={running}
        hasOutput={hasOutput}
        inputsSlot={
          <div className="space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">
              Scenario
            </p>
            <div className="space-y-2">
              {FIXTURE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setFixture(opt.value);
                    setHasOutput(false);
                  }}
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-left transition-all",
                    fixture === opt.value
                      ? "border-amber-400/35 bg-amber-400/7 text-amber-300/80"
                      : "border-white/8 bg-white/2 text-white/40 hover:border-white/15 hover:text-white/60",
                  ].join(" ")}
                >
                  <p className="text-xs font-medium">{opt.label}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">{opt.desc}</p>
                </button>
              ))}
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/15">
                State rules
              </p>
              <p className="text-[10px] text-white/25">
                dissonance &gt; 30% OR HCD=CRITICAL → DISORDERED
              </p>
              <p className="text-[10px] text-white/25">
                dissonance &gt; 12% OR not authorized → MISALIGNED
              </p>
              <p className="text-[10px] text-white/25">
                dissonance ≤ 12% AND authorized → ORDERED
              </p>
            </div>
          </div>
        }
        outputsSlot={
          hasOutput ? (
            <div className="space-y-4">
              {/* State badge + narrative */}
              {state && narrative && (
                <div className={`rounded-lg border p-3 ${STATE_PANEL[state]}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest ${STATE_CHIP[state]}`}
                    >
                      {state}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-white/70 mb-1">{narrative.headline}</p>
                  <p className="text-[11px] text-white/45 leading-relaxed mb-2">
                    {narrative.summary}
                  </p>
                  <p className="text-[10px] text-white/30 font-mono border-t border-white/8 pt-2 mt-2">
                    <span className="text-white/20">mandate: </span>
                    {narrative.mandate}
                  </p>
                </div>
              )}

              {/* Financial exposure */}
              {financialExposure && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5">
                    Financial exposure
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="text-center">
                      <p className="text-[10px] text-white/25">Replacement</p>
                      <p className="text-xs font-mono text-white/60">
                        £{Math.round(financialExposure.replacementCost).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/25">Execution loss</p>
                      <p className="text-xs font-mono text-white/60">
                        £{Math.round(financialExposure.executionLoss).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-white/25">Total</p>
                      <p className="text-xs font-mono text-amber-300/70 font-semibold">
                        £{Math.round(financialExposure.totalExposure).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* OGR */}
              {ogr && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5">
                    OGR manifest
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Sovereign certainty</span>
                      <span
                        className={`text-[10px] font-mono ${ogr.isAuthorizedToExecute ? "text-emerald-400/70" : "text-red-400/70"}`}
                      >
                        {ogr.sovereignCertainty.toFixed(2)}%
                        {ogr.isAuthorizedToExecute ? " ✓" : " ✗"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Integration tax</span>
                      <span className="text-[10px] font-mono text-white/50">
                        {ogr.integrationTax}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Velocity multiplier</span>
                      <span className="text-[10px] font-mono text-white/50">
                        {ogr.velocityMultiplier}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Resonance */}
              {resonance && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5">
                    Resonance telemetry
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Average dissonance</span>
                      <span
                        className={`text-[10px] font-mono ${resonance.averageDissonance > 30 ? "text-red-400/70" : resonance.averageDissonance > 12 ? "text-amber-400/70" : "text-emerald-400/70"}`}
                      >
                        {resonance.averageDissonance}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Weakest domain</span>
                      <span className="text-[10px] font-mono text-white/45">
                        {resonance.weakestDomain ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Domains</span>
                      <span className="text-[10px] font-mono text-white/45">
                        {resonance.domainCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* HCD aggregate */}
              {hcdAggregate && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5">
                    Human capital delta
                  </p>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Risk score</span>
                      <span
                        className={`text-[10px] font-mono font-semibold ${
                          hcdAggregate.riskScore === "CRITICAL"
                            ? "text-red-400/80"
                            : hcdAggregate.riskScore === "ELEVATED"
                              ? "text-orange-400/80"
                              : hcdAggregate.riskScore === "MODERATE"
                                ? "text-amber-400/70"
                                : "text-emerald-400/70"
                        }`}
                      >
                        {hcdAggregate.riskScore}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Burnout index</span>
                      <span className="text-[10px] font-mono text-white/50">
                        {hcdAggregate.overallBurnoutIndex.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Critical domains</span>
                      <span className="text-[10px] font-mono text-white/45">
                        {hcdAggregate.criticalDomains.length > 0
                          ? hcdAggregate.criticalDomains.join(", ")
                          : "none"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-white/35">Replacement liability</span>
                      <span className="text-[10px] font-mono text-white/50">
                        £{hcdAggregate.totalReplacementCost.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Priority stack */}
              {priorityStack.length > 0 && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1.5">
                    Priority stack
                  </p>
                  {priorityStack.map((item, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="text-[9px] font-mono text-white/20 mt-0.5">{i + 1}.</span>
                      <p className="text-[11px] text-white/50">{item}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Failure modes */}
              {failureModes.length > 0 && (
                <div className="rounded border border-red-500/12 bg-red-500/3 p-2.5 space-y-1">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-red-400/40 mb-1.5">
                    Failure modes
                  </p>
                  {failureModes.map((mode, i) => (
                    <p key={i} className="text-[11px] text-red-400/60">
                      · {mode}
                    </p>
                  ))}
                </div>
              )}

              {summary && (
                <p className="text-[10px] text-white/25 font-mono leading-relaxed">{summary}</p>
              )}

              <FindingsList findings={findings} />
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">
              Run the engine to see the executive intelligence brief.
            </p>
          )
        }
        checksSlot={
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={
                  fixture === "ordered" ? "text-emerald-400" : "text-red-400/70"
                }
              >
                {fixture === "ordered" ? "✓" : "✗"}
              </span>
              <span className="text-white/50">Authorized to execute</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={
                  fixture === "ordered"
                    ? "text-emerald-400"
                    : fixture === "misaligned"
                      ? "text-amber-400"
                      : "text-red-400/70"
                }
              >
                {fixture === "ordered" ? "✓" : fixture === "misaligned" ? "~" : "✗"}
              </span>
              <span className="text-white/50">Dissonance within threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={fixture !== "disordered" ? "text-emerald-400" : "text-red-400/70"}
              >
                {fixture !== "disordered" ? "✓" : "✗"}
              </span>
              <span className="text-white/50">HCD risk not critical</span>
            </div>
            {hasOutput && state && (
              <div className="border-t border-white/8 pt-2 mt-2">
                <p
                  className={`text-[11px] font-mono ${
                    state === "ORDERED"
                      ? "text-emerald-400/70"
                      : state === "MISALIGNED"
                        ? "text-amber-400/70"
                        : "text-red-400/70"
                  }`}
                >
                  State: {state}
                </p>
              </div>
            )}
          </div>
        }
        formulaSlot={
          <FormulaInspector
            mode="hybrid"
            findings={findings}
            formulaSteps={formulaSteps}
            title="Executive Report Trace"
          />
        }
        actionsSlot={
          saveMsg ? (
            <p className="text-[11px] text-white/40 font-mono">{saveMsg}</p>
          ) : (
            <p className="text-[11px] text-white/20 italic">
              Run and save to capture a ResearchRun.
            </p>
          )
        }
      />

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Adapter scope + limitation banner */}
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
                <p key={fn} className="text-[11px] font-mono text-emerald-400/70 pl-2">
                  ✓ {fn}
                </p>
              ))}
            </div>
          )}

          {stagesNotCalled.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] font-mono uppercase text-white/20 tracking-wider mb-1">
                Pipeline stages not called
              </p>
              {stagesNotCalled.map((fn) => (
                <p key={fn} className="text-[11px] font-mono text-white/25 pl-2">
                  — {fn}
                </p>
              ))}
            </div>
          )}

          <div className="space-y-1 border-t border-white/8 pt-3">
            <p className="text-[9px] font-mono uppercase text-white/20 tracking-wider mb-1">
              Limitations
            </p>
            {limitations.map((l) => (
              <p key={l} className="text-[11px] text-amber-400/50 pl-2">
                · {l}
              </p>
            ))}
          </div>

          {promotionReqs.length > 0 && (
            <div className="space-y-1 border-t border-white/8 pt-3">
              <p className="text-[9px] font-mono uppercase text-white/20 tracking-wider mb-1">
                Promotion requirements
              </p>
              {promotionReqs.map((r) => (
                <p key={r} className="text-[11px] text-white/30 pl-2">
                  → {r}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
