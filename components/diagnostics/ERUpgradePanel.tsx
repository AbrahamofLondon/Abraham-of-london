"use client";

/**
 * components/diagnostics/ERUpgradePanel.tsx
 *
 * Severity-specific Executive Report upgrade panel.
 * Shown on the Fast Diagnostic result page when signal strength is moderate or high.
 *
 * Shows:
 * - Severity-framed headline (tailored to condition + signalStrength)
 * - Redacted ER preview (section structure visible, content obscured)
 * - Cost-of-delay figure when available from the diagnostic result
 * - Direct £295 checkout — no sales call, no form, no ambiguity
 *
 * Checkout: POST /api/billing/checkout → { url } → redirect to Stripe
 */

import * as React from "react";
import { Lock, ChevronRight, ArrowRight } from "lucide-react";
import { track } from "@/lib/analytics/track";
import { getProductAmountGbp } from "@/lib/commercial/catalog";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ERUpgradePanelProps = {
  /** From FastDiagnosticResult */
  condition: string;
  conditionLabel: string;
  signalStrength: "low" | "moderate" | "high";
  /** Governance move from authorityIndex */
  nextGovernanceMove?: string | null;
  /** Cost of inaction horizon */
  costOfInaction?: {
    horizon30?: string;
    exposureBand?: string;
  } | null;
  /** Case reference for tracking */
  caseRef?: string | null;
  /** Pre-fill email if already captured */
  initialEmail?: string;
};

// ─── ER section preview data ──────────────────────────────────────────────────

const ER_SECTION_LABELS = [
  "Decision Authority Classification",
  "Governance Gap Analysis",
  "Institutional Signal Report",
  "Authority Posture Assessment",
  "Cost-of-Delay Calculation",
  "Decision Structure Mapping",
  "Recommended Intervention Path",
  "Board-Ready Summary",
];

function getHeadline(condition: string, signalStrength: "low" | "moderate" | "high"): string {
  if (signalStrength === "high") {
    if (condition === "authority") return "High-severity authority gap confirmed. Executive Report required.";
    if (condition === "execution") return "Execution breakdown detected at high severity. An ER maps the repair path.";
    if (condition === "definition") return "Strategic clarity is absent at high severity. The ER establishes the structural reading.";
    return "High-severity condition detected. This cannot be resolved without a structured authority audit.";
  }
  if (signalStrength === "moderate") {
    if (condition === "authority") return "Authority gap identified. An Executive Report will trace the ownership structure.";
    if (condition === "execution") return "Execution strain confirmed. An ER will name the structural repair required.";
    return "Decision condition confirmed. An Executive Report moves from detection to diagnosis.";
  }
  return "Decision condition recorded. The Executive Report deepens the reading.";
}

function getSubline(condition: string): string {
  if (condition === "authority") {
    return "Who can make this decision binding? The ER maps the authority structure, identifies the gap, and delivers a governance-ready resolution path.";
  }
  if (condition === "execution") {
    return "Execution has stalled. The ER identifies the specific breakdown in the execution chain and maps the intervention required to restore forward movement.";
  }
  if (condition === "definition") {
    return "The decision is not yet clean enough to route correctly. The ER defines the terms, frames the authority, and establishes the institutional reading needed before any move is made.";
  }
  return "The ER takes the diagnostic reading and converts it into a structured institutional analysis — section by section, decision by decision, with a board-ready output.";
}

// ─── Redacted preview row ─────────────────────────────────────────────────────

