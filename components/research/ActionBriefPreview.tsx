"use client";

import { SeverityBadge } from "./SeverityBadge";
import { RunStatusBadge } from "./RunStatusBadge";
import { FindingsList } from "./FindingsList";
import type { ActionBrief } from "@/lib/research/foundry-contract";

export function ActionBriefPreview({ brief }: { brief: ActionBrief }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-6 space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-1">
            Action Brief — {brief.module}
          </p>
          <h3 className="text-base font-semibold text-white/85">{brief.title}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeverityBadge severity={brief.severity} />
          <RunStatusBadge status={brief.status} />
        </div>
      </div>

      {brief.recommendation && (
        <div className="rounded-lg border border-white/8 bg-white/3 p-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-white/30 mb-2">Recommendation</p>
          <p className="text-sm text-white/70">{brief.recommendation}</p>
        </div>
      )}

      {brief.findings.length > 0 && (
        <div>
          <p className="text-[11px] font-mono uppercase tracking-wider text-white/30 mb-2">
            Findings ({brief.findings.length})
          </p>
          <FindingsList findings={brief.findings} />
        </div>
      )}

      {brief.blockingIssues.length > 0 && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
          <p className="text-[11px] font-mono uppercase tracking-wider text-red-400/60 mb-2">Blocking Issues</p>
          <ul className="space-y-1">
            {brief.blockingIssues.map((issue, i) => (
              <li key={i} className="text-xs text-red-300/70 flex items-start gap-2">
                <span className="mt-0.5 shrink-0 text-red-500/50">•</span>
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4 border-t border-white/8 pt-4 text-[11px] text-white/30 font-mono">
        {brief.estimatedEffort && <span>Effort: {brief.estimatedEffort}</span>}
        {brief.deferredReason && <span>Deferred: {brief.deferredReason}</span>}
        {brief.decisionOutcome && <span>Decision: {brief.decisionOutcome}</span>}
        <span className="ml-auto">Exported: {new Date(brief.exportedAt).toLocaleDateString("en-GB")}</span>
      </div>
    </div>
  );
}
