// app/admin/intelligence-foundry/simulation/executive-report-boardroom-bridge/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SimulationShell } from "@/components/research/SimulationShell";
import { FindingsList } from "@/components/research/FindingsList";
import { FormulaInspector } from "@/components/research/FormulaInspector";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

// ─── Types ────────────────────────────────────────────────────────────────────

type MappingTrace = {
  from: string;
  to: string;
  sourceRule: string;
  valueKind: "direct" | "derived" | "fallback" | "omitted";
  confidence: "high" | "medium" | "low";
};

type MappingGap = {
  missingSource: string;
  targetField: string;
  impact: "low" | "medium" | "high";
  recommendation: string;
};

type BridgeDecision = "QUALIFIES" | "BORDERLINE" | "DOES_NOT_QUALIFY" | "MAPPING_INSUFFICIENT";

type DossierSection = {
  id: string;
  label: string;
  content: string;
  tone: "factual" | "confrontational" | "quantified";
};

type BoardroomDossier = {
  title: string;
  classification: string;
  qualifiedForBoard: boolean;
  gateMessage: string | null;
  sections: DossierSection[];
  objectionHandling: Array<{ objection: string; response: string }>;
  decisionPath: Array<{ option: string; consequence: string; recommended: boolean }>;
};

type BoardroomQualification = {
  qualified: boolean;
  reason: string;
};

// ─── Fixture Options ──────────────────────────────────────────────────────────

const FIXTURE_OPTIONS = [
  {
    value: "disordered",
    label: "Disordered — high cost, qualifies",
    desc: "DISORDERED state, £256k exposure. Should produce QUALIFIES.",
    payload: { useDisorderedFixture: true },
  },
  {
    value: "misaligned",
    label: "Misaligned — borderline",
    desc: "MISALIGNED state, £125k exposure. Should produce BORDERLINE.",
    payload: { useMisalignedFixture: true },
  },
  {
    value: "ordered",
    label: "Ordered — does not qualify",
    desc: "ORDERED state, £15k exposure. Should produce DOES_NOT_QUALIFY.",
    payload: { useOrderedFixture: true },
  },
  {
    value: "mappingGap",
    label: "Mapping gap — insufficient",
    desc: "Minimal report with missing fields. Should produce MAPPING_INSUFFICIENT.",
    payload: { useMappingGapFixture: true },
  },
];

// ─── Styling ──────────────────────────────────────────────────────────────────

const BRIDGE_DECISION_STYLE: Record<BridgeDecision, string> = {
  QUALIFIES: "bg-emerald-400/15 text-emerald-300 border border-emerald-400/20",
  BORDERLINE: "bg-amber-400/12 text-amber-300 border border-amber-400/20",
  DOES_NOT_QUALIFY: "bg-white/8 text-white/40 border border-white/10",
  MAPPING_INSUFFICIENT: "bg-red-500/15 text-red-300 border border-red-500/20",
};

const VALUE_KIND_STYLE: Record<string, string> = {
  direct: "text-emerald-400/70",
  derived: "text-amber-400/70",
  fallback: "text-orange-400/70",
  omitted: "text-red-400/70",
};

const CONFIDENCE_STYLE: Record<string, string> = {
  high: "text-emerald-400/70",
  medium: "text-amber-400/70",
  low: "text-red-400/70",
};

