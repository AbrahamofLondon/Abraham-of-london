// lib/decision/recommendation-governance.ts

import type { MatchedAsset } from "@/lib/decision/asset-matcher";
import type { ConstitutionalAssessment } from "@/lib/decision/system-constitution";

export interface GovernanceRule {
  id?: string;
  assetId?: string | null;
  assetKind?: string | null;
  ruleType: string;
  contextType?: string | null;
  contextValue?: string | null;
  minConfidenceScore?: number | null;
  minContextualWeight?: number | null;
  maxContextualWeight?: number | null;
  minImpressions?: number | null;
  suppress?: boolean | null;
  priorityPenalty?: number | null;
  priorityBoost?: number | null;
  rationale?: string | null;
}

export interface GovernanceDecision {
  assetId: string;
  allowed: boolean;
  adjustedScore: number;
  suppressionReason?: string;
  appliedRules: string[];
}

export interface GovernanceOptions {
  rules?: GovernanceRule[];
  minDiversityKinds?: number;
  maxPerKind?: number;
}

function safeNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function constitutionalContextValue(
  constitution: ConstitutionalAssessment,
  contextType?: string | null
): string {
  switch (contextType) {
    case "route":
      return constitution.route;
    case "readinessTier":
      return constitution.readinessTier;
    case "authorityType":
      return constitution.authorityType;
    case "orgState":
      return constitution.orgState;
    case "marketRiskBand":
      return constitution.marketRiskBand;
    case "revenueBand":
      return constitution.revenueBand;
    default:
      return "";
  }
}

function ruleMatches(
  rule: GovernanceRule,
  asset: MatchedAsset,
  constitution: ConstitutionalAssessment
): boolean {
  if (rule.assetId && rule.assetId !== asset.id) return false;

  if (
    rule.assetKind &&
    safeString(rule.assetKind).toLowerCase() !== safeString(asset.kind).toLowerCase()
  ) {
    return false;
  }

  if (rule.contextType && rule.contextValue) {
    const current = constitutionalContextValue(constitution, rule.contextType);
    if (current.toLowerCase() !== safeString(rule.contextValue).toLowerCase()) {
      return false;
    }
  }

  return true;
}

function evaluateRule(rule: GovernanceRule, asset: MatchedAsset) {
  const contextualWeights = asset.rankingTrace?.contextualWeights || [];
  const avgConfidence =
    contextualWeights.length > 0
      ? contextualWeights.reduce((acc, x) => acc + (x.confidenceScore ?? 0), 0) /
        contextualWeights.length
      : 0;

  const avgContextualWeight =
    contextualWeights.length > 0
      ? contextualWeights.reduce((acc, x) => acc + x.weight, 0) /
        contextualWeights.length
      : 1;

  if (
    rule.minConfidenceScore != null &&
    avgConfidence < safeNumber(rule.minConfidenceScore)
  ) {
    return {
      blocked: !!rule.suppress,
      scoreDelta: -Math.abs(safeNumber(rule.priorityPenalty, 0)),
      reason: rule.rationale || "Below constitutional confidence threshold",
    };
  }

  if (
    rule.minContextualWeight != null &&
    avgContextualWeight < safeNumber(rule.minContextualWeight)
  ) {
    return {
      blocked: !!rule.suppress,
      scoreDelta: -Math.abs(safeNumber(rule.priorityPenalty, 0)),
      reason: rule.rationale || "Below constitutional contextual threshold",
    };
  }

  if (
    rule.maxContextualWeight != null &&
    avgContextualWeight > safeNumber(rule.maxContextualWeight)
  ) {
    return {
      blocked: !!rule.suppress,
      scoreDelta: -Math.abs(safeNumber(rule.priorityPenalty, 0)),
      reason: rule.rationale || "Above constitutional contextual ceiling",
    };
  }

  return {
    blocked: !!rule.suppress,
    scoreDelta:
      safeNumber(rule.priorityBoost, 0) - safeNumber(rule.priorityPenalty, 0),
    reason: rule.rationale || "Governance rule applied",
  };
}

