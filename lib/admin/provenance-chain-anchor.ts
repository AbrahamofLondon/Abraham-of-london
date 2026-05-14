/**
 * lib/admin/provenance-chain-anchor.ts
 *
 * v1 provenance chain anchor — Merkle root computation over a set of
 * provenance hashes. This is the foundation for batch-level integrity
 * verification without external anchoring.
 *
 * A Merkle root commits to an entire set of provenance records. Any change
 * to any record in the set changes the root. This enables:
 * - Daily batch integrity: all records created in a UTC day share one root
 * - Account-level integrity: all records for an account share one root
 * - Cycle-batch integrity: all records in a cycle share one root
 *
 * v1 scope: computation only. No external storage, no public API, no
 * blockchain anchoring. The root can be stored in existing AuditEvent
 * metadata or a future dedicated model.
 */

import { createHash } from "crypto";

// ─── Types ─────────────────────────────────────────────────────────────────

export type ProvenanceChainLeaf = {
  subjectType: string;
  subjectId: string;
  provenanceHash: string;
  computedAt?: string | null;
};

export type ProvenanceChainAnchor = {
  version: 1;
  scope: "DAILY" | "ACCOUNT" | "ORGANISATION" | "CYCLE_BATCH";
  scopeId: string;
  leafCount: number;
  merkleRoot: string;
  leaves: ProvenanceChainLeaf[];
  computedAt: string;
};

export type ProvenanceChainAnchorResult =
  | { ok: true; anchor: ProvenanceChainAnchor }
  | { ok: false; reason: string };

// ─── Helpers ───────────────────────────────────────────────────────────────

function hashLeaf(leaf: ProvenanceChainLeaf): string {
  return createHash("sha256")
    .update(`${leaf.subjectType}::${leaf.subjectId}::${leaf.provenanceHash}`)
    .digest("hex");
}

function sortLeaves(leaves: ProvenanceChainLeaf[]): ProvenanceChainLeaf[] {
  return [...leaves].sort((a, b) => {
    const typeCmp = a.subjectType.localeCompare(b.subjectType);
    if (typeCmp !== 0) return typeCmp;
    const idCmp = a.subjectId.localeCompare(b.subjectId);
    if (idCmp !== 0) return idCmp;
    return a.provenanceHash.localeCompare(b.provenanceHash);
  });
}

/**
 * Build a Merkle root from a set of leaf hashes.
 *
 * Algorithm:
 * 1. Sort leaf hashes deterministically
 * 2. Pair adjacent hashes and concatenate + hash to form the next level
 * 3. Repeat until a single hash remains (the Merkle root)
 * 4. Odd-numbered levels: the last unpaired hash is promoted to the next level
 *
 * This is a standard binary Merkle tree. Not sparse, not sorted-leaf-optimised.
 * Suitable for v1 batch sizes (up to thousands of leaves, not millions).
 */
export function buildMerkleRoot(leafHashes: string[]): string | null {
  if (leafHashes.length === 0) return null;

  let level = [...leafHashes].sort();

  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        const left = level[i]!;
        const right = level[i + 1]!;
        const combined = `${left}${right}`;
        nextLevel.push(createHash("sha256").update(combined).digest("hex"));
      } else {
        // Odd number of nodes — promote the last one
        nextLevel.push(level[i]!);
      }
    }
    level = nextLevel;
  }

  return level[0]!;
}

/**
 * Build a Merkle root from provenance chain leaves.
 * Leaves are sorted deterministically before hashing.
 */
export function buildProvenanceMerkleRoot(leaves: ProvenanceChainLeaf[]): string | null {
  if (leaves.length === 0) return null;

  const sorted = sortLeaves(leaves);
  const leafHashes = sorted.map(hashLeaf);

  return buildMerkleRoot(leafHashes);
}

/**
 * Build a full provenance chain anchor with scope metadata.
 */
export function buildProvenanceChainAnchor(input: {
  scope: ProvenanceChainAnchor["scope"];
  scopeId: string;
  leaves: ProvenanceChainLeaf[];
}): ProvenanceChainAnchorResult {
  if (input.leaves.length === 0) {
    return {
      ok: false,
      reason: `Cannot build provenance chain anchor for scope ${input.scope}/${input.scopeId}: no leaves provided.`,
    };
  }

  const sorted = sortLeaves(input.leaves);
  const merkleRoot = buildProvenanceMerkleRoot(sorted);

  if (!merkleRoot) {
    return {
      ok: false,
      reason: `Cannot build provenance chain anchor for scope ${input.scope}/${input.scopeId}: Merkle root computation returned null.`,
    };
  }

  return {
    ok: true,
    anchor: {
      version: 1,
      scope: input.scope,
      scopeId: input.scopeId,
      leafCount: sorted.length,
      merkleRoot,
      leaves: sorted,
      computedAt: new Date().toISOString(),
    },
  };
}

/**
 * Verify that a specific leaf is included in a provenance chain anchor.
 *
 * This is a simple inclusion check: the leaf's hash must appear in the
 * anchor's leaf set. A full Merkle proof (path from leaf to root) is not
 * implemented in v1 — the anchor includes all leaves, so inclusion is
 * checked by hash membership.
 *
 * For v2, a Merkle proof path should be generated and stored alongside
 * the anchor so that inclusion can be verified without the full leaf set.
 */
export function verifyProvenanceInclusion(
  anchor: ProvenanceChainAnchor,
  leaf: ProvenanceChainLeaf,
): boolean {
  const leafHash = hashLeaf(leaf);
  return anchor.leaves.some((l) => hashLeaf(l) === leafHash);
}

/**
 * Verify that the anchor's Merkle root is consistent with its leaves.
 * Recomputes the root from the stored leaves and compares.
 */
export function verifyAnchorIntegrity(anchor: ProvenanceChainAnchor): boolean {
  const recomputedRoot = buildProvenanceMerkleRoot(anchor.leaves);
  return recomputedRoot === anchor.merkleRoot;
}
