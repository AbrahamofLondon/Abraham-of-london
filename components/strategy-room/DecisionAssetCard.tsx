// components/strategy-room/DecisionAssetCard.tsx
"use client";

import { DecisionAssetLink } from "./DecisionAssetLink";

type Asset = {
  id: string;
  title: string;
  description?: string;
  href?: string | null;
  kind?: string;
  matchScore?: number;
  metadataConfidence?: number | null;
  reasons?: string[];
};

type Props = {
  asset: Asset;
  sessionKey: string;
  rank: number;
  routeAfter?: string;
  readinessTierAfter?: string;
  authorityTypeAfter?: string;
  clarityDelta?: number;
  authorityDelta?: number;
  conversionTypeOnClick?: string;
};

export function DecisionAssetCard({
  asset,
  sessionKey,
  rank,
  routeAfter,
  readinessTierAfter,
  authorityTypeAfter,
  clarityDelta = 0.2,
  authorityDelta = 0.2,
  conversionTypeOnClick = "asset_open",
}: Props) {
  return (
    <div className="border border-neutral-200 bg-white p-6 hover:shadow-sm transition-all">
      <div className="flex justify-between items-start mb-3">
        <p className="text-[9px] font-mono uppercase tracking-wider text-neutral-500">
          {asset.kind || "INTELLIGENCE"}
        </p>

        {asset.matchScore !== undefined && (
          <span className="text-[10px] font-mono text-neutral-400">
            {Math.round(asset.matchScore)}% match
          </span>
        )}
      </div>

      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
        {asset.title}
      </h3>

      {asset.description && (
        <p className="text-sm text-neutral-600 mb-4 leading-relaxed">
          {asset.description}
        </p>
      )}

      {asset.reasons?.length ? (
        <ul className="mb-4 space-y-1">
          {asset.reasons.slice(0, 2).map((r, i) => (
            <li key={i} className="text-[11px] text-neutral-500">
              • {r}
            </li>
          ))}
        </ul>
      ) : null}

      <DecisionAssetLink
        sessionKey={sessionKey}
        asset={asset}
        rank={rank}
        conversionTypeOnClick={conversionTypeOnClick}
        followupOnClick={{
          routeAfter,
          readinessTierAfter,
          authorityTypeAfter,
          clarityDelta,
          authorityDelta,
          convertedAfterGuidance: conversionTypeOnClick === "asset_open",
          metadata: {
            action: "open_recommended_asset",
          },
        }}
        className="text-[11px] font-bold uppercase tracking-wider text-black hover:underline"
      >
        Open Asset
      </DecisionAssetLink>
    </div>
  );
}