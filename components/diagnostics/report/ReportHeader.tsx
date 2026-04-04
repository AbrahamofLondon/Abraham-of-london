/* components/diagnostics/report/ReportHeader.tsx */
import * as React from "react";
import { Fingerprint, ShieldCheck } from "lucide-react";

export default function ReportHeader({
  diagnosticRef,
  title,
  headline,
  strapline,
  version,
  generatedAt,
}: {
  diagnosticRef: string;
  title: string;
  headline: string;
  strapline: string;
  version: string;
  generatedAt: string;
}) {
  return (
    <header className="border border-white/[0.08] bg-white/[0.02] p-8 shadow-[0_20px_80px_-50px_rgba(0,0,0,0.8)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-400/70" />
          <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-amber-300/80">
            Executive Diagnostic Report
          </span>
        </div>

        <div className="flex items-center gap-3 text-white/35">
          <Fingerprint className="h-4 w-4" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em]">
            {diagnosticRef}
          </span>
        </div>
      </div>

      <h1 className="mt-8 font-serif text-5xl leading-[1.02] text-white">
        {title}
      </h1>

      <h2 className="mt-4 font-serif text-2xl text-white/72">{headline}</h2>

      <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.24em] text-white/35">
        {strapline}
      </p>

      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric label="Version" value={version} />
        <Metric label="Generated" value={new Date(generatedAt).toLocaleDateString("en-GB")} />
        <Metric label="Report Class" value="Export-grade" />
        <Metric label="Output" value="HTML + PDF" />
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-white/6 bg-black/20 p-4">
      <div className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/30">
        {label}
      </div>
      <div className="mt-2 font-serif text-xl text-white">{value}</div>
    </div>
  );
}