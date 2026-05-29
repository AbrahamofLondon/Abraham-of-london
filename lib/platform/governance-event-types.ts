/**
 * lib/platform/governance-event-types.ts
 *
 * Shared governance event vocabulary for the entire platform.
 * Every subsystem (Executive Reporting, Boardroom Bridge, Outbound Publishing,
 * Foundry ResearchRun transitions, Content/Vault) uses this contract.
 *
 * Event maturity model (replaces binary reserved/active):
 *
 *   RESERVED_CONCEPT  →  SIMULATION_ONLY  →  PILOT_READY  →  LIVE_GOVERNED  →  RETIRED
 *
 * Rules:
 *   - RESERVED_CONCEPT  — vocabulary reserved for strategic continuity; no emitter wired
 *   - SIMULATION_ONLY   — exists inside Foundry, scenario testing, red-team, mock runs
 *   - PILOT_READY       — controlled real-world use under constraint; manual approval required
 *   - LIVE_GOVERNED     — real production workflow (real trigger, real emitter, durable record,
 *                         auth guard, audit trail, status truth) — ONLY this counts as GREEN
 *   - RETIRED           — genuinely obsolete, duplicated, superseded, or strategically abandoned
 *
 * Only LIVE_GOVERNED affects Product Health.
 * RESERVED_CONCEPT, SIMULATION_ONLY, and PILOT_READY must never make dashboards green.
 */

import type { AdminDomain } from "./admin-domain-registry";
import type { CanonicalRecordType } from "./product-ladder-registry";

// ─── Severity ────────────────────────────────────────────────────────────────

export type GovernanceSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

// ─── Durability / Reality / Domain classifiers ────────────────────────────────

/** How durably an event is (or must be) written when emitted. */
export type GovernanceEventDurability =
  | "none"                // fire-and-forget; no write required
  | "ephemeral"           // written to in-memory or short-lived store
  | "durable_required"    // must be written to the database before responding
  | "durable_confirmed"   // durable write confirmed by governance bus response
  | "external_confirmed"; // durable write confirmed by external platform response

/**
 * Event maturity model — replaces binary reserved/active classification.
 *
 * The Foundry is the institutional R&D and controlled experimentation engine.
 * Events mature through this pipeline:
 *
 *   RESERVED_CONCEPT
 *     → SIMULATION_ONLY
 *     → PILOT_READY
 *     → LIVE_GOVERNED
 *     → RETIRED
 *
 * Only LIVE_GOVERNED counts as GREEN for Product Health.
 * RESERVED_CONCEPT, SIMULATION_ONLY, and PILOT_READY must never make
 * dashboards green — they are governance vocabulary waiting for proof.
 * RETIRED should be rare and requires justification.
 */
export type EventMaturity =
  | "RESERVED_CONCEPT"   // Future product pathway; vocabulary reserved for strategic continuity
  | "SIMULATION_ONLY"    // Exists inside Foundry, scenario testing, red-team, mock runs, preview
  | "PILOT_READY"        // Controlled real-world use under constraint; manual approval required
  | "LIVE_GOVERNED"      // Real production workflow: real trigger, real emitter, durable record, auth guard, audit trail
  | "RETIRED";           // Genuinely obsolete, duplicated, superseded, or strategically abandoned

/** Whether the event represents a real production occurrence or a test/sim path. */
export type GovernanceEventReality =
  | "real"         // LIVE_GOVERNED — live production event
  | "simulation"   // SIMULATION_ONLY — Foundry/scenario/test path
  | "dry_run"      // PILOT_READY — explicit dry-run (gate validation, no side effects)
  | "preview"      // PILOT_READY — admin preview; no client-facing artefact
  | "test"         // SIMULATION_ONLY — test/canary path
  | "reserved";    // RESERVED_CONCEPT — registered but no emitter wired yet

