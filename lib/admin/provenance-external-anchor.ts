/**
 * Future external anchoring interface for provenance chain roots.
 *
 * v1 is deliberately not connected to RFC3161, WORM storage, or blockchain
 * providers. It records the shape of a future receipt without claiming an
 * external confirmation that does not exist.
 */

export type ExternalAnchorProvider = "NONE" | "RFC3161" | "WORM_OBJECT_STORAGE" | "BLOCKCHAIN";

export type ExternalAnchorStatus = "NOT_CONFIGURED" | "SUBMITTED" | "CONFIRMED" | "FAILED";

export type ExternalAnchorCapabilities = {
  internalChainAnchoringAvailable: boolean;
  externalAnchoringConfigured: boolean;
  rfc3161TimestampingAvailable: boolean;
  wormObjectStorageAvailable: boolean;
  blockchainAnchoringAvailable: boolean;
  canSubmitExternalAnchor: boolean;
  canConfirmExternalAnchor: boolean;
  publicVerificationAvailable: boolean;
};

export type ExternalAnchorReceipt = {
  version: 1;
  provider: ExternalAnchorProvider;
  status: ExternalAnchorStatus;
  merkleRoot: string;
  chainHash?: string | null;
  submittedAt?: string | null;
  confirmedAt?: string | null;
  receiptId?: string | null;
  receiptPayloadHash?: string | null;
  capabilities: ExternalAnchorCapabilities;
  message: string;
};

export function getConfiguredExternalAnchorProvider(): ExternalAnchorProvider {
  return "NONE";
}

export function getExternalAnchorCapabilities(
  provider: ExternalAnchorProvider = getConfiguredExternalAnchorProvider(),
): ExternalAnchorCapabilities {
  const externalAnchoringConfigured = provider !== "NONE";
  return {
    internalChainAnchoringAvailable: true,
    externalAnchoringConfigured,
    rfc3161TimestampingAvailable: provider === "RFC3161",
    wormObjectStorageAvailable: provider === "WORM_OBJECT_STORAGE",
    blockchainAnchoringAvailable: provider === "BLOCKCHAIN",
    canSubmitExternalAnchor: externalAnchoringConfigured,
    canConfirmExternalAnchor: externalAnchoringConfigured,
    publicVerificationAvailable: false,
  };
}

function clean(value?: string | null): string | null {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed || null;
}

function requireMerkleRoot(value: string): string {
  const merkleRoot = clean(value);
  if (!merkleRoot) {
    throw new Error("merkleRoot is required to build an external anchor receipt.");
  }
  return merkleRoot;
}

export function buildNotConfiguredExternalAnchorReceipt(input: {
  merkleRoot: string;
  chainHash?: string | null;
}): ExternalAnchorReceipt {
  return {
    version: 1,
    provider: "NONE",
    status: "NOT_CONFIGURED",
    merkleRoot: requireMerkleRoot(input.merkleRoot),
    chainHash: clean(input.chainHash),
    submittedAt: null,
    confirmedAt: null,
    receiptId: null,
    receiptPayloadHash: null,
    capabilities: getExternalAnchorCapabilities("NONE"),
    message: "External anchoring is not configured. Internal chain anchoring remains available.",
  };
}

export function buildExternalAnchorReceipt(input: {
  merkleRoot: string;
  chainHash?: string | null;
  provider?: ExternalAnchorProvider;
  status?: ExternalAnchorStatus;
  submittedAt?: string | null;
  confirmedAt?: string | null;
  receiptId?: string | null;
  receiptPayloadHash?: string | null;
}): ExternalAnchorReceipt {
  const provider = input.provider ?? getConfiguredExternalAnchorProvider();
  if (provider === "NONE") {
    return buildNotConfiguredExternalAnchorReceipt(input);
  }

  const merkleRoot = requireMerkleRoot(input.merkleRoot);
  const receiptId = clean(input.receiptId);
  const receiptPayloadHash = clean(input.receiptPayloadHash);
  const confirmedAt = clean(input.confirmedAt);
  const requestedStatus = input.status ?? "SUBMITTED";

  if (requestedStatus === "CONFIRMED" && (!confirmedAt || (!receiptId && !receiptPayloadHash))) {
    return {
      version: 1,
      provider,
      status: "FAILED",
      merkleRoot,
      chainHash: clean(input.chainHash),
      submittedAt: clean(input.submittedAt),
      confirmedAt: null,
      receiptId: null,
      receiptPayloadHash: null,
      capabilities: getExternalAnchorCapabilities(provider),
      message: "External anchor confirmation cannot be recorded without receipt evidence.",
    };
  }

  return {
    version: 1,
    provider,
    status: requestedStatus,
    merkleRoot,
    chainHash: clean(input.chainHash),
    submittedAt: clean(input.submittedAt),
    confirmedAt: requestedStatus === "CONFIRMED" ? confirmedAt : null,
    receiptId: receiptId,
    receiptPayloadHash: receiptPayloadHash,
    capabilities: getExternalAnchorCapabilities(provider),
    message: requestedStatus === "CONFIRMED"
      ? "External anchor confirmation recorded from supplied receipt evidence."
      : "External anchor receipt prepared. No external immutability claim is made by this interface.",
  };
}
