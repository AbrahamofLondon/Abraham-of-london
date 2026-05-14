import { describe, expect, it } from "vitest";

import type { ClientSafeProvenanceSummary } from "@/lib/product/client-safe-provenance-contract";
import { buildProvenanceBadgeModel } from "@/lib/product/client-safe-provenance-badge";

function summary(overrides: Partial<ClientSafeProvenanceSummary> = {}): ClientSafeProvenanceSummary {
  return {
    version: 1,
    subjectId: "cycle_001",
    accountabilityStatement:
      "3 evidence inputs captured; 1 operator review completed; delivery sent; outcome recorded.",
    provenanceHash: "deadbeef1234567890abcdef",
    deliveryPosture: "DELIVERED",
    outcomePosture: "RECORDED",
    gapCount: 0,
    gapClasses: [],
    confidenceBands: [
      { level: "OPERATOR_VERIFIED", count: 2 },
      { level: "USER_REPORTED", count: 1 },
    ],
    timelineSummary: [
      { milestone: "EVIDENCE_CAPTURED", label: "Evidence captured", occurredAt: "2026-05-01T09:00:00.000Z" },
      { milestone: "DELIVERY_SENT", label: "Oversight brief delivered", occurredAt: "2026-05-04T09:00:00.000Z" },
    ],
    composedAt: "2026-05-14T12:00:00.000Z",
    ...overrides,
  };
}

// ─── Badge state derivation ────────────────────────────────────────────────────

describe("buildProvenanceBadgeModel — state derivation", () => {
  it("derives NOT_ANCHORED when summary is null", () => {
    const model = buildProvenanceBadgeModel({ summary: null });
    expect(model.state).toBe("NOT_ANCHORED");
    expect(model.label).toBe("Not anchored");
  });

  it("derives NOT_ANCHORED when provenanceHash is empty", () => {
    const model = buildProvenanceBadgeModel({ summary: summary({ provenanceHash: "" }) });
    expect(model.state).toBe("NOT_ANCHORED");
  });

  it("derives HASH_VERIFIED when summary has a hash and no anchorStatus", () => {
    const model = buildProvenanceBadgeModel({ summary: summary() });
    expect(model.state).toBe("HASH_VERIFIED");
    expect(model.label).toBe("Hash-verified");
  });

  it("derives CHAIN_ANCHORED when anchorStatus is CHAIN_ANCHORED", () => {
    const model = buildProvenanceBadgeModel({ summary: summary(), anchorStatus: "CHAIN_ANCHORED" });
    expect(model.state).toBe("CHAIN_ANCHORED");
    expect(model.label).toBe("Chain-anchored");
  });

  it("derives PENDING_ANCHOR when anchorStatus is PENDING_ANCHOR", () => {
    const model = buildProvenanceBadgeModel({ summary: summary(), anchorStatus: "PENDING_ANCHOR" });
    expect(model.state).toBe("PENDING_ANCHOR");
    expect(model.label).toBe("Pending anchor");
  });

  it("derives INTEGRITY_WARNING when anchorStatus is INTEGRITY_WARNING regardless of summary", () => {
    const model = buildProvenanceBadgeModel({ summary: summary(), anchorStatus: "INTEGRITY_WARNING" });
    expect(model.state).toBe("INTEGRITY_WARNING");
    expect(model.label).toBe("Integrity warning");
  });

  it("derives INTEGRITY_WARNING even when summary is null", () => {
    const model = buildProvenanceBadgeModel({ summary: null, anchorStatus: "INTEGRITY_WARNING" });
    expect(model.state).toBe("INTEGRITY_WARNING");
  });
});

// ─── Hash exposure ─────────────────────────────────────────────────────────────

describe("buildProvenanceBadgeModel — provenance hash", () => {
  it("exposes provenanceHashFull for copy affordance", () => {
    const hash = "deadbeef1234567890abcdef";
    const model = buildProvenanceBadgeModel({ summary: summary({ provenanceHash: hash }) });
    expect(model.provenanceHashFull).toBe(hash);
  });

  it("exposes provenanceHashShort as 12-char prefix with ellipsis for display", () => {
    const model = buildProvenanceBadgeModel({ summary: summary({ provenanceHash: "deadbeef1234567890abcdef" }) });
    expect(model.provenanceHashShort).toBe("deadbeef1234…");
  });

  it("provenanceHashShort does not equal provenanceHashFull for a long hash", () => {
    const hash = "deadbeef1234567890abcdef";
    const model = buildProvenanceBadgeModel({ summary: summary({ provenanceHash: hash }) });
    expect(model.provenanceHashShort).not.toBe(hash);
  });

  it("returns null hashes when summary is null", () => {
    const model = buildProvenanceBadgeModel({ summary: null });
    expect(model.provenanceHashFull).toBeNull();
    expect(model.provenanceHashShort).toBeNull();
  });
});

// ─── Raw event isolation ───────────────────────────────────────────────────────

