"use client";

import Link from "next/link";
import { SeverityBadge } from "./SeverityBadge";
import { RunStatusBadge } from "./RunStatusBadge";
import type { ResearchRun } from "@/lib/research/foundry-contract";

export function ResearchRunCard({ run }: { run: ResearchRun }) {
  const findings: any[] = (() => {
    try { return run.findingsJson ? JSON.parse(run.findingsJson) : []; }
    catch { return []; }
  })();

  return (
    <Link
      href={`/admin/intelligence-foundry/runs/${run.id}`}
      className="block rounded-xl border border-white/8 bg-white/2 p-4 transition-colors hover:border-white/15 hover:bg-white/4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <SeverityBadge severity={run.severity} />
            <RunStatusBadge status={run.status} />
            {run.maturityStage && (
              <span className={`rounded px-1.5 py-0.5 text-[9px] font-mono uppercase ${
                run.maturityStage === "LIVE_GOVERNED"  ? "bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/15" :
                run.maturityStage === "PILOT_READY"    ? "bg-violet-500/10 text-violet-400/70 border border-violet-500/15" :
                run.maturityStage === "SIMULATION_ONLY"? "bg-purple-500/10 text-purple-400/60 border border-purple-500/12" :
                "bg-white/5 text-white/30 border border-white/8"
              }`}>
                {run.maturityStage === "LIVE_GOVERNED" ? "Live" :
                 run.maturityStage === "PILOT_READY"   ? "Pilot" :
                 run.maturityStage === "SIMULATION_ONLY" ? "Sim" :
                 run.maturityStage === "RESERVED_CONCEPT" ? "Reserved" : run.maturityStage}
              </span>
            )}
            {run.promotionDecision && (
              <span className="rounded bg-amber-500/8 px-1.5 py-0.5 text-[9px] font-mono text-amber-400/60 border border-amber-500/12">
                {run.promotionDecision}
              </span>
            )}
            {run.isDemo && (
              <span className="rounded bg-purple-500/15 px-1.5 py-0.5 text-[9px] font-mono text-purple-400">
                DEMO
              </span>
            )}
          </div>
          <h3 className="text-sm font-medium text-white/75 mt-1.5 truncate">{run.title}</h3>
          <p className="text-[11px] text-white/30 font-mono mt-0.5">{run.module}</p>
        </div>
        <div className="text-[11px] text-white/20 font-mono shrink-0">
          {new Date(run.createdAt).toLocaleDateString("en-GB")}
        </div>
      </div>

      {findings.length > 0 && (
        <p className="mt-2 text-[11px] text-white/30">
          {findings.length} finding{findings.length !== 1 ? "s" : ""}
        </p>
      )}

      {run.recommendation && (
        <p className="mt-2 text-xs text-white/45 line-clamp-2">{run.recommendation}</p>
      )}
    </Link>
  );
}
