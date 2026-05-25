/**
 * lib/research/lineage/lineage-chain-definitions.ts
 *
 * Canonical chain definitions for Report Lineage Simulation.
 * Each chain defines the expected event sequence and canonical record type
 * per event. These are validated against the Pass 1 registries at simulation time.
 */

import type { LineageSimulationChainId } from "./lineage-simulation-contract";

export type ChainEventDef = {
  eventType: string;
  expectedCanonicalRecord: string;
  description: string;
};

export type ChainDefinition = {
  chainId: LineageSimulationChainId;
  title: string;
  description: string;
  sourceSurface: string;
  expectedCanonicalRecord: string;
  events: ChainEventDef[];
};

export const LINEAGE_CHAIN_DEFINITIONS: ChainDefinition[] = [
  // ── Executive Reporting chain ───────────────────────────────────────────
  {
    chainId: "executive-reporting",
    title: "Executive Reporting Lifecycle",
    description: "Full lifecycle of an executive report from initiation to revocation.",
    sourceSurface: "executive-reporting",
    expectedCanonicalRecord: "ExecutiveReport",
    events: [
      { eventType: "EXECUTIVE_REPORT_STARTED", expectedCanonicalRecord: "ExecutiveReport", description: "Executive report generation initiated" },
      { eventType: "EXECUTIVE_REPORT_GENERATED", expectedCanonicalRecord: "ExecutiveReport", description: "Executive report successfully generated" },
      { eventType: "EXECUTIVE_REPORT_REVIEWED", expectedCanonicalRecord: "ExecutiveReport", description: "Executive report reviewed by admin" },
      { eventType: "EXECUTIVE_REPORT_EXPORTED", expectedCanonicalRecord: "ExecutiveReport", description: "Executive report exported (PDF/download)" },
      { eventType: "EXECUTIVE_REPORT_REVOKED", expectedCanonicalRecord: "ExecutiveReport", description: "Executive report revoked or superseded" },
    ],
  },

  // ── ER → Boardroom chain ────────────────────────────────────────────────
  {
    chainId: "executive-report-boardroom",
    title: "ER → Boardroom Escalation",
    description: "Governed escalation path from Executive Report to Boardroom dossier.",
    sourceSurface: "executive-reporting", // Bridge is an escalation from Executive Reporting
    expectedCanonicalRecord: "ExecutiveReport",
    events: [
      { eventType: "EXECUTIVE_REPORT_GENERATED", expectedCanonicalRecord: "ExecutiveReport", description: "Executive report generated as input to bridge" },
      { eventType: "ER_MAPPED_TO_INTELLIGENCE_SPINE", expectedCanonicalRecord: "ExecutiveReport", description: "Executive Report mapped to IntelligenceSpine" },
      { eventType: "BOARDROOM_QUALIFICATION_EVALUATED", expectedCanonicalRecord: "BoardroomDossier", description: "Boardroom qualification gate evaluated" },
      { eventType: "BOARDROOM_DOSSIER_PREVIEWED", expectedCanonicalRecord: "BoardroomDossier", description: "Boardroom dossier previewed (simulated)" },
      { eventType: "BOARDROOM_DOSSIER_EXPORTED_SIMULATED", expectedCanonicalRecord: "BoardroomDossier", description: "Boardroom dossier export simulated" },
    ],
  },

  // ── Strategy Room chain ─────────────────────────────────────────────────
  {
    chainId: "strategy-room",
    title: "Strategy Room Case Lifecycle",
    description: "Full lifecycle of a Strategy Room case from opening to action.",
    sourceSurface: "strategy-room",
    expectedCanonicalRecord: "StrategyRoomCase",
    events: [
      { eventType: "STRATEGY_ROOM_CASE_OPENED", expectedCanonicalRecord: "StrategyRoomCase", description: "Strategy Room case opened" },
      { eventType: "EVIDENCE_REVIEWED", expectedCanonicalRecord: "StrategyRoomCase", description: "Evidence reviewed in Strategy Room" },
      { eventType: "DIRECTIVE_DERIVED", expectedCanonicalRecord: "StrategyRoomCase", description: "Decision directive derived" },
      { eventType: "ESCALATION_TRIGGERED", expectedCanonicalRecord: "StrategyRoomCase", description: "Escalation triggered from Strategy Room" },
      { eventType: "ACTION_REQUIRED", expectedCanonicalRecord: "StrategyRoomCase", description: "Action required from Strategy Room outcome" },
    ],
  },

  // ── Outbound Publishing chain ───────────────────────────────────────────
  {
    chainId: "outbound-publishing",
    title: "Outbound Publishing Lifecycle",
    description: "Full lifecycle of an outbound post from draft to publish or failure.",
    sourceSurface: "outbound-linkedin",
    expectedCanonicalRecord: "OutboundPost",
    events: [
      { eventType: "OUTBOUND_DRAFT_CREATED", expectedCanonicalRecord: "OutboundPost", description: "Outbound post draft created" },
      { eventType: "OUTBOUND_POLICY_CHECKED", expectedCanonicalRecord: "OutboundPost", description: "Outbound post passed policy check" },
      { eventType: "OUTBOUND_APPROVED", expectedCanonicalRecord: "OutboundPost", description: "Outbound post approved for publishing" },
      { eventType: "OUTBOUND_PUBLISHED", expectedCanonicalRecord: "OutboundPost", description: "Outbound post published to platform" },
      { eventType: "OUTBOUND_SYNCED", expectedCanonicalRecord: "OutboundPost", description: "Outbound post synced across platforms" },
      { eventType: "OUTBOUND_FAILED", expectedCanonicalRecord: "OutboundPost", description: "Outbound post publishing failed" },
    ],
  },

  // ── Foundry ResearchRun chain ───────────────────────────────────────────
  {
    chainId: "foundry-research-run",
    title: "Foundry ResearchRun Lifecycle",
    description: "Full lifecycle of a ResearchRun from creation to archival.",
    sourceSurface: "fast-diagnostic", // Foundry is not a product surface; use the first diagnostic surface
    expectedCanonicalRecord: "ResearchRun",
    events: [
      { eventType: "RESEARCH_RUN_CREATED", expectedCanonicalRecord: "ResearchRun", description: "ResearchRun created" },
      { eventType: "FINDING_CREATED", expectedCanonicalRecord: "FoundryFinding", description: "FoundryFinding created" },
      { eventType: "ACTION_BRIEF_EXPORTED", expectedCanonicalRecord: "ActionBrief", description: "ActionBrief exported from Foundry" },
      { eventType: "FOUNDRY_ACTION_REQUIRED", expectedCanonicalRecord: "ResearchRun", description: "Foundry ResearchRun requires action" },
      { eventType: "IMPLEMENTED", expectedCanonicalRecord: "ResearchRun", description: "ResearchRun finding implemented" },
      { eventType: "ARCHIVED", expectedCanonicalRecord: "ResearchRun", description: "ResearchRun archived" },
    ],
  },

  // ── Content / Editorial chain ───────────────────────────────────────────
  {
    chainId: "content-editorial",
    title: "Content / Editorial Lifecycle",
    description: "Full lifecycle of a content asset from creation to publication.",
    sourceSurface: "editorials",
    expectedCanonicalRecord: "ContentAsset",
    events: [
      { eventType: "CONTENT_ASSET_CREATED", expectedCanonicalRecord: "ContentAsset", description: "Content asset created" },
      { eventType: "CONTENT_STYLE_CHECKED", expectedCanonicalRecord: "ContentAsset", description: "Content passed style check" },
      { eventType: "CONTENT_METADATA_VALIDATED", expectedCanonicalRecord: "ContentAsset", description: "Content metadata validated" },
      { eventType: "CONTENT_PUBLISHED", expectedCanonicalRecord: "ContentAsset", description: "Content asset published" },
      { eventType: "CONTENT_OUTBOUND_ELIGIBLE", expectedCanonicalRecord: "ContentAsset", description: "Content marked as outbound-eligible" },
    ],
  },

  // ── GMI Release chain ───────────────────────────────────────────────────
  {
    chainId: "gmi-release",
    title: "GMI Release Lifecycle",
    description: "Full lifecycle of a Global Market Intelligence release.",
    sourceSurface: "gmi",
    expectedCanonicalRecord: "GmiRelease",
    events: [
      { eventType: "GMI_RELEASE_DRAFTED", expectedCanonicalRecord: "GmiRelease", description: "GMI release drafted" },
      { eventType: "GMI_PRIOR_CALLS_REVIEWED", expectedCanonicalRecord: "GmiRelease", description: "Prior calls reviewed for GMI release" },
      { eventType: "GMI_QUALITY_GATE_RUN", expectedCanonicalRecord: "GmiRelease", description: "Quality gate run for GMI release" },
      { eventType: "GMI_RELEASE_APPROVED", expectedCanonicalRecord: "GmiRelease", description: "GMI release approved" },
      { eventType: "GMI_RELEASE_PUBLISHED", expectedCanonicalRecord: "GmiRelease", description: "GMI release published" },
      { eventType: "GMI_CALL_CARRIED_FORWARD", expectedCanonicalRecord: "GmiRelease", description: "GMI call carried forward to next release" },
    ],
  },
];

export function getChainDefinition(chainId: LineageSimulationChainId): ChainDefinition | undefined {
  return LINEAGE_CHAIN_DEFINITIONS.find((c) => c.chainId === chainId);
}

export function getAllChainIds(): LineageSimulationChainId[] {
  return LINEAGE_CHAIN_DEFINITIONS.map((c) => c.chainId);
}
