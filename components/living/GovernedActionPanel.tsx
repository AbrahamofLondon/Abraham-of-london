"use client";

/**
 * Shows what action is now required, what evidence supports it,
 * and what proves progress. Consumes real engine output.
 *
 * Includes safe feedback capture controls when a feedbackId and objectId
 * are provided, allowing users to record action state without falsely
 * inferring evidence verification, completion, or approval.
 */

import React from "react";
import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";

type Props = {
  requiredAction: string | null;
  whyThisAction: string | null;
  whatProvesProgress: string | null;
  whatHappensNext: string | null;
  evidenceBasis?: string[];
  feedbackStatus?: string | null;
  feedbackId?: string | null;
  objectId?: string | null;
  actionId?: string | null;
  audience?: "user" | "operator";
  className?: string;
  variant?: LivingThemeVariant;
};

const USER_ACTIONS = [
  { status: "acknowledged", label: "I understand" },
  { status: "started", label: "I have started" },
  { status: "evidence_submitted", label: "I have evidence to add" },
  { status: "skipped", label: "I cannot proceed yet" },
];

const OPERATOR_ACTIONS = [
  { status: "started", label: "Mark started" },
  { status: "completed_unverified", label: "Mark completed (unverified)" },
  { status: "blocked", label: "Mark blocked" },
  { status: "skipped", label: "Mark skipped" },
];

export default function GovernedActionPanel({
  requiredAction,
  whyThisAction,
  whatProvesProgress,
  whatHappensNext,
  evidenceBasis,
  feedbackStatus,
  feedbackId,
  objectId,
  actionId,
  audience = "user",
  className = "",
  variant = "dark",
}: Props) {
  const theme = getLivingTheme(variant);
  const [updating, setUpdating] = React.useState(false);
  const [updateError, setUpdateError] = React.useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = React.useState<string | null>(feedbackStatus ?? null);

  if (!requiredAction) return null;

  const hasFeedbackId = Boolean(feedbackId || (objectId && actionId));
  const isTerminal = currentStatus === "verified_complete" || currentStatus === "expired";

  async function handleFeedbackUpdate(status: string) {
    if (!hasFeedbackId || updating || isTerminal) return;

    setUpdating(true);
    setUpdateError(null);

    try {
      const route = audience === "operator"
        ? "/api/internal/living-action-feedback/update"
        : "/api/living-action-feedback/user-update";

      const body: Record<string, unknown> = { status };
      if (feedbackId) body.feedbackId = feedbackId;
      if (objectId) body.objectId = objectId;
      if (actionId) body.actionId = actionId;

      const response = await fetch(route, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await response.json();
      if (json.ok) {
        setCurrentStatus(status);
      } else {
        setUpdateError(json.error || "Failed to update");
      }
    } catch {
      setUpdateError("Network error");
    } finally {
      setUpdating(false);
    }
  }

  const availableActions = audience === "operator" ? OPERATOR_ACTIONS : USER_ACTIONS;

  return (
    <div className={`p-5 ${className}`} style={{ border: `1px solid ${theme.amber}22`, backgroundColor: variant === 'dark' ? 'rgba(251,191,36,0.03)' : 'rgba(180,130,30,0.04)' }}>
      <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-3" style={{ color: theme.amber }}>
        Required action
      </div>

      <p className="text-base leading-7 mb-4" style={{ color: theme.heading }}>
        {requiredAction}
      </p>

      {/* Feedback status badge */}
      {currentStatus && (
        <div className="mb-3">
          <span
            className="inline-block font-mono text-[8px] uppercase tracking-[0.16em] px-2 py-0.5"
            style={{
              border: `1px solid ${
                currentStatus === "verified_complete" ? theme.emerald :
                currentStatus === "started" || currentStatus === "evidence_submitted" ? theme.accent :
                currentStatus === "skipped" || currentStatus === "blocked" || currentStatus === "regressed" ? theme.red :
                theme.amber
              }40`,
              color: currentStatus === "verified_complete" ? theme.emerald :
                currentStatus === "started" || currentStatus === "evidence_submitted" ? theme.accent :
                currentStatus === "skipped" || currentStatus === "blocked" || currentStatus === "regressed" ? theme.red :
                theme.amber,
              backgroundColor: `${
                currentStatus === "verified_complete" ? theme.emerald :
                currentStatus === "started" || currentStatus === "evidence_submitted" ? theme.accent :
                currentStatus === "skipped" || currentStatus === "blocked" || currentStatus === "regressed" ? theme.red :
                theme.amber
              }10`,
            }}
          >
            {currentStatus.replace(/_/g, ' ')}
          </span>
        </div>
      )}

      {whyThisAction && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.muted }}>
            Why this action
          </div>
          <p className="text-sm leading-6" style={{ color: theme.body }}>{whyThisAction}</p>
        </div>
      )}

      {whatProvesProgress && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.muted }}>
            What proves progress
          </div>
          <p className="text-sm leading-6" style={{ color: theme.body }}>{whatProvesProgress}</p>
        </div>
      )}

      {whatHappensNext && (
        <div className="mb-3">
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.muted }}>
            What happens next
          </div>
          <p className="text-sm leading-6" style={{ color: theme.body }}>{whatHappensNext}</p>
        </div>
      )}

      {evidenceBasis && evidenceBasis.length > 0 && (
        <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-1" style={{ color: theme.dim }}>
            Evidence basis
          </div>
          {evidenceBasis.map((e, i) => (
            <div key={i} className="text-xs leading-5" style={{ color: theme.muted }}>{e}</div>
          ))}
        </div>
      )}

      {/* Feedback capture controls */}
      {hasFeedbackId && !isTerminal && (
        <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <div className="font-mono text-[9px] uppercase tracking-[0.18em] mb-2" style={{ color: theme.dim }}>
            {audience === "operator" ? "Update status" : "Your progress"}
          </div>
          <div className="flex flex-wrap gap-2">
            {availableActions.map((action) => {
              const isActive = currentStatus === action.status;
              const isDisabled = updating || isActive;
              return (
                <button
                  key={action.status}
                  type="button"
                  onClick={() => handleFeedbackUpdate(action.status)}
                  disabled={isDisabled}
                  style={{
                    border: `1px solid ${isActive ? theme.accent : theme.divider}`,
                    backgroundColor: isActive ? `${theme.accent}15` : "transparent",
                    color: isActive ? theme.accent : theme.muted,
                    cursor: isDisabled ? "default" : "pointer",
                    opacity: isDisabled ? 0.5 : 1,
                    fontSize: "9px",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    padding: "4px 10px",
                  }}
                  className="transition-colors"
                >
                  {action.label}
                </button>
              );
            })}
          </div>
          {updateError && (
            <p className="mt-2 text-[10px]" style={{ color: theme.red }}>{updateError}</p>
          )}
          {updating && (
            <p className="mt-2 text-[10px]" style={{ color: theme.muted }}>Updating...</p>
          )}
        </div>
      )}

      {/* Read-only notice when no feedback route available */}
      {!hasFeedbackId && !isTerminal && (
        <div className="pt-3 mt-3" style={{ borderTop: `1px solid ${theme.divider}` }}>
          <p className="text-[10px]" style={{ color: theme.dim }}>
            Feedback capture route unavailable. Action state is read-only in this environment.
          </p>
        </div>
      )}
    </div>
  );
}
