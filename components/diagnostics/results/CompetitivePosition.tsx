/**
 * CompetitivePosition — visual indicator of where the organisation stands.
 *
 * States: BEHIND | AT_RISK | STABLE | ADVANCING | LEADING
 * This is a live indicator, not analytics.
 */

import * as React from "react";
import type { CompetitivePosition as Position } from "@/lib/diagnostics/advantage-terrain";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const CONFIG: Record<Position, { color: string; bg: string }> = {
  BEHIND: { color: "rgba(252,165,165,0.75)", bg: "rgba(252,165,165,0.06)" },
  AT_RISK: { color: "rgba(253,186,116,0.70)", bg: "rgba(253,186,116,0.05)" },
  STABLE: { color: "rgba(255,255,255,0.45)", bg: "rgba(255,255,255,0.02)" },
  ADVANCING: { color: "rgba(110,231,183,0.65)", bg: "rgba(110,231,183,0.04)" },
  LEADING: { color: "rgba(110,231,183,0.80)", bg: "rgba(110,231,183,0.06)" },
};

const ALL: Position[] = ["BEHIND", "AT_RISK", "STABLE", "ADVANCING", "LEADING"];

export default function CompetitivePositionSignal({ position }: { position: Position }) {
  const active = CONFIG[position];

  return (
    <div style={{
      border: `1px solid ${active.color}25`,
      backgroundColor: active.bg,
      padding: "0.65rem 1rem",
      marginBottom: "0.75rem",
    }}>
      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
        Competitive position
      </span>
      <div className="flex items-center gap-1 mt-2">
        {ALL.map((p) => {
          const isActive = p === position;
          const c = CONFIG[p];
          return (
            <div key={p} className="flex-1" style={{ height: "3px", backgroundColor: isActive ? c.color : "rgba(255,255,255,0.06)", transition: "background-color 300ms" }} />
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        {ALL.map((p) => (
          <span key={p} style={{
            ...mono,
            fontSize: "5px",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: p === position ? CONFIG[p].color : "rgba(255,255,255,0.10)",
            fontWeight: p === position ? 700 : 400,
          }}>
            {p.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
