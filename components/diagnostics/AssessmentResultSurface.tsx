/**
 * components/diagnostics/AssessmentResultSurface.tsx
 *
 * Shared result surface for all governed assessments.
 *
 * Renders the canonical 9-section layout defined by the assessment result contract.
 * No page should show three equal CTAs — this component enforces a single primary
 * earned action with optional secondary save/send actions.
 *
 * Usage:
 *   <AssessmentResultSurface
 *     result={assessmentResult}
 *     onSave={...}      // optional save-to-DC action
 *     onSend={...}      // optional send-to-self action
 *   />
 */

import * as React from "react";
import Link from "next/link";

import type { AssessmentResult } from "@/lib/diagnostics/assessment-result-contract";
import { describeEvidencePosture, recordStatusLabel } from "@/lib/diagnostics/assessment-result-contract";

// ─── Tokens ───────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "8px",
        letterSpacing: "0.20em",
        textTransform: "uppercase",
        color: "rgba(255,255,255,0.28)",
        marginBottom: "6px",
      }}
    >
      {children}
    </p>
  );
}

function GoldDivider() {
  return (
    <div
      style={{
        height: "1px",
        background: `linear-gradient(90deg, transparent 0%, ${GOLD}20 20%, ${GOLD}20 80%, transparent 100%)`,
        margin: "24px 0",
      }}
    />
  );
}