/** High-level domain that owns the event. */
export type GovernanceEventDomain =
  | "admin"
  | "foundry"
  | "outbound"
  | "commercial"
  | "delivery"
  | "diagnostics"
  | "content_release"
  | "governance"
  | "auth"
  | "product"
  | "system";

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

  /**
   * @deprecated Use `maturity` instead. Kept for backward compatibility during migration.
   * reserved: true — registered event with no governance-bus emitter yet.
   * Product Health must treat reserved events as AMBER intent, not GREEN proof.
   */
  reserved?: true;
  /** @deprecated Use `blockingGaps` instead. */
  reservedReason?: string;

  // ── Maturity model (replaces binary reserved/active) ────────────────────

  /** Current maturity stage. Required for all events. */
  maturity: EventMaturity;

  /** Current reality classification — what the event actually is today. */
  currentReality: GovernanceEventReality;

  /** Target maturity this event should eventually reach. */
  targetMaturity?: EventMaturity;

  /** Conditions that must be met before promoting to the next maturity stage. */
  promotionCriteria?: string[];

  /** What is blocking promotion to the next stage. */
  blockingGaps?: string[];

  /** Product domain this event belongs to. */
  productDomain?: string;

  /** How the Foundry relates to this event (if applicable). */
  foundryRelationship?: "generates" | "consumes" | "simulates" | "validates" | "none";

  /** Whether this event should affect Product Health dashboard. Default: true only for LIVE_GOVERNED. */
  affectsProductHealth?: boolean;

  /** Whether this event should appear in dashboards at all. Default: true. */
  appearsInDashboards?: boolean;

  /** Required only when maturity === RETIRED — explains why retired. */
  retiredReason?: string;
};