export function applyRecommendationGovernance(
  assets: MatchedAsset[],
  constitution: ConstitutionalAssessment,
  options?: GovernanceOptions
): {
  governed: MatchedAsset[];
  decisions: GovernanceDecision[];
  suppressed: GovernanceDecision[];
} {
  const rules = options?.rules ?? [];
  const decisions: GovernanceDecision[] = [];

  const evaluated = assets
    .map((asset) => {
      let adjustedScore = asset.matchScore;
      let allowed = true;
      let suppressionReason: string | undefined;
      const appliedRules: string[] = [];

      for (const rule of rules) {
        if (!ruleMatches(rule, asset, constitution)) continue;

        const result = evaluateRule(rule, asset);
        appliedRules.push(rule.ruleType);

        adjustedScore += result.scoreDelta;

        if (result.blocked) {
          allowed = false;
          suppressionReason = result.reason;
        }
      }

      // Constitutional hard stops
      if (
        constitution.route === "REJECT" &&
        safeString(asset.kind).toLowerCase() === "strategy"
      ) {
        allowed = false;
        suppressionReason = "Constitution blocks strategy escalation on reject route.";
        appliedRules.push("CONSTITUTIONAL_ROUTE_HARD_STOP");
      }

      if (
        constitution.readinessTier === "FRAGILE" &&
        safeString(asset.kind).toLowerCase() === "strategy"
      ) {
        allowed = false;
        suppressionReason =
          "Constitution blocks strategy asset on fragile readiness.";
        appliedRules.push("CONSTITUTIONAL_READINESS_HARD_STOP");
      }

      if (
        constitution.authorityType === "UNCLEAR" &&
        safeString(asset.kind).toLowerCase() === "strategy"
      ) {
        adjustedScore -= 20;
        appliedRules.push("CONSTITUTIONAL_AUTHORITY_PENALTY");
      }

      const decision: GovernanceDecision = {
        assetId: asset.id,
        allowed,
        adjustedScore: Number(adjustedScore.toFixed(2)),
        suppressionReason,
        appliedRules,
      };

      decisions.push(decision);

      return {
        asset: {
          ...asset,
          matchScore: decision.adjustedScore,
          matchReasons: [
            ...asset.matchReasons,
            ...(appliedRules.length
              ? [`Governance: ${appliedRules.join(", ")}`]
              : []),
          ],
        },
        decision,
      };
    })
    .filter((x) => x.decision.allowed);

  evaluated.sort((a, b) => b.asset.matchScore - a.asset.matchScore);

  const maxPerKind = options?.maxPerKind ?? 2;
  const minDiversityKinds = options?.minDiversityKinds ?? 2;

  const kindCounts = new Map<string, number>();
  const selected: MatchedAsset[] = [];

  for (const row of evaluated) {
    const kind = safeString(row.asset.kind || "unknown").toLowerCase();
    const current = kindCounts.get(kind) || 0;
    if (current >= maxPerKind) continue;

    selected.push(row.asset);
    kindCounts.set(kind, current + 1);
  }

  const kinds = new Set(selected.map((x) => safeString(x.kind).toLowerCase()));

  if (kinds.size < minDiversityKinds) {
    for (const row of evaluated) {
      const kind = safeString(row.asset.kind || "unknown").toLowerCase();
      if (selected.some((x) => x.id === row.asset.id)) continue;
      if (kinds.has(kind)) continue;

      selected.push(row.asset);
      kinds.add(kind);

      if (kinds.size >= minDiversityKinds) break;
    }
  }

  return {
    governed: selected.sort((a, b) => b.matchScore - a.matchScore),
    decisions,
    suppressed: decisions.filter((x) => !x.allowed),
  };
}