function PosturePill({ posture }: { posture: AssessmentResult["evidencePosture"] }) {
  const labels: Record<AssessmentResult["evidencePosture"], string> = {
    USER_REPORTED: "User-reported",
    SYSTEM_INFERRED: "System-inferred",
    OPERATOR_VERIFIED: "Operator-verified",
    THIRD_PARTY: "Third-party",
  };
  return (
    <span
      style={{
        ...mono,
        fontSize: "7px",
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        border: `1px solid ${GOLD}30`,
        color: `${GOLD}BB`,
        padding: "2px 8px",
        display: "inline-block",
      }}
    >
      {labels[posture]}
    </span>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

export type AssessmentResultSurfaceProps = {
  result: AssessmentResult;
  /** Optional secondary action: save to Decision Centre */
  onSave?: () => void;
  /** Whether a save action is available */
  canSave?: boolean;
  /** Optional secondary node: send-to-self form */
  sendToSelfSlot?: React.ReactNode;
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssessmentResultSurface({
  result,
  onSave,
  canSave,
  sendToSelfSlot,
}: AssessmentResultSurfaceProps) {
  const {
    title,
    band,
    score,
    primaryFinding,
    failurePattern,
    evidencePosture,
    governanceImplication,
    recommendedNextMove,
    consequenceTimeline,
    earnedRoute,
    recordStatus,
  } = result;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>

      {/* ── 1. Case ID / record status ─────────────────────────────────── */}
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          marginBottom: "2px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.25)",
            }}
          >
            {recordStatus.level === "SESSION_PREVIEW"
              ? "Session preview"
              : recordStatus.level === "ACCOUNT_RECORD"
              ? "Account record"
              : "Governed case"}
          </span>
          {recordStatus.caseId && (
            <span
              style={{
                ...mono,
                fontSize: "9px",
                color: `${GOLD}99`,
                borderLeft: `1px solid ${GOLD}25`,
                paddingLeft: "10px",
              }}
            >
              {recordStatus.caseId}
            </span>
          )}
        </div>
        <span
          style={{
            ...mono,
            fontSize: "7px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.25)",
            textAlign: "right",
          }}
        >
          {recordStatusLabel(recordStatus.level, recordStatus.caseId)}
        </span>
      </section>

      {/* ── Title + band ───────────────────────────────────────────────── */}
      <section
        style={{
          padding: "24px 0 16px",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: `${GOLD}AA`,
              marginBottom: "6px",
            }}
          >
            {band}
            {score !== null && score !== undefined && ` · ${score}/100`}
          </p>
        </div>
        <h2
          style={{
            ...serif,
            fontSize: "clamp(22px, 3vw, 32px)",
            color: "rgba(255,255,255,0.90)",
            lineHeight: 1.25,
            marginTop: "4px",
          }}
        >
          {title}
        </h2>
      </section>

      <GoldDivider />

      {/* ── 2. Primary finding ─────────────────────────────────────────── */}
      <section style={{ marginBottom: "20px" }}>
        <SectionLabel>Primary finding</SectionLabel>
        <p
          style={{
            ...serif,
            fontSize: "17px",
            color: "rgba(255,255,255,0.80)",
            lineHeight: 1.65,
          }}
        >
          {primaryFinding}
        </p>
      </section>

      {/* ── 3. Failure pattern ─────────────────────────────────────────── */}
      <section
        style={{
          borderLeft: `2px solid ${GOLD}40`,
          paddingLeft: "16px",
          marginBottom: "24px",
        }}
      >
        <SectionLabel>Failure pattern</SectionLabel>
        <p
          style={{
            ...serif,
            fontSize: "15px",
            color: "rgba(255,255,255,0.60)",
            lineHeight: 1.65,
            fontStyle: "italic",
          }}
        >
          {failurePattern}
        </p>
      </section>

      {/* ── 4. Evidence posture ────────────────────────────────────────── */}
      <section style={{ marginBottom: "24px" }}>
        <SectionLabel>Evidence posture</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <PosturePill posture={evidencePosture} />
          <p
            style={{
              ...mono,
              fontSize: "10px",
              color: "rgba(255,255,255,0.35)",
              lineHeight: 1.6,
            }}
          >
            {describeEvidencePosture(evidencePosture)}
          </p>
        </div>
      </section>

      <GoldDivider />

      {/* ── 5. Governance implication ──────────────────────────────────── */}
      <section
        style={{
          border: "1px solid rgba(255,200,100,0.12)",
          background: "rgba(255,200,100,0.04)",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <SectionLabel>Governance implication</SectionLabel>
        <p
          style={{
            ...serif,
            fontSize: "15px",
            color: "rgba(255,255,255,0.75)",
            lineHeight: 1.7,
          }}
        >
          {governanceImplication}
        </p>
      </section>

      {/* ── 6. Consequence timeline ────────────────────────────────────── */}
      <section style={{ marginBottom: "24px" }}>
        <SectionLabel>If this condition goes unaddressed</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {(
            [
              { label: "7 days", value: consequenceTimeline.sevenDays },
              { label: "30 days", value: consequenceTimeline.thirtyDays },
              { label: "90 days", value: consequenceTimeline.ninetyDays },
            ] as const
          ).map(({ label, value }) => (
            <div key={label} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
              <span
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: `${GOLD}80`,
                  minWidth: "52px",
                  paddingTop: "3px",
                  flexShrink: 0,
                }}
              >
                {label}
              </span>
              <p
                style={{
                  ...serif,
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.55)",
                  lineHeight: 1.65,
                }}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 7. Recommended next move ───────────────────────────────────── */}
      <section
        style={{
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          padding: "16px",
          marginBottom: "24px",
        }}
      >
        <SectionLabel>Required move</SectionLabel>
        <p
          style={{
            ...serif,
            fontSize: "16px",
            color: "rgba(255,255,255,0.80)",
            lineHeight: 1.6,
          }}
        >
          {recommendedNextMove}
        </p>
      </section>

      {/* ── 8. Primary earned action ───────────────────────────────────── */}
      <section style={{ marginBottom: "16px" }}>
        <SectionLabel>Earned next action</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <Link
            href={earnedRoute.href}
            style={{
              ...mono,
              fontSize: "10px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: GOLD,
              border: `1px solid ${GOLD}40`,
              background: `${GOLD}0A`,
              padding: "12px 20px",
              textDecoration: "none",
              display: "inline-block",
              alignSelf: "flex-start",
            }}
          >
            {earnedRoute.label}
          </Link>
          <p
            style={{
              ...mono,
              fontSize: "9px",
              color: "rgba(255,255,255,0.30)",
              lineHeight: 1.5,
              maxWidth: "480px",
            }}
          >
            {earnedRoute.reason}
          </p>
        </div>
      </section>

      {/* ── 9. Secondary save/send actions ────────────────────────────── */}
      {(onSave || sendToSelfSlot) && (
        <section
          style={{
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {onSave && (
            <button
              type="button"
              onClick={onSave}
              disabled={!canSave}
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: canSave ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.20)",
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.03)",
                padding: "10px 16px",
                cursor: canSave ? "pointer" : "not-allowed",
                alignSelf: "flex-start",
              }}
            >
              Save to Decision Centre
            </button>
          )}
          {sendToSelfSlot}
        </section>
      )}
    </div>
  );
}
