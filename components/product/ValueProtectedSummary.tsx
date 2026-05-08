"use client";

/**
 * ValueProtectedSummary — shows what the system surfaced that would
 * likely have remained hidden without governed oversight.
 *
 * The market lock-in moment. Every item must be evidence-backed.
 */

import * as React from "react";
import { ShieldCheck } from "lucide-react";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type ValueItem = {
  label: string;
  explanation: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  evidenceBasis?: string;
};

type Props = {
  title?: string;
  items: ValueItem[];
  compact?: boolean;
};

const SEVERITY_COLOR: Record<string, string> = {
  CRITICAL: "rgba(252,165,165,0.65)",
  HIGH: "rgba(251,191,36,0.60)",
  MEDIUM: "rgba(255,255,255,0.40)",
  LOW: "rgba(255,255,255,0.25)",
};

export default function ValueProtectedSummary({
  title = "What this surfaced",
  items,
  compact = false,
}: Props) {
  if (!items.length) return null;

  return (
    <div style={{
      border: "1px solid rgba(201,169,110,0.15)",
      backgroundColor: "rgba(201,169,110,0.02)",
      padding: compact ? "10px 14px" : "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: compact ? "6px" : "10px" }}>
        <ShieldCheck style={{ width: "12px", height: "12px", color: "#C9A96E", flexShrink: 0 }} />
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(201,169,110,0.65)" }}>
          {title}
        </span>
      </div>

      <div style={{ display: "grid", gap: compact ? "4px" : "8px" }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
            <span style={{
              display: "inline-block",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: SEVERITY_COLOR[item.severity || "MEDIUM"],
              marginTop: "6px",
              flexShrink: 0,
            }} />
            <div>
              <span style={{ fontSize: "13px", lineHeight: 1.5, color: "rgba(255,255,255,0.55)" }}>
                {item.label}
              </span>
              {!compact && item.explanation && (
                <p style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(255,255,255,0.30)", marginTop: "2px" }}>
                  {item.explanation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export type { ValueItem, Props as ValueProtectedSummaryProps };
