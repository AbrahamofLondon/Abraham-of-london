// app/client/reports/[reportId]/page.tsx
// Secure client-facing Executive Report page.
// Token-authenticated. Tracks views. Supports revocation.

"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";

type ReportData = {
  id: string;
  state: string;
  narrative: { headline: string; summary: string; mandate: string };
  financialExposure: { totalExposure: number; replacementCost: number; executionLoss: number };
  priorityStack: string[];
  failureModes: string[];
  ogr: { sovereignCertainty: number; isAuthorizedToExecute: boolean };
};

type ActionItem = {
  id: string;
  finding: string;
  severity: string;
  recommendedAction: string;
  status: string;
  owner: string | null;
  dueDate: string | null;
  outcomeNote: string | null;
};

const STATE_STYLE: Record<string, string> = {
  DISORDERED: "bg-red-500/15 text-red-300 border-red-500/20",
  MISALIGNED: "bg-amber-400/12 text-amber-300 border-amber-400/20",
  ORDERED: "bg-emerald-400/12 text-emerald-300 border-emerald-400/20",
};

export default function ClientReportPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const reportId = params?.reportId as string;
  const token = searchParams?.get("token") ?? "";

  const [report, setReport] = React.useState<ReportData | null>(null);
  const [actionItems, setActionItems] = React.useState<ActionItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!reportId || !token) {
      setError("Access link invalid.");
      setLoading(false);
      return;
    }

    fetch(`/api/client/reports/${reportId}?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setReport(data.report);
          setActionItems(data.actionItems ?? []);
        } else setError(data.error ?? "Access denied");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [reportId, token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-sm text-white/30 font-mono">Loading report...</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="text-6xl mb-6 opacity-20">◈</div>
          <h1 className="text-lg font-semibold text-white/60 mb-2">Executive Report</h1>
          <p className="text-sm text-white/30 mb-6">{error ?? "Report not found."}</p>
          <p className="text-xs text-white/15">Abraham of London — Restricted Access</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-widest ${STATE_STYLE[report.state] ?? ""}`}>
              {report.state}
            </span>
            <span className="text-[10px] text-white/20 font-mono">Executive Report</span>
          </div>
          <h1 className="text-xl font-serif italic text-white/80 leading-tight">
            {report.narrative.headline}
          </h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        {/* Summary */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <p className="text-sm text-white/50 leading-relaxed font-light">{report.narrative.summary}</p>
        </div>

        {/* Financial exposure */}
        <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Financial Exposure</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-[10px] text-white/30">Total</p>
              <p className="text-lg font-mono text-amber-300/80">£{Math.round(report.financialExposure.totalExposure).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30">Replacement Cost</p>
              <p className="text-lg font-mono text-white/50">£{Math.round(report.financialExposure.replacementCost).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30">Execution Loss</p>
              <p className="text-lg font-mono text-white/50">£{Math.round(report.financialExposure.executionLoss).toLocaleString()}</p>
            </div>
          </div>
          <p className="text-[9px] text-white/15 font-mono mt-2">Scenario projection — not a guarantee</p>
        </div>

        {/* Priority stack */}
        {report.priorityStack.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Priority Actions</p>
            {report.priorityStack.map((item, i) => (
              <div key={i} className="flex gap-3 mb-2">
                <span className="text-[10px] font-mono text-white/20 mt-0.5">{i + 1}.</span>
                <p className="text-sm text-white/50">{item}</p>
              </div>
            ))}
          </div>
        )}

        {/* Failure modes */}
        {report.failureModes.length > 0 && (
          <div className="rounded-lg border border-red-500/15 bg-red-500/5 p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-red-400/60 mb-3">Failure Modes</p>
            {report.failureModes.map((mode, i) => (
              <p key={i} className="text-sm text-red-400/60 mb-1">· {mode}</p>
            ))}
          </div>
        )}

        {/* Action items */}
        {actionItems.length > 0 && (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] p-5">
            <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-3">Action Items ({actionItems.length})</p>
            {actionItems.map((item) => (
              <div key={item.id} className="flex gap-3 mb-3 pb-3 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                <span className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  item.severity === "CRITICAL" ? "bg-red-500"
                  : item.severity === "HIGH" ? "bg-orange-500"
                  : "bg-amber-400"
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm text-white/60 font-medium">{item.finding}</p>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                      item.status === "open" ? "bg-amber-400/10 text-amber-400/70"
                      : item.status === "in_progress" ? "bg-blue-400/10 text-blue-400/70"
                      : item.status === "actioned" ? "bg-emerald-400/10 text-emerald-400/70"
                      : "bg-white/5 text-white/40"
                    }`}>{item.status.replace("_", " ")}</span>
                  </div>
                  <p className="text-xs text-white/40">{item.recommendedAction}</p>
                  {item.dueDate && (
                    <p className="text-[10px] text-white/25 mt-0.5">Due: {new Date(item.dueDate).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mandate */}
        <div className="rounded-lg border border-amber-400/15 bg-amber-400/5 p-5">
          <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400/60 mb-2">Required Action</p>
          <p className="text-sm text-amber-300/70 leading-relaxed">{report.narrative.mandate}</p>
        </div>

        {/* Boardroom qualification */}
        <div className="rounded-lg border border-amber-400/15 bg-amber-400/5 p-5 text-center">
          <p className="text-sm text-amber-300/70 mb-2">
            {report.ogr.isAuthorizedToExecute
              ? "This report qualifies for Boardroom escalation."
              : "This report indicates a governance gap. Strategy Room recommended."}
          </p>
          <p className="text-xs text-amber-400/50">
            Contact your advisor to schedule the next step.
          </p>
        </div>

        <div className="border-t border-white/8 pt-6 text-center">
          <p className="text-xs text-white/20 font-mono">Abraham of London — Executive Report</p>
          <p className="text-[10px] text-white/10 mt-1">Restricted. Do not distribute.</p>
        </div>
      </main>
    </div>
  );
}
