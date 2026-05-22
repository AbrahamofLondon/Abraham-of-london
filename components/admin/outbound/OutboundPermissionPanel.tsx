/**
 * components/admin/outbound/OutboundPermissionPanel.tsx
 *
 * Expandable panel showing all granted and missing scopes/permissions
 * for a provider connection. Used in Facebook, X, and LinkedIn consoles.
 */

import * as React from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type PermissionEntry = {
  scope: string;
  label?: string;
  description?: string;
};

export type OutboundPermissionPanelProps = {
  grantedScopes: string[];
  missingScopes: string[];
  /** Optional human-readable labels for scope names */
  scopeLabels?: Record<string, string>;
  /** Optional help text shown below the permission list */
  helpText?: string;
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OutboundPermissionPanel({
  grantedScopes,
  missingScopes,
  scopeLabels = {},
  helpText,
}: OutboundPermissionPanelProps) {
  function labelFor(scope: string): string {
    return scopeLabels[scope] ?? scope;
  }

  const hasMissing = missingScopes.length > 0;

  return (
    <div className="rounded-lg border border-white/8 bg-white/[0.02] p-4">
      <h3 className="mb-3 text-[11px] font-medium uppercase tracking-widest text-white/40">
        Permissions
      </h3>

      {/* Granted */}
      {grantedScopes.length > 0 && (
        <div className="mb-3 space-y-1.5">
          {grantedScopes.map((scope) => (
            <div key={scope} className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
              <span className="text-[11px] text-white/70">{labelFor(scope)}</span>
              {scope !== labelFor(scope) && (
                <span className="font-mono text-[9px] text-white/25">{scope}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Missing */}
      {hasMissing && (
        <div className="mb-3 space-y-1.5">
          {missingScopes.map((scope) => (
            <div key={scope} className="flex items-center gap-2">
              <XCircle className="h-3.5 w-3.5 shrink-0 text-rose-400" />
              <span className="text-[11px] text-rose-300">{labelFor(scope)}</span>
              {scope !== labelFor(scope) && (
                <span className="font-mono text-[9px] text-rose-400/40">{scope}</span>
              )}
              <span className="ml-auto text-[9px] text-rose-400/60 uppercase tracking-wider">Missing</span>
            </div>
          ))}
        </div>
      )}

      {grantedScopes.length === 0 && !hasMissing && (
        <p className="text-[11px] text-white/25">No permission data available.</p>
      )}

      {/* Help text */}
      {helpText && (
        <p className="mt-3 flex items-start gap-1.5 border-t border-white/8 pt-3 text-[10px] text-white/35">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          {helpText}
        </p>
      )}
    </div>
  );
}
