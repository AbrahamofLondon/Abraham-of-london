// lib/decision/sample-assets.ts
import {
  inferMetadataConfidence,
  type DecisionAsset,
} from "@/lib/decision/content-asset-adapter";

type DecisionAssetFixture = Omit<DecisionAsset, "metadataConfidence">;

function withMetadataConfidence(asset: DecisionAssetFixture): DecisionAsset {
  const fieldCount = [
    asset.appliesTo,
    asset.sectors,
    asset.revenueBands,
    asset.orgStates,
    asset.readinessTiers,
    asset.failureModes,
    asset.dominantDomains,
    asset.requiredInterventions,
    asset.marketRiskBands,
    asset.worldviewAnchors,
    asset.commercialUseCases,
    asset.audience,
    asset.transformationStage,
  ].filter((value) => Array.isArray(value) && value.length > 0).length;

  return {
    ...asset,
    metadataConfidence: inferMetadataConfidence({
      hasExplicitMetadata: fieldCount > 0,
      fieldCount,
      warningsCount: 0,
    }),
  };
}

export const SAMPLE_DECISION_ASSETS: DecisionAsset[] = [
  withMetadataConfidence({
    id: "brief-operational-clarity-reset",
    title: "Operational Clarity Reset",
    kind: "brief",
    href: "/briefs/operational-clarity-reset",
    summary: "Used when strategic intent is diluted through weak operating translation.",
    orgStates: ["MISALIGNED", "DISORDERED"],
    dominantDomains: ["OPERATIONAL_CLARITY", "STRATEGIC_INTENT"],
    failureModes: ["Strategic-operational misalignment", "Systemic structural disorder"],
    requiredInterventions: ["Re-sequence strategic priorities", "Stabilize operating environment"],
    readinessTiers: ["DIAGNOSTIC", "ADVISORY", "EXECUTION"],
    priorityWeight: 6,
  }),
  withMetadataConfidence({
    id: "playbook-burnout-containment",
    title: "Burnout Containment Playbook",
    kind: "playbook",
    href: "/playbook/burnout-containment",
    summary: "Activates when execution fragility is likely to distort all subsequent decisions.",
    failureModes: ["Execution fragility"],
    requiredInterventions: ["Reduce execution strain before transformation load"],
    readinessTiers: ["DIAGNOSTIC", "ADVISORY"],
    priorityWeight: 8,
  }),
  withMetadataConfidence({
    id: "doctrine-decision-rights",
    title: "Decision Rights Doctrine",
    kind: "doctrine",
    href: "/canon/decision-rights-doctrine",
    summary: "Used where sponsor ambiguity blocks clean intervention.",
    failureModes: ["Decision-rights ambiguity"],
    requiredInterventions: ["Clarify decision owner and sponsor"],
    readinessTiers: ["DIAGNOSTIC", "ADVISORY", "EXECUTION"],
    priorityWeight: 5,
  }),
  withMetadataConfidence({
    id: "framework-volatility-short-horizon",
    title: "Volatility Short-Horizon Framework",
    kind: "framework",
    href: "/strategy/volatility-short-horizon",
    summary: "Used under high external volatility.",
    marketRiskBands: ["HIGH", "CRITICAL"],
    requiredInterventions: ["Adjust decision horizon for external volatility"],
    priorityWeight: 4,
  }),
  withMetadataConfidence({
    id: "report-module-strategy-room-escalation",
    title: "Strategy Room Escalation Module",
    kind: "report-module",
    href: "/strategy-room",
    summary: "Used where strategic escalation is justified.",
    appliesTo: ["STRATEGY", "HIGH", "CRITICAL", "SOVEREIGN", "DIRECT", "PROXY"],
    readinessTiers: ["ADVISORY", "EXECUTION", "SOVEREIGN"],
    priorityWeight: 10,
  }),
];
