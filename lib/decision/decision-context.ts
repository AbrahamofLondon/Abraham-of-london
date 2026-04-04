// lib/decision/decision-context.ts
// ============================================================================
// DECISION CONTEXT
// Turns live signals into a canonical decision context for asset matching
// ============================================================================

import type {
  AuthorityType,
  DecisionIntervention,
  DominantDomain,
  OrgState,
  ReadinessTier,
  RevenueBand,
  RiskBand,
  SectorTaxonomy,
} from "@/lib/decision/decision-metadata";
import type { DealFusionResult } from "@/lib/ai/deal-fusion";

export interface QuestionnaireInput {
  sector?: string;
  sponsorRole?: string;
  statedProblem?: string;
  desiredOutcome?: string;
  primaryConcern?: string;
}

export interface ResonanceTelemetryInput {
  averageDissonance?: number;
  domains?: Array<{
    label: string;
    intent: number;
    reality: number;
    dissonance: number;
  }>;
}

export interface HcdAggregateInput {
  overallBurnoutIndex?: number;
  criticalDomains?: string[];
  elevatedDomains?: string[];
  riskScore?: string;
}

export interface MarketContextInput {
  marketRiskBand?: RiskBand;
  sector?: SectorTaxonomy | string;
  volatilityScore?: number;
}

