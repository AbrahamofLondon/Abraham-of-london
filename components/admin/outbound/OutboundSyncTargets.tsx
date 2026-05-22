/**
 * components/admin/outbound/OutboundSyncTargets.tsx
 *
 * Sync target selection panel shown after gate passes and before publish.
 * Lists available sync targets with their readiness, allows opt-in per target.
 *
 * Used by Facebook console (sync to X) and X console (sync to Facebook).
 * LinkedIn has no sync targets currently.
 */

import * as React from "react";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import type { SyncTargetStatus } from "@/lib/outbound/core/outbound-sync-orchestrator";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundSyncTargetsProps = {
  primaryProvider: string;
  targets: SyncTargetStatus[];
  selectedTargets: string[];
  onToggle: (provider: string, checked: boolean) => void;
  disabled?: boolean;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OutboundSyncTargets({
  primaryProvider,
  targets,
  selectedTargets,
  onToggle,
  disabled = false,
}: OutboundSyncTargetsProps) {
  if (targets.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center gap-2">
        <ArrowRight className="h-4 w-4 text-white/30" />
        <h3 className="text-[11px] font-medium uppercase tracking-widest text-white/40">
          Sync to
        </h3>
      </div>

      <div className="space-y-2">
        {targets.map((target) => {
          const isSelected = selectedTargets.includes(target.provider);
          const canSelect = target.supported && target.ready && !disabled;

          return (
            <label
              key={target.provider}
              className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all ${
                !canSelect
                  ? "cursor-not-allowed border-white/5 bg-white/[0.01] opacity-50"
                  : isSelected
                    ? "cursor-pointer border-blue-500/25 bg-blue-500/8"
                    : "cursor-pointer border-white/8 bg-white/[0.02] hover:border-white/14"
              }`}
            >
              <input
                type="checkbox"
                checked={isSelected}
                disabled={!canSelect}
                onChange={(e) => onToggle(target.provider, e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/40"
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-white/80">
                    {target.label}
                  </span>
                  {target.ready ? (
                    <span className="flex items-center gap-1 text-[9px] text-emerald-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[9px] text-white/25">
                      <XCircle className="h-3 w-3" />
                      Not connected
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[10px] text-white/30">
                  {primaryProvider} → {target.label}
                  {!target.ready && " — connect first to enable sync"}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <p className="mt-3 text-[10px] text-white/25">
        Sync runs after the primary post succeeds. Sync failure does not roll back the primary post.
      </p>
    </div>
  );
}
