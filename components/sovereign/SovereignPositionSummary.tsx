"use client";

/**
 * SovereignPositionSummary
 *
 * The institutional authority statement — one visible, unambiguous view
 * of where this organisation stands against the sovereign intelligence dataset.
 *
 * Placed above all other sovereign panels. This is the product's authority claim:
 * "Here is what the institution tells us about you, drawn from comparable organisations."
 */

import * as React from "react";
import type { IntelligenceSignal } from "@/lib/sovereign/intelligence-signals";
import type { PercentileResult } from "@/lib/sovereign/intelligence-commons";
import type { CohortMatchResult } from "@/lib/sovereign/cohort-intelligence";

const MONO: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const SERIF: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
};

const POSTURE_CONFIG = {
  SOVEREIGN: {
    label: "Sovereign",
    color: "rgba(110,231,183,0.80)",
    border: "rgba(110,231,183,0.20)",
    bg: "rgba(110,231,183,0.04)",
    description: "Your authority, narrative, and execution structures are aligned and self-reinforcing. This is the rarest configuration in the dataset.",
  },
  ALIGNED: {
    label: "Aligned",
    color: "rgba(110,231,183,0.60)",
    border: "rgba(110,231,183,0.15)",
    bg: "rgba(110,231,183,0.02)",
    description: "Your diagnostic profile shows structural alignment without active failure modes. Maintain vigilance against overconfidence — this is when organisations are most vulnerable to overextension.",
  },
  DRIFTING: {
    label: "Drifting",
    color: "#C9A96E",
    border: "rgba(201,169,110,0.20)",
    bg: "rgba(201,169,110,0.04)",
    description: "Your structures are not actively failing, but they are not self-correcting. Without intervention, drift compounds. The window to correct without disruption is open.",
  },
  MISALIGNED: {
    label: "Misaligned",
    color: "rgba(252,165,165,0.75)",
    border: "rgba(252,165,165,0.20)",
    bg: "rgba(252,165,165,0.04)",
    description: "Your authority, narrative, and execution structures are working against each other. This configuration degrades performance over time and resists symptomatic fixes.",
  },
  DISORDERED: {
    label: "Disordered",
    color: "rgba(252,165,165,0.90)",
    border: "rgba(252,165,165,0.30)",
    bg: "rgba(252,165,165,0.06)",
    description: "Multiple structural systems are in active conflict. The risk of compounding institutional failure is elevated. Structural intervention is required — not operational management.",
  },
} as const;

type PostureKey = keyof typeof POSTURE_CONFIG;

type Props = {
  signals: IntelligenceSignal[];
  benchmarks: Record<string, PercentileResult> | null;
  cohort: CohortMatchResult | null;
  trajectory: string;
  commonsSize: number;
};

function derivePosture(signals: IntelligenceSignal[], trajectory: string): PostureKey {
  const hasCritical = signals.some((s) => s.severity === "CRITICAL");
  const alertCount = signals.filter((s) => s.severity === "ALERT").length;
  const traj = trajectory.toUpperCase();

  if (hasCritical && traj === "DETERIORATING") return "DISORDERED";
  if (hasCritical) return "MISALIGNED";
  if (alertCount >= 2) return "MISALIGNED";
  if (alertCount >= 1 || traj === "DETERIORATING") return "DRIFTING";
  if (signals.length === 0 && traj === "IMPROVING") return "ALIGNED";
  if (signals.length === 0) return "DRIFTING";
  return "DRIFTING";
}

