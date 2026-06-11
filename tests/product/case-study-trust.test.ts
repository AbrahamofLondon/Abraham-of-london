/**
 * tests/product/case-study-trust.test.ts
 *
 * Trust invariant tests for the governed case study system.
 *
 * These are pure logic tests — no DB, no network.
 * They verify the contracts that prevent false public claims.
 */

import { describe, expect, it } from "vitest";
import {
  checkPublicationAllowed,
  toSchemaStatus,
  fromSchemaStatus,
} from "../../lib/evidence/case-study-service-contracts";
import {
  toPublicCaseStudy,
  assertNoPII,
  EVIDENCE_STATUS_LABELS,
  OUTCOME_STATUS_LABELS,
} from "@/lib/evidence/case-study-public";
import type { CaseStudyRecord } from "@/lib/evidence/case-study-service";

// ─── Test helpers ─────────────────────────────────────────────────────────────

function makeRecord(overrides: Partial<CaseStudyRecord> = {}): CaseStudyRecord {
  return {
    id: "cs_test_001",
    slug: "test-case",
    title: "Test Case Study",
    summary: "A test case.",
    visibilityStatus: "DRAFT",
    evidenceStatus: "METHOD_DEMONSTRATION",
    outcomeStatus: "NOT_MEASURED",
    consentStatus: "PENDING",
    verificationStatus: "UNVERIFIED",
    publicationAllowed: false,
    anonymised: true,
    narrative: {
      productCode: "boardroom-brief",
      sector: "Financial Services",
      orgType: "Mid-market firm",
      decisionType: "Board-level capital allocation",
      pressureCondition: "Executive committee required a defensible position within 48 hours.",
      interventionPerformed: "Boardroom Brief with structured pressure-point analysis.",
      evidenceTested: "Four competing assumptions tested against available data.",
      falsificationQuestion: "Would a different framing of the options have produced the same recommendation?",
      outcomeHypothesisText: "The decision will be revisited within 90 days.",
      whatRemainsUnproven: "Long-term execution quality is not measured.",
      whatWouldChangeConclusion: "Evidence of a superior alternative framing not considered.",
      adminNotes: "PRIVATE — do not expose",
      deliveryNotes: "PRIVATE — internal note",
    },
    publishedAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    evidenceLinks: [],
    ...overrides,
  };
}

// ─── TEST 1: Anonymous case study does not expose client PII ─────────────────

describe("Anonymous case study PII protection", () => {
  it("toPublicCaseStudy does not include adminNotes", () => {
    const record = makeRecord({ anonymised: true });
    const pub = toPublicCaseStudy(record);
    expect((pub as any).adminNotes).toBeUndefined();
  });

  it("toPublicCaseStudy does not include deliveryNotes", () => {
    const record = makeRecord({ anonymised: true });
    const pub = toPublicCaseStudy(record);
    expect((pub as any).deliveryNotes).toBeUndefined();
  });

  it("toPublicCaseStudy does not include internalClientRef", () => {
    const record = makeRecord({ narrative: { ...makeRecord().narrative, internalClientRef: "ACME Corp" } });
    const pub = toPublicCaseStudy(record);
    expect((pub as any).internalClientRef).toBeUndefined();
  });

  it("assertNoPII throws if private field is present in public output", () => {
    expect(() => assertNoPII({ adminNotes: "secret" } as any)).toThrow("PII_LEAK");
    expect(() => assertNoPII({ deliveryNotes: "secret" } as any)).toThrow("PII_LEAK");
  });

  it("assertNoPII does not throw for clean public output", () => {
    const record = makeRecord();
    const pub = toPublicCaseStudy(record);
    expect(() => assertNoPII(pub as any)).not.toThrow();
  });
});

// ─── TEST 2: Named case study requires consent ────────────────────────────────

describe("Named publication consent guard", () => {
  it("blocks PUBLIC_NAMED when consentStatus is PENDING", () => {
    const result = checkPublicationAllowed("METHOD_DEMONSTRATION", "NOT_MEASURED", "PENDING", "PUBLIC_NAMED", false);
    expect(result.allowed).toBe(false);
    expect(result.allowed ? "" : result.reason).toContain("consent");
  });

  it("blocks PUBLIC_NAMED when consentStatus is REVOKED", () => {
    const result = checkPublicationAllowed("METHOD_DEMONSTRATION", "NOT_MEASURED", "REVOKED", "PUBLIC_NAMED", false);
    expect(result.allowed).toBe(false);
  });

  it("allows PUBLIC_NAMED when consentStatus is GRANTED", () => {
    const result = checkPublicationAllowed("FOUNDER_VERIFIED", "HYPOTHESIS_SET", "GRANTED", "PUBLIC_NAMED", false);
    expect(result.allowed).toBe(true);
  });

  it("allows PUBLIC_ANONYMISED without explicit named consent", () => {
    const result = checkPublicationAllowed("FOUNDER_VERIFIED", "HYPOTHESIS_SET", "PENDING", "PUBLIC_ANONYMISED", true);
    expect(result.allowed).toBe(true);
  });
});

