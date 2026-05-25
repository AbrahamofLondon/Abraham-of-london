// app/admin/intelligence-foundry/engines/page.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { EngineStatusCard } from "@/components/research/EngineStatusCard";
import type { EngineRegistryEntry } from "@/lib/research/engine-adapter-contract";

type AdapterRequestState =
  | { status: "idle" }
  | { status: "loading"; engineId: string }
  | { status: "success"; engineId: string; runId: string }
  | { status: "error"; engineId: string; message: string };

export default function EngineTestingRangePage() {
  const [engines, setEngines] = React.useState<EngineRegistryEntry[]>([]);
  const [summary, setSummary] = React.useState<Record<string, number>>({});
  const [loading, setLoading] = React.useState(true);
  const [adapterRequest, setAdapterRequest] = React.useState<AdapterRequestState>({ status: "idle" });

  React.useEffect(() => {
    fetch("/api/admin/intelligence-foundry/engines")
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setEngines(data.engines ?? []);
          setSummary(data.summary ?? {});
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleRequestAdapter = async (engineId: string) => {
    setAdapterRequest({ status: "loading", engineId });

    try {
      const res = await fetch("/api/admin/intelligence-foundry/engines/request-adapter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engineId }),
      });

      const data = await res.json();
      if (data.ok) {
        setAdapterRequest({ status: "success", engineId, runId: data.run?.id ?? "unknown" });
      } else {
        setAdapterRequest({ status: "error", engineId, message: data.error ?? "Request failed" });
      }
    } catch (err) {
      setAdapterRequest({
        status: "error",
        engineId,
        message: err instanceof Error ? err.message : "Network error",
      });
    }
  };

  const callable = engines.filter((e) => e.status === "PRODUCTION_CALLABLE");
  const needsWrap = engines.filter((e) => e.status === "PRODUCTION_NEEDS_WRAP");
  const humanProcess = engines.filter((e) => e.status === "HUMAN_PROCESS");
  const docsOnly = engines.filter((e) => e.status === "DOCUMENTATION_ONLY");
  const decommissioned = engines.filter((e) => e.status === "DECOMMISSIONED");

  return (
    <div className="space-y-8 p-6">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Engine Testing Range</h1>
        <p className="text-sm text-white/35 max-w-xl">
          Engine registry with live status. Request adapters for engines that need wrapping.
          Adapter requests create ACTION_REQUIRED ResearchRuns visible in the Vault and Trash Day queue.
        </p>
      </div>

      {/* Summary bar */}
      {!loading && (
        <div className="flex flex-wrap gap-4 rounded-xl border border-white/8 bg-white/2 p-4">
          {[
            { label: "Callable", count: summary["callable"] ?? callable.length, color: "text-emerald-400" },
            { label: "Needs Adapter", count: summary["needsWrap"] ?? needsWrap.length, color: "text-yellow-400" },
            { label: "Human Process", count: summary["humanProcess"] ?? humanProcess.length, color: "text-blue-400" },
            { label: "Docs Only", count: summary["documentationOnly"] ?? docsOnly.length, color: "text-white/30" },
            { label: "Decommissioned", count: summary["decommissioned"] ?? decommissioned.length, color: "text-red-400/40" },
            { label: "Total", count: summary["total"] ?? engines.length, color: "text-white/50" },
          ].map((s) => (
            <div key={s.label} className="text-center min-w-[60px]">
              <p className={`text-lg font-semibold font-mono ${s.color}`}>{s.count}</p>
              <p className="text-[10px] font-mono text-white/25 uppercase">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Adapter request notification */}
      {adapterRequest.status === "success" && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-400">
          Adapter request created — ResearchRun{" "}
          <span className="font-mono">{adapterRequest.runId}</span> is now ACTION_REQUIRED in the{" "}
          <Link href="/admin/intelligence-foundry/runs" className="underline underline-offset-2">
            Vault
          </Link>{" "}
          and{" "}
          <Link href="/admin/intelligence-foundry/trash-day" className="underline underline-offset-2">
            Trash Day
          </Link>
          .
        </div>
      )}

      {adapterRequest.status === "error" && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">
          Request failed: {adapterRequest.message}
        </div>
      )}

      {loading && (
        <p className="text-xs text-white/25 italic">Loading engine registry…</p>
      )}

      {/* Callable */}
      {callable.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-emerald-400/60">
            Production Callable — {callable.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {callable.map((engine) => (
              <EngineStatusCard key={engine.id} engine={engine} />
            ))}
          </div>
        </section>
      )}

      {/* Needs adapter */}
      {needsWrap.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-yellow-400/60">
            Needs Adapter — {needsWrap.length}
          </h2>
          <p className="text-[11px] text-white/25">
            These engines have production logic but no Foundry adapter. Use &ldquo;Request Adapter&rdquo; to open an ACTION_REQUIRED run.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {needsWrap.map((engine) => (
              <EngineStatusCard
                key={engine.id}
                engine={engine}
                onRequestAdapter={handleRequestAdapter}
              />
            ))}
          </div>
        </section>
      )}

      {/* Human process */}
      {humanProcess.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-blue-400/60">
            Human Process — {humanProcess.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {humanProcess.map((engine) => (
              <EngineStatusCard
                key={engine.id}
                engine={engine}
                onRequestAdapter={handleRequestAdapter}
              />
            ))}
          </div>
        </section>
      )}

      {/* Documentation only */}
      {docsOnly.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-white/20">
            Documentation Only — {docsOnly.length}
          </h2>
          <p className="text-[11px] text-white/20">
            Architecture documented. No callable logic implemented. Adapter requests not available
            until implementation is in progress.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {docsOnly.map((engine) => (
              <EngineStatusCard key={engine.id} engine={engine} />
            ))}
          </div>
        </section>
      )}

      {/* Decommissioned */}
      {decommissioned.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-[10px] font-mono uppercase tracking-widest text-red-400/30">
            Decommissioned — {decommissioned.length}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {decommissioned.map((engine) => (
              <EngineStatusCard key={engine.id} engine={engine} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
