/**
 * DecisionTerrainStatus — visible indicator of competitive terrain state.
 *
 * States: STABLE | DRIFTING | OUTPACED | ACCELERATING
 * Shows where the organisation sits relative to AI-accelerated market movement.
 */

import * as React from "react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export type TerrainState = "STABLE" | "DRIFTING" | "OUTPACED" | "ACCELERATING";

const TERRAIN_CONFIG: Record<TerrainState, { color: string; message: string }> = {
  STABLE: {
    color: "rgba(110,231,183,0.60)",
    message: "Decision velocity aligned with market baseline. Terrain conditions are holding.",
  },
  DRIFTING: {
    color: `${GOLD}CC`,
    message: "Decision velocity falling behind market acceleration. Gap widening but recoverable.",
  },
  OUTPACED: {
    color: "rgba(252,165,165,0.70)",
    message: "Competitors operating materially faster. Structural disadvantage accumulating.",
  },
  ACCELERATING: {
    color: "rgba(110,231,183,0.75)",
    message: "Decision velocity exceeding market baseline. Competitive advantage building.",
  },
};

export function deriveTerrainState(velocityGapPercent: number): TerrainState {
  if (velocityGapPercent <= 0) return "ACCELERATING";
  if (velocityGapPercent <= 30) return "STABLE";
  if (velocityGapPercent <= 80) return "DRIFTING";
  return "OUTPACED";
}

export default function DecisionTerrainStatus({
  state,
  velocityGapPercent,
}: {
  state: TerrainState;
  velocityGapPercent: number;
}) {
  const config = TERRAIN_CONFIG[state];

  return (
    <div style={{
      border: `1px solid ${config.color}25`,
      backgroundColor: `${config.color}05`,
      padding: "0.75rem 1rem",
      marginBottom: "0.75rem",
      display: "flex",
      alignItems: "center",
      gap: "0.75rem",
    }}>
      <div style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        backgroundColor: config.color,
        flexShrink: 0,
      }} />
      <div>
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase", color: config.color, fontWeight: 700 }}>
          Terrain: {state}
        </span>
        <span style={{ ...mono, fontSize: "6.5px", color: "rgba(255,255,255,0.18)", marginLeft: "0.5rem" }}>
          {velocityGapPercent > 0 ? `${velocityGapPercent}% behind baseline` : "At or ahead of baseline"}
        </span>
      </div>
    </div>
  );
}
