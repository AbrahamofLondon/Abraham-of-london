"use client";

import * as React from "react";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";

type FeedbackScore = "precise" | "partial" | "no";

export default function DiagnosticFeedback({ stage }: { stage: string }) {
  const [submitted, setSubmitted] = React.useState(false);

  function submit(score: FeedbackScore) {
    track("diagnostic_feedback", { score, stage });
    setSubmitted(true);
    try {
      sessionStorage.setItem("aol_feedback_" + stage, score);
    } catch {}
  }

  if (submitted) {
    return (
      <div style={{
        marginTop: "1rem",
        padding: "0.75rem 1rem",
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.02)",
      }}>
        <p style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "7.5px", letterSpacing: "0.24em", textTransform: "uppercase",
          color: "rgba(255,255,255,0.30)",
        }}>
          Recorded. Thank you.
        </p>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: "1rem",
      padding: "0.85rem 1.25rem",
      border: "1px solid rgba(255,255,255,0.06)",
      backgroundColor: "rgba(255,255,255,0.02)",
    }}>
      <p style={{
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: "7.5px", letterSpacing: "0.28em", textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        marginBottom: "0.65rem",
      }}>
        Did this accurately reflect your situation?
      </p>
      <div className="flex gap-2">
        {([
          { label: "Yes — precisely", value: "precise" as FeedbackScore, color: "rgba(110,231,183,0.55)" },
          { label: "Partially", value: "partial" as FeedbackScore, color: `${GOLD}80` },
          { label: "No", value: "no" as FeedbackScore, color: "rgba(252,165,165,0.55)" },
        ]).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => submit(opt.value)}
            className="transition-all duration-150 hover:opacity-80"
            style={{
              padding: "0.45rem 0.85rem",
              border: `1px solid ${opt.color}40`,
              backgroundColor: `${opt.color}08`,
              color: opt.color,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
