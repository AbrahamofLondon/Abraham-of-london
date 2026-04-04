"use client";

import * as React from "react";
import Link from "next/link";
import {
  Download,
  FileText,
  FileJson,
  Printer,
  ShieldCheck,
} from "lucide-react";

export default function ExecutiveReportDownloadCard({
  campaignId,
  auditStatus,
}: {
  campaignId: string;
  auditStatus?: {
    ok: boolean;
    auditId?: string;
    error?: string;
  } | null;
}) {
  return (
    <div className="border border-neutral-100 bg-neutral-50/60 p-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-[#8A6A2F]">
            Export Surface
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">
            Executive deliverables
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-neutral-600">
            Download the report as a branded PDF, export the structured JSON
            contract, or open the print workflow for internal governance use.
          </p>
        </div>

        <div className="hidden md:flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-3 py-2">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-emerald-700">
            {auditStatus?.ok ? "Audit Logged" : "Audit Pending"}
          </span>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <a
          href={`/api/campaigns/${campaignId}/report/pdf-file`}
          className="group border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <div className="flex items-center justify-between">
            <FileText className="h-5 w-5 text-[#8A6A2F]" />
            <Download className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-y-[1px]" />
          </div>
          <div className="mt-5 text-sm font-semibold text-neutral-950">
            Download PDF
          </div>
          <div className="mt-2 text-xs leading-6 text-neutral-500">
            Branded executive report with cover, narrative, matrix, and exposure summary.
          </div>
        </a>

        <a
          href={`/api/campaigns/${campaignId}/report/json`}
          className="group border border-neutral-200 bg-white p-5 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <div className="flex items-center justify-between">
            <FileJson className="h-5 w-5 text-[#8A6A2F]" />
            <Download className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-y-[1px]" />
          </div>
          <div className="mt-5 text-sm font-semibold text-neutral-950">
            Export JSON
          </div>
          <div className="mt-2 text-xs leading-6 text-neutral-500">
            Structured machine-readable report contract for pipelines, storage, or downstream analysis.
          </div>
        </a>

        <button
          type="button"
          onClick={() => window.print()}
          className="group border border-neutral-200 bg-white p-5 text-left transition-colors hover:border-neutral-300 hover:bg-neutral-50"
        >
          <div className="flex items-center justify-between">
            <Printer className="h-5 w-5 text-[#8A6A2F]" />
            <Download className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-y-[1px]" />
          </div>
          <div className="mt-5 text-sm font-semibold text-neutral-950">
            Print View
          </div>
          <div className="mt-2 text-xs leading-6 text-neutral-500">
            Quick internal print workflow for operational review and board-room distribution.
          </div>
        </button>
      </div>

      {auditStatus ? (
        <div className="mt-6 border-t border-neutral-200 pt-4">
          <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-neutral-400">
            Audit
          </div>
          <div className="mt-2 text-sm text-neutral-700">
            {auditStatus.ok
              ? `Logged successfully${auditStatus.auditId ? ` • ${auditStatus.auditId}` : ""}`
              : `Audit write failed${auditStatus.error ? ` • ${auditStatus.error}` : ""}`}
          </div>
        </div>
      ) : null}
    </div>
  );
}