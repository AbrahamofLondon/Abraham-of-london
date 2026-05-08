import * as React from "react";

import {
  formatMemorySourceLabel,
  isMemoryDisplaySafe,
  type GovernedMemoryItem,
} from "@/lib/product/governed-memory-contract";

type GovernanceEvidenceCarryForwardProps = {
  title: string;
  intro: string;
  impact?: string;
  items: GovernedMemoryItem[];
  variant?: "executive" | "entry" | "session";
};

function formatCapturedDate(value: string | null): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(status: GovernedMemoryItem["status"]): string {
  return status.toLowerCase().replace(/_/g, " ");
}

export default function GovernanceEvidenceCarryForward({
  title,
  intro,
  impact,
  items,
  variant = "entry",
}: GovernanceEvidenceCarryForwardProps) {
  if (!items.length) return null;

  return (
    <section
      style={{
        border: "1px solid rgba(201,169,110,0.14)",
        backgroundColor: variant === "executive" ? "rgba(201,169,110,0.035)" : "rgba(255,255,255,0.018)",
        padding: "1rem 1.05rem",
      }}
    >
      <div
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.24em",
          textTransform: "uppercase",
          color: "rgba(201,169,110,0.75)",
        }}
      >
        {title}
      </div>
      <p
        style={{
          marginTop: "0.55rem",
          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
          fontSize: "0.95rem",
          lineHeight: 1.55,
          color: "rgba(255,255,255,0.58)",
        }}
      >
        {intro}
      </p>
      {impact ? (
        <p
          style={{
            marginTop: "0.45rem",
            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
            fontSize: "0.92rem",
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.70)",
          }}
        >
          {impact}
        </p>
      ) : null}
      <div style={{ display: "grid", gap: "0.65rem", marginTop: "0.85rem" }}>
        {items.map((item) => {
          const safeToShow = isMemoryDisplaySafe(item);
          const dateLabel = formatCapturedDate(item.capturedAt);
          return (
            <div
              key={`${item.id}:${item.capturedAt ?? "na"}`}
              style={{
                borderLeft: "1px solid rgba(201,169,110,0.52)",
                paddingLeft: "0.75rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.2px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.34)",
                }}
              >
                {formatMemorySourceLabel(item)}
                {dateLabel ? ` · ${dateLabel}` : ""}
                {` · ${statusLabel(item.status)}`}
              </div>
              <div
                style={{
                  marginTop: "0.22rem",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "7.4px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "rgba(201,169,110,0.74)",
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  marginTop: "0.22rem",
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontSize: "0.92rem",
                  lineHeight: 1.5,
                  color: "rgba(255,255,255,0.74)",
                }}
              >
                {safeToShow ? item.summary : item.suppressedReason || "Evidence captured but withheld from display."}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
