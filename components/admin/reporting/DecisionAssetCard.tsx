// components/admin/reporting/DecisionAssetCard.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  ArrowRight, 
  FileText, 
  BookOpen, 
  Briefcase, 
  Target, 
  Shield, 
  TrendingUp,
  Heart,
  AlertCircle,
  CheckCircle,
  Sparkles
} from "lucide-react";

type DecisionAsset = {
  id: string;
  title: string;
  kind: string;
  confidence: number;
  href?: string;
  worldviewAnchors?: string[];
  commercialUseCases?: string[];
  audience?: string[];
  transformationStage?: string[];
};

type DecisionAssetCardProps = {
  asset: DecisionAsset;
  sessionKey?: string;
  rank: number;
  onSelect?: (asset: DecisionAsset) => void;
};

const assetIcons = {
  brief: FileText,
  playbook: BookOpen,
  doctrine: Shield,
  framework: Target,
  "report-module": Briefcase,
};

const confidenceColors = {
  high: "from-emerald-500 to-emerald-600",
  medium: "from-amber-500 to-amber-600",
  low: "from-neutral-500 to-neutral-600",
};

const stageColors = {
  assess: "bg-blue-50 text-blue-700 border-blue-200",
  diagnose: "bg-amber-50 text-amber-700 border-amber-200",
  realign: "bg-orange-50 text-orange-700 border-orange-200",
  govern: "bg-purple-50 text-purple-700 border-purple-200",
  scale: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function DecisionAssetCard({ asset, rank, onSelect, sessionKey }: DecisionAssetCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = assetIcons[asset.kind as keyof typeof assetIcons] || FileText;
  
  const confidenceLevel = asset.confidence >= 75 ? "high" : asset.confidence >= 50 ? "medium" : "low";
  const confidenceColor = confidenceColors[confidenceLevel];
  
  const primaryStage = asset.transformationStage?.[0];
  const stageColor = primaryStage ? stageColors[primaryStage as keyof typeof stageColors] : "bg-neutral-50 text-neutral-600 border-neutral-200";

  const handleClick = () => {
    if (onSelect) {
      onSelect(asset);
    }
    
    // Track impression
    if (sessionKey && asset.id) {
      fetch("/api/decision/track-impression", {
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
      }).catch(console.error);
    }
  };

  return (
    <div
      className={`group relative overflow-hidden transition-all duration-300 ${
        isHovered ? "translate-y-[-2px]" : ""
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-neutral-50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      <div className="relative bg-white border border-neutral-200 hover:border-neutral-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
        {/* Confidence indicator bar */}
        <div className="absolute top-0 left-0 right-0 h-1">
          <div 
            className={`h-full bg-gradient-to-r ${confidenceColor} transition-all duration-500`}
            style={{ width: `${asset.confidence}%` }}
          />
        </div>
        
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-neutral-100 group-hover:bg-neutral-200 transition-colors`}>
                <Icon className="w-4 h-4 text-neutral-700" />
              </div>
              <div>
                <span className="text-[8px] font-mono uppercase tracking-wider text-neutral-400">
                  #{rank + 1} • {asset.kind.toUpperCase()}
                </span>
                <h4 className="text-base font-medium text-neutral-900 mt-0.5 group-hover:text-neutral-700 transition-colors">
                  {asset.title}
                </h4>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-md border text-[8px] font-mono uppercase tracking-wider ${stageColor}`}>
              {primaryStage || "Strategic"}
            </div>
          </div>

          {/* Metadata badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {asset.worldviewAnchors?.slice(0, 2).map((anchor) => (
              <span
                key={anchor}
                className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[8px] font-mono uppercase tracking-wider rounded"
              >
                {anchor.replace(/-/g, " ")}
              </span>
            ))}
            {asset.audience?.slice(0, 2).map((aud) => (
              <span
                key={aud}
                className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-mono uppercase tracking-wider rounded"
              >
                {aud}
              </span>
            ))}
          </div>

          {/* Confidence and CTA */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Sparkles className={`w-3 h-3 ${
                  asset.confidence >= 75 ? "text-emerald-500" : 
                  asset.confidence >= 50 ? "text-amber-500" : "text-neutral-400"
                }`} />
                <span className="text-[9px] font-mono text-neutral-500">
                  {Math.round(asset.confidence)}% match
                </span>
              </div>
              {asset.commercialUseCases?.length > 0 && (
                <span className="text-[7px] font-mono text-neutral-400">
                  {asset.commercialUseCases[0].replace(/-/g, " ")}
                </span>
              )}
            </div>
            
            {asset.href && (
              <Link
                href={asset.href}
                onClick={handleClick}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-all group/btn"
              >
                <span>Access</span>
                <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}