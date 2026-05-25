/**
 * lib/platform/canonical-record-registry.ts
 *
 * Single map of every canonical record type in the system.
 * Each record declares its admin domain owner, creating surfaces,
 * admin viewing routes, Foundry test modules, lineage/audit events,
 * retention policy, and privacy class.
 */

import type { AdminDomain } from "./admin-domain-registry";

export type PrivacyClass = "PUBLIC" | "INTERNAL" | "SENSITIVE" | "RESTRICTED";

export type CanonicalRecordEntry = {
  id: string;
  label: string;
  ownerDomain: AdminDomain;
  createdBySurfaces: string[];
  viewedInAdminRoutes: string[];
  testedByFoundryModules: string[];
  lineageEvents: string[];
  auditEvents: string[];
  retentionPolicy?: string;
  privacyClass: PrivacyClass;
};

export const CANONICAL_RECORDS: CanonicalRecordEntry[] = [
  {
    id: "ContentAsset",
    label: "Content Asset",
    ownerDomain: "content",
    createdBySurfaces: ["editorials", "blog", "shorts", "briefs", "canon"],
    viewedInAdminRoutes: ["/admin/content", "/admin/content-vault"],
    testedByFoundryModules: ["editorial-style-checker", "content-red-team", "outbound-content-validator"],
    lineageEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED", "CONTENT_ARCHIVED"],
    auditEvents: ["CONTENT_PUBLISHED", "CONTENT_UPDATED"],
    retentionPolicy: "indefinite",
    privacyClass: "PUBLIC",
  },
  {
    id: "DiagnosticRun",
    label: "Diagnostic Run",
    ownerDomain: "product-operations",
    createdBySurfaces: ["fast-diagnostic", "purpose-alignment", "constitutional-diagnostic"],
    viewedInAdminRoutes: ["/admin/intelligence-foundry/runs", "/admin/calibration"],
    testedByFoundryModules: ["fast-diagnostic", "purpose-alignment", "constitutional-diagnostic"],
    lineageEvents: ["DIAGNOSTIC_STARTED", "DIAGNOSTIC_COMPLETED", "DIAGNOSTIC_REVIEWED"],
    auditEvents: ["DIAGNOSTIC_COMPLETED"],
    retentionPolicy: "2 years",
    privacyClass: "SENSITIVE",
  },
  {
    id: "ExecutiveReport",
    label: "Executive Report",
    ownerDomain: "product-operations",
    createdBySurfaces: ["executive-reporting"],
    viewedInAdminRoutes: ["/admin/reporting/executive", "/admin/reports", "/admin/reporting/lineage"],
    testedByFoundryModules: ["executive-reporting", "executive-report-boardroom-bridge"],
    lineageEvents: [
      "EXECUTIVE_REPORT_STARTED",
      "EXECUTIVE_REPORT_GENERATED",
      "EXECUTIVE_REPORT_REVIEWED",
      "EXECUTIVE_REPORT_EXPORTED",
      "EXECUTIVE_REPORT_REVOKED",
    ],
    auditEvents: [
      "EXECUTIVE_REPORT_GENERATED",
      "EXECUTIVE_REPORT_EXPORTED",
      "EXECUTIVE_REPORT_REVOKED",
    ],
    retentionPolicy: "5 years",
    privacyClass: "RESTRICTED",
  },
  {
    id: "StrategyRoomCase",
    label: "Strategy Room Case",
    ownerDomain: "product-operations",
    createdBySurfaces: ["strategy-room"],
    viewedInAdminRoutes: ["/admin/strategy-room", "/admin/authority-center"],
    testedByFoundryModules: ["strategy-room"],
    lineageEvents: [
      "STRATEGY_ROOM_CASE_OPENED",
      "EVIDENCE_REVIEWED",
      "DIRECTIVE_DERIVED",
      "ESCALATION_TRIGGERED",
      "ACTION_REQUIRED",
    ],
    auditEvents: [
      "STRATEGY_ROOM_CASE_OPENED",
      "DIRECTIVE_DERIVED",
      "ESCALATION_TRIGGERED",
    ],
    retentionPolicy: "5 years",
    privacyClass: "RESTRICTED",
  },
  {
    id: "BoardroomDossier",
    label: "Boardroom Dossier",
    ownerDomain: "product-operations",
    createdBySurfaces: ["boardroom-mode"],
    viewedInAdminRoutes: ["/admin/intelligence-foundry/simulation/boardroom-mode", "/admin/reporting/lineage"],
    testedByFoundryModules: ["boardroom-dossier", "executive-report-boardroom-bridge"],
    lineageEvents: [
      "BOARDROOM_QUALIFICATION_EVALUATED",
      "BOARDROOM_DOSSIER_GENERATED",
      "BOARDROOM_DOSSIER_EXPORTED",
      "BOARDROOM_DOSSIER_REVIEWED",
    ],
    auditEvents: [
      "BOARDROOM_DOSSIER_GENERATED",
      "BOARDROOM_DOSSIER_EXPORTED",
    ],
    retentionPolicy: "5 years",
    privacyClass: "RESTRICTED",
  },
  {
    id: "EnterpriseCampaign",
    label: "Enterprise Campaign",
    ownerDomain: "product-operations",
    createdBySurfaces: ["enterprise-decision-authority"],
    viewedInAdminRoutes: ["/admin/enterprise", "/admin/campaign"],
    testedByFoundryModules: ["enterprise-decision-authority"],
    lineageEvents: [
      "ENTERPRISE_CAMPAIGN_CREATED",
      "ENTERPRISE_CAMPAIGN_EXECUTED",
      "ENTERPRISE_CAMPAIGN_COMPLETED",
    ],
    auditEvents: [
      "ENTERPRISE_CAMPAIGN_CREATED",
      "ENTERPRISE_CAMPAIGN_EXECUTED",
    ],
    retentionPolicy: "5 years",
    privacyClass: "RESTRICTED",
  },
  {
    id: "GmiRelease",
    label: "GMI Release",
    ownerDomain: "intelligence",
    createdBySurfaces: ["gmi"],
    viewedInAdminRoutes: ["/admin/intelligence/gmi-release-console", "/admin/intelligence/gmi-event-log"],
    testedByFoundryModules: ["gmi"],
    lineageEvents: [
      "GMI_RELEASE_DRAFTED",
      "GMI_RELEASE_REVIEWED",
      "GMI_RELEASE_PUBLISHED",
    ],
    auditEvents: [
      "GMI_RELEASE_REVIEWED",
      "GMI_RELEASE_PUBLISHED",
    ],
    retentionPolicy: "3 years",
    privacyClass: "SENSITIVE",
  },
  {
    id: "OutboundPost",
    label: "Outbound Post",
    ownerDomain: "outbound",
    createdBySurfaces: ["outbound-linkedin", "outbound-facebook", "outbound-x"],
    viewedInAdminRoutes: ["/admin/outbound/linkedin", "/admin/outbound/facebook", "/admin/outbound/x"],
    testedByFoundryModules: ["outbound-content-validator", "outbound-policy-gate"],
    lineageEvents: [
      "OUTBOUND_DRAFT_CREATED",
      "OUTBOUND_POLICY_CHECKED",
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_SYNCED",
      "OUTBOUND_FAILED",
    ],
    auditEvents: [
      "OUTBOUND_APPROVED",
      "OUTBOUND_PUBLISHED",
      "OUTBOUND_FAILED",
    ],
    retentionPolicy: "2 years",
    privacyClass: "PUBLIC",
  },
  {
    id: "ResearchRun",
    label: "Research Run",
    ownerDomain: "foundry",
    createdBySurfaces: ["scenario-workbench", "fast-diagnostic-sim", "boardroom-mode-sim", "executive-reporting-sim", "er-boardroom-bridge-sim"],
    viewedInAdminRoutes: ["/admin/intelligence-foundry/runs"],
    testedByFoundryModules: [],  // ResearchRuns are the output, not the test
    lineageEvents: [
      "RESEARCH_RUN_CREATED",
      "FINDING_CREATED",
      "ACTION_BRIEF_EXPORTED",
      "ACTION_REQUIRED",
      "IMPLEMENTED",
      "ARCHIVED",
    ],
    auditEvents: [
      "RESEARCH_RUN_CREATED",
      "FINDING_CREATED",
      "ACTION_BRIEF_EXPORTED",
    ],
    retentionPolicy: "indefinite",
    privacyClass: "INTERNAL",
  },
  {
    id: "FoundryFinding",
    label: "Foundry Finding",
    ownerDomain: "foundry",
    createdBySurfaces: [],
    viewedInAdminRoutes: ["/admin/intelligence-foundry/runs"],
    testedByFoundryModules: [],
    lineageEvents: ["FINDING_CREATED", "FINDING_RESOLVED"],
    auditEvents: ["FINDING_CREATED"],
    retentionPolicy: "indefinite",
    privacyClass: "INTERNAL",
  },
  {
    id: "ActionBrief",
    label: "Action Brief",
    ownerDomain: "foundry",
    createdBySurfaces: [],
    viewedInAdminRoutes: ["/admin/intelligence-foundry/runs"],
    testedByFoundryModules: [],
    lineageEvents: ["ACTION_BRIEF_EXPORTED"],
    auditEvents: ["ACTION_BRIEF_EXPORTED"],
    retentionPolicy: "indefinite",
    privacyClass: "INTERNAL",
  },
  {
    id: "AccessGrant",
    label: "Access Grant",
    ownerDomain: "access",
    createdBySurfaces: [],
    viewedInAdminRoutes: ["/admin/access", "/admin/users"],
    testedByFoundryModules: [],
    lineageEvents: ["ACCESS_GRANTED", "ACCESS_REVOKED"],
    auditEvents: ["ACCESS_GRANTED", "ACCESS_REVOKED"],
    retentionPolicy: "5 years",
    privacyClass: "SENSITIVE",
  },
  {
    id: "Entitlement",
    label: "Entitlement",
    ownerDomain: "access",
    createdBySurfaces: [],
    viewedInAdminRoutes: ["/admin/access", "/admin/users"],
    testedByFoundryModules: [],
    lineageEvents: ["ENTITLEMENT_GRANTED", "ENTITLEMENT_REVOKED", "ENTITLEMENT_EXPIRED"],
    auditEvents: ["ENTITLEMENT_GRANTED", "ENTITLEMENT_REVOKED"],
    retentionPolicy: "5 years",
    privacyClass: "SENSITIVE",
  },
  {
    id: "AuditEvent",
    label: "Audit Event",
    ownerDomain: "audit",
    createdBySurfaces: [],
    viewedInAdminRoutes: ["/admin/audit", "/admin/reporting/lineage"],
    testedByFoundryModules: [],
    lineageEvents: [],
    auditEvents: [],
    retentionPolicy: "7 years",
    privacyClass: "INTERNAL",
  },
  {
    id: "LineageEvent",
    label: "Lineage Event",
    ownerDomain: "audit",
    createdBySurfaces: [],
    viewedInAdminRoutes: ["/admin/reporting/lineage"],
    testedByFoundryModules: [],
    lineageEvents: [],
    auditEvents: [],
    retentionPolicy: "7 years",
    privacyClass: "INTERNAL",
  },
];

export function getCanonicalRecord(id: string): CanonicalRecordEntry | undefined {
  return CANONICAL_RECORDS.find((r) => r.id === id);
}

export function getRecordsByDomain(domain: AdminDomain): CanonicalRecordEntry[] {
  return CANONICAL_RECORDS.filter((r) => r.ownerDomain === domain);
}

export function getRecordsByFoundryModule(moduleId: string): CanonicalRecordEntry[] {
  return CANONICAL_RECORDS.filter((r) => r.testedByFoundryModules.includes(moduleId));
}