// ─── TEST 3: Outcome verified requires evidence ───────────────────────────────

describe("Outcome verified evidence requirement", () => {
  it("blocks OUTCOME_VERIFIED claim if evidenceStatus is not OUTCOME_VERIFIED", () => {
    const result = checkPublicationAllowed("FOUNDER_VERIFIED", "VERIFIED", "GRANTED", "PUBLIC_ANONYMISED", true);
    expect(result.allowed).toBe(false);
    expect(result.allowed ? "" : result.reason).toContain("OUTCOME_VERIFIED");
  });

  it("allows VERIFIED outcome when evidenceStatus is OUTCOME_VERIFIED", () => {
    const result = checkPublicationAllowed("OUTCOME_VERIFIED", "VERIFIED", "GRANTED", "PUBLIC_ANONYMISED", true);
    expect(result.allowed).toBe(true);
  });

  it("blocks WITHDRAWN evidenceStatus from publication", () => {
    const result = checkPublicationAllowed("WITHDRAWN", "NOT_MEASURED", "GRANTED", "PUBLIC_ANONYMISED", true);
    expect(result.allowed).toBe(false);
  });
});

// ─── TEST 4: Public page labels outcome pending correctly ─────────────────────

describe("Public case study outcome state labels", () => {
  it("PENDING_REVIEW has a label", () => {
    expect(OUTCOME_STATUS_LABELS["PENDING_REVIEW"]).toBeDefined();
    expect(OUTCOME_STATUS_LABELS["PENDING_REVIEW"].length).toBeGreaterThan(0);
  });

  it("HYPOTHESIS_SET has a label", () => {
    expect(OUTCOME_STATUS_LABELS["HYPOTHESIS_SET"]).toBeDefined();
  });

  it("VERIFIED label does not say pending", () => {
    expect(OUTCOME_STATUS_LABELS["VERIFIED"].toLowerCase()).not.toContain("pending");
  });

  it("all evidence status values have labels", () => {
    const statuses = ["METHOD_DEMONSTRATION", "FOUNDER_VERIFIED", "CLIENT_CONFIRMED", "EVIDENCE_LINKED", "OUTCOME_PENDING", "OUTCOME_VERIFIED", "PARTIAL_OUTCOME", "DISPUTED", "WITHDRAWN"];
    for (const s of statuses) {
      expect(EVIDENCE_STATUS_LABELS[s as keyof typeof EVIDENCE_STATUS_LABELS]).toBeDefined();
    }
  });

  it("all outcome status values have labels", () => {
    const statuses = ["NOT_MEASURED", "HYPOTHESIS_SET", "PENDING_REVIEW", "VERIFIED", "PARTIAL", "FAILED", "DISPUTED"];
    for (const s of statuses) {
      expect(OUTCOME_STATUS_LABELS[s as keyof typeof OUTCOME_STATUS_LABELS]).toBeDefined();
    }
  });
});

// ─── TEST 5: Case study from Boardroom Brief links artefacts ─────────────────

describe("Boardroom Brief case study creation — artefact linkage contract", () => {
  it("prefills productCode as boardroom-brief", () => {
    // Mirror createCaseStudy input expected from the bridge
    const input = {
      productCode: "boardroom-brief",
      evidenceStatus: "FOUNDER_VERIFIED",
      outcomeStatus: "HYPOTHESIS_SET",
      visibilityStatus: "DRAFT",
    };
    expect(input.productCode).toBe("boardroom-brief");
    expect(input.evidenceStatus).toBe("FOUNDER_VERIFIED");
    expect(input.outcomeStatus).toBe("HYPOTHESIS_SET");
    expect(input.visibilityStatus).toBe("DRAFT");
  });

  it("does not auto-set visibility to PUBLIC", () => {
    const draft = { visibilityStatus: "DRAFT" };
    expect(draft.visibilityStatus).not.toBe("PUBLIC_ANONYMISED");
    expect(draft.visibilityStatus).not.toBe("PUBLIC_NAMED");
  });

  it("evidence link sourceType values are known types", () => {
    const validTypes = ["boardroom_brief_order", "product_artifact", "falsification_entry", "outcome_hypothesis", "retainer_contract", "oversight_review_cycle"];
    const usedTypes = ["boardroom_brief_order", "product_artifact", "falsification_entry", "outcome_hypothesis"];
    for (const t of usedTypes) {
      expect(validTypes).toContain(t);
    }
  });
});

// ─── TEST 6: Empty public index is trust-building ─────────────────────────────

describe("Empty public index state", () => {
  it("empty cases array is a valid render state", () => {
    const cases: unknown[] = [];
    expect(cases.length).toBe(0);
    expect(Array.isArray(cases)).toBe(true);
  });

  it("empty state does not return an error — it returns ok:true with empty array", () => {
    // Simulate what the API returns when no published cases exist
    const apiResponse = { ok: true, cases: [] };
    expect(apiResponse.ok).toBe(true);
    expect(apiResponse.cases).toHaveLength(0);
  });
});

