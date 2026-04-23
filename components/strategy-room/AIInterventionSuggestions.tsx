/**
 * AIInterventionSuggestions — auto-suggested AI leverage interventions.
 *
 * Maps AI risk → intervention options.
 * Shows top 2-3 interventions with category, impact, timeframe.
 * Attached to Strategy Room execution.
 */

import * as React from "react";
import type { InterventionSuggestion } from "@/lib/diagnostics/ai-interventions";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const CATEGORY_COLOR: Record<string, string> = {
  AUTOMATE: "rgba(110,231,183,0.60)",
  AUGMENT: `${GOLD}CC`,
  ELIMINATE: "rgba(252,165,165,0.55)",
  REPOSITION: "rgba(147,197,253,0.60)",
};

export default function AIInterventionSuggestions({ suggestions }: { suggestions: InterventionSuggestion[] }) {
  if (suggestions.length === 0) return null;

  return (
    <div style={{ border: "1px solid rgba(110,231,183,0.10)", backgroundColor: "rgba(110,231,183,0.02)", padding: "1.25rem", marginBottom: "1rem" }}>
      <div className="mb-3">
        <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(110,231,183,0.50)" }}>
          AI leverage interventions
        </span>
      </div>

      {suggestions.map((s, i) => {
        const color = CATEGORY_COLOR[s.intervention.category] ?? `${GOLD}80`;
        return (
          <div key={s.intervention.id} style={{
            border: "1px solid rgba(255,255,255,0.05)",
            padding: "0.75rem",
            marginTop: i > 0 ? "0.5rem" : 0,
          }}>
            <div className="flex items-center gap-2 mb-1">
              <span style={{ ...mono, fontSize: "7px", textTransform: "uppercase", color, fontWeight: 700 }}>
                {s.intervention.category}
              </span>
              <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>
                {s.intervention.timeframe}
              </span>
            </div>
            <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.50)" }}>
              {s.intervention.description}
            </p>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              <div>
                <span style={{ ...mono, fontSize: "5.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(110,231,183,0.35)" }}>
                  Expected impact
                </span>
                <p style={{ ...serif, fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.1rem" }}>
                  {s.intervention.expectedImpact}
                </p>
              </div>
              <div>
                <span style={{ ...mono, fontSize: "5.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(252,165,165,0.35)" }}>
                  Risk if ignored
                </span>
                <p style={{ ...serif, fontSize: "0.75rem", color: "rgba(252,165,165,0.30)", marginTop: "0.1rem" }}>
                  {s.intervention.riskIfIgnored}
                </p>
              </div>
            </div>
            <p style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)", marginTop: "0.35rem" }}>
              {s.reason}
            </p>
          </div>
        );
      })}
    </div>
  );
}