const GAP_IMPACT_STYLE: Record<string, string> = {
  high: "bg-red-500/10 border-red-500/20 text-red-300",
  medium: "bg-amber-400/8 border-amber-400/15 text-amber-300",
  low: "bg-white/5 border-white/10 text-white/50",
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ExecutiveReportBoardroomBridgePage() {
  const [fixture, setFixture] = React.useState<string>("disordered");
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [formulaSteps, setFormulaSteps] = React.useState<FormulaStep[]>([]);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [bridgeDecision, setBridgeDecision] = React.useState<BridgeDecision | null>(null);
  const [qualifiesForBoardroom, setQualifiesForBoardroom] = React.useState<boolean>(false);
  const [mappingTrace, setMappingTrace] = React.useState<MappingTrace[]>([]);
  const [mappingGaps, setMappingGaps] = React.useState<MappingGap[]>([]);
  const [erState, setErState] = React.useState<string | null>(null);
  const [erSummary, setErSummary] = React.useState<string | null>(null);
  const [boardroomQualification, setBoardroomQualification] = React.useState<BoardroomQualification | null>(null);
  const [dossier, setDossier] = React.useState<BoardroomDossier | null>(null);
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
        "/api/admin/intelligence-foundry/engines/executive-report-boardroom-bridge/run",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedFixture.payload),
        },
      );

      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Bridge run failed");
        setRunning(false);
        return;
      }

      setFindings(data.findings ?? []);
      setFormulaSteps(data.formulaSteps ?? []);
      setSummary(data.summary ?? null);
      setBridgeDecision(data.bridgeDecision ?? null);
      setQualifiesForBoardroom(data.qualifiesForBoardroom ?? false);
      setMappingTrace(data.mappingTrace ?? []);
      setMappingGaps(data.mappingGaps ?? []);
      setErState((data.executiveReport as Record<string, unknown> | null)?.state as string ?? null);
      setErSummary((data.executiveReport as Record<string, unknown> | null)?.narrative as Record<string, unknown> ? (data.executiveReport as Record<string, unknown>).narrative as Record<string, unknown> ? ((data.executiveReport as Record<string, unknown>).narrative as Record<string, unknown>).summary as string : null : null);
      setBoardroomQualification(
        (data.boardroomResult?.rawOutput as Record<string, unknown> | null)?.qualification as BoardroomQualification | null ?? null,
      );
      setDossier(
        (data.boardroomResult?.rawOutput as Record<string, unknown> | null)?.dossier as BoardroomDossier | null ?? null,
      );
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
          title: `ER → Boardroom Bridge Simulation — ${new Date().toLocaleString("en-GB")}`,
          slug: `er-boardroom-bridge-sim-${Date.now()}`,
          runType: "SCENARIO",
          module: "scenario-workbench",
          moduleVersion: "1.0.0",
          inputJson: JSON.stringify({ fixture }),
          outputJson: JSON.stringify({ findings, summary, bridgeDecision, mappingGaps }),
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
          ER → Boardroom Bridge Simulator
        </h1>
        <p className="text-sm text-white/35 max-w-xl">
          Proves the governed escalation path: Executive Reporting output → IntelligenceSpine
          transformation → Boardroom qualification gate. Calls{" "}
          <code className="text-white/50 text-xs">executiveReportingAdapter.run()</code>,{" "}
          <code className="text-white/50 text-xs">mapExecutiveReportToIntelligenceSpine()</code>, and{" "}
          <code className="text-white/50 text-xs">boardroomModeAdapter.run()</code>.
        </p>
        <p className="mt-1 text-xs text-amber-400/40 font-mono">
          Dry-run bridge only. No PDF rendered. No client-facing dossier created.
          Executive Reporting output is being mapped into Boardroom Mode input.
        </p>
      </div>

      <SimulationShell
        title="ER → Boardroom Bridge — Escalation Path"
        moduleId="executive-report-boardroom-bridge"
        engineStatus="PRODUCTION_CALLABLE"
        onRun={handleRun}
        onSave={hasOutput ? handleSave : undefined}
        running={running}
        hasOutput={hasOutput}
        inputsSlot={
          <div className="space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">
              Fixture
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
                Bridge decision rules
              </p>
              <p className="text-[10px] text-white/25">
                QUALIFIES: Boardroom qualified + no high-impact mapping gaps
              </p>
              <p className="text-[10px] text-white/25">
                BORDERLINE: Not qualified but close, or medium-impact gaps
              </p>
              <p className="text-[10px] text-white/25">
                DOES_NOT_QUALIFY: Not qualified, mapping sufficient
              </p>
              <p className="text-[10px] text-white/25">
                MAPPING_INSUFFICIENT: High-impact mapping gap
              </p>
            </div>
          </div>
        }
        outputsSlot={
          hasOutput ? (
            <div className="space-y-4">
              {/* Bridge decision banner */}
              {bridgeDecision && (
                <div
                  className={`rounded-lg border p-3 ${
                    bridgeDecision === "QUALIFIES"
                      ? "border-emerald-400/25 bg-emerald-400/5"
                      : bridgeDecision === "BORDERLINE"
                        ? "border-amber-400/20 bg-amber-400/5"
                        : bridgeDecision === "MAPPING_INSUFFICIENT"
                          ? "border-red-500/20 bg-red-500/5"
                          : "border-white/10 bg-white/2"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest ${BRIDGE_DECISION_STYLE[bridgeDecision]}`}
                    >
                      {bridgeDecision}
                    </span>
                    <span className="text-[9px] text-white/25 font-mono">
                      {qualifiesForBoardroom ? "Boardroom: QUALIFIED" : "Boardroom: NOT QUALIFIED"}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{summary}</p>
                </div>
              )}

              {/* Executive Report summary */}
              {erState && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1">
                    Executive Report Summary
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[8px] font-mono font-semibold uppercase tracking-widest ${
                        erState === "DISORDERED"
                          ? "bg-red-500/15 text-red-300 border border-red-500/20"
                          : erState === "MISALIGNED"
                            ? "bg-amber-400/12 text-amber-300 border border-amber-400/20"
                            : "bg-emerald-400/12 text-emerald-300 border border-emerald-400/20"
                      }`}
                    >
                      {erState}
                    </span>
                  </div>
                  {erSummary && (
                    <p className="text-[11px] text-white/45 mt-1">{erSummary}</p>
                  )}
                </div>
              )}

              {/* Mapping trace table */}
              {mappingTrace.length > 0 && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1">
                    Mapping Trace ({mappingTrace.length} entries)
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono">
                      <thead>
                        <tr className="text-white/20 border-b border-white/8">
                          <th className="text-left py-1 pr-2">From</th>
                          <th className="text-left py-1 pr-2">To</th>
                          <th className="text-left py-1 pr-2">Kind</th>
                          <th className="text-left py-1">Confidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappingTrace.map((trace, i) => (
                          <tr key={i} className="border-b border-white/5">
                            <td className="py-1 pr-2 text-white/40">{trace.from}</td>
                            <td className="py-1 pr-2 text-white/50">{trace.to}</td>
                            <td className={`py-1 pr-2 ${VALUE_KIND_STYLE[trace.valueKind] ?? "text-white/40"}`}>
                              {trace.valueKind}
                            </td>
                            <td className={`py-1 ${CONFIDENCE_STYLE[trace.confidence] ?? "text-white/40"}`}>
                              {trace.confidence}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Mapping gaps panel */}
              {mappingGaps.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                    Mapping Gaps ({mappingGaps.length})
                  </p>
                  {mappingGaps.map((gap, i) => (
                    <div
                      key={i}
                      className={`rounded border p-2 ${GAP_IMPACT_STYLE[gap.impact] ?? "bg-white/5 border-white/10 text-white/50"}`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-mono uppercase tracking-wider">
                          {gap.impact} impact
                        </span>
                      </div>
                      <p className="text-[10px] font-mono">
                        <span className="text-white/30">Missing: </span>
                        {gap.missingSource}
                      </p>
                      <p className="text-[10px] font-mono">
                        <span className="text-white/30">Target: </span>
                        {gap.targetField}
                      </p>
                      <p className="text-[10px] mt-0.5 text-white/40">{gap.recommendation}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* IntelligenceSpine preview */}
              {bridgeDecision && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20 mb-1">
                    IntelligenceSpine Preview
                  </p>
                  <div className="space-y-0.5 text-[10px] font-mono">
                    <p className="text-white/30">
                      Spine ID:{" "}
                      <span className="text-white/50">mapped-from-er-{Date.now()}</span>
                    </p>
                    <p className="text-white/30">
                      Condition:{" "}
                      <span className="text-white/50">
                        {erState === "DISORDERED"
                          ? "instability"
                          : "execution"}
                      </span>
                    </p>
                    <p className="text-white/30">
                      Stage: <span className="text-white/50">executive_reporting</span>
                    </p>
                    <p className="text-white/30">
                      Traces: <span className="text-white/50">{mappingTrace.length}</span>
                    </p>
                    <p className="text-white/30">
                      Gaps:{" "}
                      <span
                        className={
                          mappingGaps.some((g) => g.impact === "high")
                            ? "text-red-400/70"
                            : "text-white/50"
                        }
                      >
                        {mappingGaps.length}
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Boardroom qualification result */}
              {boardroomQualification && (
                <div
                  className={`rounded-lg border p-3 ${
                    boardroomQualification.qualified
                      ? "border-emerald-400/25 bg-emerald-400/5"
                      : "border-white/10 bg-white/2"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest ${
                        boardroomQualification.qualified
                          ? "bg-emerald-400/15 text-emerald-300"
                          : "bg-white/8 text-white/40"
                      }`}
                    >
                      {boardroomQualification.qualified ? "QUALIFIED" : "NOT QUALIFIED"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/50">{boardroomQualification.reason}</p>
                </div>
              )}

              {/* Boardroom dossier preview */}
              {dossier && boardroomQualification?.qualified && (
                <div className="space-y-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                    Boardroom Dossier Preview
                  </p>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] text-white/20 font-mono">
                      {dossier.classification}
                    </span>
                    <span className="text-[9px] text-white/15">·</span>
                    <span className="text-[9px] text-white/25">
                      {dossier.sections.length} sections
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 font-medium">{dossier.title}</p>
                  {dossier.sections.slice(0, 4).map((section) => (
                    <div
                      key={section.id}
                      className={`rounded border ${
                        section.tone === "confrontational"
                          ? "border-amber-400/20"
                          : section.tone === "quantified"
                            ? "border-emerald-400/20"
                            : "border-white/10"
                      } bg-white/2 p-2`}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[10px] font-medium ${
                            section.tone === "confrontational"
                              ? "text-amber-400/80"
                              : section.tone === "quantified"
                                ? "text-emerald-400/80"
                                : "text-white/70"
                          }`}
                        >
                          {section.label}
                        </span>
                        <span className="ml-auto text-[8px] font-mono uppercase text-white/15">
                          {section.tone}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/40 leading-relaxed whitespace-pre-line line-clamp-2">
                        {section.content}
                      </p>
                    </div>
                  ))}
                  {dossier.sections.length > 4 && (
                    <p className="text-[9px] text-white/20 text-center">
                      +{dossier.sections.length - 4} more sections
                    </p>
                  )}
                </div>
              )}

              <FindingsList findings={findings} />
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">
              Run the bridge to see the escalation path from Executive Report to Boardroom qualification.
            </p>
          )
        }
        checksSlot={
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={fixture !== "ordered" ? "text-emerald-400" : "text-white/25"}>
                {fixture !== "ordered" ? "✓" : "—"}
              </span>
              <span className="text-white/50">ER state severe enough</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={fixture === "disordered" ? "text-emerald-400" : fixture === "misaligned" ? "text-amber-400" : "text-white/25"}>
                {fixture === "disordered" ? "✓" : fixture === "misaligned" ? "~" : "—"}
              </span>
              <span className="text-white/50">Financial exposure above threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={fixture === "disordered" || fixture === "misaligned" ? "text-emerald-400" : "text-white/25"}>
                {fixture === "disordered" || fixture === "misaligned" ? "✓" : "—"}
              </span>
              <span className="text-white/50">Failure modes detected</span>
            </div>
            {hasOutput && bridgeDecision && (
              <div className="border-t border-white/8 pt-2 mt-2">
                <p
                  className={`text-[11px] font-mono ${
                    bridgeDecision === "QUALIFIES"
                      ? "text-emerald-400/70"
                      : bridgeDecision === "BORDERLINE"
                        ? "text-amber-400/70"
                        : bridgeDecision === "MAPPING_INSUFFICIENT"
                          ? "text-red-400/70"
                          : "text-white/30"
                  }`}
                >
                  Bridge: {bridgeDecision}
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
            title="Bridge Trace"
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
            Bridge Scope — What This Simulator Covers
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
