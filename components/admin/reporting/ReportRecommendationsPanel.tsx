// components/admin/reporting/ReportRecommendationsPanel.tsx
"use client";

import * as React from "react";
import DecisionAssetCard from "@/components/admin/reporting/DecisionAssetCard";

type RecommendationItem = {
  id?: string;
  type: string;
  title: string;
  description: string;
  priority: string;
  href?: string | null;
  score?: number;
};

type MatchedAsset = {
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

type DecisionLayer = {
  worldviewAnchors?: string[];
  commercialUseCases?: string[];
  audience?: string[];
  transformationStage?: string[];
  matchedAssets?: MatchedAsset[];
  recommendations?: RecommendationItem[];
  summary?: string;
  nextAction?: string;
};

export interface ReportRecommendationsPanelProps {
  decisionLayer: DecisionLayer;
  sessionKey?: string;
}

function priorityTone(priority: string) {
  const p = priority.toLowerCase();
  if (p === "high") return "border-red-500/20 bg-red-500/[0.06] text-red-300";
  if (p === "medium") return "border-amber-500/20 bg-amber-500/[0.06] text-amber-300";
  return "border-white/10 bg-white/[0.04] text-white/45";
}

export function ReportRecommendationsPanel({
  decisionLayer,
  sessionKey,
}: ReportRecommendationsPanelProps) {
  const [tab, setTab] = React.useState<"recommendations" | "assets">("recommendations");

  const recs = decisionLayer?.recommendations || [];
  const assets = decisionLayer?.matchedAssets || [];

  if (!recs.length && !assets.length) return null;

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#080B11] text-white shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <div className="border-b border-white/10 p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-amber-400/75">
              Recommendation layer
            </div>
            <h2 className="mt-3 font-serif text-2xl text-white md:text-3xl">
              Governed recommendation surface
            </h2>
            {decisionLayer.summary ? (
              <p className="mt-3 max-w-3xl text-sm leading-7 text-white/52">
                {decisionLayer.summary}
              </p>
            ) : null}
          </div>

          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={() => setTab("recommendations")}
              className={`rounded-full px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em] transition ${
                tab === "recommendations"
                  ? "bg-white text-black"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              Recommendations
            </button>
            <button
              type="button"
              onClick={() => setTab("assets")}
              className={`rounded-full px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em] transition ${
                tab === "assets"
                  ? "bg-white text-black"
                  : "text-white/45 hover:text-white/70"
              }`}
            >
              Assets
            </button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {decisionLayer.worldviewAnchors?.slice(0, 4).map((item) => (
            <span
              key={item}
              className="rounded-full border border-amber-500/20 bg-amber-500/[0.08] px-2 py-1 text-[8px] font-mono uppercase tracking-[0.14em] text-amber-300/85"
            >
              {item}
            </span>
          ))}
          {decisionLayer.transformationStage?.slice(0, 4).map((item) => (
            <span
              key={item}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-1 text-[8px] font-mono uppercase tracking-[0.14em] text-white/45"
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      <div className="p-6">
        {tab === "recommendations" ? (
          <div className="space-y-4">
            {recs.map((item, index) => (
              <div
                key={`${item.title}-${index}`}
                className="rounded-[20px] border border-white/10 bg-white/[0.03] p-5"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-1 text-[8px] font-mono uppercase tracking-[0.14em] ${priorityTone(item.priority)}`}>
                        {item.priority}
                      </span>
                      <span className="text-[8px] font-mono uppercase tracking-[0.14em] text-white/30">
                        {item.type}
                      </span>
                    </div>
                    <h3 className="mt-3 text-lg font-medium text-white">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-white/56">{item.description}</p>
                  </div>

                  {item.href ? (
                    <a
                      href={item.href}
                      className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/70 transition hover:border-white/20 hover:bg-white/[0.07]"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {assets.map((asset, index) => (
              <DecisionAssetCard
                key={asset.id}
                asset={asset}
                rank={index}
                sessionKey={sessionKey}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}