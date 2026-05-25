/**
 * lib/platform/governance-event-types.ts
 *
 * Shared governance event vocabulary for the entire platform.
 * Every subsystem (Executive Reporting, Boardroom Bridge, Outbound Publishing,
 * Foundry ResearchRun transitions, Content/Vault) uses this contract.
 *
 * Initial implementation: typed event definitions and validation.
 * No pub/sub infrastructure yet — but every event uses the same shape.
 */

import type { AdminDomain } from "./admin-domain-registry";
import type { CanonicalRecordType } from "./product-ladder-registry";

// ─── Severity ────────────────────────────────────────────────────────────────

export type GovernanceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ─── Governance Event ────────────────────────────────────────────────────────

export type GovernanceEvent = {
  eventId: string;
  eventType: string;
  sourceSurface: string;
  canonicalRecordType: CanonicalRecordType;
  canonicalRecordId?: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  severity: GovernanceSeverity;
  payload: Record<string, unknown>;
  shouldWriteAudit: boolean;
  shouldWriteLineage: boolean;
  shouldCreateResearchRun?: boolean;
  emittedAt: string;
};

// ─── Event Type Registry ─────────────────────────────────────────────────────

export type EventTypeEntry = {
  eventType: string;
  description: string;
  sourceSurface: string;
  canonicalRecordType: CanonicalRecordType;
  defaultSeverity: GovernanceSeverity;
  writesAudit: boolean;
  writesLineage: boolean;
  canCreateResearchRun: boolean;
  adminDomain: AdminDomain;
};

