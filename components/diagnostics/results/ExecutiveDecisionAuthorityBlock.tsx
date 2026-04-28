/**
 * ExecutiveDecisionAuthorityBlock — public-safe elevation surface.
 *
 * Renders: Decision Authority, Cost of Inaction, Execution Risk, Governance Move.
 * Does NOT render: scores, thresholds, internal signals, engine modes, traces.
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const GOLD = "#C9A96E";
const RED = "rgba(252,165,165,";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type AuthorityIndex = {
  band: "strong" | "strained" | "weak" | "critical";
  label: string;
  boardMeaning: string;
  nextGovernanceMove: string;
};

type CostOfInaction = {
  exposureBand: string;
  horizon30: string;
  horizon60: string;
  horizon90: string;
  executiveWarning: string;
};

type ExecutionFailure = {
  likelyFailureMode: string;
  whyExecutionWillStall: string;
  requiredCorrection: string;
};

export type ExecutiveDecisionAuthorityBlockProps = {
  authorityIndex?: AuthorityIndex;
  costOfInaction?: CostOfInaction;
  executionFailure?: ExecutionFailure;
};

const BAND_COLORS: Record<string, { border: string; bg: string; text: string }> = {
  critical: { border: `${RED}0.30)`, bg: `${RED}0.04)`, text: `${RED}0.70)` },
  weak: { border: `${RED}0.20)`, bg: `${RED}0.03)`, text: `${RED}0.55)` },
  strained: { border: `${GOLD}25`, bg: `${GOLD}06`, text: `${GOLD}BB` },
  strong: { border: "rgba(110,231,183,0.20)", bg: "rgba(110,231,183,0.03)", text: "rgba(110,231,183,0.65)" },
  high: { border: `${RED}0.25)`, bg: `${RED}0.03)`, text: `${RED}0.60)` },
  moderate: { border: `${GOLD}20`, bg: `${GOLD}04`, text: `${GOLD}AA` },
  low: { border: "rgba(110,231,183,0.15)", bg: "rgba(110,231,183,0.02)", text: "rgba(110,231,183,0.55)" },
};

function getBandStyle(band: string) {
  return BAND_COLORS[band] ?? BAND_COLORS.moderate!;
}

export default function ExecutiveDecisionAuthorityBlock({
  authorityIndex,
  costOfInaction,
  executionFailure,
}: ExecutiveDecisionAuthorityBlockProps) {
  if (!authorityIndex && !costOfInaction && !executionFailure) return null;

  return (
    <div className="space-y-3" style={{ marginTop: "1.5rem" }}>
      <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}50` }}>
        Executive decision authority
      </div>

      {/* 1. Decision Authority Band */}
      {authorityIndex && (
        <div style={{ border: `1px solid ${getBandStyle(authorityIndex.band).border}`, backgroundColor: getBandStyle(authorityIndex.band).bg, padding: "1rem" }}>
          <div className="flex items-center justify-between">
            <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: getBandStyle(authorityIndex.band).text }}>
              Authority: {authorityIndex.band}
            </span>
          </div>
          <p style={{ ...serif, fontSize: "0.95rem", lineHeight: 1.6, color: "rgba(255,255,255,0.70)", marginTop: "0.4rem" }}>
            {authorityIndex.label}
          </p>
          <p style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(255,255,255,0.38)", marginTop: "0.3rem" }}>
            {authorityIndex.boardMeaning}
          </p>
        </div>
      )}

      {/* 2. Cost of Inaction */}
      {costOfInaction && costOfInaction.exposureBand !== "undisclosed" && (
        <div style={{ border: `1px solid ${getBandStyle(costOfInaction.exposureBand).border}`, padding: "1rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${RED}0.45)` }}>
            Cost of inaction — {costOfInaction.exposureBand} exposure
          </span>
          <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.65, color: "rgba(255,255,255,0.55)", marginTop: "0.4rem" }}>
            {costOfInaction.executiveWarning}
          </p>
          <div className="mt-2 space-y-1">
            {[
              { label: "30 days", text: costOfInaction.horizon30 },
              { label: "60 days", text: costOfInaction.horizon60 },
              { label: "90 days", text: costOfInaction.horizon90 },
            ].map((h) => (
              <div key={h.label} className="flex gap-3">
                <span style={{ ...mono, fontSize: "6.5px", color: `${RED}0.30)`, minWidth: "45px" }}>{h.label}</span>
                <span style={{ fontSize: "0.78rem", lineHeight: 1.6, color: "rgba(255,255,255,0.38)" }}>{h.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. Execution Failure */}
      {executionFailure && executionFailure.likelyFailureMode !== "Low risk" && (
        <div style={{ border: "1px solid rgba(253,186,116,0.15)", backgroundColor: "rgba(253,186,116,0.02)", padding: "1rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(253,186,116,0.50)" }}>
            Why execution will stall — {executionFailure.likelyFailureMode}
          </span>
          <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(255,255,255,0.50)", marginTop: "0.3rem" }}>
            {executionFailure.whyExecutionWillStall}
          </p>
          <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.10em", color: `${GOLD}90`, marginTop: "0.5rem" }}>
            Required: {executionFailure.requiredCorrection}
          </p>
        </div>
      )}

      {/* 4. Governance Move */}
      {authorityIndex && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "0.75rem" }}>
          <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
            Next governance move
          </span>
          <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginTop: "0.2rem" }}>
            {authorityIndex.nextGovernanceMove}
          </p>
          <Link href="/diagnostics/executive-reporting" className="mt-3 inline-flex items-center gap-1.5" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: `${GOLD}AA` }}>
            Price this in Executive Reporting <ArrowRight style={{ width: 9, height: 9 }} />
          </Link>
        </div>
      )}
    </div>
  );
}
