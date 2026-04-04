// components/admin/reporting/ReportRecommendationsPanel.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  Shield,
  Target,
  Briefcase,
  Compass,
  Star,
  CheckCircle2,
  Zap,
  Lightbulb,
  Rocket,
  ChevronRight,
} from "lucide-react";

type RecommendationItem = {
  type: string;
  title: string;
  description: string;
  priority: string;
  assetId?: string;
};

type MatchedAsset = {
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

type DecisionLayer = {
  worldviewAnchors?: string[];
  commercialUseCases?: string[];
  audience?: string[];
  transformationStage?: string[];
  matchedAssets?: MatchedAsset[];
  recommendations?: RecommendationItem[];
};

type ReportRecommendationsPanelProps = {
  decisionLayer: DecisionLayer;
  sessionKey?: string;
};

const assetIcons = {
  brief: FileText,
  playbook: BookOpen,
  doctrine: Shield,
  framework: Target,
  "report-module": Briefcase,
  default: Compass,
};

const getScoreColor = (score: number) => {
  if (score >= 85) return "from-emerald-500 to-emerald-600";
  if (score >= 70) return "from-amber-500 to-amber-600";
  if (score >= 50) return "from-orange-500 to-orange-600";
  return "from-neutral-500 to-neutral-600";
};

const getScoreLabel = (score: number) => {
  if (score >= 85) return "Exceptional Match";
  if (score >= 70) return "Strong Alignment";
  if (score >= 50) return "Relevant";
  return "Consider";
};

const priorityConfig = {
  high: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "🔥" },
  medium: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "⚡" },
  low: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", icon: "📘" },
};

