/**
 * components/admin/outbound/OutboundConnectionStatus.tsx
 *
 * Shared provider connection status card used by Facebook, X, and LinkedIn consoles.
 * Renders: connected status badge, account label, readiness badge, and a reconnect action.
 *
 * Client component — no server imports.
 */

import * as React from "react";
import { Plug, PlugZap, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import type { OutboundReadiness } from "@/lib/outbound/core/outbound-provider-contract";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OutboundConnectionStatusProps = {
  provider: string;
  connected: boolean;
  readiness: OutboundReadiness;
  accountLabel: string | null;
  grantedScopes: string[];
  missingScopes: string[];
  expiresAt: string | null;
  lastPublishAt: string | null;
  message: string;
  warnings: string[];
  oauthHref: string;
  connectLabel?: string;
};

// ─── Readiness helpers ────────────────────────────────────────────────────────

function readinessBadgeTone(readiness: OutboundReadiness) {
  switch (readiness) {
    case "READY": return "success" as const;
    case "MISSING_SCOPE": return "warning" as const;
    case "NOT_CONNECTED": return "muted" as const;
    case "TOKEN_INVALID": return "danger" as const;
    case "CONFIG_MISSING": return "danger" as const;
    case "PUBLISHING_DISABLED": return "warning" as const;
    case "API_ERROR": return "danger" as const;
  }
}

function readinessLabel(readiness: OutboundReadiness): string {
  switch (readiness) {
    case "READY": return "Ready";
    case "MISSING_SCOPE": return "Missing scope";
    case "NOT_CONNECTED": return "Not connected";
    case "TOKEN_INVALID": return "Token invalid";
    case "CONFIG_MISSING": return "Config missing";
    case "PUBLISHING_DISABLED": return "Disabled";
    case "API_ERROR": return "API error";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OutboundConnectionStatus({
  provider,
  connected,
  readiness,
  accountLabel,
  grantedScopes,
  missingScopes,
  expiresAt,
  lastPublishAt,
  message,
  warnings,
  oauthHref,
  connectLabel = "Connect via OAuth",
}: OutboundConnectionStatusProps) {
  return (
    <section className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          connected ? "bg-emerald-500/15" : "bg-white/5"
        }`}>
          {connected
            ? <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            : <Plug className="h-5 w-5 text-white/30" />
          }
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {accountLabel ?? `${provider} — not connected`}
            </span>
            <AdminStatusBadge
              label={readinessLabel(readiness)}
              tone={readinessBadgeTone(readiness)}
              pill
            />
          </div>
          <p className="mt-0.5 text-[11px] text-white/40">{message}</p>
        </div>
      </div>

      {/* Scope grid */}
      {(grantedScopes.length > 0 || missingScopes.length > 0) && (
        <div className="mb-4 grid grid-cols-2 gap-2">
          {grantedScopes.map((scope) => (
            <div key={scope} className="flex items-center gap-1.5 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {scope}
            </div>
          ))}
          {missingScopes.map((scope) => (
            <div key={scope} className="flex items-center gap-1.5 text-[10px] text-rose-400">
              <AlertCircle className="h-3 w-3 shrink-0" />
              {scope} — missing
            </div>
          ))}
        </div>
      )}

      {/* Meta row */}
      {(expiresAt || lastPublishAt) && (
        <div className="mb-4 flex gap-4 text-[10px] text-white/35">
          {expiresAt && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires {new Date(expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          )}
          {lastPublishAt && (
            <span>Last publish: {new Date(lastPublishAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
          )}
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="mb-4 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="flex items-start gap-1.5 text-[10px] text-amber-400">
              <AlertCircle className="mt-0.5 h-3 w-3 shrink-0" />
              {w}
            </p>
          ))}
        </div>
      )}

      {/* OAuth action */}
      <a
        href={oauthHref}
        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-white/60 hover:border-white/20 hover:text-white/80 transition-colors"
      >
        <PlugZap className="h-3.5 w-3.5" />
        {connected ? "Reconnect" : connectLabel}
      </a>
    </section>
  );
}
