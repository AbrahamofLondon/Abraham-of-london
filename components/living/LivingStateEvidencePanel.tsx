"use client";

/**
 * components/living/LivingStateEvidencePanel.tsx
 *
 * Generic render of LivingStateObject.evidence. Shows the honest evidence
 * posture, what supports it, what is missing, and — crucially — what the system
 * explicitly cannot infer. Reused across user- and operator-facing surfaces.
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";
import type {
  LivingStateEvidence,
  LivingStateEvidenceStatus,
} from "@/lib/living-intelligence/living-state-object-contract";

type Props = {
  evidence: LivingStateEvidence;
  /** When true, hides internal supporting-evidence detail (user-facing). */
  userSafe?: boolean;
  variant?: LivingThemeVariant;
  className?: string;
};

const STATUS_LABEL: Record<LivingStateEvidenceStatus, string> = {
  verified: "Verified",
  strongly_indicated: "Strongly indicated",
  weakly_indicated: "Weakly indicated",
  inferred: "Inferred",
  unverified: "Unverified",
  contradictory: "Contradictory",
  needs_human_review: "Needs human review",
};

function statusColor(
  status: LivingStateEvidenceStatus,
  theme: ReturnType<typeof getLivingTheme>,
): string {
  switch (status) {
    case "verified":
      return theme.emerald;
    case "strongly_indicated":
      return theme.accent;
    case "weakly_indicated":
    case "inferred":
      return theme.amber;
    case "unverified":
    case "needs_human_review":
      return theme.amber;
    case "contradictory":
      return theme.red;
  }
}

export default function LivingStateEvidencePanel({
  evidence,
  userSafe = false,
  variant = "dark",
  className = "",
}: Props) {
  const theme = getLivingTheme(variant);
  const color = statusColor(evidence.status, theme);

  return (
    <div className={`p-4 ${className}`} style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.muted }}>
          Evidence posture
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color }}>
          {STATUS_LABEL[evidence.status]}
        </span>
      </div>

      {!userSafe && evidence.supportingEvidence.length > 0 && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.dim }}>
            What the system heard
          </div>
          {evidence.supportingEvidence.map((e, i) => (
            <div key={i} className="text-xs leading-5" style={{ color: theme.body }}>• {e}</div>
          ))}
        </div>
      )}

      {evidence.missingEvidence.length > 0 && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.dim }}>
            What is still missing
          </div>
          {evidence.missingEvidence.map((e, i) => (
            <div key={i} className="text-xs leading-5" style={{ color: theme.muted }}>• {e}</div>
          ))}
        </div>
      )}

      {evidence.cannotInfer.length > 0 && (
        <div className="pt-3 mt-1" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.red }}>
            What cannot be inferred
          </div>
          {evidence.cannotInfer.map((e, i) => (
            <div key={i} className="text-xs leading-5" style={{ color: theme.muted }}>• {e}</div>
          ))}
        </div>
      )}
    </div>
  );
}
