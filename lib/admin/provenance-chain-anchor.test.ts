/**
 * Tests for provenance chain anchor — Merkle root computation and verification.
 */

import { describe, expect, it } from "vitest";

import {
  buildMerkleRoot,
  buildProvenanceChainAnchor,
  buildProvenanceMerkleRoot,
  verifyAnchorIntegrity,
  verifyProvenanceInclusion,
  type ProvenanceChainLeaf,
} from "./provenance-chain-anchor";

function leaf(overrides: Partial<ProvenanceChainLeaf> = {}): ProvenanceChainLeaf {
  return {
    subjectType: "OVERSIGHT_CYCLE",
    subjectId: "cycle_001",
    provenanceHash: "abc123def456",
    computedAt: "2026-05-14T12:00:00.000Z",
    ...overrides,
  };
}

describe("buildMerkleRoot", () => {
  it("returns null for empty leaf list", () => {
    expect(buildMerkleRoot([])).toBeNull();
  });

  it("returns the hash of a single leaf (promoted directly)", () => {
    const root = buildMerkleRoot(["hash_a"]);
    expect(root).toBe("hash_a");
  });

  it("produces a deterministic root for the same hashes", () => {
    const hashes = ["hash_a", "hash_b", "hash_c"];
    const rootA = buildMerkleRoot(hashes);
    const rootB = buildMerkleRoot(hashes);
    expect(rootA).toBe(rootB);
  });

  it("produces the same root regardless of input order", () => {
    const hashesA = ["hash_a", "hash_b", "hash_c"];
    const hashesB = ["hash_c", "hash_a", "hash_b"];
    expect(buildMerkleRoot(hashesA)).toBe(buildMerkleRoot(hashesB));
  });

  it("produces a different root when a hash changes", () => {
    const hashesA = ["hash_a", "hash_b", "hash_c"];
    const hashesB = ["hash_a", "hash_b", "hash_d"];
    expect(buildMerkleRoot(hashesA)).not.toBe(buildMerkleRoot(hashesB));
  });

  it("handles duplicate hashes deterministically", () => {
    const hashes = ["hash_a", "hash_a", "hash_b"];
    const rootA = buildMerkleRoot(hashes);
    const rootB = buildMerkleRoot([...hashes].reverse());
    expect(rootA).toBe(rootB);
  });

  it("handles even number of leaves", () => {
    const hashes = ["hash_a", "hash_b", "hash_c", "hash_d"];
    const root = buildMerkleRoot(hashes);
    expect(root).toBeTruthy();
    expect(root!.length).toBe(64);
  });

  it("handles odd number of leaves (promotes last)", () => {
    const hashes = ["hash_a", "hash_b", "hash_c"];
    const root = buildMerkleRoot(hashes);
    expect(root).toBeTruthy();
    expect(root!.length).toBe(64);
  });
});

describe("buildProvenanceMerkleRoot", () => {
  it("returns null for empty leaves", () => {
    expect(buildProvenanceMerkleRoot([])).toBeNull();
  });

  it("produces deterministic root for same leaves regardless of order", () => {
    const leavesA = [
      leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
      leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
    ];
    const leavesB = [
      leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
      leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
    ];
    expect(buildProvenanceMerkleRoot(leavesA)).toBe(buildProvenanceMerkleRoot(leavesB));
  });

  it("produces different root when a leaf hash changes", () => {
    const leavesA = [
      leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
      leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
    ];
    const leavesB = [
      leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
      leaf({ subjectId: "cycle_002", provenanceHash: "hash_c" }),
    ];
    expect(buildProvenanceMerkleRoot(leavesA)).not.toBe(buildProvenanceMerkleRoot(leavesB));
  });
});

describe("buildProvenanceChainAnchor", () => {
  it("returns ok:false for empty leaves", () => {
    const result = buildProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain("no leaves provided");
    }
  });

  it("returns ok:true with anchor for valid leaves", () => {
    const result = buildProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [
        leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
        leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.anchor.version).toBe(1);
      expect(result.anchor.scope).toBe("DAILY");
      expect(result.anchor.scopeId).toBe("2026-05-14");
      expect(result.anchor.leafCount).toBe(2);
      expect(result.anchor.merkleRoot).toBeTruthy();
      expect(result.anchor.merkleRoot.length).toBe(64);
      expect(result.anchor.computedAt).toBeTruthy();
    }
  });

  it("includes sorted leaves in the anchor", () => {
    const result = buildProvenanceChainAnchor({
      scope: "CYCLE_BATCH",
      scopeId: "cycle_batch_001",
      leaves: [
        leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
        leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.anchor.leaves[0]?.subjectId).toBe("cycle_001");
      expect(result.anchor.leaves[1]?.subjectId).toBe("cycle_002");
    }
  });

  it("supports all scope types", () => {
    for (const scope of ["DAILY", "ACCOUNT", "ORGANISATION", "CYCLE_BATCH"] as const) {
      const result = buildProvenanceChainAnchor({
        scope,
        scopeId: "test_scope",
        leaves: [leaf()],
      });
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.anchor.scope).toBe(scope);
      }
    }
  });
});

describe("verifyProvenanceInclusion", () => {
  it("returns true when leaf is in the anchor", () => {
    const targetLeaf = leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" });
    const result = buildProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [
        targetLeaf,
        leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(verifyProvenanceInclusion(result.anchor, targetLeaf)).toBe(true);
    }
  });

  it("returns false when leaf is not in the anchor", () => {
    const result = buildProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [
        leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const differentLeaf = leaf({ subjectId: "cycle_999", provenanceHash: "hash_unknown" });
      expect(verifyProvenanceInclusion(result.anchor, differentLeaf)).toBe(false);
    }
  });

  it("inclusion check is hash-based, not reference-based", () => {
    const targetLeaf = leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" });
    const result = buildProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [targetLeaf],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      // Same data, different object reference
      const sameLeaf = leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" });
      expect(verifyProvenanceInclusion(result.anchor, sameLeaf)).toBe(true);
    }
  });
});

describe("verifyAnchorIntegrity", () => {
  it("returns true when anchor root matches recomputed root", () => {
    const result = buildProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [
        leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
        leaf({ subjectId: "cycle_002", provenanceHash: "hash_b" }),
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(verifyAnchorIntegrity(result.anchor)).toBe(true);
    }
  });

  it("returns false when anchor root does not match recomputed root", () => {
    const result = buildProvenanceChainAnchor({
      scope: "DAILY",
      scopeId: "2026-05-14",
      leaves: [
        leaf({ subjectId: "cycle_001", provenanceHash: "hash_a" }),
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const tampered = { ...result.anchor, merkleRoot: "tampered_root" };
      expect(verifyAnchorIntegrity(tampered)).toBe(false);
    }
  });
});
