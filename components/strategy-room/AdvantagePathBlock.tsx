/**
 * AdvantagePathBlock — where the organisation can move ahead.
 *
 * Shows opportunity moves alongside required actions.
 * Shifts posture from defensive to offensive.
 * "This decision defines whether you fall behind or move ahead."
 */

import * as React from "react";
import type { AdvantagePath } from "@/lib/diagnostics/advantage-terrain";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const LEVERAGE_COLOR: Record<string, string> = {
  automate: "rgba(110,231,183,0.55)",
  augment: `${GOLD}BB`,
  redesign: "rgba(253,186,116,0.60)",
  eliminate: "rgba(252,165,165,0.55)",
  accelerate: "rgba(110,231,183,0.65)",
  consolidate: `${GOLD}AA`,
};

export default function AdvantagePathBlock({ data }: { data: AdvantagePath | null }) {
  if (!data || data.opportunityMoves.length === 0) return null;

  return (
    <div style={{ border: `1px solid rgba(110,231,183,0.12)`, backgroundColor: "rgba(110,231,183,0.02)", padding: "1.25rem", marginBottom: "1rem" }}>
      {/* Header */}
      <div className="mb-3">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(110,231,183,0.55)" }}>
          Advantage path
        </span>
      </div>

      {/* Advantage narrative */}
      <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.55, color: "rgba(255,255,255,0.55)", marginBottom: "0.75rem" }}>
        {data.advantageNarrative}
      </p>

      {/* Forward projection */}
      <div className="grid gap-2 md:grid-cols-3 mb-4">
        {[
          { label: "30 days", text: data.forwardProjection.days30 },
          { label: "60 days", text: data.forwardProjection.days60 },
          { label: "90 days", text: data.forwardProjection.days90 },
        ].map((p) => (
          <div key={p.label} style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "0.6rem" }}>
            <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              {p.label}
            </span>
            <p style={{ ...serif, fontSize: "0.75rem", lineHeight: 1.45, color: "rgba(255,255,255,0.35)", marginTop: "0.15rem" }}>
              {p.text}
            </p>
          </div>
        ))}
      </div>

      {/* Opportunity moves */}
      <div>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.45)" }}>
          Opportunity moves
        </span>
        {data.opportunityMoves.map((move, i) => (
          <div key={i} style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "0.65rem", marginTop: "0.35rem" }}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color: LEVERAGE_COLOR[move.leverageType] ?? `${GOLD}80` }}>
                {move.leverageType}
              </span>
              <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>
                {move.timeframe}
              </span>
            </div>
            <p style={{ ...serif, fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.50)" }}>
              {move.action}
            </p>
            <p style={{ ...serif, fontSize: "0.75rem", lineHeight: 1.45, color: "rgba(110,231,183,0.35)", marginTop: "0.15rem" }}>
              {move.competitiveEffect}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
