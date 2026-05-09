import * as React from "react";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "8px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

export type DecisionTimelineItem = {
  id: string;
  label: string;
  status: "PENDING" | "EXECUTED" | "BLOCKED" | "ABANDONED" | "DISPUTED" | "CHECKPOINT_DUE" | "CHECKPOINT_OVERDUE";
  date?: string | null;
  checkpointRelationship?: string | null;
  evidencePosture?: string | null;
};

function colorForStatus(status: DecisionTimelineItem["status"]): string {
  switch (status) {
    case "EXECUTED":
      return "rgba(110,231,183,0.72)";
    case "BLOCKED":
    case "CHECKPOINT_OVERDUE":
      return "rgba(252,165,165,0.72)";
    case "DISPUTED":
    case "CHECKPOINT_DUE":
      return `${GOLD}CC`;
    case "ABANDONED":
      return "rgba(244,114,182,0.72)";
    default:
      return "rgba(255,255,255,0.44)";
  }
}

function formatDate(value?: string | null): string {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date unavailable";
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function DecisionTimeline({ items }: { items: DecisionTimelineItem[] }) {
  if (items.length === 0) return null;

  return (
    <section style={{ padding: "1.25rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div style={{ ...mono, color: "rgba(255,255,255,0.24)", marginBottom: "0.75rem" }}>
        Decision timeline
      </div>
      <div style={{ display: "grid", gap: "0.5rem" }}>
        {items.map((item) => {
          const color = colorForStatus(item.status);
          return (
            <div key={item.id} style={{ borderLeft: `2px solid ${color}`, backgroundColor: "rgba(255,255,255,0.015)", padding: "0.75rem 0.9rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div>
                  <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.45, color: "rgba(255,255,255,0.75)" }}>{item.label}</p>
                  <p style={{ fontSize: "12px", lineHeight: 1.5, color: "rgba(255,255,255,0.38)", marginTop: "4px" }}>
                    {item.checkpointRelationship ?? "No checkpoint relationship recorded."}
                  </p>
                </div>
                <span style={{ ...mono, color }}>
                  {item.status.replace(/_/g, " ")}
                </span>
              </div>
              <p style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.24)", marginTop: "8px" }}>
                {formatDate(item.date)}{item.evidencePosture ? ` · ${item.evidencePosture.replace(/_/g, " ").toLowerCase()}` : ""}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
