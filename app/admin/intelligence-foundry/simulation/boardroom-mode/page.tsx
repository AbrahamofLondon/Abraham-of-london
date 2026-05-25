// app/admin/intelligence-foundry/simulation/boardroom-mode/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SimulationShell } from "@/components/research/SimulationShell";
import { FindingsList } from "@/components/research/FindingsList";
import { FormulaInspector } from "@/components/research/FormulaInspector";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

type DossierSection = {
  id: string;
  label: string;
  content: string;
  tone: "factual" | "confrontational" | "quantified";
};

type Objection = { objection: string; response: string };
type DecisionPath = { option: string; consequence: string; recommended: boolean };

type DossierPreview = {
  title: string;
  classification: string;
  qualifiedForBoard: boolean;
  gateMessage: string | null;
  sections: DossierSection[];
  objectionHandling: Objection[];
  decisionPath: DecisionPath[];
};

type QualificationResult = {
  qualified: boolean;
  reason: string;
};

const FIXTURE_OPTIONS = [
  { value: "qualifying",     label: "Qualifying — £8.5k/month, authority, accuracy confirmed" },
  { value: "borderline",     label: "Borderline — £5.2k/month, execution, accuracy partial" },
  { value: "non-qualifying", label: "Not qualified — £1.8k/month, operational issue" },
];

const TONE_COLOURS: Record<DossierSection["tone"], string> = {
  factual: "text-white/70",
  confrontational: "text-amber-400/80",
  quantified: "text-emerald-400/80",
};

const TONE_BORDER: Record<DossierSection["tone"], string> = {
  factual: "border-white/10",
  confrontational: "border-amber-400/20",
  quantified: "border-emerald-400/20",
};

