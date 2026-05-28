/**
 * lib/platform/governance-event-types.ts
 *
 * Shared governance event vocabulary for the entire platform.
 * Every subsystem (Executive Reporting, Boardroom Bridge, Outbound Publishing,
 * Foundry ResearchRun transitions, Content/Vault) uses this contract.
 *
 * Event lifecycle classification:
 *   active   — emitter exists via routeGovernanceEvent / emitGovernanceEvent
 *   reserved — registered, no governance-bus emitter yet; see reservedReason
 *
 * No pub/sub infrastructure yet — but every event uses the same shape.
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
   * reserved: true — registered event with no governance-bus emitter yet.
   * Product Health must treat reserved events as AMBER intent, not GREEN proof.
   */
  reserved?: true;
  reservedReason?: string;

  // ── Maturity model (progressive migration from binary reserved/active) ──
  maturity?: EventMaturity;

  /** Current reality classification — what the event actually is today. */
  currentReality?: GovernanceEventReality;

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

  /** Whether this event should affect Product Health dashboard. */
  affectsProductHealth?: boolean;

  /** Whether this event should appear in dashboards at all. */
  appearsInDashboards?: boolean;

  /** Required only when maturity === RETIRED — explains why retired. */
  retiredReason?: string;
};

export const GOVERNANCE_EVENT_TYPES: EventTypeEntry[] = [
  // ── Executive Reporting ─────────────────────────────────────────────────
  // active: emitter wired via routeGovernanceEvent in paid-er-generation.ts
  { eventType: "EXECUTIVE_REPORT_GENERATED", description: "Executive report successfully generated", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_DELIVERED", description: "Executive report delivered to client via secure link", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_VIEWED", description: "Executive report viewed by client via secure link", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "EXECUTIVE_REPORT_REVOKED", description: "Executive report revoked or superseded", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations" },
  // reserved: no governance-bus emitter; logged operationally via logAuditEvent
  { eventType: "EXECUTIVE_REPORT_STARTED", description: "Executive report generation initiated", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Start event logged via logAuditEvent; governance bus wiring pending" },
  { eventType: "EXECUTIVE_REPORT_REVIEWED", description: "Executive report reviewed by admin", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Admin review step not yet implemented in product flow" },
  { eventType: "EXECUTIVE_REPORT_EXPORTED", description: "Executive report exported (PDF/download)", sourceSurface: "executive-reporting", canonicalRecordType: "ExecutiveReport", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Export event logged via logAuditEvent; governance bus wiring pending" },

  // ── ER → Boardroom Bridge ───────────────────────────────────────────────
  // reserved: bridge mapping not yet wired to governance bus
  { eventType: "ER_MAPPED_TO_INTELLIGENCE_SPINE", description: "Executive Report mapped to IntelligenceSpine", sourceSurface: "er-boardroom-bridge", canonicalRecordType: "ExecutiveReport", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", reserved: true, reservedReason: "Bridge mapping path not yet wired to governance bus" },
  // reserved: qualification gate runs in boardroom-source-resolver without governance bus wire
  { eventType: "BOARDROOM_QUALIFICATION_EVALUATED", description: "Boardroom qualification gate evaluated", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Qualification evaluation runs in source resolver; governance bus wiring pending" },
  // active: emitter wired via routeGovernanceEvent in boardroom-dossier-service.ts
  { eventType: "BOARDROOM_DOSSIER_GENERATED", description: "Boardroom dossier generated", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_APPROVED", description: "Boardroom dossier approved for delivery by admin", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_DELIVERED", description: "Boardroom dossier delivered to client (access granted)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_ACCESS_REVOKED", description: "Boardroom dossier access revoked by admin", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_DOSSIER_VIEWED", description: "Boardroom dossier viewed by client", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  // active: emitter wired via routeGovernanceEvent in boardroom-access-token.ts
  { eventType: "BOARDROOM_SECURE_LINK_CREATED", description: "Secure delivery token created for boardroom dossier — replaces email-query access", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  { eventType: "BOARDROOM_SECURE_LINK_REVOKED", description: "Secure delivery token explicitly revoked before expiry", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  // reserved: export and review steps not yet wired
  { eventType: "BOARDROOM_DOSSIER_EXPORTED", description: "Boardroom dossier exported", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "PDF export pipeline not yet wired to governance bus" },
  { eventType: "BOARDROOM_DOSSIER_REVIEWED", description: "Boardroom dossier reviewed", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", reserved: true, reservedReason: "Admin dossier review step not yet implemented" },
  { eventType: "STRATEGY_ROOM_ESCALATION_OFFERED", description: "Strategy Room escalation offered to client after Boardroom dossier delivery", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", reserved: true, reservedReason: "Escalation offer not yet wired to governance bus after dossier delivery" },
  // reserved (simulation only): used exclusively in lineage chain simulation; no live emitter
  { eventType: "BOARDROOM_DOSSIER_PREVIEWED", description: "Boardroom dossier previewed in simulation (dry-run, no client-facing artefact created)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", reserved: true, reservedReason: "Simulation-only event used in lineage chain definitions; no live governance bus emitter" },
  { eventType: "BOARDROOM_DOSSIER_EXPORTED_SIMULATED", description: "Boardroom dossier export simulated (dry-run, no PDF rendered, no client-facing artefact)", sourceSurface: "boardroom-mode", canonicalRecordType: "BoardroomDossier", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", reserved: true, reservedReason: "Simulation-only event used in lineage chain definitions; no live governance bus emitter" },

  // ── Strategy Room ───────────────────────────────────────────────────────
  // reserved: Strategy Room logged via logAuditEvent; governance bus wiring pending
  { eventType: "STRATEGY_ROOM_CASE_OPENED", description: "Strategy Room case opened", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Case open logged via logAuditEvent (INTAKE_INITIALIZED); governance bus wiring pending" },
  { eventType: "EVIDENCE_REVIEWED", description: "Evidence reviewed in Strategy Room", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Evidence review logged operationally; governance bus wiring pending" },
  { eventType: "DIRECTIVE_DERIVED", description: "Decision directive derived", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Directive derivation logged operationally; governance bus wiring pending" },
  { eventType: "ESCALATION_TRIGGERED", description: "Escalation triggered from Strategy Room", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", reserved: true, reservedReason: "Escalation logged via logAuditEvent; governance bus wiring pending" },
  { eventType: "ACTION_REQUIRED", description: "Action required from Strategy Room outcome", sourceSurface: "strategy-room", canonicalRecordType: "StrategyRoomCase", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", reserved: true, reservedReason: "Action required logged via logAuditEvent; governance bus wiring pending" },

  // ── Outbound Publishing ─────────────────────────────────────────────────
  // reserved: outbound domain uses logAuditEvent and outbound ledger; governance bus wiring pending
  { eventType: "OUTBOUND_DRAFT_CREATED", description: "Outbound post draft created", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", reserved: true, reservedReason: "Draft creation tracked in MDX frontmatter; governance bus wiring pending" },
  { eventType: "OUTBOUND_POLICY_CHECKED", description: "Outbound post passed policy check", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", reserved: true, reservedReason: "Policy check runs in outbound gate helpers; governance bus wiring pending" },
  { eventType: "OUTBOUND_APPROVED", description: "Outbound post approved for publishing", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", reserved: true, reservedReason: "Approval tracked in MDX approvalStatus field; governance bus wiring pending" },
  { eventType: "OUTBOUND_PUBLISHED", description: "Outbound post published to platform", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", reserved: true, reservedReason: "Publish recorded in outbound ledger (PUBLISHED status); governance bus wiring pending" },
  { eventType: "OUTBOUND_SYNCED", description: "Outbound post synced across platforms", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "outbound", reserved: true, reservedReason: "Cross-platform sync not yet implemented; governance bus wiring pending" },
  { eventType: "OUTBOUND_FAILED", description: "Outbound post publishing failed", sourceSurface: "outbound", canonicalRecordType: "OutboundPost", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "outbound", reserved: true, reservedReason: "Failure recorded in outbound ledger (FAILED status); governance bus wiring pending" },

  // ── Foundry ResearchRun ─────────────────────────────────────────────────
  // active: FINDING_CREATED wired in app/api/client/actions/[actionId]/route.ts
  { eventType: "FINDING_CREATED", description: "FoundryFinding created", sourceSurface: "foundry", canonicalRecordType: "FoundryFinding", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry" },
  // active: ACTION_LOG_CREATED wired in lib/commercial/decision-action-log.ts
  { eventType: "ACTION_LOG_CREATED", description: "Decision action log item created from a governed report", sourceSurface: "executive-reporting", canonicalRecordType: "DecisionActionLog", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations" },
  // reserved: Foundry run logging via prisma/logAuditEvent; governance bus wiring pending
  { eventType: "RESEARCH_RUN_CREATED", description: "ResearchRun created", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", reserved: true, reservedReason: "ResearchRun creation logged via Foundry service prisma write; governance bus wiring pending" },
  { eventType: "ACTION_BRIEF_EXPORTED", description: "ActionBrief exported from Foundry", sourceSurface: "foundry", canonicalRecordType: "ActionBrief", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", reserved: true, reservedReason: "ActionBrief export not yet wired to governance bus" },
  { eventType: "IMPLEMENTED", description: "ResearchRun finding implemented", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", reserved: true, reservedReason: "Implementation tracking logged operationally; governance bus wiring pending" },
  { eventType: "ARCHIVED", description: "ResearchRun archived", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "foundry", reserved: true, reservedReason: "Archive event logged operationally; governance bus wiring pending" },
  { eventType: "FOUNDRY_ACTION_REQUIRED", description: "Foundry ResearchRun requires action — distinct from Strategy Room ACTION_REQUIRED", sourceSurface: "foundry", canonicalRecordType: "ResearchRun", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "foundry", reserved: true, reservedReason: "Foundry action requirement logged via logAuditEvent; governance bus wiring pending" },

  // ── Content ─────────────────────────────────────────────────────────────
  // active: emitters wired in lib/platform/content-governance-events.ts
  { eventType: "CONTENT_STYLE_CHECKED", description: "Content passed editorial style check (house style, tone, claim defensibility)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_METADATA_VALIDATED", description: "Content metadata validated (frontmatter, cover image, SEO, access tier)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  { eventType: "CONTENT_OUTBOUND_ELIGIBLE", description: "Content marked as outbound-eligible (passed internal eligibility checks — does not mean published to social)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content" },
  // reserved: content lifecycle via Contentlayer/MDX; governance bus wiring pending
  { eventType: "CONTENT_ASSET_CREATED", description: "Content asset created (editorial, blog, brief, or canon entry)", sourceSurface: "editorials", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", reserved: true, reservedReason: "Content creation managed by Contentlayer build; governance bus wiring pending" },
  { eventType: "CONTENT_PUBLISHED", description: "Content asset published", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", reserved: true, reservedReason: "Publication managed via MDX frontmatter date; governance bus wiring pending" },
  { eventType: "CONTENT_UPDATED", description: "Content asset updated", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", reserved: true, reservedReason: "Update tracking via Contentlayer rebuild; governance bus wiring pending" },
  { eventType: "CONTENT_ARCHIVED", description: "Content asset archived", sourceSurface: "content", canonicalRecordType: "ContentAsset", defaultSeverity: "LOW", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "content", reserved: true, reservedReason: "Content archive workflow not yet implemented" },

  // ── Access ──────────────────────────────────────────────────────────────
  // reserved: access/entitlement events logged via grantEntitlement/logAuditEvent; governance bus wiring pending
  { eventType: "ACCESS_GRANTED", description: "Access grant created", sourceSurface: "access", canonicalRecordType: "AccessGrant", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", reserved: true, reservedReason: "Access grant logged via grantEntitlement; governance bus wiring pending" },
  { eventType: "ACCESS_REVOKED", description: "Access grant revoked", sourceSurface: "access", canonicalRecordType: "AccessGrant", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", reserved: true, reservedReason: "Revocation logged operationally; governance bus wiring pending" },
  { eventType: "ENTITLEMENT_GRANTED", description: "Entitlement granted", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", reserved: true, reservedReason: "Entitlement grant logged via grantEntitlement; governance bus wiring pending" },
  { eventType: "ENTITLEMENT_REVOKED", description: "Entitlement revoked", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", reserved: true, reservedReason: "Revocation logged operationally; governance bus wiring pending" },
  { eventType: "ENTITLEMENT_EXPIRED", description: "Entitlement expired", sourceSurface: "access", canonicalRecordType: "Entitlement", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "access", reserved: true, reservedReason: "Expiry not yet tracked; governance bus wiring pending" },

  // ── GMI ─────────────────────────────────────────────────────────────────
  // reserved: GMI domain uses gmi-event-store (separate durable store); governance bus wiring pending
  { eventType: "GMI_RELEASE_DRAFTED", description: "GMI release drafted", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "LOW", writesAudit: false, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", reserved: true, reservedReason: "GMI events recorded in gmi-event-store; governance bus wiring pending" },
  { eventType: "GMI_PRIOR_CALLS_REVIEWED", description: "Prior quarter calls reviewed for GMI release — every quarterly report reviews the material calls from the previous quarter before issuing the next one", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", reserved: true, reservedReason: "GMI events recorded in gmi-event-store; governance bus wiring pending" },
  { eventType: "GMI_QUALITY_GATE_RUN", description: "Quality gate run for GMI release — signal validation, evidence posture, and release readiness check", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "intelligence", reserved: true, reservedReason: "GMI events recorded in gmi-event-store; governance bus wiring pending" },
  { eventType: "GMI_RELEASE_APPROVED", description: "GMI release approved for publication", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", reserved: true, reservedReason: "GMI events recorded in gmi-event-store; governance bus wiring pending" },
  { eventType: "GMI_RELEASE_PUBLISHED", description: "GMI release published", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", reserved: true, reservedReason: "GMI events recorded in gmi-event-store; governance bus wiring pending" },
  { eventType: "GMI_CALL_CARRIED_FORWARD", description: "GMI call carried forward to next release cycle — unresolved signal or observation deferred to the next quarterly review", sourceSurface: "gmi", canonicalRecordType: "GmiRelease", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "intelligence", reserved: true, reservedReason: "GMI events recorded in gmi-event-store; governance bus wiring pending" },

  // ── Enterprise ──────────────────────────────────────────────────────────
  // reserved: enterprise campaign events not yet wired to governance bus
  { eventType: "ENTERPRISE_CAMPAIGN_CREATED", description: "Enterprise campaign created", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Campaign creation logged operationally; governance bus wiring pending" },
  { eventType: "ENTERPRISE_CAMPAIGN_EXECUTED", description: "Enterprise campaign executed", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "HIGH", writesAudit: true, writesLineage: true, canCreateResearchRun: true, adminDomain: "product-operations", reserved: true, reservedReason: "Campaign execution logged operationally; governance bus wiring pending" },
  { eventType: "ENTERPRISE_CAMPAIGN_COMPLETED", description: "Enterprise campaign completed", sourceSurface: "enterprise-decision-authority", canonicalRecordType: "EnterpriseCampaign", defaultSeverity: "MEDIUM", writesAudit: true, writesLineage: true, canCreateResearchRun: false, adminDomain: "product-operations", reserved: true, reservedReason: "Campaign completion logged operationally; governance bus wiring pending" },
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