function RedactedRow({ label, index }: { label: string; index: number }) {
  const GOLD = "#C9A96E";
  const redactWidths = [
    "72%", "58%", "85%", "63%", "70%", "55%", "80%", "67%",
  ];
  const width = redactWidths[index % redactWidths.length];

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
        padding: "0.65rem 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <span
        style={{
          fontFamily: "JetBrains Mono, ui-monospace, monospace",
          fontSize: "7px",
          letterSpacing: "0.22em",
          textTransform: "uppercase" as const,
          color: `${GOLD}60`,
          whiteSpace: "nowrap" as const,
          paddingTop: "2px",
          width: "180px",
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <div style={{ flex: 1 }}>
        <div
          style={{
            height: "9px",
            width,
            backgroundColor: "rgba(255,255,255,0.06)",
            borderRadius: "2px",
            position: "relative" as const,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 4px, transparent 4px, transparent 8px)",
            }}
          />
        </div>
        <div
          style={{
            height: "6px",
            width: `calc(${width} * 0.6)`,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: "2px",
            marginTop: "5px",
          }}
        />
      </div>
      <Lock size={10} style={{ color: "rgba(255,255,255,0.15)", flexShrink: 0, marginTop: "2px" }} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ERUpgradePanel({
  condition,
  conditionLabel,
  signalStrength,
  nextGovernanceMove,
  costOfInaction,
  caseRef,
  initialEmail = "",
}: ERUpgradePanelProps) {
  const GOLD = "#C9A96E";
  const mono = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" } as const;
  const serif = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 } as const;

  const [email, setEmail] = React.useState(initialEmail);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const mountTime = React.useRef(Date.now());

  const price = getProductAmountGbp("executive_reporting");
  const headline = getHeadline(condition, signalStrength);
  const subline = getSubline(condition);
  const isHighSeverity = signalStrength === "high";

  // Only show if signal is at least moderate
  if (signalStrength === "low") return null;

  async function handleCheckout() {
    setLoading(true);
    setMessage("");

    if (typeof window !== "undefined" && email) {
      window.sessionStorage.setItem("aol_exec_checkout_email", email);
    }

    track("er_upgrade_panel_checkout_clicked", {
      condition,
      signal_strength: signalStrength,
      has_email: Boolean(email.trim()),
      case_ref: caseRef ?? null,
      hesitation_ms: Date.now() - mountTime.current,
    });

    // Fire upgrade trigger in background — do not await, do not block checkout
    if (email.trim()) {
      void fetch("/api/diagnostics/upgrade-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          condition,
          conditionLabel,
          signalStrength: signalStrength as "moderate" | "high",
          nextGovernanceMove: nextGovernanceMove ?? null,
          exposureBand: costOfInaction?.exposureBand ?? null,
          caseRef: caseRef ?? null,
        }),
      }).catch(() => {});
    }

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productCode: "executive_reporting",
          email: email.trim() || undefined,
          caseRef: caseRef ?? undefined,
          originPath: "/diagnostics/fast",
        }),
      });
      const data = await res.json();

      if (data?.url) {
        window.location.href = data.url;
        return;
      }

      const reason = data?.reason || data?.error || "CHECKOUT_FAILED";
      setMessage(
        reason === "EMAIL_REQUIRED"
          ? "Add your email above to continue."
          : "Checkout could not be prepared. Please try again.",
      );
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        border: `1px solid ${GOLD}30`,
        backgroundColor: `${GOLD}04`,
        padding: "0",
        marginTop: "0.5rem",
        marginBottom: "0.5rem",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          backgroundColor: isHighSeverity ? "rgba(239,68,68,0.06)" : `${GOLD}06`,
          borderBottom: `1px solid ${GOLD}20`,
          padding: "0.85rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          flexWrap: "wrap" as const,
        }}
      >
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.32em",
            textTransform: "uppercase" as const,
            color: isHighSeverity ? "rgba(252,165,165,0.7)" : `${GOLD}90`,
          }}
        >
          {isHighSeverity ? "High severity · Executive Report required" : "Next: Executive Report · £" + price}
        </span>
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.22em",
            textTransform: "uppercase" as const,
            color: "rgba(255,255,255,0.20)",
          }}
        >
          Condition: {conditionLabel}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem" }}>

        {/* Headline */}
        <p style={{ ...serif, fontSize: "clamp(1.05rem,2.5vw,1.35rem)", lineHeight: 1.35, color: "rgba(255,255,255,0.92)", marginBottom: "0.75rem" }}>
          {headline}
        </p>
        <p style={{ fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.52)", marginBottom: "1.5rem" }}>
          {subline}
        </p>

        {/* Cost of inaction if available */}
        {costOfInaction?.horizon30 && (
          <div
            style={{
              border: "1px solid rgba(252,165,165,0.18)",
              backgroundColor: "rgba(252,165,165,0.03)",
              padding: "0.85rem 1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "rgba(252,165,165,0.50)", marginBottom: "0.35rem" }}>
              Cost of delay — 30 days
            </p>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.70)" }}>
              {costOfInaction.horizon30}
            </p>
            {costOfInaction.exposureBand && (
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.25)", marginTop: "0.4rem" }}>
                Exposure band: {costOfInaction.exposureBand}
              </p>
            )}
          </div>
        )}

        {/* Redacted ER preview */}
        <div
          style={{
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.015)",
            padding: "1rem 1.25rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.85rem" }}>
            <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.30)" }}>
              Executive Report — {ER_SECTION_LABELS.length} sections
            </p>
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: `${GOLD}50`, display: "flex", alignItems: "center", gap: "0.3rem" }}>
              <Lock size={8} /> Access locked
            </span>
          </div>

          {ER_SECTION_LABELS.map((label, i) => (
            <RedactedRow key={label} label={label} index={i} />
          ))}

          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.15)", marginTop: "0.75rem", lineHeight: 1.6 }}>
            Content unlocked on payment. All sections populated from your submitted diagnostic inputs.
          </p>
        </div>

        {/* Governance move preview */}
        {nextGovernanceMove && (
          <div
            style={{
              borderLeft: `2px solid ${GOLD}40`,
              paddingLeft: "1.25rem",
              marginBottom: "1.5rem",
            }}
          >
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.22em", textTransform: "uppercase" as const, color: `${GOLD}60`, marginBottom: "0.35rem" }}>
              Required governance move (preview)
            </p>
            <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.65, color: "rgba(255,255,255,0.75)" }}>
              {nextGovernanceMove}
            </p>
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: "rgba(255,255,255,0.20)", marginTop: "0.4rem" }}>
              Full analysis and evidence map in the Executive Report.
            </p>
          </div>
        )}

        {/* Email capture (if no email yet) */}
        {!initialEmail && (
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ ...mono, fontSize: "7px", letterSpacing: "0.20em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.30)", display: "block", marginBottom: "0.4rem" }}>
              Email for report delivery
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@organisation.com"
              style={{
                width: "100%",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.85)",
                padding: "0.6rem 0.85rem",
                fontSize: "0.88rem",
                outline: "none",
                fontFamily: "inherit",
                marginBottom: "0.5rem",
                boxSizing: "border-box" as const,
              }}
            />
          </div>
        )}

        {/* Error message */}
        {message && (
          <p style={{ fontSize: "0.82rem", color: "rgba(252,165,165,0.70)", marginBottom: "0.75rem" }}>
            {message}
          </p>
        )}

        {/* Checkout CTA */}
        <button
          onClick={handleCheckout}
          disabled={loading}
          style={{
            width: "100%",
            padding: "1rem 1.5rem",
            background: isHighSeverity
              ? "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.10))"
              : `linear-gradient(135deg, ${GOLD}22, ${GOLD}14)`,
            border: `1px solid ${isHighSeverity ? "rgba(252,165,165,0.35)" : `${GOLD}40`}`,
            color: isHighSeverity ? "rgba(252,165,165,0.90)" : GOLD,
            fontFamily: "JetBrains Mono, ui-monospace, monospace",
            fontSize: "11px",
            letterSpacing: "0.24em",
            textTransform: "uppercase" as const,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.65 : 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.75rem",
            transition: "opacity 200ms",
          }}
        >
          {loading ? (
            "Preparing checkout…"
          ) : (
            <>
              Unlock Executive Report — £{price}
              <ArrowRight size={14} />
            </>
          )}
        </button>

        {/* Trust strip */}
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.85rem", flexWrap: "wrap" as const }}>
          {["No sales call required", "One-time payment", "Report delivered immediately", "Governed output"].map((item) => (
            <span key={item} style={{ ...mono, fontSize: "7px", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.22)" }}>
              · {item}
            </span>
          ))}
        </div>

      </div>
    </div>
  );
}
