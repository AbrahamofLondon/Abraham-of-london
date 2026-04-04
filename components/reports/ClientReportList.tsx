/* components/reports/ClientReportList.tsx */
"use client";

import * as React from "react";
import { FileText, Download, Clock3, CheckCircle2, AlertTriangle } from "lucide-react";

type ReportRow = {
  id: string;
  reference: string;
  title: string;
  packageKey: string;
  amountGbp: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  reportUrl: string | null;
};

function statusTone(status: string) {
  const s = String(status || "").toLowerCase();
  if (s === "delivered") return "text-emerald-700 bg-emerald-50 border-emerald-100";
  if (s === "paid" || s === "queued" || s === "in_progress") return "text-blue-700 bg-blue-50 border-blue-100";
  if (s === "failed" || s === "cancelled") return "text-red-700 bg-red-50 border-red-100";
  return "text-amber-700 bg-amber-50 border-amber-100";
}

export default function ClientReportList({ reports }: { reports: ReportRow[] }) {
  if (!reports.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <AlertTriangle size={28} className="mx-auto mb-4 text-gray-200" />
        <p className="font-serif text-lg italic text-gray-500">
          No report requests yet.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {reports.map((report) => (
        <div key={report.id} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700">
                <FileText size={14} />
                {report.packageKey}
              </div>

              <h3 className="mt-3 font-serif text-2xl italic text-gray-900">
                {report.title}
              </h3>

              <div className="mt-3 text-sm text-gray-600">
                Ref: <span className="font-mono">{report.reference}</span>
              </div>

              <div className="mt-2 text-sm text-gray-500">
                Requested on {new Date(report.createdAt).toLocaleString("en-GB")}
              </div>
            </div>

            <div className="flex flex-col gap-3 md:items-end">
              <span
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] ${statusTone(report.status)}`}
              >
                {report.status.replace(/_/g, " ")}
              </span>

              <div className="text-lg font-serif text-gray-900">£{report.amountGbp}</div>

              {report.reportUrl ? (
                <a
                  href={report.reportUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-blue-700"
                >
                  <Download size={14} />
                  Download
                </a>
              ) : null}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-gray-100 pt-4 text-[10px] uppercase tracking-[0.18em] text-gray-400">
            <span className="inline-flex items-center gap-2">
              <Clock3 size={12} />
              Paid: {report.paidAt ? new Date(report.paidAt).toLocaleDateString("en-GB") : "No"}
            </span>

            <span className="inline-flex items-center gap-2">
              <CheckCircle2 size={12} />
              Delivered: {report.deliveredAt ? new Date(report.deliveredAt).toLocaleDateString("en-GB") : "Pending"}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}