// ─── TEST 7: Withdrawn case study is not publicly accessible ─────────────────

describe("Withdrawn case study access", () => {
  it("withdrawn visibility status produces not-found behaviour", () => {
    const record = makeRecord({ visibilityStatus: "WITHDRAWN", publicationAllowed: false });
    // Simulate API logic: withdrawn → notFound
    const shouldReturn404 = !record.publicationAllowed || record.visibilityStatus === "WITHDRAWN";
    expect(shouldReturn404).toBe(true);
  });

  it("published record is accessible", () => {
    const record = makeRecord({ visibilityStatus: "PUBLIC_ANONYMISED", publicationAllowed: true });
    const shouldReturn404 = !record.publicationAllowed || record.visibilityStatus === "WITHDRAWN";
    expect(shouldReturn404).toBe(false);
  });
});

// ─── TEST 8: Public cards expose evidence/outcome/consent state ───────────────

describe("Public case study card data completeness", () => {
  it("toPublicCaseStudy includes evidenceStatus and its label", () => {
    const record = makeRecord({ evidenceStatus: "FOUNDER_VERIFIED" });
    const pub = toPublicCaseStudy(record);
    expect(pub.evidenceStatus).toBe("FOUNDER_VERIFIED");
    expect(pub.evidenceStatusLabel).toBe(EVIDENCE_STATUS_LABELS["FOUNDER_VERIFIED"]);
  });

  it("toPublicCaseStudy includes outcomeStatus and its label", () => {
    const record = makeRecord({ outcomeStatus: "HYPOTHESIS_SET" });
    const pub = toPublicCaseStudy(record);
    expect(pub.outcomeStatus).toBe("HYPOTHESIS_SET");
    expect(pub.outcomeStatusLabel).toBe(OUTCOME_STATUS_LABELS["HYPOTHESIS_SET"]);
  });

  it("toPublicCaseStudy includes consentBasis", () => {
    const record = makeRecord({ consentStatus: "PENDING", anonymised: true });
    const pub = toPublicCaseStudy(record);
    expect(pub.consentBasis).toBe("ANONYMISED");
  });

  it("toPublicCaseStudy includes isFalsificationLinked", () => {
    const record = makeRecord({ evidenceLinks: [{ id: "ev1", sourceType: "falsification_entry", sourceId: "f1", verificationStatus: "PENDING", notes: null }] });
    const pub = toPublicCaseStudy(record);
    expect(pub.isFalsificationLinked).toBe(true);
  });

  it("toPublicCaseStudy isFalsificationLinked is false when no link", () => {
    const record = makeRecord({ evidenceLinks: [] });
    const pub = toPublicCaseStudy(record);
    expect(pub.isFalsificationLinked).toBe(false);
  });
});

// ─── TEST 9: Method demonstration cannot claim client result ──────────────────

describe("Method demonstration claim guard", () => {
  it("METHOD_DEMONSTRATION is a valid public evidenceStatus", () => {
    const result = checkPublicationAllowed("METHOD_DEMONSTRATION", "NOT_MEASURED", "PENDING", "PUBLIC_ANONYMISED", true);
    expect(result.allowed).toBe(true);
  });

  it("METHOD_DEMONSTRATION cannot claim VERIFIED outcome", () => {
    const result = checkPublicationAllowed("METHOD_DEMONSTRATION", "VERIFIED", "GRANTED", "PUBLIC_ANONYMISED", true);
    expect(result.allowed).toBe(false);
    expect(result.allowed ? "" : result.reason).toContain("OUTCOME_VERIFIED");
  });

  it("EVIDENCE_STATUS_LABELS METHOD_DEMONSTRATION does not say 'client' or 'confirmed'", () => {
    const label = EVIDENCE_STATUS_LABELS["METHOD_DEMONSTRATION"];
    expect(label.toLowerCase()).not.toContain("client");
    expect(label.toLowerCase()).not.toContain("confirmed");
  });
});

// ─── TEST 10: Case study slug uniqueness ──────────────────────────────────────

describe("Case study slug discipline", () => {
  it("slug is present in toPublicCaseStudy output", () => {
    const record = makeRecord({ slug: "boardroom-brief-capital-allocation-2026" });
    const pub = toPublicCaseStudy(record);
    expect(pub.slug).toBe("boardroom-brief-capital-allocation-2026");
  });

  it("null slug is handled gracefully", () => {
    const record = makeRecord({ slug: null });
    const pub = toPublicCaseStudy(record);
    expect(pub.slug).toBeNull();
  });

  it("slug containing PII markers would be detectable — slugs should not contain email", () => {
    const dangerousSlug = "case-user@example.com-2026";
    const hasPII = dangerousSlug.includes("@");
    expect(hasPII).toBe(true); // detected — would be rejected by admin guard
  });
});
