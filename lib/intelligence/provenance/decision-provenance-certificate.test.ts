/**
 * lib/intelligence/provenance/decision-provenance-certificate.test.ts
 *
 * §13 proof: valid certificate verifies; modified content fails; superseded certificate
 * remains historically verifiable; cross-tenant retrieval denied; deleted confidential
 * source does not leak into the export (body is reference-only by construction).
 */

import { describe, it, expect } from "vitest";
import {
  issueCertificate,
  verifyCertificate,
  supersedeCertificate,
  retrieveCertificate,
  exportCertificate,
  createEphemeralEd25519Signer,
  CertificateAccessError,
  type IssueInput,
} from "./decision-provenance-certificate";

function baseInput(overrides: Partial<IssueInput> = {}): IssueInput {
  return {
    tenantId: "tenantA",
    caseId: "case_tenantA",
    decision: { id: "dec-1", title: "Reduce single-supplier dependency" },
    productInteractionIds: ["int_a", "int_b"],
    evidenceReferences: [{ key: "supplier_exposure", ref: "interaction:int_a" }],
    contradictions: [{ key: "supply_dependency", severity: "HIGH", count: 2 }],
    commitments: [{ key: "dual_source", statement: "qualify a second supplier", owner: "COO", deadline: "2026-09-30" }],
    checkpoint: { hint: "review at next reporting cycle", dueAt: "2026-08-31" },
    falsificationConditions: [{ key: "single_source_persists", condition: "single supplier for 2 reporting periods" }],
    outcomeEvidence: [],
    twinVersion: 3,
    methodologyVersions: { spine: "1.0.0", integrity: "1.0.0" },
    governanceGatesPassed: ["tenant_isolation", "consent", "claim_boundary"],
    humanReviewStatus: "approved",
    artifactHashes: ["deadbeef"],
    issuedAt: "2026-07-07T00:00:00Z",
    ...overrides,
  };
}

describe("§13 Decision Provenance Certificate", () => {
  it("a valid certificate verifies", () => {
    const signer = createEphemeralEd25519Signer();
    const cert = issueCertificate(baseInput(), signer);
    const v = verifyCertificate(cert, signer);
    expect(v.valid).toBe(true);
    expect(cert.certificateId).toMatch(/^dpc_/);
  });

  it("modified content fails verification (tamper detection)", () => {
    const signer = createEphemeralEd25519Signer();
    const cert = issueCertificate(baseInput(), signer);
    // tamper: change a commitment owner after signing
    const tampered = { ...cert, body: { ...cert.body, commitments: [{ key: "dual_source", statement: "qualify a second supplier", owner: "ATTACKER", deadline: "2026-09-30" }] } };
    const v = verifyCertificate(tampered, signer);
    expect(v.valid).toBe(false);
    expect(v.reasons).toContain("CONTENT_HASH_MISMATCH");
  });

  it("a forged signature fails verification", () => {
    const signer = createEphemeralEd25519Signer();
    const cert = issueCertificate(baseInput(), signer);
    const forged = { ...cert, signature: Buffer.from("forged").toString("base64") };
    expect(verifyCertificate(forged, signer).valid).toBe(false);
  });

  it("a superseded certificate remains historically verifiable", () => {
    const signer = createEphemeralEd25519Signer();
    const v1 = issueCertificate(baseInput(), signer);
    const v2 = issueCertificate(baseInput({ issuedAt: "2026-08-01T00:00:00Z", twinVersion: 4, supersedes: v1.certificateId }), signer);
    const v1superseded = supersedeCertificate(v1, v2);
    // marked superseded, but STILL verifies (append-only accountability, not erased)
    expect(v1superseded.supersededBy).toBe(v2.certificateId);
    expect(verifyCertificate(v1superseded, signer).valid).toBe(true);
    expect(verifyCertificate(v2, signer).valid).toBe(true);
    expect(v2.body.supersedes).toBe(v1.certificateId);
  });

  it("cross-tenant retrieval is denied", () => {
    const signer = createEphemeralEd25519Signer();
    const cert = issueCertificate(baseInput(), signer);
    expect(retrieveCertificate(cert, "tenantA").certificateId).toBe(cert.certificateId);
    expect(() => retrieveCertificate(cert, "tenantB")).toThrow(CertificateAccessError);
  });

  it("export carries references + hashes only — no raw confidential source leaks", () => {
    const signer = createEphemeralEd25519Signer();
    const cert = issueCertificate(baseInput(), signer);
    const exported = exportCertificate(cert);
    const json = JSON.stringify(exported);
    // references present, but no embedded raw content field
    expect(json).toContain("interaction:int_a");
    expect(json).not.toMatch(/rawContent|sourceBody|confidentialText/);
    // even after the source is "deleted", the exported cert still verifies from its refs
    expect(verifyCertificate(exported, signer).valid).toBe(true);
  });
});
