// components/vault/VaultItemCard.tsx
// Thin composition: Vault archive tile.
// Uses CardShell (flush variant) for shell semantics.
// All styling via --ds-* tokens. No raw colors.

"use client";

import * as React from "react";
import { ShieldCheck, Download, FileText, Lock, ArrowRight } from "lucide-react";
import { CardShell } from "@/components/primitives/CardShell";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type VaultItemKind = "brief" | "download" | "pdf";

export type VaultCardItem = {
  id: string;
  kind: VaultItemKind;
  title: string;
  excerpt: string;
  category: string;
  format: string;
  size: string;
  tier: string;
  requiresAuth: boolean;
};

export type VaultItemCardProps = {
  item: VaultCardItem;
  isLocked: boolean;
  onAction: () => void;
};

// ---------------------------------------------------------------------------
// Sub-components (internal)
// ---------------------------------------------------------------------------

function KindIcon({ kind }: { kind: VaultItemKind }) {
  const style: React.CSSProperties =
    kind === "brief"
      ? { color: "var(--ds-accent)" }
      : { color: "var(--ds-text-subtle)" };

  return (
    <div
      className="flex h-12 w-12 items-center justify-center border transition-colors"
      style={{ borderColor: "var(--ds-border)" }}
    >
      {kind === "brief" ? (
        <ShieldCheck size={20} style={style} />
      ) : kind === "download" ? (
        <Download size={20} style={style} />
      ) : (
        <FileText size={20} style={style} />
      )}
    </div>
  );
}

function TierBadge({ isLocked, tier }: { isLocked: boolean; tier: string }) {
  const badgeStyle: React.CSSProperties = isLocked
    ? {
        borderColor: "var(--ds-accent-soft)",
        backgroundColor: "var(--ds-accent-soft)",
        color: "var(--ds-accent)",
      }
    : {
        borderColor: "var(--ds-border)",
        backgroundColor: "var(--ds-panel)",
        color: "var(--ds-success)",
      };

  return (
    <span
      className="border px-3 py-1 text-[8px] font-black uppercase tracking-[0.3em]"
      style={badgeStyle}
    >
      {isLocked ? "Classified" : tier}
    </span>
  );
}

function ActionButton({
  isLocked,
  kind,
  onClick,
}: {
  isLocked: boolean;
  kind: VaultItemKind;
  onClick: () => void;
}) {
  const label = isLocked
    ? "Elevate Clearance"
    : kind === "brief"
      ? "Open Briefing"
      : kind === "download"
        ? "Open Asset"
        : "Open File";

  return (
    <button
      onClick={onClick}
      className="group/btn flex w-full items-center justify-between border px-6 py-4 transition-all"
      style={{
        borderColor: isLocked ? "var(--ds-accent-soft)" : "var(--ds-border)",
        color: isLocked ? "var(--ds-accent)" : "var(--ds-text-muted)",
        transitionDuration: "var(--ds-duration-slow)",
      }}
    >
      <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em]">
        {label}
      </span>
      {isLocked ? (
        <Lock size={14} />
      ) : (
        <ArrowRight
          size={14}
          className="transition-transform group-hover/btn:translate-x-1"
        />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// VaultItemCard
// ---------------------------------------------------------------------------

export default function VaultItemCard({
  item,
  isLocked,
  onAction,
}: VaultItemCardProps) {
  return (
    <CardShell
      as="div"
      variant="flush"
      density="airy"
      className="group relative flex min-h-[440px] flex-col justify-between"
      style={{
        backgroundColor: "var(--ds-background)",
      }}
    >
      {/* Top: icon + badge + title + excerpt */}
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <KindIcon kind={item.kind} />
          <TierBadge isLocked={isLocked} tier={item.tier} />
        </div>

        <div className="space-y-4">
          <h3
            className="text-3xl font-serif leading-tight transition-colors"
            style={{ color: "var(--ds-text)" }}
          >
            {item.title}
          </h3>
          <p
            className="line-clamp-4 text-sm font-light italic leading-relaxed transition-colors"
            style={{ color: "var(--ds-text-subtle)" }}
          >
            {item.excerpt}
          </p>
        </div>
      </div>

      {/* Bottom: metadata + CTA */}
      <div className="mt-12 space-y-6">
        <div
          className="flex justify-between border-b pb-4 font-mono text-[8px] uppercase tracking-[0.4em]"
          style={{
            borderColor: "var(--ds-border)",
            color: "var(--ds-text-subtle)",
          }}
        >
          <span>
            {item.format} // {item.size}
          </span>
          <span style={{ color: "var(--ds-accent)" }}>{item.category}</span>
        </div>

        <ActionButton isLocked={isLocked} kind={item.kind} onClick={onAction} />
      </div>
    </CardShell>
  );
}
