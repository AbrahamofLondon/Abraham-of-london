/* components/admin/reports/ReportBuilderForm.tsx */
"use client";

import * as React from "react";

export default function ReportBuilderForm({
  item,
}: {
  item: any;
}) {
  const [state, setState] = React.useState({
    executiveSummary: item.executiveSummary || "",
    keyFindings: Array.isArray(item.keyFindings) ? item.keyFindings.join("\n") : "",
    riskSummary: item.riskSummary || "",
    correctionPriorities: Array.isArray(item.correctionPriorities)
      ? item.correctionPriorities.join("\n")
      : "",
    advisoryRecommendation: item.advisoryRecommendation || "",
    status: item.status || "queued",
  });

  const [saving, setSaving] = React.useState(false);
  const [delivering, setDelivering] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/reports/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          executiveSummary: state.executiveSummary,
          keyFindings: state.keyFindings
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
          riskSummary: state.riskSummary,
          correctionPriorities: state.correctionPriorities
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean),
          advisoryRecommendation: state.advisoryRecommendation,
          status: state.status,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setMessage(json?.reason || "SAVE_FAILED");
        return;
      }

      setMessage("Saved");
    } catch {
      setMessage("NETWORK_FAILURE");
    } finally {
      setSaving(false);
    }
  }

  async function deliver() {
    setDelivering(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/reports/${item.id}/deliver`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok || !json?.ok) {
        setMessage(json?.reason || "DELIVERY_FAILED");
        return;
      }

      setMessage(`Delivered: ${json.reportUrl}`);
      window.location.reload();
    } catch {
      setMessage("NETWORK_FAILURE");
    } finally {
      setDelivering(false);
    }
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-800 bg-slate-950 p-8 text-slate-200">
      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
          Executive Summary
        </label>
        <textarea
          rows={5}
          value={state.executiveSummary}
          onChange={(e) => setState((s) => ({ ...s, executiveSummary: e.target.value }))}
          className="w-full rounded-xl border border-slate-800 bg-black px-4 py-4 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
          Key Findings (one per line)
        </label>
        <textarea
          rows={5}
          value={state.keyFindings}
          onChange={(e) => setState((s) => ({ ...s, keyFindings: e.target.value }))}
          className="w-full rounded-xl border border-slate-800 bg-black px-4 py-4 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
          Risk Summary
        </label>
        <textarea
          rows={4}
          value={state.riskSummary}
          onChange={(e) => setState((s) => ({ ...s, riskSummary: e.target.value }))}
          className="w-full rounded-xl border border-slate-800 bg-black px-4 py-4 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
          Correction Priorities (one per line)
        </label>
        <textarea
          rows={5}
          value={state.correctionPriorities}
          onChange={(e) => setState((s) => ({ ...s, correctionPriorities: e.target.value }))}
          className="w-full rounded-xl border border-slate-800 bg-black px-4 py-4 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
          Advisory Recommendation
        </label>
        <textarea
          rows={4}
          value={state.advisoryRecommendation}
          onChange={(e) => setState((s) => ({ ...s, advisoryRecommendation: e.target.value }))}
          className="w-full rounded-xl border border-slate-800 bg-black px-4 py-4 text-sm outline-none"
        />
      </div>

      <div>
        <label className="mb-2 block text-[10px] font-black uppercase tracking-widest text-slate-500">
          Status
        </label>
        <select
          value={state.status}
          onChange={(e) => setState((s) => ({ ...s, status: e.target.value }))}
          className="w-full rounded-xl border border-slate-800 bg-black px-4 py-4 text-sm outline-none"
        >
          <option value="paid">paid</option>
          <option value="queued">queued</option>
          <option value="in_progress">in_progress</option>
          <option value="delivered">delivered</option>
          <option value="cancelled">cancelled</option>
          <option value="failed">failed</option>
        </select>
      </div>

      {message ? (
        <div className="rounded-xl border border-slate-800 bg-black px-4 py-3 text-sm">
          {message}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="rounded-full bg-blue-700 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white"
        >
          {saving ? "Saving..." : "Save Draft"}
        </button>

        <button
          onClick={deliver}
          disabled={delivering}
          className="rounded-full bg-emerald-700 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-white"
        >
          {delivering ? "Delivering..." : "Render + Deliver PDF"}
        </button>
      </div>
    </div>
  );
}