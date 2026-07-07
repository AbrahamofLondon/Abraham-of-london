import type { CSSProperties } from "react";

/**
 * Canonical assessment design-system foundation.
 *
 * This is deliberately framework-light: pages/components may consume these tokens
 * and style helpers without importing a second visual language. Claude-owned
 * flagship journey files should migrate to this contract when their lane is free.
 */

export const assessmentTokens = {
  color: {
    ground: "#0B0B0A",
    panel: "rgba(255,255,255,0.035)",
    panelStrong: "rgba(255,255,255,0.06)",
    line: "rgba(255,255,255,0.12)",
    lineMuted: "rgba(255,255,255,0.08)",
    text: "rgba(255,255,255,0.88)",
    textMuted: "rgba(255,255,255,0.62)",
    textFaint: "rgba(255,255,255,0.42)",
    authority: "#C9A96E",
    success: "#6EE7B7",
    warning: "#FBBF24",
    danger: "#FCA5A5",
    info: "#93C5FD",
  },
  font: {
    serif: "'Cormorant Garamond', Georgia, ui-serif, serif",
    body: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
  },
  radius: {
    small: 4,
    medium: 6,
  },
  space: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 36,
  },
  type: {
    meta: 11,
    small: 13,
    body: 15,
    lead: 17,
    h3: 22,
    h2: 30,
  },
} as const;

export type AssessmentAccessMode = "free" | "self_serve" | "controlled" | "manual_billing" | "unavailable";
export type AssessmentGovernanceState = "open" | "validation_gated" | "auth_gated" | "entitlement_gated" | "controlled";
export type AssessmentEvidencePosture = "user_reported" | "system_inferred" | "operator_verified" | "third_party";

export type AssessmentInstrumentMeta = {
  productCode: string;
  surfaceType: "diagnostic" | "instrument" | "playbook" | "foundry" | "intake" | "decision_centre" | "corridor";
  governanceState: AssessmentGovernanceState;
  expectedDuration: string | null;
  priceOrAccess: string;
  accessMode: AssessmentAccessMode;
  methodologyVersion: string | null;
  evidencePosture: AssessmentEvidencePosture;
};

export type AssessmentResultSlot = {
  finding?: string;
  evidenceBasis?: string;
  contradiction?: string;
  evidenceGap?: string;
  uncertainty?: string;
  questionToResolve?: string;
  nextAdmissibleMove?: string;
  whyAdmissible?: string;
  notYetAppropriate?: string;
  carriesForward?: string[];
  governance?: string;
};

export function assessmentLabelStyle(): CSSProperties {
  return {
    fontFamily: assessmentTokens.font.mono,
    fontSize: assessmentTokens.type.meta,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    color: assessmentTokens.color.textFaint,
    lineHeight: 1.4,
  };
}

export function assessmentFieldStyle(state: "default" | "invalid" | "disabled" = "default"): CSSProperties {
  return {
    width: "100%",
    minHeight: 42,
    borderRadius: assessmentTokens.radius.small,
    border: `1px solid ${state === "invalid" ? assessmentTokens.color.danger : assessmentTokens.color.line}`,
    background: state === "disabled" ? "rgba(255,255,255,0.025)" : assessmentTokens.color.panel,
    color: state === "disabled" ? assessmentTokens.color.textFaint : assessmentTokens.color.text,
    padding: "10px 12px",
    fontFamily: assessmentTokens.font.body,
    fontSize: assessmentTokens.type.small,
    lineHeight: 1.45,
    outlineColor: assessmentTokens.color.authority,
  };
}

export function assessmentPrimaryActionStyle(disabled = false): CSSProperties {
  return {
    minHeight: 44,
    borderRadius: assessmentTokens.radius.small,
    border: `1px solid ${assessmentTokens.color.authority}66`,
    background: disabled ? "rgba(255,255,255,0.035)" : `${assessmentTokens.color.authority}22`,
    color: disabled ? assessmentTokens.color.textFaint : assessmentTokens.color.authority,
    padding: "12px 18px",
    fontFamily: assessmentTokens.font.mono,
    fontSize: assessmentTokens.type.meta,
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    cursor: disabled ? "not-allowed" : "pointer",
  };
}

export function assessmentPanelStyle(kind: "default" | "evidence" | "warning" | "governance" = "default"): CSSProperties {
  const border = kind === "warning" ? assessmentTokens.color.warning : kind === "governance" ? assessmentTokens.color.authority : assessmentTokens.color.lineMuted;
  return {
    border: `1px solid ${border}55`,
    borderRadius: assessmentTokens.radius.medium,
    background: assessmentTokens.color.panel,
    padding: assessmentTokens.space.md,
  };
}