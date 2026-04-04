/* components/diagnostics/report/ReportSummaryBlock.tsx */
import * as React from "react";

export default function ReportSummaryBlock({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="border border-white/[0.08] bg-white/[0.02] p-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300/70">
        {title}
      </div>
      <p className="mt-5 text-base leading-relaxed text-white/68">{body}</p>
    </section>
  );
}