import { describe, expect, it } from "vitest";

import {
  buildExternalAnchorReceipt,
  buildNotConfiguredExternalAnchorReceipt,
  getConfiguredExternalAnchorProvider,
} from "@/lib/admin/provenance-external-anchor";

describe("provenance external anchor interface", () => {
  it("NONE provider returns NOT_CONFIGURED", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "root-123",
    });

    expect(getConfiguredExternalAnchorProvider()).toBe("NONE");
    expect(receipt.provider).toBe("NONE");
    expect(receipt.status).toBe("NOT_CONFIGURED");
  });

  it("preserves the Merkle root", () => {
    const receipt = buildNotConfiguredExternalAnchorReceipt({
      merkleRoot: "abc123",
    });

    expect(receipt.merkleRoot).toBe("abc123");
  });

  it("preserves chainHash if supplied", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "abc123",
      chainHash: "def456",
    });

    expect(receipt.chainHash).toBe("def456");
  });

  it("does not create a fake receipt id", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "root-123",
    });

    expect(receipt.receiptId).toBeNull();
  });

  it("does not create a fake confirmedAt", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "root-123",
    });

    expect(receipt.confirmedAt).toBeNull();
  });

  it("BLOCKCHAIN/RFC3161/WORM providers cannot return CONFIRMED without receipt evidence", () => {
    for (const provider of ["BLOCKCHAIN", "RFC3161", "WORM_OBJECT_STORAGE"] as const) {
      const receipt = buildExternalAnchorReceipt({
        provider,
        status: "CONFIRMED",
        merkleRoot: "root-123",
      });

      expect(receipt.status).not.toBe("CONFIRMED");
      expect(receipt.status).toBe("FAILED");
      expect(receipt.receiptId).toBeNull();
      expect(receipt.confirmedAt).toBeNull();
    }
  });

  it("allows CONFIRMED only when receipt evidence is supplied", () => {
    const receipt = buildExternalAnchorReceipt({
      provider: "RFC3161",
      status: "CONFIRMED",
      merkleRoot: "root-123",
      chainHash: "chain-123",
      submittedAt: "2026-05-14T12:00:00.000Z",
      confirmedAt: "2026-05-14T12:01:00.000Z",
      receiptPayloadHash: "payload-hash",
    });

    expect(receipt.status).toBe("CONFIRMED");
    expect(receipt.receiptPayloadHash).toBe("payload-hash");
    expect(receipt.confirmedAt).toBe("2026-05-14T12:01:00.000Z");
  });

  it("rejects invalid or empty merkleRoot", () => {
    expect(() => buildExternalAnchorReceipt({ merkleRoot: "" })).toThrow("merkleRoot is required");
    expect(() => buildNotConfiguredExternalAnchorReceipt({ merkleRoot: "   " })).toThrow("merkleRoot is required");
  });

  it("message does not claim external immutability", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "root-123",
    });

    expect(receipt.message).toBe(
      "External anchoring is not configured. Internal chain anchoring remains available.",
    );
    expect(receipt.message.toLowerCase()).not.toContain("externally immutable");
    expect(receipt.message.toLowerCase()).not.toContain("worm retained");
    expect(receipt.message.toLowerCase()).not.toContain("blockchain secured");
  });
});
