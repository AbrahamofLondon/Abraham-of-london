/**
 * RetainerEntryGate — conditional retainer offer.
 *
 * Appears ONLY when qualification criteria are met:
 * - Contradiction persists
 * - Recurrence detected
 * - Multi-stakeholder divergence present
 *
 * Fixed messaging. No pricing comparison. No alternatives.
 */

import * as React from "react";
import type { RetainerQualification } from "@/lib/retainer/qualification";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

export default function RetainerEntryGate({ qualification }: { qualification: RetainerQualification | null }) {
  if (!qualification || !qualification.qualifies) return null;

  const borderColor = qualification.severity === "critical"
    ? "rgba(252,165,165,0.25)"
    : `${GOLD}25`;

  const accentColor = qualification.severity === "critical"
    ? "rgba(252,165,165,0.70)"
    : `${GOLD}CC`;

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      backgroundColor: "rgba(255,255,255,0.015)",
      padding: "1.5rem",
      marginTop: "1.5rem",
    }}>
      {/* Qualification evidence */}
      <div style={{ marginBottom: "0.75rem" }}>
        <span style={{
          ...mono,
          fontSize: "7px",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: accentColor,
        }}>
          System directive — ongoing enforcement required
        </span>
      </div>

      {/* Fixed message — do not modify */}
      <p style={{
        ...serif,
        fontSize: "1.05rem",
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.65)",
        marginBottom: "0.5rem",
      }}>
        This is not a one-off condition.
      </p>
      <p style={{
        ...serif,
        fontSize: "1.05rem",
        lineHeight: 1.6,
        color: "rgba(255,255,255,0.50)",
        marginBottom: "0.75rem",
      }}>
        The contradiction will persist without sustained enforcement.
      </p>
      <p style={{
        ...serif,
        fontSize: "0.95rem",
        lineHeight: 1.5,
        color: "rgba(255,255,255,0.40)",
        marginBottom: "0.5rem",
      }}>
        This determines whether you fall behind or move ahead.
      </p>
      <p style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.22)",
        marginBottom: "0.75rem",
      }}>
        At scale, unresolved decisions become financial and competitive liabilities.
      </p>
      <p style={{
        ...mono,
        fontSize: "6.5px",
        letterSpacing: "0.12em",
        color: "rgba(255,255,255,0.15)",
        marginBottom: "0.75rem",
      }}>
        Decisions are evaluated against an AI-accelerated market baseline.
      </p>

      {/* Evidence — why this qualifies */}
      <div style={{
        border: "1px solid rgba(255,255,255,0.06)",
        backgroundColor: "rgba(255,255,255,0.01)",
        padding: "0.65rem",
        marginBottom: "1rem",
      }}>
        <span style={{
          ...mono,
          fontSize: "6px",
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "rgba(255,255,255,0.22)",
        }}>
          Qualification evidence
        </span>
        <p style={{
          ...serif,
          fontSize: "0.82rem",
          lineHeight: 1.5,
          color: "rgba(255,255,255,0.40)",
          marginTop: "0.15rem",
        }}>
          {qualification.evidence}
        </p>
      </div>

      {/* CTA — fixed, no alternatives */}
      <a
        href="/consulting?retainer=qualified"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "11px 22px",
          border: `1px solid ${accentColor}`,
          backgroundColor: `${accentColor}10`,
          color: accentColor,
          ...mono,
          fontSize: "8px",
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          textDecoration: "none",
        }}
      >
        Activate ongoing enforcement
      </a>
    </div>
  );
}
