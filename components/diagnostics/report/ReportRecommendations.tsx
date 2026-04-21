/* components/diagnostics/report/ReportRecommendations.tsx */
import * as React from "react";

function tone(priority: string) {
  if (priority === "critical") return "border-red-500/20 bg-red-500/[0.05] text-red-300";
  if (priority === "high") return "border-amber-500/20 bg-amber-500/[0.05] text-amber-300";
  if (priority === "medium") return "border-blue-500/20 bg-blue-500/[0.05] text-blue-300";
  return "border-emerald-500/20 bg-emerald-500/[0.05] text-emerald-300";
}

export default function ReportRecommendations({
  recommendations,
}: {
  recommendations: Array<{
    id?: string;
    title: string;
    detail: string;
    priority: "low" | "medium" | "high" | "critical";
  }>;
}) {
  return (
    <section className="border border-white/[0.08] bg-white/[0.02] p-8">
      <div className="font-mono text-[10px] uppercase tracking-[0.26em] text-amber-300/70">
        Recommendations
      </div>

      <div className="mt-8 space-y-4">
        {recommendations.map((rec, idx) => (
          <div key={rec.id || `${rec.title}-${idx}`} className="border border-white/6 bg-black/20 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="font-serif text-2xl text-white">{rec.title}</div>
              <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.22em] ${tone(rec.priority)}`}>
                {rec.priority}
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-white/62">{rec.detail}</p>
          </div>
        ))}
        <div className="border border-amber-500/20 bg-black/40 p-5">
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-amber-300/70">
            Action layer
          </div>
          <div className="mt-3 font-serif text-2xl text-white">
            If intervention is required, move to Strategy Room.
          </div>
          <p className="mt-4 text-sm leading-relaxed text-white/62">
            Executive Reporting prices the consequence. Strategy Room executes the intervention.
          </p>
        </div>
      </div>
    </section>
  );
}
