/**
 * BLOCK 10 — SECONDARY DATA
 * Domain scores, charts, breakdowns. NOT before blocks 1-9.
 */

const GOLD = "#C9A96E";

export type DomainScore = {
  domain: string;
  label: string;
  percent: number;
  resonance: number;
  certainty: number;
};

export default function ResultDiagnostics({ domains, percent, band }: {
  domains: DomainScore[];
  percent: number;
  band: string;
}) {
  return (
    <div style={{
      border: "1px solid rgba(255,255,255,0.06)",
      backgroundColor: "rgba(255,255,255,0.015)",
      padding: "1.25rem",
    }}>
      <div style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7px",
        letterSpacing: "0.32em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.22)",
        marginBottom: "0.65rem",
      }}>
        Diagnostic data &middot; {band} &middot; {percent}%
      </div>
      <div className="space-y-2">
        {domains.map((d) => (
          <div key={d.domain}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                {d.label}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", color: "rgba(255,255,255,0.22)" }}>
                  R:{d.resonance} C:{d.certainty}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", color: d.percent < 40 ? "rgba(252,165,165,0.60)" : d.percent < 60 ? `${GOLD}80` : "rgba(110,231,183,0.60)" }}>
                  {d.percent}%
                </span>
              </div>
            </div>
            <div style={{ height: "3px", backgroundColor: "rgba(255,255,255,0.04)", position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${d.percent}%`, backgroundColor: d.percent < 40 ? "rgba(252,165,165,0.40)" : d.percent < 60 ? `${GOLD}40` : "rgba(110,231,183,0.40)", transition: "width 500ms ease" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
