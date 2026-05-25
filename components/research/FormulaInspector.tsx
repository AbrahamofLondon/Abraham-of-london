"use client";

import * as React from "react";
import type { Finding, FormulaStep, FormulaInspectorMode } from "@/lib/research/foundry-contract";

type FormulaInspectorProps = {
  mode?: FormulaInspectorMode;
  findings?: Finding[];
  formulaSteps?: FormulaStep[];
  title?: string;
};

function FindingSourcePanel({ findings }: { findings: Finding[] }) {
  const sourced = findings.filter((f) => f.source);
  if (sourced.length === 0) return <p className="text-[11px] text-white/20 italic">No sourced findings.</p>;
  return (
    <div className="space-y-3">
      {sourced.map((finding) => (
        <div key={finding.id} className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-white/25 uppercase">{finding.severity}</span>
            <span className="text-xs text-white/55">{finding.title}</span>
          </div>
          <p className="text-[11px] font-mono text-emerald-400/70 pl-4">→ {finding.source}</p>
        </div>
      ))}
    </div>
  );
}

function LiveFormulaPanel({ steps }: { steps: FormulaStep[] }) {
  const [active, setActive] = React.useState<string | null>(null);

  if (steps.length === 0) return <p className="text-[11px] text-white/20 italic">No formula steps available.</p>;

  return (
    <div className="space-y-2">
      {steps.map((step) => {
        const isOpen = active === step.stepId;
        return (
          <div
            key={step.stepId}
            className="rounded border border-white/8 bg-white/2 overflow-hidden"
          >
            <button
              type="button"
              onClick={() => setActive(isOpen ? null : step.stepId)}
              className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-white/3 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-white/25">{step.stepId}</span>
                <span className="text-xs text-white/55">{step.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-emerald-400/80">{String(step.output)}</span>
                <span className="text-[10px] text-white/20">{isOpen ? "▲" : "▼"}</span>
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-white/8 px-3 pb-3 pt-2 space-y-2 text-[11px] font-mono">
                {Object.keys(step.inputs).length > 0 && (
                  <div>
                    <p className="text-white/20 uppercase tracking-wider mb-1">Inputs</p>
                    <div className="space-y-0.5 pl-2">
                      {Object.entries(step.inputs).map(([k, v]) => (
                        <p key={k} className="text-white/40">
                          <span className="text-white/25">{k}:</span> {String(v)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                {step.intermediate && Object.keys(step.intermediate).length > 0 && (
                  <div>
                    <p className="text-white/20 uppercase tracking-wider mb-1">Intermediate</p>
                    <div className="space-y-0.5 pl-2">
                      {Object.entries(step.intermediate).map(([k, v]) => (
                        <p key={k} className="text-white/30">
                          <span className="text-white/20">{k}:</span> {String(v)}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-amber-400/60">rule: {step.sourceRule}</p>
                <p className="text-white/15">engine: {step.engineVersion}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function FormulaInspector({
  mode = "finding-source",
  findings = [],
  formulaSteps = [],
  title = "Formula Trace",
}: FormulaInspectorProps) {
  const [open, setOpen] = React.useState(false);

  const hasContent =
    (mode === "finding-source" || mode === "hybrid") && findings.some((f) => f.source) ||
    (mode === "live-formula" || mode === "hybrid") && formulaSteps.length > 0;

  if (!hasContent) return null;

  const count =
    mode === "finding-source" ? findings.filter((f) => f.source).length
    : mode === "live-formula" ? formulaSteps.length
    : findings.filter((f) => f.source).length + formulaSteps.length;

  return (
    <div className="rounded-lg border border-white/10 bg-white/2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-[11px] font-mono uppercase tracking-wider text-white/35">
          {title} ({count})
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-white/15 uppercase">{mode}</span>
          <span className="text-[10px] text-white/25">{open ? "▲" : "▼"}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-white/8 px-4 pb-4 pt-3 space-y-4">
          {(mode === "finding-source" || mode === "hybrid") && (
            <div>
              {mode === "hybrid" && (
                <p className="text-[9px] font-mono uppercase text-white/20 mb-2 tracking-wider">Finding Sources</p>
              )}
              <FindingSourcePanel findings={findings} />
            </div>
          )}
          {(mode === "live-formula" || mode === "hybrid") && (
            <div>
              {mode === "hybrid" && (
                <p className="text-[9px] font-mono uppercase text-white/20 mb-2 tracking-wider">Formula Steps</p>
              )}
              <LiveFormulaPanel steps={formulaSteps} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
