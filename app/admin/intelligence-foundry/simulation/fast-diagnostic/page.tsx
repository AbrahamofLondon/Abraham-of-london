// app/admin/intelligence-foundry/simulation/fast-diagnostic/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { SimulationShell } from "@/components/research/SimulationShell";
import { FindingsList } from "@/components/research/FindingsList";
import { FormulaInspector } from "@/components/research/FormulaInspector";
import { DemoDisclaimer } from "@/components/research/DemoDisclaimer";
import type { Finding, FormulaStep } from "@/lib/research/foundry-contract";

type AnswerRow = {
  sectionId: string;
  questionId: string;
  prompt: string;
  value: number;
};

const DEFAULT_ANSWERS: AnswerRow[] = [
  { sectionId: "authority", questionId: "q1", prompt: "Is decision ownership clear?", value: 3 },
  { sectionId: "authority", questionId: "q2", prompt: "Is there a named decision-maker?", value: 3 },
  { sectionId: "execution", questionId: "q3", prompt: "Has a prior attempt been made?", value: 3 },
  { sectionId: "execution", questionId: "q4", prompt: "Is there a clear execution path?", value: 3 },
  { sectionId: "governance", questionId: "q5", prompt: "Are governance controls in place?", value: 3 },
  { sectionId: "governance", questionId: "q6", prompt: "Is escalation defined?", value: 3 },
];

const SECTION_LABELS: Record<string, string> = {
  authority: "Authority",
  execution: "Execution",
  governance: "Governance",
};

export default function FastDiagnosticSimulatorPage() {
  const [answers, setAnswers] = React.useState<AnswerRow[]>(DEFAULT_ANSWERS);
  const [findings, setFindings] = React.useState<Finding[]>([]);
  const [formulaSteps, setFormulaSteps] = React.useState<FormulaStep[]>([]);
  const [summary, setSummary] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState(false);
  const [hasOutput, setHasOutput] = React.useState(false);
  const [saveMsg, setSaveMsg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setSaveMsg(null);

    try {
      const res = await fetch("/api/admin/intelligence-foundry/engines/fast-diagnostic/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: {
            fixture: {
              answers: answers.map((a) => ({
                sectionId: a.sectionId,
                questionId: a.questionId,
                prompt: a.prompt,
                value: a.value,
              })),
            },
          },
        }),
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
          title: `Fast Diagnostic — ${new Date().toLocaleString("en-GB")}`,
          slug: `fd-${Date.now()}`,
          runType: "SCENARIO",
          module: "scenario-workbench",
          moduleVersion: "1.0.0",
          inputJson: JSON.stringify({ answers }),
          outputJson: JSON.stringify({ findings, summary }),
          findingsJson: JSON.stringify(findings),
          severity: findings.some((f) => f.severity === "CRITICAL") ? "CRITICAL" : findings.some((f) => f.severity === "HIGH") ? "HIGH" : "INFO",
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

  const updateAnswer = (index: number, value: number) => {
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, value } : a)));
  };

  const resetAnswers = () => {
    setAnswers(DEFAULT_ANSWERS);
    setFindings([]);
    setFormulaSteps([]);
    setSummary(null);
    setHasOutput(false);
    setSaveMsg(null);
    setError(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Fast Diagnostic Simulator</h1>
        <p className="text-sm text-white/35">
          Run the Fast Diagnostic engine with synthetic inputs. Validates inputs, computes deterministic scores, and captures formula traces.
        </p>
      </div>

      <SimulationShell
        title="Fast Diagnostic"
        moduleId="scenario-workbench"
        engineStatus="PRODUCTION_CALLABLE"
        onRun={handleRun}
        onSave={handleSave}
        running={running}
        hasOutput={hasOutput}
        inputsSlot={
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-mono uppercase tracking-wider text-white/20">Diagnostic Answers (1–5)</p>
              <button
                onClick={resetAnswers}
                className="text-[10px] text-white/25 hover:text-white/45 font-mono transition-colors"
              >
                Reset
              </button>
            </div>
            {answers.map((answer, i) => (
              <div key={`${answer.sectionId}-${answer.questionId}`} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-white/30 uppercase">{SECTION_LABELS[answer.sectionId] ?? answer.sectionId}</span>
                    <span className="text-[10px] font-mono text-white/15 ml-2">({answer.questionId})</span>
                  </div>
                  <span className="text-xs font-mono text-amber-400/80">{answer.value}/5</span>
                </div>
                <p className="text-[11px] text-white/50">{answer.prompt}</p>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={answer.value}
                  onChange={(e) => updateAnswer(i, Number(e.target.value))}
                  className="h-1 w-full cursor-pointer appearance-none rounded-lg bg-white/10 accent-amber-500"
                />
              </div>
            ))}
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
              <FindingsList findings={findings} />
            </div>
          ) : (
            <p className="text-xs text-white/25 italic">Run the engine to see output.</p>
          )
        }
        checksSlot={
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className={answers.length >= 3 ? "text-emerald-400" : "text-red-400"}>
                {answers.length >= 3 ? "✓" : "✗"}
              </span>
              <span className="text-white/50">Minimum 3 answers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={answers.every((a) => a.value >= 1 && a.value <= 5) ? "text-emerald-400" : "text-red-400"}>
                {answers.every((a) => a.value >= 1 && a.value <= 5) ? "✓" : "✗"}
              </span>
              <span className="text-white/50">All values 1–5</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={new Set(answers.map((a) => a.sectionId)).size >= 1 ? "text-emerald-400" : "text-red-400"}>
                {new Set(answers.map((a) => a.sectionId)).size >= 1 ? "✓" : "✗"}
              </span>
              <span className="text-white/50">At least 1 section</span>
            </div>
          </div>
        }
        formulaSlot={
          <FormulaInspector
            mode="hybrid"
            findings={findings}
            formulaSteps={formulaSteps}
            title="Engine Trace"
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

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>
      )}
    </div>
  );
}
