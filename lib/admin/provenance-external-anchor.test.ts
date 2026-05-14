import { describe, expect, it } from "vitest";

import {
  buildExternalAnchorReceipt,
  getConfiguredExternalAnchorProvider,
} from "@/lib/admin/provenance-external-anchor";

describe("provenance external anchor interface", () => {
  it("returns NONE as the configured provider in v1", () => {
    expect(getConfiguredExternalAnchorProvider()).toBe("NONE");
  });

  it("returns NOT_CONFIGURED without claiming external confirmation", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "root-123",
      requestedAt: "2026-05-14T12:00:00.000Z",
    });

    expect(receipt.provider).toBe("NONE");
    expect(receipt.status).toBe("NOT_CONFIGURED");
    expect(receipt.confirmedAt).toBeUndefined();
    expect(receipt.message).toBe(
      "External anchoring is not configured. Internal chain anchor remains available.",
    );
  });

  it("preserves the Merkle root and optional chain context", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "abc123",
      chainHash: "def456",
      scope: "DAILY",
      scopeId: "2026-05-14",
      requestedAt: "2026-05-14T12:00:00.000Z",
    });

    expect(receipt.merkleRoot).toBe("abc123");
    expect(receipt.chainHash).toBe("def456");
    expect(receipt.scope).toBe("DAILY");
    expect(receipt.scopeId).toBe("2026-05-14");
  });

  it("does not create a fake receipt id", () => {
    const receipt = buildExternalAnchorReceipt({
      merkleRoot: "root-123",
      requestedAt: "2026-05-14T12:00:00.000Z",
    });

    expect(receipt.receiptId).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(receipt, "receiptId")).toBe(false);
  });
});
