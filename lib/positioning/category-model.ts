// lib/positioning/category-model.ts
// Canonical category architecture for the governed executive reporting system.

export type ProductCategory =
  | "governed_executive_reporting"
  | "diagnostic_evidence_layer"
  | "escalation_environment"
  | "monitoring_layer"
  | "supporting_asset";

export type BuyerType =
  | "founder"
  | "executive"
  | "board_sponsor"
  | "operator"
  | "advisor"
  | "institutional_client";

export type UseCase =
  | "structural_diagnosis"
  | "consequence_pricing"
  | "escalation_decision"
  | "team_reality_validation"
  | "institutional_monitoring"
  | "board_briefing";

export type FlagshipRelation =
  | "flagship"
  | "feeds_flagship"
  | "extends_flagship"
  | "supports_flagship";

export type ProductPosition = {
  category: ProductCategory;
  buyerTypes: BuyerType[];
  useCases: UseCase[];
  flagshipRelation: FlagshipRelation;
  categoryLabel: string;
  flagshipLabel: string;
};

type SurfaceKey =
  | "executive_reporting"
  | "constitutional_diagnostic"
  | "team_assessment"
  | "enterprise_assessment"
  | "purpose_alignment"
  | "strategy_room"
  | "watch"
  | "monitoring"
  | "team_reality_campaign"
  | "inner_circle"
  | "downloads";

const POSITION_MAP: Record<SurfaceKey, ProductPosition> = {
  executive_reporting: {
    category: "governed_executive_reporting",
    buyerTypes: ["executive", "board_sponsor", "founder", "institutional_client"],
    useCases: ["consequence_pricing", "board_briefing", "structural_diagnosis"],
    flagshipRelation: "flagship",
    categoryLabel: "Governed executive reporting",
    flagshipLabel: "Flagship · Consequence interpretation",
  },
  constitutional_diagnostic: {
    category: "diagnostic_evidence_layer",
    buyerTypes: ["executive", "founder", "operator"],
    useCases: ["structural_diagnosis"],
    flagshipRelation: "feeds_flagship",
    categoryLabel: "Diagnostic evidence layer",
    flagshipLabel: "Evidence layer · Constitutional routing",
  },
  team_assessment: {
    category: "diagnostic_evidence_layer",
    buyerTypes: ["executive", "founder", "operator"],
    useCases: ["team_reality_validation", "structural_diagnosis"],
    flagshipRelation: "feeds_flagship",
    categoryLabel: "Diagnostic evidence layer",
    flagshipLabel: "Evidence layer · Team perception gap",
  },
  enterprise_assessment: {
    category: "diagnostic_evidence_layer",
    buyerTypes: ["executive", "board_sponsor", "institutional_client"],
    useCases: ["structural_diagnosis", "institutional_monitoring"],
    flagshipRelation: "feeds_flagship",
    categoryLabel: "Diagnostic evidence layer",
    flagshipLabel: "Evidence layer · Institutional stress test",
  },
  purpose_alignment: {
    category: "diagnostic_evidence_layer",
    buyerTypes: ["founder", "executive", "operator"],
    useCases: ["structural_diagnosis"],
    flagshipRelation: "feeds_flagship",
    categoryLabel: "Diagnostic evidence layer",
    flagshipLabel: "Evidence layer · Personal alignment",
  },
  strategy_room: {
    category: "escalation_environment",
    buyerTypes: ["executive", "board_sponsor", "institutional_client"],
    useCases: ["escalation_decision"],
    flagshipRelation: "extends_flagship",
    categoryLabel: "Escalation environment",
    flagshipLabel: "Escalation · Where intervention is warranted",
  },
  watch: {
    category: "monitoring_layer",
    buyerTypes: ["executive", "operator", "advisor"],
    useCases: ["institutional_monitoring"],
    flagshipRelation: "extends_flagship",
    categoryLabel: "Governed observation",
    flagshipLabel: "Monitoring · Governed observation",
  },
  monitoring: {
    category: "monitoring_layer",
    buyerTypes: ["executive", "board_sponsor", "institutional_client"],
    useCases: ["institutional_monitoring", "board_briefing"],
    flagshipRelation: "extends_flagship",
    categoryLabel: "Monitored operating view",
    flagshipLabel: "Monitoring · Longitudinal evidence",
  },
  team_reality_campaign: {
    category: "diagnostic_evidence_layer",
    buyerTypes: ["executive", "founder", "operator"],
    useCases: ["team_reality_validation"],
    flagshipRelation: "feeds_flagship",
    categoryLabel: "Respondent-based team evidence",
    flagshipLabel: "Evidence source · Team sentiment campaign",
  },
  inner_circle: {
    category: "supporting_asset",
    buyerTypes: ["executive", "founder", "advisor"],
    useCases: ["structural_diagnosis", "board_briefing"],
    flagshipRelation: "supports_flagship",
    categoryLabel: "Access layer",
    flagshipLabel: "Support · Continuous access",
  },
  downloads: {
    category: "supporting_asset",
    buyerTypes: ["executive", "founder", "operator", "advisor"],
    useCases: ["structural_diagnosis"],
    flagshipRelation: "supports_flagship",
    categoryLabel: "Decision assets",
    flagshipLabel: "Support · Frameworks and tools",
  },
};

export function resolveProductPosition(surface: string): ProductPosition {
  const key = surface.replace(/[/-]/g, "_").replace(/^_+|_+$/g, "") as SurfaceKey;
  return POSITION_MAP[key] ?? POSITION_MAP.executive_reporting;
}

export function listAllPositions(): Array<{ surface: string } & ProductPosition> {
  return Object.entries(POSITION_MAP).map(([surface, pos]) => ({ surface, ...pos }));
}

export function resolveFlagshipRelation(surface: string): FlagshipRelation {
  return resolveProductPosition(surface).flagshipRelation;
}
