import * as React from "react";

interface MatrixData {
  quadrant: string;
  probability: number;
  impact: number;
  score: number;
  priority?: string;
  action?: string;
}

interface MatrixProps {
  title: string;
  data: MatrixData[];
  className?: string;
}

export default function Matrix({ title, data, className = "" }: MatrixProps) {
  return (
    <div className={`my-12 ${className}`}>
      <div className="mb-6 flex items-center gap-3">
        <span className="h-[1px] w-8 bg-amber-800/40" />
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-600/70">
          {title}
        </span>
        <span className="h-[1px] flex-1 bg-amber-800/20" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.map((item, i) => {
          const riskLevel = item.score >= 0.5 ? "critical" : item.score >= 0.3 ? "high" : "medium";
          const borderColor = 
            riskLevel === "critical" ? "border-red-900/50" :
            riskLevel === "high" ? "border-amber-900/50" :
            "border-emerald-900/50";
          
          const bgColor = 
            riskLevel === "critical" ? "bg-red-950/20" :
            riskLevel === "high" ? "bg-amber-950/20" :
            "bg-emerald-950/20";
          
          return (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-xl border ${borderColor} ${bgColor} p-5 backdrop-blur-sm transition-all hover:bg-white/[0.03]`}
            >
              {/* Top accent line */}
              <div className={`absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent ${
                riskLevel === "critical" ? "via-red-800/50 to-transparent" :
                riskLevel === "high" ? "via-amber-800/50 to-transparent" :
                "via-emerald-800/50 to-transparent"
              }`} />
              
              <div className="mb-3 flex items-center justify-between">
                <span className="font-serif text-lg text-white/90">{item.quadrant}</span>
                <span className={`rounded-full px-2 py-1 text-[8px] font-mono uppercase tracking-wider border ${
                  riskLevel === "critical" ? "border-red-900/30 text-red-400/70" :
                  riskLevel === "high" ? "border-amber-900/30 text-amber-400/70" :
                  "border-emerald-900/30 text-emerald-400/70"
                }`}>
                  {(item.score * 100).toFixed(0)}% RISK
                </span>
              </div>
              
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className="rounded-lg bg-black/40 p-2 text-center">
                  <div className="text-[8px] font-mono text-white/30">PROBABILITY</div>
                  <div className="text-sm font-light text-white/80">{(item.probability * 100).toFixed(0)}%</div>
                </div>
                <div className="rounded-lg bg-black/40 p-2 text-center">
                  <div className="text-[8px] font-mono text-white/30">IMPACT</div>
                  <div className="text-sm font-light text-white/80">{(item.impact * 100).toFixed(0)}%</div>
                </div>
              </div>
              
              {item.action && (
                <div className="mt-2 border-t border-white/5 pt-3">
                  <div className="text-[9px] font-mono uppercase tracking-wider text-amber-500/60">ACTION</div>
                  <div className="mt-1 text-xs text-white/70">{item.action}</div>
                </div>
              )}
              
              {item.priority && (
                <div className="absolute bottom-3 right-3">
                  <span className="rounded-full bg-amber-950/30 px-2 py-1 text-[7px] font-mono uppercase tracking-wider text-amber-500/50">
                    {item.priority}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}