function synthesisStatement(
  signals: IntelligenceSignal[],
  benchmarks: Record<string, PercentileResult> | null,
  cohort: CohortMatchResult | null,
  posture: PostureKey,
): string {
  const parts: string[] = [];

  // Signal synthesis
  const criticals = signals.filter((s) => s.severity === "CRITICAL");
  const alerts = signals.filter((s) => s.severity === "ALERT");
  const concerns = signals.filter((s) => s.severity === "CONCERN");

  if (criticals.length > 0) {
    parts.push(
      `The diagnostic has identified ${criticals.length} critical pattern${criticals.length > 1 ? "s" : ""} — ${criticals.map((s) => s.name).join(" and ")}. These are configurations we track because they have consistent, documented trajectories. Left unaddressed, critical patterns narrow the window of intervention.`,
    );
  } else if (alerts.length > 0) {
    parts.push(
      `${alerts.length} alert-level pattern${alerts.length > 1 ? "s are" : " is"} active — ${alerts.map((s) => s.name).join(alerts.length > 2 ? ", " : " and ")}. Alert patterns are present in the dataset at a rate that makes them structurally significant rather than incidental.`,
    );
  } else if (concerns.length > 0) {
    parts.push(
      `${concerns.length} concern-level pattern${concerns.length > 1 ? "s were" : " was"} detected. These are early-indicator configurations — they do not represent acute failure, but they represent the conditions under which more serious patterns develop.`,
    );
  } else if (signals.length === 0) {
    parts.push(
      "No named risk patterns are currently active in your diagnostic profile. This is a meaningful finding — the absence of active signals indicates structural alignment at the pattern level.",
    );
  }

  // Benchmark synthesis
  if (benchmarks) {
    const entries = Object.entries(benchmarks);
    const weakest = entries.sort((a, b) => a[1].percentile - b[1].percentile)[0];
    const strongest = entries.sort((a, b) => b[1].percentile - a[1].percentile)[0];

    if (weakest && strongest && weakest[0] !== strongest[0]) {
      const metricLabels: Record<string, string> = {
        authorityClarity: "authority clarity",
        narrativeCoherence: "narrative coherence",
        interventionReadiness: "intervention readiness",
        executionReadiness: "execution readiness",
      };
      const weakLabel = metricLabels[weakest[0]] ?? weakest[0];
      const strongLabel = metricLabels[strongest[0]] ?? strongest[0];
      parts.push(
        `Against your cohort, your strongest metric is ${strongLabel} (${strongest[1].percentile}th percentile) and your weakest is ${weakLabel} (${weakest[1].percentile}th percentile). The gap between your strongest and weakest metric is the diagnostic's primary structural signal — organisations with large gaps tend to outperform on the strength and underperform on the weakness until the weakness becomes the constraint.`,
      );
    }
  }

  // Cohort synthesis
  if (cohort?.matched) {
    const positive = cohort.cohort.outcomes[0];
    if (positive) {
      parts.push(
        `Of ${cohort.cohort.memberCount > 0 ? `the ${cohort.cohort.memberCount} organisations in your cohort` : "organisations in your cohort category"}, ${positive.percentage}% ${positive.label.toLowerCase()}. The primary differentiator between that outcome and the alternatives: ${cohort.cohort.topDifferentiator}`,
      );
    }
  }

  return parts.join(" ") || POSTURE_CONFIG[posture].description;
}

export default function SovereignPositionSummary({
  signals,
  benchmarks,
  cohort,
  trajectory,
  commonsSize,
}: Props) {
  const posture = derivePosture(signals, trajectory);
  const config = POSTURE_CONFIG[posture];
  const synthesis = synthesisStatement(signals, benchmarks, cohort, posture);

  return (
    <div
      style={{
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderLeft: `3px solid ${config.color}`,
        padding: "28px 30px",
        marginBottom: "0",
      }}
    >
      {/* ── Section label ───────────────────────────────────── */}
      <p
        style={{
          ...MONO,
          fontSize: "9px",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.25)",
          marginBottom: "16px",
        }}
      >
        Sovereign Intelligence — Institutional Position
      </p>

      {/* ── Posture declaration ─────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "14px", marginBottom: "18px", flexWrap: "wrap" }}>
        <p
          style={{
            ...SERIF,
            fontWeight: 500,
            fontSize: "clamp(28px, 3.5vw, 38px)",
            lineHeight: 1.1,
            color: config.color,
            margin: 0,
            letterSpacing: "-0.01em",
          }}
        >
          {config.label}
        </p>
        {signals.length > 0 && (
          <span
            style={{
              ...MONO,
              fontSize: "9px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {signals.length} active signal{signals.length !== 1 ? "s" : ""}
          </span>
        )}
        {commonsSize > 0 && (
          <span
            style={{
              ...MONO,
              fontSize: "9px",
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            · dataset: {commonsSize.toLocaleString()} sessions
          </span>
        )}
      </div>

      {/* ── Synthesis narrative ─────────────────────────────── */}
      <p
        style={{
          fontSize: "15px",
          lineHeight: 1.8,
          color: "rgba(255,255,255,0.60)",
        }}
      >
        {synthesis}
      </p>

      {/* ── Signal severity summary ─────────────────────────── */}
      {signals.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "20px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            flexWrap: "wrap",
          }}
        >
          {(["CRITICAL", "ALERT", "CONCERN", "WATCH"] as const).map((sev) => {
            const count = signals.filter((s) => s.severity === sev).length;
            if (count === 0) return null;
            const colors = {
              CRITICAL: "rgba(252,165,165,0.65)",
              ALERT: "#C9A96E",
              CONCERN: "rgba(255,255,255,0.40)",
              WATCH: "rgba(110,231,183,0.55)",
            };
            return (
              <span key={sev} style={{ ...MONO, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: colors[sev] }}>
                {count} {sev.toLowerCase()}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
