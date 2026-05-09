"use client";

/**
 * ArbiterBadge — signals that the output passed internal consistency checks.
 * Does NOT expose the five arbiter rules, tournament mechanics, or scoring logic.
 * Shows the user that the output is not raw AI prose — it was challenged before display.
 */

import * as React from "react";
import { ShieldCheck } from "lucide-react";

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export function ArbiterBadge({
  context,
  variant = "default",
}: {
  context: "fast_diagnostic" | "executive_reporting" | "purpose_alignment" | "constitutional" | "strategy_room";
  variant?: "default" | "compact" | "dark";
}) {
  const isDark = variant === "dark";
  const iconColor = isDark ? "rgba(110,231,183,0.45)" : "rgba(110,231,183,0.60)";
  const textColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)";

  const contextLabel =
    context === "fast_diagnostic" ? "Fast Diagnostic"
    : context === "executive_reporting" ? "Executive Report"
    : context === "purpose_alignment" ? "Personal Decision Audit"
    : context === "constitutional" ? "Constitutional Diagnostic"
    : "Strategy Room";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: variant === "compact" ? "4px 0" : "6px 0" }}>
      <ShieldCheck style={{ width: 12, height: 12, color: iconColor, flexShrink: 0 }} />
      <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: textColor }}>
        {contextLabel} output passed internal consistency checks before display
      </span>
    </div>
  );
}
