/**
 * components/diagnostics/BoardSummaryPreview.tsx
 *
 * Canonical board summary rendering component.
 * Used inline in fast.tsx (result screen) and as the content block in
 * pages/diagnostics/board-summary.tsx (standalone printable page).
 *
 * PDF export deferred until the HTML surface is stable.
 */

import * as React from "react";
import { Shield, Hash } from "lucide-react";

import type { BoardSummaryData } from "@/lib/diagnostics/board-summary";

export type { BoardSummaryData };
export {
  buildBoardSummaryFromFastDiagnostic,
  buildBoardSummaryFromExecutiveReport,
  buildBoardSummaryFromSessionStorage,
} from "@/lib/diagnostics/board-summary";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Severity badge ───────────────────────────────────────────────────────────

function SeverityBadge({ band }: { band: string }) {
  const color =
    band === "CRITICAL" ? "rgba(239,68,68,0.75)" :
    band === "ALERT" || band === "HIGH" ? "rgba(249,115,22,0.72)" :
    band === "CONCERN" || band === "MODERATE" ? "rgba(251,191,36,0.70)" :
    "rgba(110,231,183,0.60)";
  const bg =
    band === "CRITICAL" ? "rgba(239,68,68,0.05)" :
    band === "ALERT" || band === "HIGH" ? "rgba(249,115,22,0.04)" :
    band === "CONCERN" || band === "MODERATE" ? "rgba(251,191,36,0.03)" :
    "rgba(110,231,183,0.03)";

  return (
    <span
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        color,
        backgroundColor: bg,
        border: `1px solid ${color}30`,
        padding: "0.25rem 0.6rem",
      }}
    >
      {band}
    </span>
  );
}

// ─── Provenance hash with copy ────────────────────────────────────────────────

function ProvenanceHashRow({ hash }: { hash: string }) {
  const [copied, setCopied] = React.useState(false);
  const short = hash.length > 18 ? `${hash.slice(0, 12)}…${hash.slice(-6)}` : hash;

  function handleCopy() {
    navigator.clipboard.writeText(hash).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }).catch(() => { /* clipboard unavailable */ });
  }

  return (
    <div>
      <p
        style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.25)",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <Hash style={{ width: 10, height: 10 }} />
        Provenance hash
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{ ...mono, fontSize: "9px", letterSpacing: "0.10em", color: `${GOLD}CC` }}
          title={hash}
        >
          {short}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: copied ? "#6EE7B7" : "rgba(255,255,255,0.28)",
            background: "none",
            border: "1px solid rgba(255,255,255,0.10)",
            padding: "2px 7px",
            cursor: "pointer",
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

// ─── BoardSummaryPreview ──────────────────────────────────────────────────────

