/**
 * Future external anchoring interface for provenance chain roots.
 *
 * v1 is deliberately not connected to RFC3161, WORM storage, or blockchain
 * providers. It records the shape of a future receipt without claiming an
 * external confirmation that does not exist.
 */

export type ExternalAnchorProvider = "NONE" | "RFC3161" | "WORM_OBJECT_STORAGE" | "BLOCKCHAIN";

export type ExternalAnchorStatus = "NOT_CONFIGURED" | "PENDING" | "CONFIRMED" | "FAILED";

export type ExternalAnchorReceipt = {
  version: 1;
  provider: ExternalAnchorProvider;
  status: ExternalAnchorStatus;
  merkleRoot: string;
  chainHash?: string | null;
  scope?: string | null;
  scopeId?: string | null;
  requestedAt: string;
  message: string;
  receiptId?: string;
  confirmedAt?: string;
};

export function getConfiguredExternalAnchorProvider(): ExternalAnchorProvider {
  return "NONE";
}

export function buildExternalAnchorReceipt(input: {
  merkleRoot: string;
  chainHash?: string | null;
  scope?: string | null;
  scopeId?: string | null;
  requestedAt?: string | null;
}): ExternalAnchorReceipt {
  return {
    version: 1,
    provider: getConfiguredExternalAnchorProvider(),
    status: "NOT_CONFIGURED",
    merkleRoot: input.merkleRoot,
    chainHash: input.chainHash ?? null,
    scope: input.scope ?? null,
    scopeId: input.scopeId ?? null,
    requestedAt: input.requestedAt ?? new Date().toISOString(),
    message: "External anchoring is not configured. Internal chain anchor remains available.",
  };
}
