/**
 * components/admin/outbound/OutboundAssetSelector.tsx
 *
 * Asset picker for the outbound console. Renders a list of available
 * publishable assets with their readiness state, allowing selection
 * for preview and publishing.
 */

import * as React from "react";
import { FileText, CheckCircle2, AlertTriangle, Ban, Send } from "lucide-react";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AssetReadinessState = "publishable" | "blocked" | "posted" | "draft";

export type OutboundAssetEntry = {
  slug: string;
  title: string;
  assetType: string;
  readinessState: AssetReadinessState;
  publishable: boolean;
  blockers: string[];
  warnings: string[];
  charCount?: number;
  sequence?: number | null;
};

export type OutboundAssetSelectorProps = {
  assets: OutboundAssetEntry[];
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  emptyLabel?: string;
};

// ─── Readiness helpers ────────────────────────────────────────────────────────

function readinessIcon(state: AssetReadinessState) {
  switch (state) {
    case "publishable": return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
    case "blocked": return <AlertTriangle className="h-4 w-4 text-amber-400" />;
    case "posted": return <Send className="h-4 w-4 text-blue-400" />;
    case "draft": return <Ban className="h-4 w-4 text-white/25" />;
  }
}

function readinessTone(state: AssetReadinessState) {
  switch (state) {
    case "publishable": return "success" as const;
    case "blocked": return "warning" as const;
    case "posted": return "info" as const;
    case "draft": return "muted" as const;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OutboundAssetSelector({
  assets,
  selectedSlug,
  onSelect,
  emptyLabel = "No publishable assets available.",
}: OutboundAssetSelectorProps) {
  if (assets.length === 0) {
    return (
      <div className="rounded-lg border border-white/8 bg-white/[0.02] p-6 text-center text-[11px] text-white/30">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {assets.map((asset) => {
        const isSelected = asset.slug === selectedSlug;
        return (
          <button
            key={asset.slug}
            onClick={() => onSelect(asset.slug)}
            className={`group w-full rounded-lg border px-4 py-3 text-left transition-all ${
              isSelected
                ? "border-white/20 bg-white/8"
                : "border-white/8 bg-white/[0.02] hover:border-white/14 hover:bg-white/5"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 shrink-0">
                {readinessIcon(asset.readinessState)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  {asset.sequence != null && (
                    <span className="font-mono text-[9px] text-white/30">#{asset.sequence}</span>
                  )}
                  <span className="text-[12px] font-medium text-white/90 truncate">
                    {asset.title}
                  </span>
                  <AdminStatusBadge
                    label={asset.readinessState}
                    tone={readinessTone(asset.readinessState)}
                    size="sm"
                  />
                  {asset.charCount != null && (
                    <span className="ml-auto shrink-0 font-mono text-[10px] text-white/30">
                      {asset.charCount} chars
                    </span>
                  )}
                </div>
                {asset.blockers.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {asset.blockers.slice(0, 2).map((b, i) => (
                      <p key={i} className="text-[10px] text-amber-400/80">{b}</p>
                    ))}
                    {asset.blockers.length > 2 && (
                      <p className="text-[10px] text-white/25">+{asset.blockers.length - 2} more blockers</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
