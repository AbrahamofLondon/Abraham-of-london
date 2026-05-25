// app/admin/intelligence-foundry/trash-day/page.tsx
"use client";

import * as React from "react";
import { TrashDayQueue } from "@/components/research/TrashDayQueue";
import Link from "next/link";
import type { ResearchRun } from "@/lib/research/foundry-contract";

type TrashDayItem = ResearchRun & { ageInDays: number; trashReason: string };

export default function TrashDayPage() {
  const [items, setItems] = React.useState<TrashDayItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [msg, setMsg] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    fetch("/api/admin/intelligence-foundry/trash-day")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setItems(d.items ?? []);
        else setError(d.error ?? "Failed to load trash day queue");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, []);

  React.useEffect(() => { load(); }, [load]);

  async function handleAction(id: string, action: "implement" | "defer" | "archive", reason?: string) {
    const url = `/api/admin/intelligence-foundry/runs/${id}/${action}`;
    const body = action === "defer" ? JSON.stringify({ deferredReason: reason ?? "Escalated via Trash Day — requires owner review" }) : undefined;
    const r = await fetch(url, {
      method: "POST",
      headers: body ? { "Content-Type": "application/json" } : {},
      body,
    });
    const data = await r.json();
    if (data.ok) { setMsg(`Run ${action}d.`); load(); }
    else setMsg(data.error ?? `Error: ${action}`);
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <Link href="/admin/intelligence-foundry" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
          ← Foundry
        </Link>
        <h1 className="mt-1 text-lg font-semibold text-white/80">Trash Day</h1>
        <p className="text-sm text-white/35">
          Stale unresolved findings that need a decision — not burial.
        </p>
      </div>

      {msg && (
        <div className="rounded-lg border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white/60">{msg}</div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-400">{error}</div>
      )}

      {loading ? (
        <p className="text-xs text-white/25 animate-pulse">Loading queue…</p>
      ) : (
        <TrashDayQueue
          items={items}
          onImplement={(id) => handleAction(id, "implement")}
          onDefer={(id) => handleAction(id, "defer", "Deferred via Trash Day — requires owner review")}
          onEscalate={(id) => handleAction(id, "defer", "Escalated to owner — requires decision")}
          onArchive={(id) => handleAction(id, "archive")}
        />
      )}
    </div>
  );
}
