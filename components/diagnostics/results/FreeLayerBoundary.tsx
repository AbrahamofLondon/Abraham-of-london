/**
 * FreeLayerBoundary — honest boundary statement for every free assessment.
 *
 * Shows: what this result is, what it isn't, what would strengthen it,
 * and why the next layer exists (additive, not withheld).
 */

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

import * as React from "react";

type FreeLayerBoundaryProps = {
  /** What this assessment delivered */
  summary: string;
  /** What this assessment cannot claim */
  limitation: string;
  /** Explicit validity boundary — what kind of evidence this is based on */
  validityBasis: string;
  /** What would make this result stronger */
  strengthenWith: string;
};

export default function FreeLayerBoundary({
  summary,
  limitation,
  validityBasis,
  strengthenWith,
}: FreeLayerBoundaryProps) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.03)", padding: "1.25rem", marginBottom: "0.75rem" }}>
      <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.30em", textTransform: "uppercase", color: "rgba(255,255,255,0.52)", marginBottom: "0.55rem" }}>
        Boundary of this result
      </div>

      {/* What this delivered */}
      <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.8, color: "rgba(255,255,255,0.82)", maxWidth: "62ch" }}>
        {summary}
      </p>

      {/* Validity basis — what kind of evidence this is */}
      <p style={{ marginTop: "0.5rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.75, color: "rgba(255,255,255,0.55)", fontStyle: "italic", maxWidth: "62ch" }}>
        {validityBasis}
      </p>

      {/* What it cannot claim */}
      <p style={{ marginTop: "0.5rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.8, color: "rgba(255,255,255,0.68)", maxWidth: "62ch" }}>
        {limitation}
      </p>

      {/* What would strengthen this result */}
      <div style={{ marginTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.65rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.45)" }}>
          To strengthen this result
        </span>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.75, color: "rgba(255,255,255,0.58)", marginTop: "0.15rem", maxWidth: "62ch" }}>
          {strengthenWith}
        </p>
      </div>
    </div>
  );
}
