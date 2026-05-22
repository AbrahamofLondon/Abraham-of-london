/**
 * lib/outbound/core/index.ts
 *
 * Barrel export for the unified outbound publishing core.
 * Import from this module rather than individual files where possible.
 */

// Provider contract types
export type {
  ProviderId,
  OutboundAssetType,
  OutboundReadiness,
  OutboundDraft,
  OutboundPublishRequest,
  OutboundPublishResult,
  OutboundSyncOutcome,
  OutboundGateResult,
  ProviderDiagnostics,
  OutboundProviderAdapter,
} from "./outbound-provider-contract";

// Policy gate
export {
  applySharedOutboundPolicy,
  mergeGateResults,
  connectionBlockers,
} from "./outbound-policy-gate";
export type { SharedPolicyOptions } from "./outbound-policy-gate";

// Asset resolver
export {
  resolveOutboundDraft,
  resolveAllOutboundDrafts,
  resolveAllXDrafts,
  buildCustomOutboundDraft,
} from "./outbound-asset-resolver";

// Audit
export {
  recordOutboundAudit,
  recordOutboundAuditBatch,
} from "./outbound-audit";
export type {
  OutboundAuditEventKind,
  OutboundAuditInput,
} from "./outbound-audit";

// Sync orchestrator
export {
  isSyncSupported,
  normaliseSyncTargets,
  canSyncTo,
  executeSyncTargets,
  getSyncTargetStatuses,
} from "./outbound-sync-orchestrator";
export type { SyncTargetStatus } from "./outbound-sync-orchestrator";