export const GOVERNANCE_EVENT_TYPES: EventTypeEntry[] = [
  // ── Executive Reporting ─────────────────────────────────────────────────
  { eventType: "EXECUTIVE_REPORT_STARTED", description: "Executive report generation initiated", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_GENERATED", description: "Executive report successfully generated", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_REVIEWED", description: "Executive report reviewed by admin", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_EXPORTED", description: "Executive report exported (PDF/download)", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_REVOKED", description: "Executive report revoked or superseded", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_DELIVERED", description: "Executive report delivered to client via secure link", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_VIEWED", description: "Executive report viewed by client via secure link", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },

  // ── ER → Boardroom Bridge ───────────────────────────────────────────────
  { eventType: "ER_MAPPED_TO_INTELLIGENCE_SPINE", description: "Executive Report mapped to IntelligenceSpine", sourceSurface: "er-boardroom-bridge", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  { eventType: "BOARDROOM_QUALIFICATION_EVALUATED", description: "Boardroom qualification gate evaluated", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_GENERATED", description: "Boardroom dossier generated", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_EXPORTED", description: "Boardroom dossier exported", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_REVIEWED", description: "Boardroom dossier reviewed", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_APPROVED", description: "Boardroom dossier approved for delivery by admin", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_DELIVERED", description: "Boardroom dossier delivered to client (access granted)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_VIEWED", description: "Boardroom dossier viewed by client", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_ACCESS_REVOKED", description: "Boardroom dossier access revoked by admin", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_SECURE_LINK_CREATED", description: "Secure delivery token created for boardroom dossier — replaces email-query access", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_SECURE_LINK_REVOKED", description: "Secure delivery token explicitly revoked before expiry", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "STRATEGY_ROOM_ESCALATION_OFFERED", description: "Strategy Room escalation offered to client after Boardroom dossier delivery", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_PREVIEWED", description: "Boardroom dossier previewed in simulation (dry-run, no client-facing artefact created)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  { eventType: "BOARDROOM_DOSSIER_EXPORTED_SIMULATED", description: "Boardroom dossier export simulated (dry-run, no PDF rendered, no client-facing artefact)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },

  // ── Strategy Room ───────────────────────────────────────────────────────
  { eventType: "STRATEGY_ROOM_CASE_OPENED", description: "Strategy Room case opened", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EVIDENCE_REVIEWED", description: "Evidence reviewed in Strategy Room", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "DIRECTIVE_DERIVED", description: "Decision directive derived", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "ESCALATION_TRIGGERED", description: "Escalation triggered from Strategy Room", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations" },
  { eventType: "ACTION_REQUIRED", description: "Action required from Strategy Room outcome", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations" },

  // ── Outbound Publishing ─────────────────────────────────────────────────
  { eventType: "OUTBOUND_DRAFT_CREATED", description: "Outbound post draft created", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound" },
  { eventType: "OUTBOUND_POLICY_CHECKED", description: "Outbound post passed policy check", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound" },
  { eventType: "OUTBOUND_APPROVED", description: "Outbound post approved for publishing", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound" },
  { eventType: "OUTBOUND_PUBLISHED", description: "Outbound post published to platform", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound" },
  { eventType: "OUTBOUND_SYNCED", description: "Outbound post synced across platforms", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound" },
  { eventType: "OUTBOUND_FAILED", description: "Outbound post publishing failed", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "outbound" },

  // ── Foundry ResearchRun ─────────────────────────────────────────────────
  { eventType: "RESEARCH_RUN_CREATED", description: "ResearchRun created", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  { eventType: "FINDING_CREATED", description: "FoundryFinding created", sourceSurface: "foundry", canonicalRecordType: "FoundryFinding", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  { eventType: "ACTION_BRIEF_EXPORTED", description: "ActionBrief exported from Foundry", sourceSurface: "foundry", canonicalRecordType: "ActionBrief", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  { eventType: "IMPLEMENTED", description: "ResearchRun finding implemented", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  { eventType: "ARCHIVED", description: "ResearchRun archived", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  { eventType: "FOUNDRY_ACTION_REQUIRED", description: "Foundry ResearchRun requires action — distinct from Strategy Room ACTION_REQUIRED", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "foundry" },

  // ── Content ─────────────────────────────────────────────────────────────
  { eventType: "CONTENT_ASSET_CREATED", description: "Content asset created (editorial, blog, brief, or canon entry)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_STYLE_CHECKED", description: "Content passed editorial style check (house style, tone, claim defensibility)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_METADATA_VALIDATED", description: "Content metadata validated (frontmatter, cover image, SEO, access tier)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_PUBLISHED", description: "Content asset published", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_UPDATED", description: "Content asset updated", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_ARCHIVED", description: "Content asset archived", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_OUTBOUND_ELIGIBLE", description: "Content marked as outbound-eligible (passed internal eligibility checks — does not mean published to social)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },

  // ── Access ──────────────────────────────────────────────────────────────
  { eventType: "ACCESS_GRANTED", description: "Access grant created", sourceSurface: "access", canonicalRecordType: "AccessGrant", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access" },
  { eventType: "ACCESS_REVOKED", description: "Access grant revoked", sourceSurface: "access", canonicalRecordType: "AccessGrant", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access" },
  { eventType: "ENTITLEMENT_GRANTED", description: "Entitlement granted", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access" },
  { eventType: "ENTITLEMENT_REVOKED", description: "Entitlement revoked", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access" },
  { eventType: "ENTITLEMENT_EXPIRED", description: "Entitlement expired", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "access" },

  // ── GMI ─────────────────────────────────────────────────────────────────
  { eventType: "GMI_RELEASE_DRAFTED", description: "GMI release drafted", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence" },
  { eventType: "GMI_PRIOR_CALLS_REVIEWED", description: "Prior quarter calls reviewed for GMI release — every quarterly report reviews the material calls from the previous quarter before issuing the next one", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence" },
  { eventType: "GMI_QUALITY_GATE_RUN", description: "Quality gate run for GMI release — signal validation, evidence posture, and release readiness check", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "intelligence" },
  { eventType: "GMI_RELEASE_APPROVED", description: "GMI release approved for publication", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence" },
  { eventType: "GMI_RELEASE_PUBLISHED", description: "GMI release published", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence" },
  { eventType: "GMI_CALL_CARRIED_FORWARD", description: "GMI call carried forward to next release cycle — unresolved signal or observation deferred to the next quarterly review", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence" },

  // ── Enterprise ──────────────────────────────────────────────────────────
  { eventType: "ENTERPRISE_CAMPAIGN_CREATED", description: "Enterprise campaign created", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "ENTERPRISE_CAMPAIGN_EXECUTED", description: "Enterprise campaign executed", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations" },
  { eventType: "ENTERPRISE_CAMPAIGN_COMPLETED", description: "Enterprise campaign completed", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
];

export function getEventType(eventType: string): EventTypeEntry | undefined {
  return GOVERNANCE_EVENT_TYPES.find((e) => e.eventType === eventType);
}

export function getEventsBySourceSurface(surfaceId: string): EventTypeEntry[] {
  return GOVERNANCE_EVENT_TYPES.filter((e) => e.sourceSurface === surfaceId);
}

export function getEventsByDomain(domain: AdminDomain): EventTypeEntry[] {
  return GOVERNANCE_EVENT_TYPES.filter((e) => e.adminDomain === domain);
}

export function getEventsThatCreateResearchRuns(): EventTypeEntry[] {
  return GOVERNANCE_EVENT_TYPES.filter((e) => e.canCreateResearchRun);
}