describe("buildProvenanceBadgeModel — raw event isolation", () => {
  it("model does not contain governanceEvents, evidenceInputs, or timeline", () => {
    const model = buildProvenanceBadgeModel({ summary: summary() });
    const serialized = JSON.stringify(model);
    expect(serialized).not.toContain("governanceEvents");
    expect(serialized).not.toContain("evidenceInputs");
    expect(serialized).not.toContain("currentPosture");
    expect(serialized).not.toContain("unavailableSources");
  });

  it("model does not expose suppression field names as JSON keys", () => {
    const model = buildProvenanceBadgeModel({ summary: summary() });
    const serialized = JSON.stringify(model);
    // Check for JSON key forms (with colon) to avoid false positives from plain-English text
    expect(serialized).not.toContain('"suppression":');
    expect(serialized).not.toContain('"suppressionDetails":');
    expect(serialized).not.toContain('"actorNotes":');
    expect(serialized).not.toContain('"actorId":');
    expect(serialized).not.toContain('"clientEvidence":');
  });

  it("timelineSummary is not re-exposed in the badge model", () => {
    const model = buildProvenanceBadgeModel({ summary: summary() });
    const serialized = JSON.stringify(model);
    expect(serialized).not.toContain("timelineSummary");
    expect(serialized).not.toContain("EVIDENCE_CAPTURED");
  });
});

// ─── External anchoring ────────────────────────────────────────────────────────

describe("buildProvenanceBadgeModel — external anchoring", () => {
  it("shows 'not configured' honestly when externalAnchoringConfigured is false (default)", () => {
    const model = buildProvenanceBadgeModel({ summary: summary() });
    expect(model.externalAnchoringLabel).toContain("not configured");
  });

  it("shows 'not configured' when externalAnchoringConfigured is explicitly false", () => {
    const model = buildProvenanceBadgeModel({ summary: summary(), externalAnchoringConfigured: false });
    expect(model.externalAnchoringLabel).toBe("External anchoring not configured");
  });

  it("shows 'registered' when externalAnchoringConfigured is true", () => {
    const model = buildProvenanceBadgeModel({ summary: summary(), externalAnchoringConfigured: true });
    expect(model.externalAnchoringLabel).toBe("External anchoring registered");
  });
});

// ─── Integrity warning ─────────────────────────────────────────────────────────

describe("buildProvenanceBadgeModel — integrity warning", () => {
  it("anchorStatusLabel signals mismatch on INTEGRITY_WARNING", () => {
    const model = buildProvenanceBadgeModel({ summary: summary(), anchorStatus: "INTEGRITY_WARNING" });
    expect(model.anchorStatusLabel.toLowerCase()).toContain("mismatch");
  });

  it("chainStatusLabel signals confirmation failure on INTEGRITY_WARNING", () => {
    const model = buildProvenanceBadgeModel({ summary: summary(), anchorStatus: "INTEGRITY_WARNING" });
    expect(model.chainStatusLabel.toLowerCase()).toContain("could not be confirmed");
  });

  it("INTEGRITY_WARNING label does not leak suppression or internal field names as JSON keys", () => {
    const model = buildProvenanceBadgeModel({ summary: null, anchorStatus: "INTEGRITY_WARNING" });
    const serialized = JSON.stringify(model);
    expect(serialized).not.toContain('"suppression":');
    expect(serialized).not.toContain('"actorNotes":');
    expect(serialized).not.toContain('"governanceEvents":');
  });
});

// ─── Confidence bands ─────────────────────────────────────────────────────────

describe("buildProvenanceBadgeModel — confidence bands", () => {
  it("maps confidence levels to human labels", () => {
    const model = buildProvenanceBadgeModel({ summary: summary() });
    const opv = model.confidenceBands.find((b) => b.level === "OPERATOR_VERIFIED");
    expect(opv?.label).toBe("Operator-verified");
    const usr = model.confidenceBands.find((b) => b.level === "USER_REPORTED");
    expect(usr?.label).toBe("User-reported");
  });

  it("returns empty confidenceBands array when summary is null", () => {
    const model = buildProvenanceBadgeModel({ summary: null });
    expect(model.confidenceBands).toHaveLength(0);
  });
});

// ─── Limitation note ───────────────────────────────────────────────────────────

describe("buildProvenanceBadgeModel — limitation note", () => {
  it("limitation note does not mention actor names, suppression, or admin paths", () => {
    const model = buildProvenanceBadgeModel({ summary: null });
    expect(model.limitationNote.toLowerCase()).not.toContain("actor name");
    expect(model.limitationNote.toLowerCase()).not.toContain("admin");
    expect(model.limitationNote.toLowerCase()).not.toContain("suppression field");
  });

  it("limitation note is present in all states", () => {
    const states = [null, summary()] as const;
    for (const s of states) {
      const model = buildProvenanceBadgeModel({ summary: s });
      expect(model.limitationNote).toBeTruthy();
    }
  });
});
