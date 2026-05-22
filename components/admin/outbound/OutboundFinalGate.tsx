/**
 * components/admin/outbound/OutboundFinalGate.tsx
 *
 * Final gate panel shown before publish. Displays gate evaluation results
 * (blockers, warnings) and the final approval checkbox.
 *
 * The parent manages the approval state and the actual form submission.
 * This component is display + checkbox only.
 */

import * as React from "react";
import { ShieldCheck, ShieldX, AlertTriangle, CheckCircle2, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundFinalGateProps = {
  /** Whether the gate has been evaluated (run) yet */
  gateRun: boolean;
  allowed: boolean;
  blockers: string[];
  warnings: string[];
  /** Whether the final approval checkbox is ticked */
  finalApproval: boolean;
  onFinalApprovalChange: (checked: boolean) => void;
  /** Shown while gate evaluation is in progress */
  isEvaluating?: boolean;
  /** If true, renders a dry-run mode note */
  dryRun?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OutboundFinalGate({
  gateRun,
  allowed,
  blockers,
  warnings,
  finalApproval,
  onFinalApprovalChange,
  isEvaluating = false,
  dryRun = false,
}: OutboundFinalGateProps) {
  if (!gateRun && !isEvaluating) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 text-center">
        <Info className="mx-auto mb-2 h-5 w-5 text-white/20" />
        <p className="text-[11px] text-white/30">Run the gate check to evaluate this draft.</p>
      </div>
    );
  }

  if (isEvaluating) {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.02] p-5 text-center">
        <p className="text-[11px] text-white/40 animate-pulse">Evaluating gate…</p>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-5 ${
      allowed
        ? "border-emerald-500/20 bg-emerald-500/5"
        : "border-rose-500/20 bg-rose-500/5"
    }`}>
      {/* Gate status header */}
      <div className="mb-4 flex items-center gap-3">
        {allowed
          ? <ShieldCheck className="h-5 w-5 text-emerald-400" />
          : <ShieldX className="h-5 w-5 text-rose-400" />
        }
        <div>
          <p className={`text-sm font-semibold ${allowed ? "text-emerald-300" : "text-rose-300"}`}>
            {allowed ? "Gate passed" : "Gate blocked"}
          </p>
          {dryRun && (
            <p className="text-[10px] text-amber-400">Dry-run mode — will not publish.</p>
          )}
        </div>
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <p className="text-[9px] font-medium uppercase tracking-widest text-rose-400/60">
            Blockers ({blockers.length})
          </p>
          {blockers.map((blocker, i) => (
            <div key={i} className="flex items-start gap-2">
              <ShieldX className="mt-0.5 h-3 w-3 shrink-0 text-rose-400" />
              <span className="text-[11px] text-rose-300">{blocker}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 space-y-1.5">
          <p className="text-[9px] font-medium uppercase tracking-widest text-amber-400/60">
            Warnings ({warnings.length})
          </p>
          {warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0 text-amber-400" />
              <span className="text-[11px] text-amber-300">{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* All clear */}
      {allowed && blockers.length === 0 && (
        <div className="mb-4 flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
          <span className="text-[11px] text-emerald-300">
            No blockers. All policy checks passed.
          </span>
        </div>
      )}

      {/* Final approval checkbox */}
      {allowed && (
        <label className="flex items-start gap-3 cursor-pointer rounded-lg border border-white/10 bg-black/20 p-3">
          <input
            type="checkbox"
            checked={finalApproval}
            onChange={(e) => onFinalApprovalChange(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500/40"
          />
          <div>
            <p className="text-[11px] font-medium text-white/80">
              I confirm this content is ready to publish.
            </p>
            <p className="mt-0.5 text-[10px] text-white/35">
              {dryRun
                ? "Dry-run only — clicking publish will validate but not post."
                : "This will post to the connected provider account. This action cannot be undone."
              }
            </p>
          </div>
        </label>
      )}
    </div>
  );
}
