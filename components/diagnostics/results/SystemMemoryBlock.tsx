/**
 * SystemMemoryBlock — Visible cross-stage intelligence
 *
 * Shows what prior stages found, what this stage confirms/contradicts/escalates.
 * Appears from Stage 2 onward. Uses the tension thread intelligence layer.
 *
 * This is what makes the system feel cumulative, not episodic.
 */

import * as React from "react";
import {
  readTensionThread,
  deriveThreadIntelligence,
  type TensionThread,
  type ThreadIntelligence,
} from "@/lib/diagnostics/tension-thread";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type Props = {
  /** Current stage identifier */
  currentStage: string;
  /** Override thread (if already loaded by parent) */
  thread?: TensionThread | null;
};

export default function SystemMemoryBlock({ currentStage, thread: threadProp }: Props) {
  const [thread, setThread] = React.useState<TensionThread | null>(threadProp ?? null);
  const [intelligence, setIntelligence] = React.useState<ThreadIntelligence | null>(null);

  React.useEffect(() => {
    if (threadProp) {
      setThread(threadProp);
      setIntelligence(deriveThreadIntelligence(threadProp));
      return;
    }
    const t = readTensionThread();
    if (t && t.tensions.length > 0) {
      setThread(t);
      setIntelligence(deriveThreadIntelligence(t));
    }
  }, [threadProp]);

  // Only show if there are prior stages with signals
  if (!thread || thread.tensions.length === 0) return null;

  const priorStages = [...new Set(thread.tensions.map((t) => t.source))].filter(
    (s) => s !== currentStage,
  );

  // Only show from Stage 2 onward (need at least 1 prior stage)
  if (priorStages.length === 0) return null;

  const highSeverityCount = thread.tensions.filter((t) => t.severity === "high").length;
  const stageLabel = priorStages.length === 1
    ? priorStages[0]!.replace(/_/g, " ")
    : `${priorStages.length} prior stages`;

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        backgroundColor: "rgba(255,255,255,0.02)",
        padding: "1rem 1.25rem",
        marginBottom: "1rem",
      }}
    >
      <div
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.28)",
          marginBottom: "0.55rem",
        }}
      >
        System memory &middot; {stageLabel}
      </div>

      {/* Escalation level */}
      {thread.escalationLevel !== "none" && (
        <div
          style={{
            ...mono,
            fontSize: "7.5px",
            letterSpacing: "0.14em",
            color:
              thread.escalationLevel === "intervention_required"
                ? "rgba(252,165,165,0.70)"
                : thread.escalationLevel === "structural_risk"
                  ? `${GOLD}90`
                  : "rgba(255,255,255,0.40)",
            marginBottom: "0.5rem",
          }}
        >
          Escalation: {thread.escalationLevel.replace(/_/g, " ")}
          {highSeverityCount > 0 && ` · ${highSeverityCount} high-severity signal${highSeverityCount > 1 ? "s" : ""}`}
        </div>
      )}

      {/* Persistent patterns */}
      {intelligence?.persistentPatterns && intelligence.persistentPatterns.length > 0 && (
        <div style={{ marginBottom: "0.5rem" }}>
          <span
            style={{
              ...mono,
              fontSize: "6px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: `${GOLD}60`,
            }}
          >
            Persistent patterns
          </span>
          {intelligence.persistentPatterns.map((p, i) => (
            <p
              key={i}
              style={{
                ...serif,
                fontSize: "0.82rem",
                lineHeight: 1.5,
                color: "rgba(255,255,255,0.42)",
                marginTop: "0.15rem",
              }}
            >
              {p}
            </p>
          ))}
        </div>
      )}

      {/* Escalating risks */}
      {intelligence?.escalatingRisks && intelligence.escalatingRisks.length > 0 && (
        <div style={{ marginBottom: "0.5rem" }}>
          <span
            style={{
              ...mono,
              fontSize: "6px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(252,165,165,0.45)",
            }}
          >
            Escalating risks
          </span>
          {intelligence.escalatingRisks.map((r, i) => (
            <p
              key={i}
              style={{
                ...serif,
                fontSize: "0.82rem",
                lineHeight: 1.5,
                color: "rgba(252,165,165,0.45)",
                marginTop: "0.15rem",
              }}
            >
              {r}
            </p>
          ))}
        </div>
      )}

      {/* Confirmed contradictions */}
      {intelligence?.confirmedContradictions && intelligence.confirmedContradictions.length > 0 && (
        <div style={{ marginBottom: "0.5rem" }}>
          <span
            style={{
              ...mono,
              fontSize: "6px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(253,186,116,0.50)",
            }}
          >
            Cross-stage contradictions
          </span>
          {intelligence.confirmedContradictions.map((c, i) => (
            <p
              key={i}
              style={{
                ...serif,
                fontSize: "0.82rem",
                lineHeight: 1.5,
                color: "rgba(253,186,116,0.45)",
                marginTop: "0.15rem",
              }}
            >
              {c}
            </p>
          ))}
        </div>
      )}

      {/* Dominant patterns */}
      {thread.dominantPatterns.length > 0 && !intelligence?.persistentPatterns?.length && (
        <p
          style={{
            ...serif,
            fontSize: "0.82rem",
            lineHeight: 1.5,
            color: "rgba(255,255,255,0.35)",
          }}
        >
          Dominant patterns: {thread.dominantPatterns.join(", ")}
        </p>
      )}

      {/* System continuity line */}
      <p
        style={{
          ...serif,
          marginTop: "0.5rem",
          fontSize: "0.78rem",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.20)",
          fontStyle: "italic",
        }}
      >
        The system carries this evidence forward. Each stage sharpens or contradicts the reading.
      </p>
    </div>
  );
}
