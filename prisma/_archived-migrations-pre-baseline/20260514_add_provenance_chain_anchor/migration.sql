-- Internal provenance chain anchor ledger.
-- Stores scoped Merkle roots and previous-root linkage only.
-- Does not store raw DecisionProvenanceRecord payloads.

CREATE TABLE "ProvenanceChainAnchor" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "scope" TEXT NOT NULL,
    "scopeId" TEXT NOT NULL,
    "anchorType" TEXT NOT NULL DEFAULT 'MERKLE_ROOT',
    "leafCount" INTEGER NOT NULL,
    "merkleRoot" TEXT NOT NULL,
    "previousRoot" TEXT,
    "chainHash" TEXT NOT NULL,
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fromTimestamp" TIMESTAMP(3),
    "toTimestamp" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProvenanceChainAnchor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProvenanceChainAnchor_scope_scopeId_idx" ON "ProvenanceChainAnchor"("scope", "scopeId");
CREATE INDEX "ProvenanceChainAnchor_scope_scopeId_computedAt_idx" ON "ProvenanceChainAnchor"("scope", "scopeId", "computedAt");
CREATE INDEX "ProvenanceChainAnchor_merkleRoot_idx" ON "ProvenanceChainAnchor"("merkleRoot");
CREATE INDEX "ProvenanceChainAnchor_chainHash_idx" ON "ProvenanceChainAnchor"("chainHash");
