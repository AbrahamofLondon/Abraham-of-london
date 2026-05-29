// app/admin/intelligence-foundry/runs/page.tsx
"use client";

import * as React from "react";
import { ResearchRunVault } from "@/components/research/ResearchRunVault";
import Link from "next/link";
import type { ResearchRun } from "@/lib/research/foundry-contract";

export default function RunsVaultPage() {
  const [runs, setRuns] = React.useState<ResearchRun[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/admin/intelligence-foundry/runs?limit=100&includeArchived=false")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setRuns(data.runs ?? []);
        else setError(data.error ?? "Failed to load runs");
      })
      .catch(() => setError("Network error loading runs"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
            ← Foundry
          </Link>
          <h1 className="mt-1 text-lg font-semibold text-white/80">Research Run Vault</h1>
          <p className="text-sm text-white/35">Complete ledger of all ResearchRuns.</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          {error}
        </div>
      )}

      <ResearchRunVault runs={runs} loading={loading} />
    </div>
  );
}
