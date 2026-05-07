/* components/reports/ClientReportRequestPanel.tsx */
"use client";

import * as React from "react";
import { ArrowRight, FileText, Loader2, ShieldCheck } from "lucide-react";
import { REPORT_PACKAGES } from "@/lib/reports/catalogue";

type Props = {
  diagnostics: Array<{
    id: string;
    diagnosticType: string;
    score: number | null;
    createdAt: string;
    verdict: string | null;
  }>;
};

export default function ClientReportRequestPanel({ diagnostics }: Props) {
  const [packageKey, setPackageKey] = React.useState<string>(REPORT_PACKAGES[0]?.key || "");
  const [diagnosticRecordId, setDiagnosticRecordId] = React.useState<string>(
    diagnostics[0]?.id || "",
  );
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const res = await fetch("/api/reports/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageKey, diagnosticRecordId, notes }),
      });

      const json = await res.json();

      if (!res.ok || !json?.ok) {
        setMessage(json?.reason || "REPORT_REQUEST_FAILED");
        return;
      }

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      setMessage(`Report request created: ${json.reference}`);
    } catch {
      setMessage("NETWORK_FAILURE");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-[28px] border border-blue-100 bg-white p-8 shadow-sm">
      <div className="mb-6 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.28em] text-blue-700">
        <ShieldCheck size={14} />
        Paid report engine
      </div>

      <h2 className="font-serif text-3xl italic text-gray-900">
        Commission a report from existing diagnostic reading.
      </h2>

      <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600">
        This turns stored diagnostic telemetry into a paid, structured reporting workflow.
        No duplicate form theatre. No manual re-entry nonsense.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
            Report package
          </label>
          <select
            value={packageKey}
            onChange={(e) => setPackageKey(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-900 outline-none focus:border-blue-300"
          >
            {REPORT_PACKAGES.map((pkg) => (
              <option key={pkg.key} value={pkg.key}>
                {pkg.title} — £{pkg.amountGbp}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
            Source diagnostic
          </label>
          <select
            value={diagnosticRecordId}
            onChange={(e) => setDiagnosticRecordId(e.target.value)}
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-900 outline-none focus:border-blue-300"
          >
            {diagnostics.length > 0 ? (
              diagnostics.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.diagnosticType} • {typeof d.score === "number" ? `${d.score}%` : "—"} •{" "}
                  {new Date(d.createdAt).toLocaleDateString("en-GB")}
                </option>
              ))
            ) : (
              <option value="">No diagnostic records available</option>
            )}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
            Operator notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="Add context, urgency, board sensitivity, internal politics, or decision pressure..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-4 text-sm text-gray-900 outline-none focus:border-blue-300"
          />
        </div>

        {message ? (
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading || !packageKey || !diagnosticRecordId}
          className="inline-flex items-center gap-3 rounded-full bg-black px-8 py-4 text-[10px] font-black uppercase tracking-[0.25em] text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
          Commission report
          <ArrowRight size={14} />
        </button>
      </form>
    </div>
  );
}