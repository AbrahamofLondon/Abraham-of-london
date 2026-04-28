/**
 * EvidenceChainSurface — renders the canonical AssessmentDecisionResult.
 *
 * Seven blocks in order:
 * 1. Primary condition
 * 2. Why the system reached this (evidence chain)
 * 3. Decision in front of you
 * 4. Minimum viable move
 * 5. If unchanged
 * 6. Validity boundary
 * 7. What would strengthen this result
 *
 * No sales CTA before all seven blocks.
 * No UI computes meaning — this renders only the contract.
 */

import * as React from "react";
import type { AssessmentDecisionResult } from "@/lib/diagnostics/assessment-contract";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const STRENGTH_CONFIG: Record<string, { color: string; label: string }> = {
  STRONG: { color: "rgba(110,231,183,0.65)", label: "Consistent pattern — likely real" },
  MODERATE: { color: `${GOLD}BB`, label: "Directional pattern — emerging" },
  WEAK: { color: "rgba(255,255,255,0.35)", label: "Early pattern — needs additional evidence" },
  REQUIRES_VALIDATION: { color: "rgba(252,165,165,0.65)", label: "Contradictory patterns — requires external validation" },
};

export default function EvidenceChainSurface({ result }: { result: AssessmentDecisionResult }) {
  const strength = STRENGTH_CONFIG[result.signalStrength] ?? STRENGTH_CONFIG.MODERATE!;

  return (
    <div className="space-y-3" style={{ maxWidth: "56rem" }}>

      {/* 1. PRIMARY CONDITION */}
      <div style={{ padding: "1rem 0" }}>
        <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
          Primary condition
        </span>
        <div className="flex items-center gap-2 mt-1">
          <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: strength.color }} />
          <span style={{ ...mono, fontSize: "7px", color: strength.color }}>{strength.label}</span>
        </div>
        <p style={{ marginTop: "0.5rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.05rem", lineHeight: 1.75, color: "rgba(255,255,255,0.85)", maxWidth: "62ch" }}>
          {result.primarySignal}
        </p>
      </div>

      {/* 2. WHY THE SYSTEM REACHED THIS */}
      <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
          Evidence chain
        </span>
        <div className="mt-2 space-y-2">
          {result.evidenceChain.map((link, i) => (
            <div key={i} style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "0.75rem" }}>
              <div className="flex items-center gap-2">
                <span style={{ ...mono, fontSize: "6.5px", color: `${GOLD}80` }}>{link.inputSource}</span>
                <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.15)" }}>evidence link</span>
              </div>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.60)", marginTop: "0.1rem" }}>
                {link.observedPattern}
              </p>
              <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.82rem", lineHeight: 1.65, color: "rgba(255,255,255,0.40)", marginTop: "0.05rem" }}>
                {link.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* INTERNAL CONTRADICTIONS */}
      {result.internalContradictions.length > 0 && (
        <div style={{ border: "1px solid rgba(253,186,116,0.18)", backgroundColor: "rgba(253,186,116,0.03)", padding: "0.85rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.55)" }}>
            Internal contradictions detected
          </span>
          {result.internalContradictions.map((c, i) => (
            <p key={i} style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(253,186,116,0.60)", marginTop: "0.2rem", maxWidth: "62ch" }}>
              {c}
            </p>
          ))}
        </div>
      )}

      {/* 3. DECISION IN FRONT OF YOU */}
      <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
        <span style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}70` }}>
          The decision this surfaces
        </span>
        <p style={{ marginTop: "0.35rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.95rem", lineHeight: 1.75, color: "rgba(255,255,255,0.82)", maxWidth: "62ch" }}>
          {result.decisionInFrontOfYou}
        </p>
      </div>

      {/* 4. MINIMUM VIABLE MOVE */}
      <div style={{ border: `1px solid ${GOLD}15`, backgroundColor: `${GOLD}03`, padding: "0.85rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>
          One move — within 72 hours
        </span>
        <p style={{ marginTop: "0.2rem", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.92rem", lineHeight: 1.75, color: "rgba(255,255,255,0.75)", maxWidth: "62ch" }}>
          {result.minimumViableMove}
        </p>
      </div>

      {/* 5. IF UNCHANGED */}
      <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "0.75rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.40)" }}>
          If unchanged
        </span>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.88rem", lineHeight: 1.7, color: "rgba(255,255,255,0.50)", marginTop: "0.15rem", maxWidth: "62ch" }}>
          {result.ifUnchanged}
        </p>
      </div>

      {/* SCALE IMPLICATION */}
      {result.scaleImplication && (
        <div style={{ border: "1px solid rgba(255,255,255,0.05)", padding: "0.65rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.40)" }}>
            At scale
          </span>
          <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(253,186,116,0.50)", marginTop: "0.1rem", maxWidth: "62ch" }}>
            {result.scaleImplication}
          </p>
        </div>
      )}

      {/* 6. VALIDITY BOUNDARY */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
        <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
          Basis and boundary
        </span>
        <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "0.15rem", maxWidth: "62ch" }}>
          {result.validityBoundary}
        </p>
      </div>

      {/* 7. WHAT WOULD STRENGTHEN THIS */}
      {result.whatWouldStrengthenThis.length > 0 && (
        <div>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(110,231,183,0.40)" }}>
            To strengthen this result
          </span>
          {result.whatWouldStrengthenThis.map((s, i) => (
            <p key={i} style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", lineHeight: 1.7, color: "rgba(255,255,255,0.45)", marginTop: "0.1rem", maxWidth: "62ch" }}>
              {s}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
