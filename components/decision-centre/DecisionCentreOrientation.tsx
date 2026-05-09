"use client";

import * as React from "react";

const STORAGE_KEY = "aol_decision_centre_orientation_dismissed";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const MICRO_POINTS = [
  "Living Cases \u2014 decisions remain open until action is verified or abandoned.",
  "Evidence tiers \u2014 the system labels what is reported, inferred, measured, or verified.",
  "Admission \u2014 later surfaces open only when the evidence justifies them.",
];

export default function DecisionCentreOrientation() {
  const [dismissed, setDismissed] = React.useState(true);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) setDismissed(false);
    } catch {
      // localStorage unavailable — stay hidden
    }
  }, []);

  if (dismissed) return null;

  function handleDismiss() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore
    }
    setDismissed(true);
  }

  return (
    <div
      style={{
        border: `1px solid rgba(201,169,110,0.20)`,
        backgroundColor: "rgba(201,169,110,0.04)",
        padding: "24px",
        marginBottom: "32px",
      }}
    >
      {/* Eyebrow */}
      <span
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: `${GOLD}CC`,
          display: "block",
          marginBottom: "10px",
        }}
      >
        First visit
      </span>

      {/* Main text */}
      <p
        style={{
          ...serif,
          fontSize: "15px",
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.70)",
          maxWidth: "60ch",
          marginBottom: "20px",
        }}
      >
        Decision Centre is not a dashboard. It is the record of cases the system
        is still carrying. Each case shows what was captured, what is due, what
        has changed, and what cannot yet be claimed.
      </p>

      {/* Micro-points */}
      <div style={{ display: "grid", gap: "6px", marginBottom: "20px" }}>
        {MICRO_POINTS.map((point) => (
          <p
            key={point}
            style={{
              fontSize: "13px",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.50)",
              paddingLeft: "14px",
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 0,
                color: `${GOLD}88`,
              }}
            >
              &mdash;
            </span>
            {point}
          </p>
        ))}
      </div>

      {/* Dismiss button */}
      <button
        onClick={handleDismiss}
        style={{
          ...mono,
          fontSize: "9px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.40)",
          backgroundColor: "transparent",
          border: "1px solid rgba(255,255,255,0.10)",
          padding: "8px 18px",
          cursor: "pointer",
          transition: "border-color 0.2s, color 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)";
          e.currentTarget.style.color = "rgba(255,255,255,0.60)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.10)";
          e.currentTarget.style.color = "rgba(255,255,255,0.40)";
        }}
      >
        Understood
      </button>
    </div>
  );
}