export default function BoardroomModeSimulatorPage() {
  const [fixture, setFixture] = React.useState<string>("qualifying");
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [formulaSteps, setFormulaSteps] = React.useState<FormulaStep[]>([]);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [qualification, setQualification] = React.useState<QualificationResult | null>(null);
  const [dossier, setDossier] = React.useState<DossierPreview | null>(null);
  const [limitations, setLimitations] = React.useState<string[]>([]);
  const [promotionReqs, setPromotionReqs] = React.useState<string[]>([]);
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

    const payload =
      fixture === "qualifying"
        ? { useQualifyingFixture: true }
        : fixture === "borderline"
          ? { useBorderlineFixture: true }
          : { useNonQualifyingFixture: true };

    try {
      const res = await fetch("/api/admin/intelligence-foundry/engines/boardroom-mode/run", {
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
      setQualification(data.qualification ?? null);
      setDossier(data.dossier ?? null);
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
          title: `Boardroom Mode Simulation — ${new Date().toLocaleString("en-GB")}`,
          slug: `boardroom-sim-${Date.now()}`,
          runType: "SCENARIO",
          module: "scenario-workbench",
          moduleVersion: "1.0.0",
          inputJson: JSON.stringify({ fixture }),
          outputJson: JSON.stringify({ findings, summary, qualification }),
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
      setSaveMsg(data.ok ? "Saved to Research Run Vault" : `Save failed: ${data.error ?? "unknown"}`);
    } catch {
      setSaveMsg("Save failed: network error");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Page header */}
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Boardroom Mode Simulator</h1>
        <p className="text-sm text-white/35 max-w-xl">
          Dry-run boardroom qualification gate and dossier generation.
          Calls <code className="text-white/50 text-xs">qualifiesForBoardroom()</code> and{" "}
          <code className="text-white/50 text-xs">generateBoardroomDossier()</code> from real production logic.
          No PDF rendered. No customer artefacts created.
        </p>
        <p className="mt-1 text-xs text-amber-400/40 font-mono">
          Dry-run only. Synthetic IntelligenceSpine fixtures. No boardroom artefacts persisted.
        </p>
      </div>

      <SimulationShell
        title="Boardroom Mode — Qualification Gate"
        moduleId="boardroom-dossier"
        engineStatus="PRODUCTION_CALLABLE"
        onRun={handleRun}
        onSave={hasOutput ? handleSave : undefined}
        running={running}
        hasOutput={hasOutput}
        inputsSlot={
          <div className="space-y-4">
            <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Fixture</p>
            <div className="space-y-2">
              {FIXTURE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { setFixture(opt.value); setHasOutput(false); }}
                  className={[
                    "w-full rounded-lg border px-3 py-2 text-left text-xs transition-all",
                    fixture === opt.value
                      ? "border-amber-400/35 bg-amber-400/7 text-amber-300/80"
                      : "border-white/8 bg-white/2 text-white/40 hover:border-white/15 hover:text-white/60",
                  ].join(" ")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="space-y-1 pt-1">
              <p className="text-[9px] font-mono uppercase tracking-wider text-white/15">
                Gate rules
              </p>
              <p className="text-[10px] text-white/25">cost ≥ £5k/month + accuracy yes/partial → qualifies</p>
              <p className="text-[10px] text-white/25">cost ≥ £20k/month → qualifies regardless of accuracy</p>
              <p className="text-[10px] text-white/25">below threshold → "resolve operationally"</p>
            </div>
          </div>
        }
        outputsSlot={
          hasOutput ? (
            <div className="space-y-4">
              {/* Qualification status */}
              {qualification && (
                <div className={[
                  "rounded-lg border p-3",
                  qualification.qualified
                    ? "border-emerald-400/25 bg-emerald-400/5"
                    : "border-white/10 bg-white/2",
                ].join(" ")}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={[
                      "inline-block rounded-full px-2 py-0.5 text-[9px] font-mono font-semibold uppercase tracking-widest",
                      qualification.qualified
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-white/8 text-white/40",
                    ].join(" ")}>
                      {qualification.qualified ? "QUALIFIED" : "NOT QUALIFIED"}
                    </span>
                  </div>
                  <p className="text-xs text-white/50">{qualification.reason}</p>
                  {summary && (
                    <p className="text-[11px] text-white/35 font-mono mt-1.5">{summary}</p>
                  )}
                </div>
              )}

              {/* Dossier sections */}
              {dossier && qualification?.qualified && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                      {dossier.classification}
                    </p>
                    <span className="text-[9px] text-white/15">·</span>
                    <p className="text-[9px] text-white/25">{dossier.sections.length} sections</p>
                  </div>
                  <p className="text-[10px] text-white/40 font-medium">{dossier.title}</p>
                  {dossier.sections.map((section) => (
                    <div
                      key={section.id}
                      className={`rounded border ${TONE_BORDER[section.tone]} bg-white/2 p-2.5`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-medium ${TONE_COLOURS[section.tone]}`}>
                          {section.label}
                        </span>
                        <span className="ml-auto text-[8px] font-mono uppercase text-white/15">
                          {section.tone}
                        </span>
                      </div>
                      <p className="text-[11px] text-white/45 leading-relaxed whitespace-pre-line">
                        {section.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Objection handling */}
              {dossier && qualification?.qualified && dossier.objectionHandling.length > 0 && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-2">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                    Objection handling
                  </p>
                  {dossier.objectionHandling.map((obj, i) => (
                    <div key={i} className="space-y-0.5">
                      <p className="text-[11px] text-amber-400/60 font-medium">"{obj.objection}"</p>
                      <p className="text-[11px] text-white/40 pl-2">{obj.response}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Decision paths */}
              {dossier && qualification?.qualified && dossier.decisionPath.length > 0 && (
                <div className="rounded border border-white/8 bg-white/2 p-2.5 space-y-1.5">
                  <p className="text-[9px] font-mono uppercase tracking-widest text-white/20">
                    Decision paths
                  </p>
                  {dossier.decisionPath.map((path, i) => (
                    <div
                      key={i}
                      className={[
                        "rounded px-2 py-1.5",
                        path.recommended ? "bg-emerald-400/5 border border-emerald-400/12" : "",
                      ].join(" ")}
                    >
                      <p className={`text-[11px] font-medium ${path.recommended ? "text-emerald-300/70" : "text-white/45"}`}>
                        {path.option}
                        {path.recommended && (
                          <span className="ml-2 text-[8px] font-mono uppercase text-emerald-400/40">
                            recommended
                          </span>
                        )}
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">{path.consequence}</p>
                    </div>
                  ))}
                </div>
              )}

              <FindingsList findings={findings} />
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">Run the engine to see qualification gate and dossier preview.</p>
          )
        }
        checksSlot={
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={fixture !== "non-qualifying" ? "text-emerald-400" : "text-white/25"}>
                {fixture !== "non-qualifying" ? "✓" : "—"}
              </span>
              <span className="text-white/50">Cost above threshold</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={fixture === "qualifying" ? "text-emerald-400" : fixture === "borderline" ? "text-amber-400" : "text-white/25"}>
                {fixture === "qualifying" ? "✓" : fixture === "borderline" ? "~" : "—"}
              </span>
              <span className="text-white/50">Accuracy confirmed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={fixture === "qualifying" ? "text-emerald-400" : "text-white/25"}>
                {fixture === "qualifying" ? "✓" : "—"}
              </span>
              <span className="text-white/50">Authority condition</span>
            </div>
            {hasOutput && qualification && (
              <div className="border-t border-white/8 pt-2 mt-2">
                <p className={`text-[11px] font-mono ${qualification.qualified ? "text-emerald-400/70" : "text-white/30"}`}>
                  {qualification.qualified ? "Gate: PASSED" : "Gate: NOT MET"}
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
            title="Boardroom Gate Trace"
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

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Production audit + limitation banner */}
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

          {promotionReqs.length > 0 && (
            <div className="space-y-1 border-t border-white/8 pt-3">
              <p className="text-[9px] font-mono uppercase text-white/20 tracking-wider mb-1">
                Promotion requirements
              </p>
              {promotionReqs.map((r) => (
                <p key={r} className="text-[11px] text-white/30 pl-2">→ {r}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
