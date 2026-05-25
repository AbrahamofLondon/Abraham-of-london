"use client";

import * as React from "react";
import { ResearchRunCard } from "./ResearchRunCard";
import type { ResearchRun, RunStatus, RunSeverity } from "@/lib/research/foundry-contract";

type ResearchRunVaultProps = {
  runs: ResearchRun[];
  loading?: boolean;
};

const STATUS_OPTIONS: { label: string; value: RunStatus | "" }[] = [
  { label: "All statuses", value: "" },
  { label: "Pending", value: "PENDING" },
  { label: "Action Required", value: "ACTION_REQUIRED" },
  { label: "Owner Decision", value: "OWNER_DECISION_REQUIRED" },
  { label: "Complete", value: "COMPLETE" },
  { label: "Implemented", value: "IMPLEMENTED" },
  { label: "Deferred", value: "DEFERRED" },
  { label: "Archived", value: "ARCHIVED" },
];

const SEVERITY_OPTIONS: { label: string; value: RunSeverity | "" }[] = [
  { label: "All severities", value: "" },
  { label: "Critical", value: "CRITICAL" },
  { label: "High", value: "HIGH" },
  { label: "Medium", value: "MEDIUM" },
  { label: "Low", value: "LOW" },
  { label: "Info", value: "INFO" },
];

export function ResearchRunVault({ runs, loading }: ResearchRunVaultProps) {
  const [statusFilter, setStatusFilter] = React.useState<RunStatus | "">("");
  const [severityFilter, setSeverityFilter] = React.useState<RunSeverity | "">("");
  const [search, setSearch] = React.useState("");

  const filtered = runs.filter((run) => {
    if (statusFilter && run.status !== statusFilter) return false;
    if (severityFilter && run.severity !== severityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        run.title.toLowerCase().includes(q) ||
        run.module.toLowerCase().includes(q) ||
        (run.recommendation ?? "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search runs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white/70 placeholder:text-white/20 focus:outline-none focus:border-white/30 w-full max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RunStatus | "")}
          className="rounded border border-white/15 bg-[#0d0d0d] px-3 py-1.5 text-xs text-white/50 focus:outline-none"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => setSeverityFilter(e.target.value as RunSeverity | "")}
          className="rounded border border-white/15 bg-[#0d0d0d] px-3 py-1.5 text-xs text-white/50 focus:outline-none"
        >
          {SEVERITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-xs text-white/25 animate-pulse">Loading runs…</p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="text-xs text-white/25 italic py-6 text-center">
          {runs.length === 0 ? "No research runs yet." : "No runs match the current filters."}
        </p>
      )}

      <div className="space-y-2">
        {filtered.map((run) => (
          <ResearchRunCard key={run.id} run={run} />
        ))}
      </div>

      {filtered.length > 0 && (
        <p className="text-[11px] text-white/20 font-mono">
          {filtered.length} of {runs.length} runs
        </p>
      )}
    </div>
  );
}
