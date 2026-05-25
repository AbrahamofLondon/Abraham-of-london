// app/admin/intelligence-foundry/runs/[id]/page.tsx
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ResearchRunDetail } from "@/components/research/ResearchRunDetail";
import Link from "next/link";
import type { ResearchRun, ActionBrief } from "@/lib/research/foundry-contract";

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const [run, setRun] = React.useState<ResearchRun | null>(null);
  const [brief, setBrief] = React.useState<ActionBrief | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);

  const loadRun = React.useCallback(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/admin/intelligence-foundry/runs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) setRun(data.run);
        else setError(data.error ?? "Run not found");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => { loadRun(); }, [loadRun]);

  async function handleExportBrief() {
    const r = await fetch(`/api/admin/intelligence-foundry/runs/${id}/export-brief`, { method: "POST" });
    const data = await r.json();
    if (data.ok) setBrief(data.brief);
  }

  async function handleImplement() {
    const r = await fetch(`/api/admin/intelligence-foundry/runs/${id}/implement`, { method: "POST" });
    const data = await r.json();
    if (data.ok) { setActionMsg("Marked as implemented."); loadRun(); }
    else setActionMsg(data.error ?? "Error");
  }

  async function handleDefer(reason: string) {
    const r = await fetch(`/api/admin/intelligence-foundry/runs/${id}/defer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deferredReason: reason }),
    });
    const data = await r.json();
    if (data.ok) { setActionMsg("Deferred."); loadRun(); }
    else setActionMsg(data.error ?? "Error");
  }

  async function handleArchive() {
    const r = await fetch(`/api/admin/intelligence-foundry/runs/${id}/archive`, { method: "POST" });
    const data = await r.json();
    if (data.ok) { setActionMsg("Archived."); loadRun(); }
    else setActionMsg(data.error ?? "Archive blocked: " + (data.error ?? ""));
  }

  if (loading) return <div className="p-6 text-xs text-white/30 animate-pulse">Loading run…</div>;
  if (error) return (
    <div className="p-6">
      <Link href="/admin/intelligence-foundry/runs" className="text-xs text-white/25 hover:text-white/45">← Vault</Link>
      <p className="mt-4 text-sm text-red-400">{error}</p>
    </div>
  );
  if (!run) return null;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <Link href="/admin/intelligence-foundry/runs" className="text-[11px] text-white/25 hover:text-white/45 font-mono">
        ← Research Run Vault
      </Link>

      {actionMsg && (
        <div className="rounded-lg border border-white/10 bg-white/3 px-4 py-2.5 text-xs text-white/60">
          {actionMsg}
        </div>
      )}

      <ResearchRunDetail
        run={run}
        brief={brief}
        onExportBrief={handleExportBrief}
        onImplement={handleImplement}
        onDefer={handleDefer}
        onArchive={handleArchive}
      />
    </div>
  );
}
