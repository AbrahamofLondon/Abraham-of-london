/**
 * lib/research/lineage/lineage-simulation-contract.ts
 *
 * Lineage Simulation Contract — the runtime proof that the Pass 1 registries
 * can generate, validate, simulate, and expose expected governance flows.
 *
 * Every simulated event must point back to registry sources.
 * Any missing registry relationship becomes a gap.
 * Any HIGH/CRITICAL gap becomes a FoundryFinding.
 */

export type LineageSimulationChainId =
  | "executive-reporting"
  | "executive-report-boardroom"
  | "strategy-room"
  | "outbound-publishing"
  | "foundry-research-run"
  | "content-editorial"
  | "gmi-release";

export type SimulatedLineageEvent = {
  eventType: string;
  canonicalRecord: string;
  sourceSurface: string;
  adminOwnerSurface: string;
  foundryModuleId?: string;
  engineId?: string;
  adapterId?: string;
  requiredActorRole: "ADMIN" | "OWNER" | "SYSTEM" | "USER";
  requiredEvidence?: string[];
  downstreamEffects: string[];
  auditRequired: boolean;
  lineageRequired: boolean;
  registrySource: {
    productSurface?: string;
    canonicalRecord?: string;
    governanceEvent?: string;
    operatingSpineEntry?: string;
  };
};

export type GapType =
  | "MISSING_PRODUCT_SURFACE"
  | "MISSING_CANONICAL_RECORD"
  | "MISSING_ADMIN_OWNER"
  | "MISSING_GOVERNANCE_EVENT"
  | "MISSING_LINEAGE_EVENT"
  | "MISSING_FOUNDRY_MODULE"
  | "MISSING_ACTOR_RULE"
  | "MISSING_DOWNSTREAM_EFFECT";

export type GapSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type LineageSimulationGap = {
  gapType: GapType;
  severity: GapSeverity;
  eventType: string;
  explanation: string;
  recommendation: string;
  sourceRule: string;
};

export type ChainStatus = "COMPLETE" | "PARTIAL" | "BROKEN";

export type LineageSimulationFinding = {
  title: string;
  description: string;
  severity: GapSeverity;
  source: string;
  recommendation: string;
};

export type LineageSimulationResult = {
  chainId: LineageSimulationChainId;
  title: string;
  status: ChainStatus;
  events: SimulatedLineageEvent[];
  gaps: LineageSimulationGap[];
  findings: LineageSimulationFinding[];
  researchRunRecommended: boolean;
};
