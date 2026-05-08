import * as React from "react";

import type { VisibilityRetainedSummary } from "@/lib/product/visibility-retained";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };
const GOLD = "#C9A96E";

export default function VisibilityRetainedPanel({
  summary,
  compact = false,
}: {
  summary: VisibilityRetainedSummary | null | undefined;
  compact?: boolean;
}) {
  if (!summary || summary.items.length === 0) return null;

  return (
    <section style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.015)", padding: compact ? "12px 14px" : "16px 18px" }}>
      <p style={{ ...mono, fontSize: compact ? "7px" : "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
        Visibility retained
      </p>
      <p style={{ ...serif, fontSize: compact ? "0.88rem" : "0.96rem", lineHeight: 1.55, color: "rgba(255,255,255,0.64)", marginTop: "6px" }}>
        {summary.headline}
      </p>
      <div style={{ display: "grid", gap: "10px", marginTop: "12px" }}>
        {summary.items.map((item) => (
          <div key={item.category} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
              {item.label} · {item.confidence}
            </p>
            <p style={{ ...serif, fontSize: compact ? "0.84rem" : "0.9rem", lineHeight: 1.55, color: "rgba(255,255,255,0.72)", marginTop: "4px" }}>
              {item.description}
            </p>
            <p style={{ fontSize: compact ? "10px" : "11px", lineHeight: 1.5, color: "rgba(255,255,255,0.34)", marginTop: "4px" }}>
              {item.evidence}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