export const GOVERNANCE_EVENT_TYPES: EventTypeEntry[] = [
  // ── Executive Reporting ─────────────────────────────────────────────────
  // LIVE_GOVERNED: emitter wired via routeGovernanceEvent in paid-er-generation.ts
  { eventType: "EXECUTIVE_REPORT_GENERATED", description: "Executive report successfully generated", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "EXECUTIVE_REPORT_DELIVERED", description: "Executive report delivered to client via secure link", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "EXECUTIVE_REPORT_VIEWED", description: "Executive report viewed by client via secure link", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "EXECUTIVE_REPORT_REVOKED", description: "Executive report revoked or superseded", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  // RESERVED_CONCEPT: no governance-bus emitter; logged operationally via logAuditEvent
  { eventType: "EXECUTIVE_REPORT_STARTED", description: "Executive report generation initiated", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in paid-er-generation.ts", "Add durable audit write"], blockingGaps: ["Governance bus wiring pending — currently logged via logAuditEvent"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "EXECUTIVE_REPORT_REVIEWED", description: "Executive report reviewed by admin", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Implement admin review step in product flow", "Wire governance bus emitter"], blockingGaps: ["Admin review step not yet implemented in product flow"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "EXECUTIVE_REPORT_EXPORTED", description: "Executive report exported (PDF/download)", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in export pipeline"], blockingGaps: ["Export event logged via logAuditEvent; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },

  // ── ER → Boardroom Bridge ───────────────────────────────────────────────
  // RESERVED_CONCEPT: bridge mapping not yet wired to governance bus
  { eventType: "ER_MAPPED_TO_INTELLIGENCE_SPINE", description: "Executive Report mapped to IntelligenceSpine", sourceSurface: "er-boardroom-bridge", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in bridge mapping path"], blockingGaps: ["Bridge mapping path not yet wired to governance bus"], affectsProductHealth: false, appearsInDashboards: false },
  // RESERVED_CONCEPT: qualification gate runs in boardroom-source-resolver without governance bus wire
  { eventType: "BOARDROOM_QUALIFICATION_EVALUATED", description: "Boardroom qualification gate evaluated", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in boardroom-source-resolver"], blockingGaps: ["Qualification evaluation runs in source resolver; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  // LIVE_GOVERNED: emitter wired via routeGovernanceEvent in boardroom-dossier-service.ts
  { eventType: "BOARDROOM_DOSSIER_GENERATED", description: "Boardroom dossier generated", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "BOARDROOM_DOSSIER_APPROVED", description: "Boardroom dossier approved for delivery by admin", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "BOARDROOM_DOSSIER_DELIVERED", description: "Boardroom dossier delivered to client (access granted)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "BOARDROOM_ACCESS_REVOKED", description: "Boardroom dossier access revoked by admin", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "BOARDROOM_DOSSIER_VIEWED", description: "Boardroom dossier viewed by client", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  // LIVE_GOVERNED: emitter wired via routeGovernanceEvent in boardroom-access-token.ts
  { eventType: "BOARDROOM_SECURE_LINK_CREATED", description: "Secure delivery token created for boardroom dossier — replaces email-query access", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "BOARDROOM_SECURE_LINK_REVOKED", description: "Secure delivery token explicitly revoked before expiry", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  // RESERVED_CONCEPT: export and review steps not yet wired
  { eventType: "BOARDROOM_DOSSIER_EXPORTED", description: "Boardroom dossier exported", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in PDF export pipeline"], blockingGaps: ["PDF export pipeline not yet wired to governance bus"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "BOARDROOM_DOSSIER_REVIEWED", description: "Boardroom dossier reviewed", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "PILOT_READY", promotionCriteria: ["Implement admin dossier review step", "Wire governance bus emitter"], blockingGaps: ["Admin dossier review step not yet implemented"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "STRATEGY_ROOM_ESCALATION_OFFERED", description: "Strategy Room escalation offered to client after Boardroom dossier delivery", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "PILOT_READY", promotionCriteria: ["Wire governance bus emitter after dossier delivery", "Implement escalation offer flow"], blockingGaps: ["Escalation offer not yet wired to governance bus after dossier delivery"], affectsProductHealth: false, appearsInDashboards: false },
  // SIMULATION_ONLY: used exclusively in lineage chain simulation; no live emitter
  { eventType: "BOARDROOM_DOSSIER_PREVIEWED", description: "Boardroom dossier previewed in simulation (dry-run, no client-facing artefact created)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "SIMULATION_ONLY", currentReality: "simulation", targetMaturity: "PILOT_READY", promotionCriteria: ["Create live preview path", "Wire governance bus emitter"], blockingGaps: ["Simulation-only event used in lineage chain definitions; no live governance bus emitter"], foundryRelationship: "simulates", affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "BOARDROOM_DOSSIER_EXPORTED_SIMULATED", description: "Boardroom dossier export simulated (dry-run, no PDF rendered, no client-facing artefact)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "SIMULATION_ONLY", currentReality: "simulation", targetMaturity: "PILOT_READY", promotionCriteria: ["Create live export path", "Wire governance bus emitter"], blockingGaps: ["Simulation-only event used in lineage chain definitions; no live governance bus emitter"], foundryRelationship: "simulates", affectsProductHealth: false, appearsInDashboards: false },

  // ── Strategy Room ───────────────────────────────────────────────────────
  // RESERVED_CONCEPT: Strategy Room logged via logAuditEvent; governance bus wiring pending
  { eventType: "STRATEGY_ROOM_CASE_OPENED", description: "Strategy Room case opened", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in Strategy Room intake"], blockingGaps: ["Case open logged via logAuditEvent (INTAKE_INITIALIZED); governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "EVIDENCE_REVIEWED", description: "Evidence reviewed in Strategy Room", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for evidence review"], blockingGaps: ["Evidence review logged operationally; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "DIRECTIVE_DERIVED", description: "Decision directive derived", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for directive derivation"], blockingGaps: ["Directive derivation logged operationally; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ESCALATION_TRIGGERED", description: "Escalation triggered from Strategy Room", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for escalation"], blockingGaps: ["Escalation logged via logAuditEvent; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ACTION_REQUIRED", description: "Action required from Strategy Room outcome", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for action required"], blockingGaps: ["Action required logged via logAuditEvent; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },

  // ── Outbound Publishing ─────────────────────────────────────────────────
  // RESERVED_CONCEPT: outbound domain uses logAuditEvent and outbound ledger; governance bus wiring pending
  { eventType: "OUTBOUND_DRAFT_CREATED", description: "Outbound post draft created", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for draft creation"], blockingGaps: ["Draft creation tracked in MDX frontmatter; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "OUTBOUND_POLICY_CHECKED", description: "Outbound post passed policy check", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for policy check"], blockingGaps: ["Policy check runs in outbound gate helpers; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "OUTBOUND_APPROVED", description: "Outbound post approved for publishing", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for approval"], blockingGaps: ["Approval tracked in MDX approvalStatus field; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "OUTBOUND_PUBLISHED", description: "Outbound post published to platform", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for publish"], blockingGaps: ["Publish recorded in outbound ledger (PUBLISHED status); governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "OUTBOUND_SYNCED", description: "Outbound post synced across platforms", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Implement cross-platform sync", "Wire governance bus emitter"], blockingGaps: ["Cross-platform sync not yet implemented; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "OUTBOUND_FAILED", description: "Outbound post publishing failed", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "outbound", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for failure"], blockingGaps: ["Failure recorded in outbound ledger (FAILED status); governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },

  // ── Foundry ResearchRun ─────────────────────────────────────────────────
  // LIVE_GOVERNED: FINDING_CREATED wired in app/api/client/actions/[actionId]/route.ts
  { eventType: "FINDING_CREATED", description: "FoundryFinding created", sourceSurface: "foundry", canonicalRecordType: "FoundryFinding", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  // LIVE_GOVERNED: ACTION_LOG_CREATED wired in lib/commercial/decision-action-log.ts
  { eventType: "ACTION_LOG_CREATED", description: "Decision action log item created from a governed report", sourceSurface: "executive-reporting", canonicalRecordType: "DecisionActionLog", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  // RESERVED_CONCEPT: Foundry run logging via prisma/logAuditEvent; governance bus wiring pending
  { eventType: "RESEARCH_RUN_CREATED", description: "ResearchRun created", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for ResearchRun creation"], blockingGaps: ["ResearchRun creation logged via Foundry service prisma write; governance bus wiring pending"], foundryRelationship: "generates", affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ACTION_BRIEF_EXPORTED", description: "ActionBrief exported from Foundry", sourceSurface: "foundry", canonicalRecordType: "ActionBrief", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for ActionBrief export"], blockingGaps: ["ActionBrief export not yet wired to governance bus"], foundryRelationship: "generates", affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "IMPLEMENTED", description: "ResearchRun finding implemented", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for implementation tracking"], blockingGaps: ["Implementation tracking logged operationally; governance bus wiring pending"], foundryRelationship: "consumes", affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ARCHIVED", description: "ResearchRun archived", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for archive"], blockingGaps: ["Archive event logged operationally; governance bus wiring pending"], foundryRelationship: "consumes", affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "FOUNDRY_ACTION_REQUIRED", description: "Foundry ResearchRun requires action — distinct from Strategy Room ACTION_REQUIRED", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "foundry", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "PILOT_READY", promotionCriteria: ["Wire governance bus emitter for Foundry action required"], blockingGaps: ["Foundry action requirement logged via logAuditEvent; governance bus wiring pending"], foundryRelationship: "generates", affectsProductHealth: false, appearsInDashboards: false },

  // ── Content ─────────────────────────────────────────────────────────────
  // LIVE_GOVERNED: emitters wired in lib/platform/content-governance-events.ts
  { eventType: "CONTENT_STYLE_CHECKED", description: "Content passed editorial style check (house style, tone, claim defensibility)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "CONTENT_METADATA_VALIDATED", description: "Content metadata validated (frontmatter, cover image, SEO, access tier)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  { eventType: "CONTENT_OUTBOUND_ELIGIBLE", description: "Content marked as outbound-eligible (passed internal eligibility checks — does not mean published to social)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", maturity: "LIVE_GOVERNED", currentReality: "real", affectsProductHealth: true, appearsInDashboards: true },
  // RESERVED_CONCEPT: content lifecycle via Contentlayer/MDX; governance bus wiring pending
  { eventType: "CONTENT_ASSET_CREATED", description: "Content asset created (editorial, blog, brief, or canon entry)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for content creation"], blockingGaps: ["Content creation managed by Contentlayer build; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "CONTENT_PUBLISHED", description: "Content asset published", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for publication"], blockingGaps: ["Publication managed via MDX frontmatter date; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "CONTENT_UPDATED", description: "Content asset updated", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for content updates"], blockingGaps: ["Update tracking via Contentlayer rebuild; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "CONTENT_ARCHIVED", description: "Content asset archived", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Implement content archive workflow", "Wire governance bus emitter"], blockingGaps: ["Content archive workflow not yet implemented"], affectsProductHealth: false, appearsInDashboards: false },

  // ── Access ──────────────────────────────────────────────────────────────
  // RESERVED_CONCEPT: access/entitlement events logged via grantEntitlement/logAuditEvent; governance bus wiring pending
  { eventType: "ACCESS_GRANTED", description: "Access grant created", sourceSurface: "access", canonicalRecordType: "AccessGrant", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for access grant"], blockingGaps: ["Access grant logged via grantEntitlement; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ACCESS_REVOKED", description: "Access grant revoked", sourceSurface: "access", canonicalRecordType: "AccessGrant", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for access revocation"], blockingGaps: ["Revocation logged operationally; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ENTITLEMENT_GRANTED", description: "Entitlement granted", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for entitlement grant"], blockingGaps: ["Entitlement grant logged via grantEntitlement; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ENTITLEMENT_REVOKED", description: "Entitlement revoked", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for entitlement revocation"], blockingGaps: ["Revocation logged operationally; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ENTITLEMENT_EXPIRED", description: "Entitlement expired", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Implement expiry tracking", "Wire governance bus emitter"], blockingGaps: ["Expiry not yet tracked; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },

  // ── GMI ─────────────────────────────────────────────────────────────────
  // RESERVED_CONCEPT: GMI domain uses gmi-event-store (separate durable store); governance bus wiring pending
  { eventType: "GMI_RELEASE_DRAFTED", description: "GMI release drafted", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for GMI draft"], blockingGaps: ["GMI events recorded in gmi-event-store; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "GMI_PRIOR_CALLS_REVIEWED", description: "Prior quarter calls reviewed for GMI release — every quarterly report reviews the material calls from the previous quarter before issuing the next one", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for GMI prior calls review"], blockingGaps: ["GMI events recorded in gmi-event-store; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "GMI_QUALITY_GATE_RUN", description: "Quality gate run for GMI release — signal validation, evidence posture, and release readiness check", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "intelligence", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for GMI quality gate"], blockingGaps: ["GMI events recorded in gmi-event-store; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "GMI_RELEASE_APPROVED", description: "GMI release approved for publication", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for GMI approval"], blockingGaps: ["GMI events recorded in gmi-event-store; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "GMI_RELEASE_PUBLISHED", description: "GMI release published", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for GMI publish"], blockingGaps: ["GMI events recorded in gmi-event-store; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "GMI_CALL_CARRIED_FORWARD", description: "GMI call carried forward to next release cycle — unresolved signal or observation deferred to the next quarterly review", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for GMI carry-forward"], blockingGaps: ["GMI events recorded in gmi-event-store; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },

  // ── Foundry Promotion ───────────────────────────────────────────────────
  // PILOT_READY: these events write real DB records (FoundryPromotion table, ResearchRun
  // maturityStage, FoundryAuditEvent) under admin authentication. Input validated.
  // Error types handled. Canary tests prove persistence. Durable write confirmed.
  // Remaining gap to LIVE_GOVERNED: governance bus emitter not yet wired separately
  // from FoundryAuditEvent (i.e. no standalone GovernanceEvent table row per emission).
  { eventType: "FOUNDRY_PROMOTION_CREATED", description: "Foundry module maturity promotion recorded — writes FoundryPromotion row, updates ResearchRun.maturityStage, emits FoundryAuditEvent", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "PILOT_READY", currentReality: "dry_run", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire standalone GovernanceEvent table emitter", "Expose promotion events in admin audit log surface", "Prove recovery path for failed DB write mid-transaction"], blockingGaps: ["Governance bus not wired separately; events queryable via FoundryAuditEvent only"], foundryRelationship: "generates", affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "FOUNDRY_PROMOTION_ROLLED_BACK", description: "Foundry module maturity promotion rolled back — append-only FoundryPromotion update + FoundryAuditEvent", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "foundry", maturity: "PILOT_READY", currentReality: "dry_run", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in rollback route", "Add rollbackBy field to FoundryPromotion"], blockingGaps: ["rollbackBy actor not persisted to schema; governance bus wiring pending"], foundryRelationship: "generates", affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "FOUNDRY_RUN_STATUS_CHANGED", description: "Foundry ResearchRun status transitioned — updates maturityStage, emits FoundryAuditEvent", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", maturity: "PILOT_READY", currentReality: "dry_run", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter in ResearchRunRepository transition methods", "Expose status timeline in run detail"], blockingGaps: ["Governance bus not wired separately; status history queryable via FoundryAuditEvent only"], foundryRelationship: "generates", affectsProductHealth: false, appearsInDashboards: false },

  // ── Enterprise ──────────────────────────────────────────────────────────
  // RESERVED_CONCEPT: enterprise campaign events not yet wired to governance bus
  { eventType: "ENTERPRISE_CAMPAIGN_CREATED", description: "Enterprise campaign created", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for campaign creation"], blockingGaps: ["Campaign creation logged operationally; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ENTERPRISE_CAMPAIGN_EXECUTED", description: "Enterprise campaign executed", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for campaign execution"], blockingGaps: ["Campaign execution logged operationally; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
  { eventType: "ENTERPRISE_CAMPAIGN_COMPLETED", description: "Enterprise campaign completed", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", maturity: "RESERVED_CONCEPT", currentReality: "reserved", targetMaturity: "LIVE_GOVERNED", promotionCriteria: ["Wire governance bus emitter for campaign completion"], blockingGaps: ["Campaign completion logged operationally; governance bus wiring pending"], affectsProductHealth: false, appearsInDashboards: false },
];

/**
 * Get the effective maturity of an event entry.
 * Handles backward compatibility: if maturity is not set but reserved is true,
 * returns RESERVED_CONCEPT. If neither is set, defaults to LIVE_GOVERNED
 * (the original default for non-reserved events).
 */
export function getEffectiveMaturity(entry: EventTypeEntry): EventMaturity {
  if (entry.maturity) return entry.maturity;
  // Backward compatibility: reserved: true → RESERVED_CONCEPT
  if (entry.reserved) return "RESERVED_CONCEPT";
  // Default for legacy entries without maturity or reserved flag
  return "LIVE_GOVERNED";
}

/**
 * Whether this event should count as GREEN for Product Health.
 * Only LIVE_GOVERNED events affect Product Health.
 */
export function affectsProductHealth(entry: EventTypeEntry): boolean {
  if (entry.affectsProductHealth !== undefined) return entry.affectsProductHealth;
  return getEffectiveMaturity(entry) === "LIVE_GOVERNED";
}

/**
 * Whether this event should appear in dashboards.
 * RESERVED_CONCEPT and RETIRED events are hidden by default.
 */
export function appearsInDashboards(entry: EventTypeEntry): boolean {
  if (entry.appearsInDashboards !== undefined) return entry.appearsInDashboards;
  const maturity = getEffectiveMaturity(entry);
  return maturity !== "RESERVED_CONCEPT" && maturity !== "RETIRED";
}

/**
 * Get the promotion pathway from one maturity stage to the next.
 * Returns null if the event is at its target or cannot be promoted.
 */
export function getPromotionPathway(entry: EventTypeEntry): {
  from: EventMaturity;
  to: EventMaturity;
  criteria: string[];
  gaps: string[];
} | null {
  const current = getEffectiveMaturity(entry);
  const target = entry.targetMaturity;
  if (!target || current === target) return null;
  return {
    from: current,
    to: target,
    criteria: entry.promotionCriteria ?? [],
    gaps: entry.blockingGaps ?? [],
  };
}

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

/** Get only events that are LIVE_GOVERNED — these are the ones that count as GREEN. */
export function getLiveGovernedEvents(): EventTypeEntry[] {
  return GOVERNANCE_EVENT_TYPES.filter((e) => getEffectiveMaturity(e) === "LIVE_GOVERNED");
}

/** Get events that are still in pipeline (not yet LIVE_GOVERNED and not RETIRED). */
export function getPipelineEvents(): EventTypeEntry[] {
  return GOVERNANCE_EVENT_TYPES.filter((e) => {
    const m = getEffectiveMaturity(e);
    return m !== "LIVE_GOVERNED" && m !== "RETIRED";
  });
}
