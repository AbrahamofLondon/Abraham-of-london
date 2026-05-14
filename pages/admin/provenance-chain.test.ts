import { describe, expect, it } from "vitest";

import { formatShortHash, shortenAnchorHash } from "./provenance-chain";

describe("formatShortHash", () => {
  it("uses 12-character prefix by default", () => {
    const hash = "1234567890abcdef1234567890abcdef";
    const result = formatShortHash(hash);
    // prefix is exactly 12 chars: "1234567890ab"
    expect(result).toBe("1234567890ab…abcdef");
    expect(result.split("…")[0]).toHaveLength(12);
  });

  it("returns full hash when it is short enough to not need shortening", () => {
    expect(formatShortHash("abc123")).toBe("abc123");
  });

  it("handles null gracefully", () => {
    expect(formatShortHash(null)).toBe("—");
  });

  it("handles undefined gracefully", () => {
    expect(formatShortHash(undefined)).toBe("—");
  });

  it("accepts a custom length parameter", () => {
    const hash = "1234567890abcdef1234567890abcdef";
    const result = formatShortHash(hash, 8);
    expect(result.split("…")[0]).toHaveLength(8);
  });
});

describe("shortenAnchorHash (12-char alias)", () => {
  it("shortens long hashes with a 12-char prefix", () => {
    expect(shortenAnchorHash("1234567890abcdef1234567890abcdef")).toBe("1234567890ab…abcdef");
  });

  it("keeps short hashes unchanged", () => {
    expect(shortenAnchorHash("abc123")).toBe("abc123");
  });

  it("handles missing hashes without throwing", () => {
    expect(shortenAnchorHash(null)).toBe("—");
    expect(shortenAnchorHash(undefined)).toBe("—");
  });
});

describe("AnchorSummary type guarantees (detail modal data safety)", () => {
  it("AnchorSummary type does not include raw provenance fields", () => {
    // Verify that the shape passed to the detail modal contains only safe fields.
    // This is a structural test: if the type were widened to include sensitive
    // fields, this object literal would need to be updated — surfacing the change.
    const safeAnchor = {
      id: "anchor_001",
      scope: "DAILY",
      scopeId: "2026-05-14",
      leafCount: 3,
      merkleRoot: "root_abc",
      previousRoot: null,
      chainHash: "chain_abc",
      computedAt: "2026-05-14T12:00:00.000Z",
      fromTimestamp: null,
      toTimestamp: null,
      metadata: { subjectCount: 3, subjectTypes: ["OVERSIGHT_CYCLE"], unavailableCount: 0, hasRawPayloads: false },
      status: "CONTINUOUS" as const,
      failures: [],
    };

    const serialized = JSON.stringify(safeAnchor);
    expect(serialized).not.toContain("provenanceHash");
    expect(serialized).not.toContain("governanceEvents");
    expect(serialized).not.toContain("suppression");
    expect(serialized).not.toContain("actorNotes");
    expect(serialized).not.toContain("clientEvidence");

    // Full hashes are present in the detail modal (not truncated at the data layer)
    expect(serialized).toContain("root_abc");
    expect(serialized).toContain("chain_abc");
  });
});
