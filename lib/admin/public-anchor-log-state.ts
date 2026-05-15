export type PublicAnchorLogState = {
  publicRootsCount: number;
  latestPublicRootAt?: string | null;
  internalAnchoringAvailable: boolean | null;
  externalAnchoringConfigured: false;
  publicationBoundary: string;
};

export type PublicAnchorEntry = {
  version: number;
  scope: string;
  merkleRoot: string;
  leafCount: number;
  computedAt: string;
  /** Chain hash (sha256 commitment over safe chain fields). Safe to publish — does not contain subject IDs. */
  chainHash?: string | null;
};

export type PublicAnchorPublicationRow = {
  metadata: unknown;
  createdAt: Date;
};

export function buildPublicAnchorLogState(input: {
  publicRootsCount: number;
  latestPublicRootAt?: string | null;
  internalAnchoringAvailable: boolean | null;
}): PublicAnchorLogState {
  return {
    publicRootsCount: Math.max(0, input.publicRootsCount),
    latestPublicRootAt: input.latestPublicRootAt ?? null,
    internalAnchoringAvailable: input.internalAnchoringAvailable,
    externalAnchoringConfigured: false,
    publicationBoundary:
      "This page only shows roots deliberately published to the public anchor log. It does not expose the internal chain ledger.",
  };
}

export function toPublicAnchorEntries(rows: PublicAnchorPublicationRow[]): PublicAnchorEntry[] {
  return rows
    .map((row) => {
      const meta = row.metadata && typeof row.metadata === "object"
        ? (row.metadata as Record<string, unknown>)
        : {};
      const merkleRoot = typeof meta.merkleRoot === "string" ? meta.merkleRoot : null;
      if (!merkleRoot) return null;

      return {
        version: typeof meta.version === "number" ? meta.version : 1,
        scope: typeof meta.scope === "string" ? meta.scope : "UNKNOWN",
        merkleRoot,
        leafCount: typeof meta.leafCount === "number" ? meta.leafCount : 0,
        computedAt: typeof meta.computedAt === "string"
          ? meta.computedAt
          : row.createdAt.toISOString(),
        chainHash: typeof meta.chainHash === "string" ? meta.chainHash : null,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null) as PublicAnchorEntry[];
}
