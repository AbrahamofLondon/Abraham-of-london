/* components/diagnostics/report/ReportVersionHistory.tsx */
import * as React from "react";
import { Download, FileClock, Archive } from "lucide-react";

type ReportVersionHistoryProps = {
  diagnosticRef: string;
  reports: Array<{
    reportId: string;
    version: string;
    generatedAt: string;
    htmlPath?: string | null;
    pdfPath?: string | null;
    archivedArtifactId?: string | null;
    archivedAt?: string | null;
  }>;
};

export default function ReportVersionHistory({
  diagnosticRef,
  reports,
}: ReportVersionHistoryProps) {
  if (!reports.length) return null;

  return (
    <section className="border border-white/[0.08] bg-white/[0.02] p-8">
      <div className="flex items-center gap-3">
        <FileClock className="h-5 w-5 text-amber-400/75" />
        <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300/70">
          Report Archive
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {reports.map((report) => (
          <div
            key={`${report.reportId}-${report.version}`}
            className="border border-white/6 bg-black/20 p-4"
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-serif text-xl text-white">
                  Version {report.version}
                </div>
                <div className="mt-1 text-sm text-white/50">
                  Generated{" "}
                  {report.generatedAt
                    ? new Date(report.generatedAt).toLocaleString("en-GB")
                    : "—"}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {report.archivedArtifactId ? (
                  <div className="inline-flex items-center gap-2 border border-emerald-500/20 bg-emerald-500/[0.08] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-emerald-300">
                    <Archive className="h-3.5 w-3.5" />
                    Archived
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 border border-amber-500/20 bg-amber-500/[0.08] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-amber-300">
                    Live only
                  </div>
                )}

                <a
                  href={`/api/diagnostics/report/pdf?ref=${encodeURIComponent(diagnosticRef)}&version=${encodeURIComponent(
                    report.version,
                  )}`}
                  className="inline-flex items-center gap-2 border border-white/10 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/80 hover:bg-white/[0.04]"
                >
                  PDF
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}