export interface DecisionContext {
  route: string;
  priority: string;
  temperature: string;
  orgState: OrgState;
  readinessTier: ReadinessTier;
  authorityType: AuthorityType;
  revenueBand: RevenueBand;
  marketRiskBand: RiskBand;
  sector: SectorTaxonomy | "general";
  dominantDomains: DominantDomain[];
  primaryFailureModes: string[];
  requiredInterventions: string[];
  narrativeSummary: string;
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
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function uniq(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

export function deriveRevenueBand(revenue?: number): RevenueBand {
  const value = safeNumber(revenue, 0);

  if (value >= 10_000_000) return "WHALE";
  if (value >= 1_000_000) return "ENTERPRISE";
  if (value >= 250_000) return "MID";
  if (value >= 50_000) return "SMB";
  return "MICRO";
}

export function deriveAuthorityType(authority?: string | boolean): AuthorityType {
  if (authority === true) return "DIRECT";

  const raw = safeString(authority).toLowerCase();
  if (!raw) return "UNCLEAR";

  if (
    ["founder", "owner", "ceo", "md", "decision maker", "yes", "true"].includes(raw)
  ) {
    return "DIRECT";
  }

  if (
    [
      "chief of staff",
      "vp strategy",
      "head of operations",
      "director",
      "proxy",
    ].some((term) => raw.includes(term))
  ) {
    return "PROXY";
  }

  return "UNCLEAR";
}

export function deriveOrgState(args: {
  fusion: DealFusionResult;
  resonance?: ResonanceTelemetryInput | null;
  hcd?: HcdAggregateInput | null;
}): OrgState {
  const avgDissonance = safeNumber(args.resonance?.averageDissonance, 0);
  const burnout = safeNumber(args.hcd?.overallBurnoutIndex, 0);

  if (avgDissonance > 30 || burnout > 75 || args.fusion.route === "REJECT") {
    return "DISORDERED";
  }

  if (avgDissonance > 20 || burnout > 60) {
    return "MISALIGNED";
  }

  if (avgDissonance > 10 || burnout > 40) {
    return "DRIFTING";
  }

  return "ORDERED";
}

export function deriveReadinessTier(args: {
  fusion: DealFusionResult;
  orgState: OrgState;
}): ReadinessTier {
  if (args.fusion.priority === "SOVEREIGN") return "SOVEREIGN";
  if (args.fusion.route === "STRATEGY" && args.orgState !== "DISORDERED") return "EXECUTION";
  if (args.fusion.route === "DIAGNOSTIC") return "DIAGNOSTIC";
  if (args.fusion.route === "STRATEGY") return "ADVISORY";
  return "UNQUALIFIED";
}

function inferDominantDomains(
  resonance?: ResonanceTelemetryInput | null,
  hcd?: HcdAggregateInput | null,
  questionnaire?: QuestionnaireInput | null
): DominantDomain[] {
  const out: DominantDomain[] = [];
  const domains = resonance?.domains || [];

  const sorted = [...domains]
    .sort((a, b) => b.dissonance - a.dissonance)
    .slice(0, 3)
    .map((d) => d.label);

  for (const label of sorted) {
    const upper = safeString(label).toUpperCase();
    if (
      [
        "STRATEGIC_INTENT",
        "OPERATIONAL_CLARITY",
        "LEADERSHIP_TRUST",
        "CULTURAL_COHESION",
        "EXECUTION",
        "GOVERNANCE",
        "ALIGNMENT",
        "BOARD",
        "OPERATING_CADENCE",
        "DECISION_QUALITY",
        "TRUST",
      ].includes(upper)
    ) {
      out.push(upper as DominantDomain);
    }
  }

  const concern = `${safeString(questionnaire?.primaryConcern)} ${safeString(
    questionnaire?.statedProblem
  )}`.toLowerCase();

  if (concern.includes("board")) out.push("BOARD");
  if (concern.includes("governance")) out.push("GOVERNANCE");
  if (concern.includes("trust")) out.push("TRUST");
  if (concern.includes("cadence")) out.push("OPERATING_CADENCE");
  if (concern.includes("execution")) out.push("EXECUTION");
  if (concern.includes("alignment")) out.push("ALIGNMENT");

  if (safeNumber(hcd?.overallBurnoutIndex, 0) > 60) {
    out.push("EXECUTION");
    out.push("OPERATING_CADENCE");
  }

  return uniq(out) as DominantDomain[];
}

function inferFailureModes(args: {
  orgState: OrgState;
  authorityType: AuthorityType;
  resonance?: ResonanceTelemetryInput | null;
  hcd?: HcdAggregateInput | null;
  questionnaire?: QuestionnaireInput | null;
}): string[] {
  const out: string[] = [];
  const stated = `${safeString(args.questionnaire?.statedProblem)} ${safeString(
    args.questionnaire?.primaryConcern
  )}`.toLowerCase();

  if (args.orgState === "DISORDERED") out.push("Systemic structural disorder");
  if (args.orgState === "MISALIGNED") out.push("Strategic-operational misalignment");
  if (args.authorityType === "UNCLEAR") out.push("Decision-rights ambiguity");
  if (safeNumber(args.hcd?.overallBurnoutIndex, 0) > 60) out.push("Execution fragility");

  if (stated.includes("governance")) out.push("Governance breakdown");
  if (stated.includes("trust")) out.push("Trust erosion");
  if (stated.includes("capital")) out.push("Capital allocation distortion");
  if (stated.includes("narrative") || stated.includes("messaging")) {
    out.push("Narrative incoherence");
  }
  if (stated.includes("cadence") || stated.includes("rhythm")) {
    out.push("Operating cadence decay");
  }

  return uniq(out);
}

function inferInterventions(args: {
  orgState: OrgState;
  authorityType: AuthorityType;
  hcd?: HcdAggregateInput | null;
  market?: MarketContextInput | null;
  fusion: DealFusionResult;
}): string[] {
  const out: string[] = [];

  if (args.orgState === "DISORDERED") out.push("Stabilize operating environment");
  if (args.orgState === "MISALIGNED") out.push("Re-sequence strategic priorities");
  if (args.authorityType === "UNCLEAR") out.push("Clarify decision owner and sponsor");
  if (safeNumber(args.hcd?.overallBurnoutIndex, 0) > 60) {
    out.push("Reduce execution strain before transformation load");
  }
  if ((args.market?.marketRiskBand || "LOW") === "HIGH" || (args.market?.marketRiskBand || "LOW") === "CRITICAL") {
    out.push("Adjust decision horizon for external volatility");
  }
  if (args.fusion.route === "STRATEGY") {
    out.push("Escalate to strategy-room review");
  } else if (args.fusion.route === "DIAGNOSTIC") {
    out.push("Run guided diagnostic before escalation");
  }

  return uniq(out);
}

export function deriveDecisionContext(args: {
  fusion: DealFusionResult;
  questionnaire?: QuestionnaireInput | null;
  resonance?: ResonanceTelemetryInput | null;
  hcd?: HcdAggregateInput | null;
  market?: MarketContextInput | null;
  revenue?: number;
  authority?: string | boolean;
}): DecisionContext {
  const revenueBand = deriveRevenueBand(args.revenue);
  const authorityType = deriveAuthorityType(
    args.authority ?? args.questionnaire?.sponsorRole
  );
  const orgState = deriveOrgState({
    fusion: args.fusion,
    resonance: args.resonance,
    hcd: args.hcd,
  });
  const readinessTier = deriveReadinessTier({
    fusion: args.fusion,
    orgState,
  });

  const sector =
    (safeString(args.market?.sector || args.questionnaire?.sector).toLowerCase() ||
      "general") as SectorTaxonomy | "general";

  const marketRiskBand =
    (safeString(args.market?.marketRiskBand).toUpperCase() as RiskBand) || "LOW";

  const dominantDomains = inferDominantDomains(
    args.resonance,
    args.hcd,
    args.questionnaire
  );

  const primaryFailureModes = inferFailureModes({
    orgState,
    authorityType,
    resonance: args.resonance,
    hcd: args.hcd,
    questionnaire: args.questionnaire,
  });

  const requiredInterventions = inferInterventions({
    orgState,
    authorityType,
    hcd: args.hcd,
    market: args.market,
    fusion: args.fusion,
  });

  const narrativeSummary = [
    `Route ${args.fusion.route}`,
    `Priority ${args.fusion.priority}`,
    `Org state ${orgState}`,
    `Readiness ${readinessTier}`,
    `Authority ${authorityType}`,
    dominantDomains.length ? `Domains ${dominantDomains.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" • ");

  return {
    route: args.fusion.route,
    priority: args.fusion.priority,
    temperature: args.fusion.temperature,
    orgState,
    readinessTier,
    authorityType,
    revenueBand,
    marketRiskBand,
    sector,
    dominantDomains,
    primaryFailureModes,
    requiredInterventions,
    narrativeSummary,
  };
}