export default function BoardSummaryPreview({ data }: { data: BoardSummaryData | null }) {
  if (!data) return null;

  return (
    <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}03`, padding: "1.25rem" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <Shield style={{ width: 16, height: 16, color: GOLD }} />
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: `${GOLD}88`,
          }}
        >
          Board Summary Preview
        </span>
        <SeverityBadge band={data.severityBand} />
      </div>

      {/* Title */}
      <h2
        style={{
          ...serif,
          fontSize: "1.3rem",
          lineHeight: 1.2,
          color: "rgba(255,255,255,0.90)",
          marginBottom: "0.75rem",
        }}
      >
        {data.title}
      </h2>

      {/* Condition + signal strength */}
      <p
        style={{
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: `${GOLD}77`,
          marginBottom: "1rem",
        }}
      >
        {data.conditionLabel} · {data.signalStrength} signal strength
      </p>

      {/* Primary contradiction */}
      <div
        style={{
          borderLeft: `2px solid ${GOLD}30`,
          padding: "0.5rem 1rem",
          backgroundColor: `${GOLD}04`,
          marginBottom: "1rem",
        }}
      >
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: `${GOLD}70`,
            marginBottom: "0.3rem",
          }}
        >
          Primary contradiction
        </p>
        <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.78)" }}>
          {data.primaryContradiction}
        </p>
      </div>

      {/* Cost of inaction */}
      <div style={{ marginBottom: "1rem" }}>
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.30)",
            marginBottom: "0.5rem",
          }}
        >
          Cost of inaction — if unresolved
        </p>
        <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "1fr 1fr 1fr" }}>
          {[
            { label: "30 days", text: data.costOfInaction.thirtyDays },
            { label: "60 days", text: data.costOfInaction.sixtyDays },
            { label: "90 days", text: data.costOfInaction.ninetyDays },
          ].map((item) => (
            <div key={item.label} style={{ borderLeft: `1px solid ${GOLD}20`, paddingLeft: "0.6rem" }}>
              <p
                style={{
                  ...mono,
                  fontSize: "7px",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: `${GOLD}70`,
                }}
              >
                {item.label}
              </p>
              <p
                style={{
                  ...serif,
                  fontSize: "0.8rem",
                  lineHeight: 1.4,
                  color: "rgba(255,255,255,0.55)",
                  marginTop: "0.2rem",
                }}
              >
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Required move */}
      <div
        style={{
          border: `1px solid ${GOLD}25`,
          backgroundColor: `${GOLD}06`,
          padding: "0.75rem 1rem",
          marginBottom: "1rem",
        }}
      >
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            color: `${GOLD}90`,
            marginBottom: "0.3rem",
          }}
        >
          Required move
        </p>
        <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.5, color: "rgba(255,255,255,0.85)" }}>
          {data.requiredMove}
        </p>
      </div>

      {/* Detected signals */}
      {data.detectedSignals && data.detectedSignals.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.30)",
              marginBottom: "0.5rem",
            }}
          >
            Detected signals
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data.detectedSignals.slice(0, 3).map((signal) => (
              <div
                key={signal.signalName}
                style={{ borderLeft: `1px solid ${GOLD}20`, paddingLeft: "0.6rem" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <SeverityBadge band={signal.severityBand} />
                  <span style={{ ...serif, fontSize: "0.85rem", color: "rgba(255,255,255,0.75)" }}>
                    {signal.signalName}
                  </span>
                </div>
                <p
                  style={{
                    ...serif,
                    fontSize: "0.75rem",
                    lineHeight: 1.4,
                    color: "rgba(255,255,255,0.45)",
                    marginTop: "0.2rem",
                  }}
                >
                  {signal.narrativeSummary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comparison band */}
      {data.comparisonBand && (
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            Comparison band
          </p>
          <p style={{ ...mono, fontSize: "9px", color: "rgba(255,255,255,0.50)" }}>
            {data.comparisonBand}
          </p>
        </div>
      )}

      {/* Evidence surface ladder (shown when populated, e.g. on standalone page) */}
      {data.completedSurfaces && data.completedSurfaces.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
              marginBottom: "6px",
            }}
          >
            Evidence sources
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {data.completedSurfaces.map((surface) => (
              <div
                key={surface}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  paddingBottom: "4px",
                }}
              >
                <span style={{ ...mono, fontSize: "7px", color: `${GOLD}80` }}>✓</span>
                <span style={{ ...serif, fontSize: "0.85rem", color: "rgba(255,255,255,0.60)" }}>
                  {surface}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Provenance hash — only when present, never faked */}
      {data.provenanceHash && (
        <div style={{ marginBottom: "1rem" }}>
          <ProvenanceHashRow hash={data.provenanceHash} />
        </div>
      )}

      {/* Source + scenario disclaimer */}
      <div style={{ borderTop: `1px solid ${GOLD}12`, paddingTop: "0.75rem" }}>
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.20)",
          }}
        >
          Source: {data.sourceLabel}
        </p>
        <p
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.18)",
            marginTop: "0.3rem",
          }}
        >
          Scenario only — not a financial forecast. Based on user-reported inputs and system-inferred analysis.
        </p>
      </div>

    </div>
  );
}