export function ReportRecommendationsPanel({ decisionLayer, sessionKey }: ReportRecommendationsPanelProps) {
  const [activeTab, setActiveTab] = React.useState<"recommendations" | "assets">("recommendations");

  if (!decisionLayer || (!decisionLayer.recommendations?.length && !decisionLayer.matchedAssets?.length)) {
    return null;
  }

  const topAssets = decisionLayer.matchedAssets?.slice(0, 3) || [];
  const recommendations = decisionLayer.recommendations || [];

  return (
    <div className="bg-gradient-to-br from-neutral-50 via-white to-neutral-50 border border-neutral-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header with gradient accent */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-500/5 to-neutral-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative p-6 border-b border-neutral-200 bg-white/50 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-neutral-600 rounded-lg shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
                  Strategic Intelligence
                </h2>
                <p className="text-[10px] font-mono text-neutral-500 mt-0.5">
                  AI-curated recommendations based on institutional alignment
                </p>
              </div>
            </div>
            
            {/* Tab selector */}
            <div className="flex items-center gap-1 bg-neutral-100 p-0.5 rounded-lg">
              <button
                onClick={() => setActiveTab("recommendations")}
                className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all ${
                  activeTab === "recommendations"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Recommendations
              </button>
              <button
                onClick={() => setActiveTab("assets")}
                className={`px-3 py-1.5 text-[9px] font-mono uppercase tracking-wider rounded-md transition-all ${
                  activeTab === "assets"
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                Curated Assets ({decisionLayer.matchedAssets?.length || 0})
              </button>
            </div>
          </div>

          {/* Metadata tags */}
          <div className="flex flex-wrap gap-2 mt-4">
            {decisionLayer.worldviewAnchors?.slice(0, 4).map((anchor) => (
              <span
                key={anchor}
                className="px-2 py-1 bg-amber-50/50 text-amber-700 text-[8px] font-mono uppercase tracking-wider rounded-full border border-amber-200/50"
              >
                {anchor.replace(/-/g, " ")}
              </span>
            ))}
            {decisionLayer.commercialUseCases?.slice(0, 3).map((useCase) => (
              <span
                key={useCase}
                className="px-2 py-1 bg-blue-50/50 text-blue-700 text-[8px] font-mono uppercase tracking-wider rounded-full border border-blue-200/50"
              >
                {useCase.replace(/-/g, " ")}
              </span>
            ))}
            {decisionLayer.transformationStage?.map((stage) => (
              <span
                key={stage}
                className="px-2 py-1 bg-emerald-50/50 text-emerald-700 text-[8px] font-mono uppercase tracking-wider rounded-full border border-emerald-200/50"
              >
                {stage.toUpperCase()} PHASE
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Content area */}
      <div className="p-6">
        {activeTab === "recommendations" ? (
          <div className="space-y-4">
            {recommendations.map((rec, idx) => {
              const priority = priorityConfig[rec.priority as keyof typeof priorityConfig] || priorityConfig.medium;
              
              return (
                <div
                  key={idx}
                  className="group relative bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${rec.priority === "high" ? "from-red-500 to-red-600" : rec.priority === "medium" ? "from-amber-500 to-amber-600" : "from-blue-500 to-blue-600"}`} />
                  
                  <div className="p-4 pl-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded ${priority.bg} ${priority.text}`}>
                            {rec.priority.toUpperCase()} PRIORITY
                          </span>
                          <span className="text-[8px] font-mono text-neutral-400 uppercase">
                            {rec.type}
                          </span>
                        </div>
                        
                        <h3 className="text-base font-medium text-neutral-900 mb-1 group-hover:text-neutral-700 transition-colors">
                          {rec.title}
                        </h3>
                        <p className="text-sm text-neutral-600 leading-relaxed">
                          {rec.description}
                        </p>
                        
                        {rec.assetId && (
                          <div className="mt-3 flex items-center gap-2 text-[9px] font-mono text-neutral-500">
                            <FileText className="w-3 h-3" />
                            <span>Related asset available</span>
                          </div>
                        )}
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-neutral-500 transition-colors flex-shrink-0 ml-4" />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {recommendations.length === 0 && (
              <div className="text-center py-8">
                <Lightbulb className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No recommendations available for this report.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {topAssets.map((asset, idx) => {
              const Icon = assetIcons[asset.kind as keyof typeof assetIcons] || assetIcons.default;
              const score = asset.confidence;
              const scoreColor = getScoreColor(score);
              const scoreLabel = getScoreLabel(score);
              
              return (
                <div
                  key={asset.id}
                  className="group relative bg-white border border-neutral-200 rounded-xl hover:border-neutral-300 hover:shadow-lg transition-all duration-300 overflow-hidden"
                >
                  {/* Confidence Score Bar */}
                  <div className="absolute top-0 left-0 right-0 h-1">
                    <div
                      className={`h-full bg-gradient-to-r ${scoreColor} transition-all duration-700 ease-out`}
                      style={{ width: `${score}%` }}
                    />
                  </div>

                  <div className="p-5 pt-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="hidden sm:flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-neutral-100 to-neutral-200 group-hover:from-neutral-200 group-hover:to-neutral-300 transition-all duration-300 flex-shrink-0">
                          <Icon className="w-5 h-5 text-neutral-700" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 bg-neutral-100 text-neutral-600 rounded">
                              {asset.kind.toUpperCase()}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              <span className="text-[9px] font-mono text-neutral-500">
                                {Math.round(score)}% • {scoreLabel}
                              </span>
                            </div>
                            <span className="text-[7px] font-mono text-neutral-400">
                              #{idx + 1} recommendation
                            </span>
                          </div>

                          <h3 className="text-lg font-medium text-neutral-900 group-hover:text-neutral-700 transition-colors mb-2">
                            {asset.title}
                          </h3>

                          {/* Metadata badges */}
                          <div className="flex flex-wrap gap-2 mt-2">
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
                        </div>
                      </div>

                      {/* Action Button */}
                      {asset.href && (
                        <Link
                          href={asset.href}
                          className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-[9px] font-mono uppercase tracking-wider rounded-lg hover:bg-neutral-800 transition-all group/btn shadow-sm"
                        >
                          <span>Open Asset</span>
                          <ArrowRight className="w-3 h-3 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      )}
                    </div>

                    {/* Score Visualization */}
                    <div className="mt-4 pt-3 border-t border-neutral-100">
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 mb-1">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          Relevance Score
                        </span>
                        <span>{Math.round(score)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${scoreColor} transition-all duration-700 ease-out`}
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {decisionLayer.matchedAssets && decisionLayer.matchedAssets.length > 3 && (
              <div className="pt-2 text-center">
                <button className="inline-flex items-center gap-2 px-4 py-2 text-[9px] font-mono uppercase tracking-wider text-neutral-600 hover:text-neutral-900 transition-colors">
                  <span>View {decisionLayer.matchedAssets.length - 3} more assets</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
            
            {topAssets.length === 0 && (
              <div className="text-center py-8">
                <Rocket className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                <p className="text-sm text-neutral-500">No curated assets available for this report.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with confidence note */}
      {decisionLayer.matchedAssets && decisionLayer.matchedAssets.length > 0 && (
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200">
          <div className="flex items-center gap-2 text-[8px] font-mono text-neutral-500">
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>AI-curated recommendations based on institutional alignment and decision metadata</span>
          </div>
        </div>
      )}
    </div>
  );
}