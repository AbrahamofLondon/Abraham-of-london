/* components/diagnostics/report/ReportSectionScores.tsx */
import * as React from "react";

export default function ReportSectionScores({
  sections,
}: {
  sections: Array<{
    sectionId: string;
    title: string;
    score: number;
    maxScore: number;
    pct: number;
  }>;
}) {
  return (
    <section className="border border-white/[0.08] bg-white/[0.02] p-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300/70">
        Domain Scores
      </div>

      <div className="mt-8 space-y-5">
        {sections.map((section) => (
          <div key={section.sectionId} className="border border-white/6 bg-black/20 p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="font-serif text-2xl text-white">{section.title}</div>
              <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/48">
                {section.score}/{section.maxScore} • {section.pct}%
              </div>
            </div>
            <div className="mt-4 h-2 w-full bg-white/5">
              <div className="h-full bg-amber-500" style={{ width: `${section.pct}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}