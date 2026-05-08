"use client";

/**
 * CounselStatusPanel — displays counsel escalation status.
 *
 * The Strategy Room is a mostly automated governed execution environment.
 * Counsel enters only when governance thresholds are exceeded.
 * This panel shows whether automated governance continues or counsel is needed.
 *
 * Counsel is an escalation privilege, not a sales CTA.
 */

import * as React from "react";
import { ShieldCheck, AlertTriangle, XCircle, Clock } from "lucide-react";

type CounselStatus =
  | "NOT_REQUIRED"
  | "RECOMMENDED"
  | "REQUIRED"
  | "PAUSED_PENDING_REVIEW"
  | "ESCALATED_TO_RETAINER";

type Props = {
  status: CounselStatus;
  reasons?: string[];
  explanation?: string | null;
  systemAction?: string | null;
  repairActions?: string[];
  compact?: boolean;
};

const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const STATUS_CONFIG: Record<CounselStatus, { icon: typeof ShieldCheck; label: string; color: string; borderColor: string; bgColor: string }> = {
  NOT_REQUIRED: {
    icon: ShieldCheck,
    label: "Automated governance active",
    color: "rgba(110,231,183,0.55)",
    borderColor: "rgba(110,231,183,0.10)",
    bgColor: "rgba(110,231,183,0.02)",
  },
  RECOMMENDED: {
    icon: AlertTriangle,
    label: "Counsel review recommended",
    color: "rgba(251,191,36,0.60)",
    borderColor: "rgba(251,191,36,0.12)",
    bgColor: "rgba(251,191,36,0.02)",
  },
  REQUIRED: {
    icon: XCircle,
    label: "Counsel review required",
    color: "rgba(252,165,165,0.65)",
    borderColor: "rgba(252,165,165,0.15)",
    bgColor: "rgba(252,165,165,0.03)",
  },
  PAUSED_PENDING_REVIEW: {
    icon: Clock,
    label: "Execution paused — counsel review required",
    color: "rgba(252,165,165,0.70)",
    borderColor: "rgba(252,165,165,0.18)",
    bgColor: "rgba(252,165,165,0.04)",
  },
  ESCALATED_TO_RETAINER: {
    icon: AlertTriangle,
    label: "Escalated to retainer oversight",
    color: "#C9A96E",
    borderColor: "rgba(201,169,110,0.20)",
    bgColor: "rgba(201,169,110,0.03)",
  },
};

export default function CounselStatusPanel({
  status,
  reasons = [],
  explanation,
  systemAction,
  repairActions = [],
  compact = false,
}: Props) {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  return (
    <div
      style={{
        border: `1px solid ${config.borderColor}`,
        backgroundColor: config.bgColor,
        padding: compact ? "10px 14px" : "16px 20px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: compact ? "4px" : "10px" }}>
        <Icon style={{ width: "13px", height: "13px", color: config.color, flexShrink: 0 }} />
        <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", color: config.color }}>
          {config.label}
        </span>
      </div>

      {/* Explanation */}
      {explanation && !compact && (
        <p style={{ fontSize: "13px", lineHeight: 1.65, color: "rgba(255,255,255,0.45)", marginBottom: "10px" }}>
          {explanation}
        </p>
      )}

      {/* Reasons */}
      {reasons.length > 0 && !compact && (
        <div style={{ marginBottom: "10px" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", display: "block", marginBottom: "4px" }}>
            Triggers
          </span>
          {reasons.map((reason, i) => (
            <p key={i} style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.35)", marginBottom: "2px" }}>
              {reason}
            </p>
          ))}
        </div>
      )}

      {/* Repair actions */}
      {repairActions.length > 0 && !compact && (status === "REQUIRED" || status === "PAUSED_PENDING_REVIEW") && (
        <div>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)", display: "block", marginBottom: "4px" }}>
            Required before execution resumes
          </span>
          {repairActions.map((action, i) => (
            <p key={i} style={{ fontSize: "12px", lineHeight: 1.55, color: "rgba(255,255,255,0.40)", marginBottom: "2px" }}>
              {action}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

export type { CounselStatus, Props as CounselStatusPanelProps };
