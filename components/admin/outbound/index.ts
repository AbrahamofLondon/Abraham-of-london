/**
 * components/admin/outbound/index.ts
 *
 * Barrel export for shared outbound UI components.
 */

export { OutboundConnectionStatus } from "./OutboundConnectionStatus";
export type { OutboundConnectionStatusProps } from "./OutboundConnectionStatus";

export { OutboundPermissionPanel } from "./OutboundPermissionPanel";
export type { OutboundPermissionPanelProps } from "./OutboundPermissionPanel";

export { OutboundAssetSelector } from "./OutboundAssetSelector";
export type { OutboundAssetSelectorProps, OutboundAssetEntry, AssetReadinessState } from "./OutboundAssetSelector";

export { OutboundDraftPreview } from "./OutboundDraftPreview";
export type { OutboundDraftPreviewProps } from "./OutboundDraftPreview";

export { OutboundFinalGate } from "./OutboundFinalGate";
export type { OutboundFinalGateProps } from "./OutboundFinalGate";

export { OutboundAttemptHistory } from "./OutboundAttemptHistory";
export type { OutboundAttemptHistoryProps, AttemptRow, AttemptStatus } from "./OutboundAttemptHistory";

export { OutboundSyncTargets } from "./OutboundSyncTargets";
export type { OutboundSyncTargetsProps } from "./OutboundSyncTargets";
