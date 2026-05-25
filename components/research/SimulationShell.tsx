"use client";

import * as React from "react";
import type { EngineStatus } from "@/lib/research/foundry-contract";
import { DemoDisclaimer } from "./DemoDisclaimer";

const ENGINE_STATUS_BADGE: Record<EngineStatus, { label: string; className: string }> = {
  PRODUCTION_CALLABLE: { label: "live", className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/8" },
  PRODUCTION_NEEDS_WRAP: { label: "needs wrap", className: "text-amber-400 border-amber-500/30 bg-amber-500/8" },
  DOCUMENTATION_ONLY: { label: "docs only", className: "text-white/25 border-white/10 bg-white/3" },
  HUMAN_PROCESS: { label: "human", className: "text-purple-400 border-purple-500/30 bg-purple-500/8" },
  DECOMMISSIONED: { label: "decommissioned", className: "text-red-400/50 border-red-500/20 bg-red-500/5" },
};

type SimulationShellProps = {
  title: string;
  moduleId: string;
  isDemo?: boolean;
  engineStatus?: EngineStatus;
  /** Left panel — parameter inputs */
  inputsSlot?: React.ReactNode;
  /** Centre panel — run outputs */
  outputsSlot?: React.ReactNode;
  /** Right panel — checks, validation, pass/fail */
  checksSlot?: React.ReactNode;
  /** Right panel — formula inspector */
  formulaSlot?: React.ReactNode;
  /** Right panel — save / archive / action buttons */
  actionsSlot?: React.ReactNode;
  onRun?: () => void;
  onSave?: () => void;
  running?: boolean;
  hasOutput?: boolean;
};

export function SimulationShell({
  title,
  moduleId,
  isDemo = false,
  engineStatus,
  inputsSlot,
  outputsSlot,
  checksSlot,
  formulaSlot,
  actionsSlot,
  onRun,
  onSave,
  running = false,
  hasOutput = false,
}: SimulationShellProps) {
  const isCallable = !engineStatus || engineStatus === "PRODUCTION_CALLABLE";
  const badge = engineStatus ? ENGINE_STATUS_BADGE[engineStatus] : null;
  const hasRightPanel = checksSlot || formulaSlot || actionsSlot;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/25">{moduleId}</p>
            {badge && (
              <span className={`text-[9px] font-mono uppercase tracking-wider border rounded px-1.5 py-0.5 ${badge.className}`}>
                {badge.label}
              </span>
            )}
          </div>
          <h2 className="text-base font-semibold text-white/80">{title}</h2>
        </div>
        <div className="flex gap-2 shrink-0">
          {onRun && (
            <button
              onClick={onRun}
              disabled={running || !isCallable}
              title={!isCallable ? `Engine is ${engineStatus?.toLowerCase().replace(/_/g, " ")} — not callable` : undefined}
              className="rounded border border-white/20 bg-white/5 px-4 py-1.5 text-xs text-white/60 hover:enabled:bg-white/8 hover:enabled:text-white/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {running ? "Running…" : "Run"}
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              disabled={!hasOutput}
              title={!hasOutput ? "Run the engine first to enable save" : undefined}
              className="rounded border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs text-amber-400 hover:enabled:bg-amber-500/15 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Save as ResearchRun
            </button>
          )}
        </div>
      </div>

      {isDemo && <DemoDisclaimer moduleName={title} />}

      {/* Three-panel body */}
      <div className={`grid gap-4 ${hasRightPanel ? "lg:grid-cols-[1fr_1.5fr_1fr]" : outputsSlot ? "lg:grid-cols-[1fr_2fr]" : ""}`}>
        {/* Left — Inputs */}
        {inputsSlot && (
          <div className="rounded-lg border border-white/8 bg-white/2 p-4 space-y-3">
            <p className="text-[9px] font-mono uppercase tracking-wider text-white/20">Inputs</p>
            {inputsSlot}
          </div>
        )}

        {/* Centre — Outputs */}
        {outputsSlot && (
          <div className="rounded-lg border border-white/8 bg-white/2 p-4 space-y-3">
            <p className="text-[9px] font-mono uppercase tracking-wider text-white/20">Output</p>
            {outputsSlot}
          </div>
        )}

        {/* Right — Checks / Formula / Actions */}
        {hasRightPanel && (
          <div className="space-y-3">
            {checksSlot && (
              <div className="rounded-lg border border-white/8 bg-white/2 p-4 space-y-3">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/20">Checks</p>
                {checksSlot}
              </div>
            )}
            {formulaSlot && (
              <div>
                {formulaSlot}
              </div>
            )}
            {actionsSlot && (
              <div className="rounded-lg border border-white/8 bg-white/2 p-4 space-y-2">
                <p className="text-[9px] font-mono uppercase tracking-wider text-white/20">Actions</p>
                {actionsSlot}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
