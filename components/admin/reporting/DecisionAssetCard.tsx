// components/admin/reporting/DecisionAssetCard.tsx
"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Briefcase, FileText, Shield, Target } from "lucide-react";

export type DecisionAsset = {
  id: string;
  title: string;
  kind: string;
  confidence: number;
  href?: string | null;
  worldviewAnchors?: string[];
  commercialUseCases?: string[];
  audience?: string[];
  transformationStage?: string[];
};

export interface DecisionAssetCardProps {
  asset: DecisionAsset;
  rank: number;
  sessionKey?: string;
  onSelect?: (asset: DecisionAsset) => void;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  brief: FileText,
  playbook: BookOpen,
  doctrine: Shield,
  framework: Target,
  "report-module": Briefcase,
};

function trackImpression(sessionKey: string, asset: DecisionAsset, rank: number) {
  void fetch("/api/decision/track-impression", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionKey,
      assetId: asset.id,
      assetTitle: asset.title,
      assetKind: asset.kind,
      rank,
      matchScore: asset.confidence,
    }),
  }).catch(() => undefined);
}

export default function DecisionAssetCard({
  asset,
  rank,
  sessionKey,
  onSelect,
}: DecisionAssetCardProps) {
  const Icon = ICONS[asset.kind] || FileText;
  const confidence =
    asset.confidence >= 75 ? "high" : asset.confidence >= 45 ? "medium" : "low";

  const confidenceClass =
    confidence === "high"
      ? "from-emerald-500 to-emerald-600"
      : confidence === "medium"
        ? "from-amber-500 to-amber-600"
        : "from-neutral-500 to-neutral-600";

  return (
    <div className="group relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0B0E14] text-white transition hover:border-white/20 hover:bg-[#0D1118]">
      <div className="absolute inset-x-0 top-0 h-1">
        <div
          className={`h-full bg-gradient-to-r ${confidenceClass}`}
          style={{ width: `${Math.max(0, Math.min(100, asset.confidence))}%` }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-white/10 bg-white/[0.04] p-2">
              <Icon className="h-4 w-4 text-amber-400/75" />
            </div>

            <div>
              <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-white/30">
                #{rank + 1} · {asset.kind}
              </div>
              <h3 className="mt-1 text-base font-medium text-white">{asset.title}</h3>
            </div>
          </div>

          <div className="rounded-full border border-white/10 px-2 py-1 text-[8px] font-mono uppercase tracking-[0.16em] text-white/45">
            {Math.round(asset.confidence)}%
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {asset.transformationStage?.slice(0, 2).map((item) => (
            <span
              key={item}
              className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2 py-1 text-[8px] font-mono uppercase tracking-[0.14em] text-amber-300/85"
            >
              {item}
            </span>
          ))}
          {asset.audience?.slice(0, 2).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-mono uppercase tracking-[0.14em] text-white/45"
            >
              {item}
            </span>
          ))}
        </div>

        {asset.href ? (
          <div className="mt-5">
            <Link
              href={asset.href}
              onClick={() => {
                onSelect?.(asset);
                if (sessionKey) trackImpression(sessionKey, asset, rank);
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/70 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
            >
              Open asset
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}