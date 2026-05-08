"use client";

/**
 * AdmissionNotice — reusable institutional admission/restriction pattern.
 *
 * Displays admission status with evidence tier, authority, continuity,
 * repair actions, and return path. Institutional, clear, calm, not punitive.
 *
 * Supports: ADMITTED, RESTRICTED, BLOCKED, REPAIR_REQUIRED, REVIEW_REQUIRED
 */

import * as React from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, XCircle, ShieldCheck, AlertTriangle, Clock } from "lucide-react";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

type AdmissionStatus = "ADMITTED" | "RESTRICTED" | "BLOCKED" | "REPAIR_REQUIRED" | "REVIEW_REQUIRED";

type AdmissionNoticeProps = {
  status: AdmissionStatus;
  surface: string;
  reasons?: string[];
  evidenceTier?: string | null;
  authorityStatus?: string | null;
  continuityStatus?: string | null;
  caseId?: string | null;
  repairActions?: string[];
  returnPath?: string | null;
  /** Compact mode for inline use */
  compact?: boolean;
};

const STATUS_CONFIG: Record<AdmissionStatus, { icon: typeof CheckCircle; label: string; color: string; borderColor: string; bgColor: string }> = {
  ADMITTED: { icon: CheckCircle, label: "Admitted", color: "rgba(110,231,183,0.65)", borderColor: "rgba(110,231,183,0.15)", bgColor: "rgba(110,231,183,0.03)" },
  RESTRICTED: { icon: XCircle, label: "Restricted", color: "rgba(252,165,165,0.65)", borderColor: "rgba(252,165,165,0.15)", bgColor: "rgba(252,165,165,0.03)" },
  BLOCKED: { icon: XCircle, label: "Blocked", color: "rgba(252,165,165,0.75)", borderColor: "rgba(252,165,165,0.20)", bgColor: "rgba(252,165,165,0.04)" },
  REPAIR_REQUIRED: { icon: AlertTriangle, label: "Repair required", color: "rgba(251,191,36,0.65)", borderColor: "rgba(251,191,36,0.15)", bgColor: "rgba(251,191,36,0.03)" },
  REVIEW_REQUIRED: { icon: Clock, label: "Under review", color: "rgba(255,255,255,0.40)", borderColor: "rgba(255,255,255,0.08)", bgColor: "rgba(255,255,255,0.02)" },
};

export default function AdmissionNotice({
  status,
  surface,
  reasons = [],
  evidenceTier,
  authorityStatus,
  continuityStatus,
  caseId,
  repairActions = [],
  returnPath,
  compact = false,
}: AdmissionNoticeProps) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      style={{
        border: `1px solid ${config.borderColor}`,
        backgroundColor: config.bgColor,
        padding: compact ? "12px 16px" : "20px 24px",
      }}
    >
      {/* Status header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: compact ? "8px" : "12px" }}>
        <Icon style={{ width: "14px", height: "14px", color: config.color, flexShrink: 0 }} />
        <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.18em", textTransform: "uppercase", color: config.color }}>
          {config.label} · {surface}
        </span>
      </div>

      {/* Status fields */}
      <div style={{ display: "grid", gap: "4px", marginBottom: reasons.length || repairActions.length ? "12px" : "0" }}>
        {evidenceTier && (
          <StatusField label="Evidence tier" value={evidenceTier} />
        )}
        {authorityStatus && (
          <StatusField label="Authority" value={authorityStatus} />
        )}
        {continuityStatus && (
          <StatusField label="Continuity" value={continuityStatus} />
        )}
        {caseId && (
          <StatusField label="Case reference" value={caseId} />
        )}
      </div>

      {/* Reasons */}
      {reasons.length > 0 && !compact && (
        <div style={{ marginBottom: "12px" }}>
          {reasons.map((reason, i) => (
            <p key={i} style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginBottom: "2px" }}>
              {reason}
            </p>
          ))}
        </div>
      )}

      {/* Repair actions */}
      {repairActions.length > 0 && (
        <div style={{ marginBottom: returnPath ? "12px" : "0" }}>
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", display: "block", marginBottom: "6px" }}>
            Required to proceed
          </span>
          {repairActions.map((action, i) => (
            <p key={i} style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.55)", paddingLeft: "10px", marginBottom: "2px" }}>
              {action}
            </p>
          ))}
        </div>
      )}

      {/* Case preservation message */}
      {caseId && (status === "RESTRICTED" || status === "REPAIR_REQUIRED") && (
        <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.5, color: "rgba(255,255,255,0.35)", fontStyle: "italic", marginBottom: returnPath ? "12px" : "0" }}>
          Your case has been preserved. You do not need to start again. Return after completing the required steps.
        </p>
      )}

      {/* Return path */}
      {returnPath && (status === "RESTRICTED" || status === "REPAIR_REQUIRED" || status === "BLOCKED") && (
        <Link
          href={returnPath}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            border: `1px solid ${GOLD}35`,
            color: `${GOLD}CC`,
            ...mono,
            fontSize: "9px",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            textDecoration: "none",
          }}
        >
          Continue building evidence <ArrowRight style={{ width: "10px", height: "10px" }} />
        </Link>
      )}

      {/* Admitted confirmation */}
      {status === "ADMITTED" && !compact && (
        <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.5, color: "rgba(110,231,183,0.45)", fontStyle: "italic" }}>
          Admission confirmed. Evidence, authority, and readiness verified.
        </p>
      )}
    </div>
  );
}

function StatusField({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>
        {label}
      </span>
      <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.06em", color: "rgba(255,255,255,0.45)" }}>
        {value}
      </span>
    </div>
  );
}

export type { AdmissionStatus, AdmissionNoticeProps };
