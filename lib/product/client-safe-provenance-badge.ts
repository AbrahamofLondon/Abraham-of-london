import type {
  ClientSafeProvenanceSummary,
  ClientSafeConfidenceBand,
} from "./client-safe-provenance-contract";

export type ProvenanceBadgeState =
  | "CHAIN_ANCHORED"
  | "HASH_VERIFIED"
  | "PENDING_ANCHOR"
  | "NOT_ANCHORED"
  | "INTEGRITY_WARNING";

export type ProvenanceBadgeInput = {
  summary: ClientSafeProvenanceSummary | null;
  anchorStatus?: "CHAIN_ANCHORED" | "PENDING_ANCHOR" | "NONE" | "INTEGRITY_WARNING" | null;
  externalAnchoringConfigured?: boolean;
};

export type ProvenanceBadgeModel = {
  state: ProvenanceBadgeState;
  label: string;
  provenanceHashFull: string | null;
  provenanceHashShort: string | null;
  accountabilityStatement: string | null;
  deliveryPostureLabel: string | null;
  outcomePostureLabel: string | null;
  confidenceBands: Array<{ level: string; label: string; count: number }>;
  anchorStatusLabel: string;
  chainStatusLabel: string;
  externalAnchoringLabel: string;
  limitationNote: string;
};

const DELIVERY_LABEL: Record<string, string> = {
  DELIVERED: "Delivered",
  APPROVED: "Approved",
  PENDING: "Pending",
  UNKNOWN: "Not recorded",
};

const OUTCOME_LABEL: Record<string, string> = {
  RECORDED: "Recorded",
  PENDING: "Pending",
  UNKNOWN: "Not recorded",
};

const CONFIDENCE_LABEL: Record<string, string> = {
  OPERATOR_VERIFIED: "Operator-verified",
  THIRD_PARTY: "Third-party verified",
  SYSTEM_INFERRED: "System-inferred",
  USER_REPORTED: "User-reported",
};

const BADGE_LABEL: Record<ProvenanceBadgeState, string> = {
  CHAIN_ANCHORED: "Chain-anchored",
  HASH_VERIFIED: "Hash-verified",
  PENDING_ANCHOR: "Pending anchor",
  NOT_ANCHORED: "Not anchored",
  INTEGRITY_WARNING: "Integrity warning",
};

const ANCHOR_STATUS_LABEL: Record<ProvenanceBadgeState, string> = {
  CHAIN_ANCHORED: "Anchored in chain",
  HASH_VERIFIED: "Hash verified; not yet chain-anchored",
  PENDING_ANCHOR: "Anchor pending",
  NOT_ANCHORED: "Not anchored",
  INTEGRITY_WARNING: "Integrity mismatch detected",
};

const CHAIN_STATUS_LABEL: Record<ProvenanceBadgeState, string> = {
  CHAIN_ANCHORED: "Included in chain sequence",
  HASH_VERIFIED: "Not yet included in chain",
  PENDING_ANCHOR: "Not yet included in chain",
  NOT_ANCHORED: "No chain record",
  INTEGRITY_WARNING: "Chain integrity could not be confirmed",
};

const LIMITATION_NOTE =
  "This badge reflects the visible provenance chain of custody. Internal review notes, protected detail records, and participant identities are not exposed in this view.";

function deriveState(input: ProvenanceBadgeInput): ProvenanceBadgeState {
  if (input.anchorStatus === "INTEGRITY_WARNING") return "INTEGRITY_WARNING";
  if (!input.summary || !input.summary.provenanceHash) return "NOT_ANCHORED";
  if (input.anchorStatus === "CHAIN_ANCHORED") return "CHAIN_ANCHORED";
  if (input.anchorStatus === "PENDING_ANCHOR") return "PENDING_ANCHOR";
  return "HASH_VERIFIED";
}

function shortHash(hash: string, length = 12): string {
  if (hash.length <= length + 6) return hash;
  return `${hash.slice(0, length)}…`;
}

export function buildProvenanceBadgeModel(input: ProvenanceBadgeInput): ProvenanceBadgeModel {
  const state = deriveState(input);
  const { summary, externalAnchoringConfigured } = input;

  const provenanceHashFull = summary?.provenanceHash ?? null;
  const provenanceHashShort = provenanceHashFull ? shortHash(provenanceHashFull) : null;

  const confidenceBands = (summary?.confidenceBands ?? []).map((band: ClientSafeConfidenceBand) => ({
    level: band.level,
    label: CONFIDENCE_LABEL[band.level] ?? band.level,
    count: band.count,
  }));

  return {
    state,
    label: BADGE_LABEL[state],
    provenanceHashFull,
    provenanceHashShort,
    accountabilityStatement: summary?.accountabilityStatement ?? null,
    deliveryPostureLabel: summary
      ? (DELIVERY_LABEL[summary.deliveryPosture] ?? summary.deliveryPosture)
      : null,
    outcomePostureLabel: summary
      ? (OUTCOME_LABEL[summary.outcomePosture] ?? summary.outcomePosture)
      : null,
    confidenceBands,
    anchorStatusLabel: ANCHOR_STATUS_LABEL[state],
    chainStatusLabel: CHAIN_STATUS_LABEL[state],
    externalAnchoringLabel: externalAnchoringConfigured
      ? "External anchoring registered"
      : "External anchoring not configured",
    limitationNote: LIMITATION_NOTE,
  };
}
