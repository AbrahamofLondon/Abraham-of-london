// app/admin/intelligence-foundry/runs/[id]/page.tsx
// Shows run detail with feedback history panel for runs that have durable feedback records.
"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { ResearchRunDetail } from "@/components/research/ResearchRunDetail";
import Link from "next/link";
import type { ResearchRun, ActionBrief } from "@/lib/research/foundry-contract";

type FeedbackRecord = {
  id:          string;
  findingId:   string;
  disposition: "ACTED" | "DISMISSED" | "DEFERRED";
  note:        string | null;
  updatedBy:   string | null;
  updatedAt:   string;
};

const DISPOSITION_STYLES: Record<string, string> = {
  ACTED:     "bg-emerald-500/8 text-emerald-400/80 border-emerald-500/20",
  DISMISSED: "bg-white/5 text-white/45 border-white/10",
  DEFERRED:  "bg-amber-500/6 text-amber-400/70 border-amber-500/15",
};

export default function RunDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();

  const [run,      setRun]      = React.useState<ResearchRun | null>(null);
  const [brief,    setBrief]    = React.useState<ActionBrief | null>(null);
  const [feedback, setFeedback] = React.useState<FeedbackRecord[]>([]);
  const [loading,  setLoading]  = React.useState(true);
  const [error,    setError]    = React.useState<string | null>(null);
  const [actionMsg, setActionMsg] = React.useState<string | null>(null);

  const loadRun = React.useCallback(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/intelligence-foundry/runs/${id}`).then((r) => r.json()),
      fetch(`/api/admin/intelligence-foundry/feedback?runId=${id}`).then((r) => r.json()).catch(() => ({ ok: false })),
    ])
      .then(([runData, fbData]) => {
        if (runData.ok) setRun(runData.run);
        else setError(runData.error ?? "Run not found");
        if (fbData.ok) setFeedback(fbData.feedback ?? []);
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

      {/* Promote this run — evidence summary + blocker gate */}
      {(() => {
        const findings: Array<{ severity: string; title: string }> = (() => {
          try { return JSON.parse(run.findingsJson ?? "[]"); } catch { return []; }
        })();
        const criticals = findings.filter((f) => f.severity === "CRITICAL");
        const highs     = findings.filter((f) => f.severity === "HIGH");
        const hasCriticalBlocker = criticals.length > 0;

        return (
          <div className={`rounded-xl border p-4 space-y-3 ${hasCriticalBlocker ? "border-red-500/20 bg-red-500/[0.04]" : "border-white/6 bg-white/[0.015]"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-0.5">Maturity Promotion</p>
                <p className="text-xs text-white/35">
                  {run.maturityStage
                    ? `Current stage: ${run.maturityStage.replace(/_/g, " ")}`
                    : "No maturity stage recorded."}
                  {" "}Capture a formal promotion decision in the promotion ledger.
                </p>
              </div>
              {hasCriticalBlocker ? (
                <span className="shrink-0 rounded border border-red-500/25 bg-red-500/10 px-2 py-1 text-[10px] font-mono text-red-400/80">
                  BLOCKED
                </span>
              ) : (
                <Link
                  href={`/admin/intelligence-foundry/promotion?runId=${id}`}
                  className="shrink-0 rounded-lg border border-amber-400/20 bg-amber-400/8 px-3 py-1.5 text-xs font-mono text-amber-400/70 hover:border-amber-400/35 hover:text-amber-400/90 transition-all"
                >
                  Promote this run →
                </Link>
              )}
            </div>

            {/* Evidence summary */}
            {findings.length > 0 && (
              <div className="border-t border-white/5 pt-3 space-y-1.5">
                <p className="text-[9px] font-mono uppercase tracking-widest text-white/18">Evidence Summary</p>
                <div className="flex gap-4 flex-wrap text-[10px] font-mono">
                  {criticals.length > 0 && (
                    <span className="text-red-400/70">{criticals.length} CRITICAL{criticals.length !== 1 ? "s" : ""}</span>
                  )}
                  {highs.length > 0 && (
                    <span className="text-orange-400/70">{highs.length} HIGH{highs.length !== 1 ? "s" : ""}</span>
                  )}
                  <span className="text-white/25">{findings.length} finding{findings.length !== 1 ? "s" : ""} total</span>
                  {run.severity && <span className="text-white/25">overall: {run.severity}</span>}
                </div>
                {hasCriticalBlocker && (
                  <p className="text-xs text-red-400/60">
                    Promotion to LIVE_GOVERNED blocked: {criticals.length} unresolved CRITICAL finding{criticals.length !== 1 ? "s" : ""}. Resolve or defer before promoting.
                  </p>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* Feedback history — only shown when durable feedback exists */}
      {feedback.length > 0 && (
        <div className="rounded-xl border border-white/8 bg-white/[0.015] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
              Finding Feedback History
            </p>
            <span className="text-[10px] font-mono text-white/20">{feedback.length} record{feedback.length !== 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {feedback.map((fb) => (
              <div key={fb.id} className="flex items-start gap-3 text-xs">
                <span
                  className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-mono uppercase border ${
                    DISPOSITION_STYLES[fb.disposition] ?? "bg-white/5 text-white/30 border-white/8"
                  }`}
                >
                  {fb.disposition}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-white/40 font-mono text-[10px] truncate">
                    finding: {fb.findingId}
                  </p>
                  {fb.note && <p className="text-white/30 mt-0.5">{fb.note}</p>}
                </div>
                <p className="shrink-0 text-[10px] text-white/20 font-mono">
                  {new Date(fb.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
