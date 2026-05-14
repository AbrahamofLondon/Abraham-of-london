"use client";

import * as React from "react";
import type { EfficacyCommand } from "@/lib/product/efficacy-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 400 };

export function EfficacyCommandBlock({
  command,
  onAccept,
  onChallenge,
  onEscalate,
  variant = "default",
}: {
  command: EfficacyCommand;
  onAccept?: () => void;
  onChallenge?: () => void;
  onEscalate?: () => void;
  variant?: "default" | "dark" | "compact";
}) {
  const isDark = variant === "dark" || variant === "compact";
  const bg = isDark ? "rgba(255,255,255,0.025)" : "#faf7f0";
  const border = isDark ? "rgba(201,169,110,0.25)" : "#e5e0d5";
  const textPrimary = isDark ? "rgba(255,255,255,0.85)" : "#1a1a1a";
  const textSecondary = isDark ? "rgba(255,255,255,0.50)" : "#666";
  const textMuted = isDark ? "rgba(255,255,255,0.25)" : "#999";

  return (
    <div style={{ borderLeft: `2px solid ${border}`, backgroundColor: bg, padding: variant === "compact" ? "16px 20px" : "20px 24px" }}>
      <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: GOLD, marginBottom: "8px" }}>
        Your required move
      </p>
      <p style={{ ...serif, fontSize: variant === "compact" ? "1rem" : "1.15rem", lineHeight: 1.45, color: textPrimary, marginBottom: "10px" }}>
        {command.title}
      </p>
      <p style={{ fontSize: "13px", lineHeight: 1.65, color: textSecondary, marginBottom: "12px" }}>
        {command.instruction}
      </p>
      <p style={{ fontSize: "12px", lineHeight: 1.6, color: textSecondary, fontStyle: "italic", marginBottom: "12px" }}>
        Why this matters: {command.whyThisMatters}
      </p>

      {command.checkpoint && (
        <div style={{ padding: "10px 14px", border: `1px solid ${isDark ? "rgba(110,231,183,0.15)" : "rgba(110,231,183,0.30)"}`, backgroundColor: isDark ? "rgba(110,231,183,0.03)" : "rgba(110,231,183,0.05)", marginBottom: "12px" }}>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(110,231,183,0.55)" }}>
            Checkpoint: {command.checkpoint.type.replace(/_/g, " ").toLowerCase()}
          </p>
          <p style={{ fontSize: "12px", lineHeight: 1.5, color: textSecondary, marginTop: "4px" }}>
            {command.checkpoint.verificationQuestion}
          </p>
          <p style={{ ...mono, fontSize: "7px", color: textMuted, marginTop: "4px" }}>
            Due: {new Date(command.checkpoint.dueAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      )}

      {command.escalationIfIgnored && (
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)" }}>
          If ignored: {command.escalationIfIgnored.consequence}
        </p>
      )}

      {(onAccept || onChallenge || onEscalate) && (
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "14px" }}>
          {onAccept && (
            <button onClick={onAccept} style={{ padding: "8px 16px", backgroundColor: isDark ? "#F5F5F5" : "#1a1a1a", color: isDark ? "#0B0B0B" : "#F5F5F5", border: "none", cursor: "pointer", ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
              Accept
            </button>
          )}
          {onChallenge && (
            <button onClick={onChallenge} style={{ padding: "8px 16px", backgroundColor: "transparent", color: textSecondary, border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#ccc"}`, cursor: "pointer", ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
              Challenge with evidence
            </button>
          )}
          {onEscalate && (
            <button onClick={onEscalate} style={{ padding: "8px 16px", backgroundColor: "transparent", color: "rgba(201,169,110,0.60)", border: `1px solid rgba(201,169,110,0.25)`, cursor: "pointer", ...mono, fontSize: "9px", letterSpacing: "0.10em", textTransform: "uppercase" }}>
              Escalate
            </button>
          )}
        </div>
      )}

      <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase", color: textMuted, marginTop: "10px" }}>
        Source: {command.surface.replace(/_/g, " ")} &middot; Evidence posture: {command.sourceEvidence[0]?.posture?.toLowerCase() ?? "system-inferred"}
      </p>
    </div>
  );
}
