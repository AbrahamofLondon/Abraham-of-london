/**
 * components/admin/AdminActionButton.tsx
 *
 * Standardised action button with intent, loading, and disabled states.
 * Never disappears when blocked — shows why instead.
 */

import * as React from "react";
import { Loader2 } from "lucide-react";

export type AdminActionButtonIntent =
  | "primary"    // sky/blue — main affirmative action
  | "danger"     // rose — destructive / irreversible
  | "warning"    // amber — gated / requires confirmation
  | "neutral"    // white/30 — secondary action
  | "success";   // emerald — positive completion

export type AdminActionButtonProps = {
  children: React.ReactNode;
  intent?: AdminActionButtonIntent;
  loading?: boolean;
  disabled?: boolean;
  blockerReason?: string;   // shown as tooltip/subtitle when disabled
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

const INTENT_CLASSES: Record<AdminActionButtonIntent, string> = {
  primary:  "border-sky-400/30 bg-sky-400/10 text-sky-100 hover:bg-sky-400/18 hover:border-sky-400/45",
  danger:   "border-rose-400/30 bg-rose-400/10 text-rose-100 hover:bg-rose-400/18 hover:border-rose-400/45",
  warning:  "border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/18 hover:border-amber-400/45",
  neutral:  "border-white/15 bg-black/20 text-white/65 hover:text-white/90 hover:border-white/25",
  success:  "border-emerald-400/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/18 hover:border-emerald-400/45",
};

export function AdminActionButton({
  children,
  intent = "neutral",
  loading = false,
  disabled = false,
  blockerReason,
  onClick,
  type = "button",
  className = "",
}: AdminActionButtonProps) {
  const isBlocked = disabled || loading;

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        type={type}
        onClick={onClick}
        disabled={isBlocked}
        title={disabled && blockerReason ? blockerReason : undefined}
        className={`inline-flex items-center gap-2 border px-3 py-2 text-xs transition-colors ${INTENT_CLASSES[intent]} ${
          isBlocked ? "cursor-not-allowed opacity-40" : ""
        } ${className}`}
      >
        {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
      {disabled && blockerReason && (
        <p className="text-[10px] text-white/30 leading-tight max-w-xs">{blockerReason}</p>
      )}
    </div>
  );
}
