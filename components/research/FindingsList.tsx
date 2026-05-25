"use client";

import { SeverityBadge } from "./SeverityBadge";
import type { Finding } from "@/lib/research/foundry-contract";

export function FindingsList({ findings, showSource = true }: { findings: Finding[]; showSource?: boolean }) {
  if (findings.length === 0) {
    return (
      <p className="text-xs text-white/25 italic">No findings recorded.</p>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map((finding) => (
        <div
          key={finding.id}
          className="rounded-lg border border-white/8 bg-white/3 p-4"
          data-testid={`finding-${finding.id}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <SeverityBadge severity={finding.severity} />
                {finding.isDemo && (
                  <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-mono text-purple-400">
                    DEMO
                  </span>
                )}
              </div>
              <h4 className="text-sm font-medium text-white/80">{finding.title}</h4>
              <p className="mt-1 text-xs text-white/50">{finding.description}</p>
              {showSource && (
                <p className="mt-1.5 text-[11px] text-white/30 font-mono">
                  Source: {finding.source}
                </p>
              )}
            </div>
          </div>
          {finding.remediation && (
            <div className="mt-3 rounded bg-white/3 px-3 py-2 border border-white/5">
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-mono mb-1">Remediation</p>
              <p className="text-xs text-white/60">{finding.remediation}</p>
            </div>
          )}
          {finding.evidence && (
            <div className="mt-2 rounded bg-white/3 px-3 py-2 border border-white/5">
              <p className="text-[11px] text-white/40 uppercase tracking-wider font-mono mb-1">Evidence</p>
              <p className="text-xs text-white/60 font-mono">{finding.evidence}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
