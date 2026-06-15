"use client";

/**
 * components/living/LivingStatePanel.tsx
 *
 * THE generic living-state surface. One panel for the whole estate — domains
 * provide a LivingStateObject (via their adapter + the engine); this panel
 * renders it. There must be no product-specific intelligence panel; product
 * pages either use this directly or wrap it.
 *
 * Audience gating is enforced here in addition to the engine's safety flags:
 *   - operator: full detail (operator summary, blockers, all next actions,
 *     evidence incl. internal supporting detail, memory).
 *   - user: only the user-safe slice, and only when the engine marked the
 *     object safe to show a user. Never leaks operator/admin internals.
 *
 * Usage:
 *   <LivingStatePanel object={livingStateObject} audience="operator" />
 *   <LivingStatePanel object={livingStateObject} audience="user" variant="light" />
 */

import { getLivingTheme, type LivingThemeVariant } from "@/lib/product/living-theme";
import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";
import LivingStateBlockerList from "@/components/living/LivingStateBlockerList";
import LivingStateNextActions from "@/components/living/LivingStateNextActions";
import LivingStateEvidencePanel from "@/components/living/LivingStateEvidencePanel";
import LivingStateMemoryPanel from "@/components/living/LivingStateMemoryPanel";

export type LivingStatePanelAudience = "operator" | "user";

type Props = {
  object: LivingStateObject;
  audience?: LivingStatePanelAudience;
  variant?: LivingThemeVariant;
  className?: string;
};

export default function LivingStatePanel({
  object,
  audience = "operator",
  variant = "dark",
  className = "",
}: Props) {
  const theme = getLivingTheme(variant);
  const isUser = audience === "user";

  // User audience: never render if the engine did not mark this user-safe.
  if (isUser && !object.safeToShowUser) {
    return (
      <div className={`p-5 ${className}`} style={{ border: `1px solid ${theme.divider}`, backgroundColor: theme.bg }}>
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] mb-2" style={{ color: theme.muted }}>
          {object.statusLabel}
        </div>
        <p className="text-sm leading-6" style={{ color: theme.body }}>
          {object.userVisibleSummary}
        </p>
      </div>
    );
  }

  const summary = isUser ? object.userVisibleSummary : object.operatorSummary;

  // For users, only show actions they themselves own.
  const userActions = object.nextActions.filter(
    (a) => a.owner === "user" || a.owner === "client",
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="p-5" style={{ border: `1px solid ${theme.border}`, backgroundColor: theme.bg }}>
        <div className="flex items-baseline justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: theme.accent }}>
            {object.domain} · {object.subjectType}
          </div>
          <span className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: theme.amber }}>
            {object.statusLabel}
          </span>
        </div>
        <h3 className="text-base font-medium mt-2" style={{ color: theme.heading }}>
          {object.title}
        </h3>
        <p className="text-sm leading-6 mt-1" style={{ color: theme.body }}>
          {summary}
        </p>
      </div>

      {/* Evidence (always relevant; user-safe hides internal supporting detail) */}
      <LivingStateEvidencePanel evidence={object.evidence} userSafe={isUser} variant={variant} />

      {isUser ? (
        // User: only their own governed actions; no blockers/memory leakage.
        userActions.length > 0 && (
          <LivingStateNextActions nextActions={userActions} variant={variant} />
        )
      ) : (
        <>
          <LivingStateBlockerList blockers={object.blockers} variant={variant} />
          <LivingStateNextActions nextActions={object.nextActions} variant={variant} />
          <LivingStateMemoryPanel memory={object.memory} variant={variant} />
        </>
      )}
    </div>
  );
}
