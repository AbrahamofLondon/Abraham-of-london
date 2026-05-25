"use client";

import * as React from "react";
import { SeverityBadge } from "./SeverityBadge";
import { RunStatusBadge } from "./RunStatusBadge";
import { FindingsList } from "./FindingsList";
import { FormulaInspector } from "./FormulaInspector";
import { DemoDisclaimer } from "./DemoDisclaimer";
import { ActionBriefPreview } from "./ActionBriefPreview";
import type { ResearchRun, ActionBrief, Finding } from "@/lib/research/foundry-contract";

type ResearchRunDetailProps = {
  run: ResearchRun;
  onArchive?: () => void;
  onImplement?: () => void;
  onDefer?: (reason: string) => void;
  onExportBrief?: () => void;
  brief?: ActionBrief | null;
};

export function ResearchRunDetail({
  run,
  onArchive,
  onImplement,
  onDefer,
  onExportBrief,
  brief,
}: ResearchRunDetailProps) {
  const [showDefer, setShowDefer] = React.useState(false);
  const [deferReason, setDeferReason] = React.useState("");

  const findings: Finding[] = (() => {
    try { return run.findingsJson ? JSON.parse(run.findingsJson) : []; }
    catch { return []; }
  })();

  const canArchive =
    run.status !== "ARCHIVED" &&
    (run.severity !== "HIGH" && run.severity !== "CRITICAL" ||
      run.implementedAt != null ||
      (run.deferredReason != null && run.deferredReason.trim().length > 0) ||
      run.decisionOutcome != null);

  return (
    <div className="space-y-6">
      {run.isDemo && <DemoDisclaimer moduleName={run.module} />}

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <SeverityBadge severity={run.severity} />
            <RunStatusBadge status={run.status} />
          </div>
          <h2 className="text-lg font-semibold text-white/85">{run.title}</h2>
          <p className="text-xs text-white/35 font-mono mt-0.5">
            {run.module} · v{run.moduleVersion} · {run.runType}
          </p>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {onExportBrief && (
            <button onClick={onExportBrief} className="rounded border border-white/15 px-3 py-1.5 text-xs text-white/50 hover:text-white/70 hover:border-white/25 transition-colors">
              Export Brief
            </button>
          )}
          {onImplement && run.status !== "IMPLEMENTED" && (
            <button onClick={onImplement} className="rounded border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs text-emerald-400 hover:bg-emerald-500/15 transition-colors">
              Mark Implemented
            </button>
          )}
          {onDefer && !showDefer && run.status !== "DEFERRED" && (
            <button onClick={() => setShowDefer(true)} className="rounded border border-white/15 px-3 py-1.5 text-xs text-white/40 hover:text-white/60 transition-colors">
              Defer
            </button>
          )}
          {onArchive && canArchive && run.status !== "ARCHIVED" && (
            <button onClick={onArchive} className="rounded border border-white/10 px-3 py-1.5 text-xs text-white/25 hover:text-white/40 transition-colors">
              Archive
            </button>
          )}
          {!canArchive && run.status !== "ARCHIVED" && (
            <span className="rounded border border-red-500/20 px-3 py-1.5 text-xs text-red-400/50 cursor-not-allowed" title="HIGH/CRITICAL requires a decision path before archiving">
              Archive blocked
            </span>
          )}
        </div>
      </div>

      {showDefer && onDefer && (
        <div className="rounded-lg border border-white/10 bg-white/3 p-4 space-y-3">
          <p className="text-xs text-white/50">State your deferral reason (minimum 20 characters):</p>
          <textarea
            value={deferReason}
            onChange={(e) => setDeferReason(e.target.value)}
            className="w-full rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 resize-none"
            rows={3}
            placeholder="Why is this being deferred? What are the conditions for revisiting?"
          />
          <div className="flex gap-2">
            <button
              onClick={() => { onDefer(deferReason); setShowDefer(false); }}
              disabled={deferReason.trim().length < 20}
              className="rounded border border-white/20 px-3 py-1.5 text-xs text-white/60 disabled:opacity-30 disabled:cursor-not-allowed hover:enabled:border-white/30 transition-colors"
            >
              Confirm Deferral
            </button>
            <button onClick={() => setShowDefer(false)} className="text-xs text-white/25 hover:text-white/40 px-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {run.recommendation && (
        <div className="rounded-lg border border-white/8 bg-white/3 p-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-white/30 mb-2">Recommendation</p>
          <p className="text-sm text-white/65">{run.recommendation}</p>
        </div>
      )}

      {findings.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-white/30 mb-3">
            Findings ({findings.length})
          </p>
          <FindingsList findings={findings} />
          <div className="mt-3">
            <FormulaInspector findings={findings} />
          </div>
        </div>
      )}

      {brief && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-white/30 mb-3">Action Brief</p>
          <ActionBriefPreview brief={brief} />
        </div>
      )}

      <div className="border-t border-white/8 pt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] font-mono">
        {[
          ["Actor", run.actorEmail ?? run.actorId ?? "—"],
          ["Created", new Date(run.createdAt).toLocaleString("en-GB")],
          ["Updated", new Date(run.updatedAt).toLocaleString("en-GB")],
          ["Run ID", run.id],
          ["Schema", run.schemaVersion],
          ["Resurrections", String(run.resurrectionCount)],
          run.implementedAt ? ["Implemented", new Date(run.implementedAt).toLocaleDateString("en-GB")] : null,
          run.archivedAt ? ["Archived", new Date(run.archivedAt).toLocaleDateString("en-GB")] : null,
          run.deferredReason ? ["Deferred Reason", run.deferredReason] : null,
        ]
          .filter((x): x is [string, string] => x != null)
          .map(([label, value]) => (
            <div key={label as string}>
              <span className="text-white/20">{label}: </span>
              <span className="text-white/45">{value as string}</span>
            </div>
          ))}
      </div>
    </div>
  );
}
