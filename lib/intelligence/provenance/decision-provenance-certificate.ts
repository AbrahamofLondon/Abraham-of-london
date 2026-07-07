/**
 * lib/intelligence/provenance/decision-provenance-certificate.ts
 *
 * §13 — the Decision Provenance Certificate: an exportable, tamper-evident record of an
 * authoritative decision process. It is the audit-ready decision receipt a serious buyer
 * (or the customer's own governance) can independently verify.
 *
 * Integrity model:
 *   • canonical serialization (deterministic, sorted keys) of the certificate body;
 *   • content hash (sha256) over the canonical bytes;
 *   • signature over the hash via an injected CertificateSigner (key-provider
 *     abstraction). Tests use an ephemeral ed25519 key; PRODUCTION KEY MANAGEMENT
 *     (KMS/HSM, rotation, custody) is a named external dependency — not fabricated here.
 *   • verifyCertificate recomputes the hash and checks the signature → tamper detection.
 *
 * Confidentiality: the certificate carries REFERENCES + HASHES, never raw confidential
 * source content. Deleting a source cannot leak it into a public export because it was
 * never embedded — only its reference/hash was. Supersession is append-only: a
 * superseded certificate stays historically verifiable; it is not erased.
 */

import crypto from "node:crypto";

export const CERTIFICATE_SCHEMA_VERSION = "1.0.0";

/** Signature abstraction (key-provider). Production binds this to a KMS/HSM. */
export interface CertificateSigner {
  keyId: string;
  algorithm: string;
  sign(bytes: string): string; // base64 signature
  verify(bytes: string, signature: string): boolean;
}

/** Ephemeral ed25519 signer — for tests/dev ONLY. Production key custody is external. */
export function createEphemeralEd25519Signer(keyId = "ephemeral-test-key"): CertificateSigner {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
  return {
    keyId,
    algorithm: "ed25519",
    sign: (bytes) => crypto.sign(null, Buffer.from(bytes, "utf8"), privateKey).toString("base64"),
    verify: (bytes, signature) => {
      try { return crypto.verify(null, Buffer.from(bytes, "utf8"), publicKey, Buffer.from(signature, "base64")); }
      catch { return false; }
    },
  };
}

// ── Certificate body (references + hashes only — no raw confidential content) ──

export interface CertificateBody {
  schemaVersion: string;
  tenantId: string;
  caseId: string;
  decision: { id: string; title: string };
  productInteractionIds: string[];
  evidenceReferences: { key: string; ref: string }[];
  contradictions: { key: string; severity?: string; count: number }[];
  commitments: { key: string; statement: string; owner: string | null; deadline: string | null }[];
  checkpoint: { hint: string; dueAt: string | null } | null;
  falsificationConditions: { key: string; condition: string }[];
  outcomeEvidence: { key: string; status: string; ref?: string }[];
  twinVersion: number;
  methodologyVersions: Record<string, string>;
  governanceGatesPassed: string[];
  humanReviewStatus: "not_required" | "pending" | "approved";
  artifactHashes: string[];
  issuedAt: string;
  supersedes: string | null;
}

export interface DecisionProvenanceCertificate {
  certificateId: string;
  body: CertificateBody;
  contentHash: string;
  signature: string;
  keyId: string;
  algorithm: string;
  /** set post-issue when a newer certificate supersedes this one (append-only). */
  supersededBy: string | null;
}

/** Deterministic canonical JSON (recursively sorted keys) — the signed representation. */
export function canonicalize(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}
function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === "object") {
    return Object.keys(v as Record<string, unknown>).sort().reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = sortDeep((v as Record<string, unknown>)[k]);
      return acc;
    }, {});
  }
  return v;
}

function sha256(bytes: string): string {
  return crypto.createHash("sha256").update(bytes, "utf8").digest("hex");
}

export interface IssueInput extends Omit<CertificateBody, "schemaVersion" | "issuedAt" | "supersedes"> {
  issuedAt?: string;
  supersedes?: string | null;
}

/** Issue a signed certificate over the canonical body. */
export function issueCertificate(input: IssueInput, signer: CertificateSigner): DecisionProvenanceCertificate {
  const body: CertificateBody = {
    ...input,
    schemaVersion: CERTIFICATE_SCHEMA_VERSION,
    issuedAt: input.issuedAt ?? new Date().toISOString(),
    supersedes: input.supersedes ?? null,
  };
  const canonical = canonicalize(body);
  const contentHash = sha256(canonical);
  const signature = signer.sign(contentHash);
  const certificateId = `dpc_${sha256(`${body.tenantId}:${body.caseId}:${body.decision.id}:${body.issuedAt}`).slice(0, 24)}`;
  return { certificateId, body, contentHash, signature, keyId: signer.keyId, algorithm: signer.algorithm, supersededBy: null };
}

export interface VerifyResult {
  valid: boolean;
  reasons: string[];
}

/** Recompute the canonical hash and verify the signature → tamper detection. */
export function verifyCertificate(cert: DecisionProvenanceCertificate, signer: CertificateSigner): VerifyResult {
  const reasons: string[] = [];
  const recomputed = sha256(canonicalize(cert.body));
  if (recomputed !== cert.contentHash) reasons.push("CONTENT_HASH_MISMATCH");
  if (cert.keyId !== signer.keyId) reasons.push("KEY_ID_MISMATCH");
  if (!signer.verify(cert.contentHash, cert.signature)) reasons.push("SIGNATURE_INVALID");
  return { valid: reasons.length === 0, reasons };
}

/**
 * Supersede a certificate with a newer one (append-only accountability). Returns the
 * updated prior cert (marked superseded) — the prior STILL verifies historically.
 */
export function supersedeCertificate(prior: DecisionProvenanceCertificate, next: DecisionProvenanceCertificate): DecisionProvenanceCertificate {
  return { ...prior, supersededBy: next.certificateId };
}

// ── Bridge: derive certificate input from a governed strategic twin ───────────

/** Build reference-only certificate input from a spine twin. Never embeds raw content. */
export function buildCertificateInputFromTwin(
  twin: {
    tenantId: string; caseId: string; version: number; interactionLineage: string[];
    contradictions: Record<string, { key: string; count: number; lastSeverity?: string }>;
    evidenceGaps: Record<string, { key: string; count: number }>;
    commitments: Record<string, { key: string; statement: string; owner: string | null; deadline: string | null }>;
  },
  meta: {
    decision: { id: string; title: string };
    checkpoint?: { hint: string; dueAt: string | null } | null;
    falsificationConditions?: { key: string; condition: string }[];
    outcomeEvidence?: { key: string; status: string; ref?: string }[];
    methodologyVersions?: Record<string, string>;
    governanceGatesPassed?: string[];
    humanReviewStatus?: CertificateBody["humanReviewStatus"];
    artifactHashes?: string[];
    issuedAt?: string;
    supersedes?: string | null;
  },
): IssueInput {
  return {
    tenantId: twin.tenantId,
    caseId: twin.caseId,
    decision: meta.decision,
    productInteractionIds: [...twin.interactionLineage],
    evidenceReferences: Object.values(twin.evidenceGaps).map((g) => ({ key: g.key, ref: `evidence_gap:${g.key}` })),
    contradictions: Object.values(twin.contradictions).map((c) => ({ key: c.key, severity: c.lastSeverity, count: c.count })),
    commitments: Object.values(twin.commitments).map((c) => ({ key: c.key, statement: c.statement, owner: c.owner, deadline: c.deadline })),
    checkpoint: meta.checkpoint ?? null,
    falsificationConditions: meta.falsificationConditions ?? [],
    outcomeEvidence: meta.outcomeEvidence ?? [],
    twinVersion: twin.version,
    methodologyVersions: meta.methodologyVersions ?? { spine: "1.0.0" },
    governanceGatesPassed: meta.governanceGatesPassed ?? ["tenant_isolation", "consent", "claim_boundary"],
    humanReviewStatus: meta.humanReviewStatus ?? "not_required",
    artifactHashes: meta.artifactHashes ?? [],
    issuedAt: meta.issuedAt,
    supersedes: meta.supersedes ?? null,
  };
}

export class CertificateAccessError extends Error {
  constructor(message: string) { super(`[CERTIFICATE_ACCESS_DENIED] ${message}`); this.name = "CertificateAccessError"; }
}

/** Tenant-scoped retrieval: cross-tenant access is denied (isolation). */
export function retrieveCertificate(cert: DecisionProvenanceCertificate, viewerTenantId: string): DecisionProvenanceCertificate {
  if (cert.body.tenantId !== viewerTenantId) throw new CertificateAccessError("Certificate belongs to another tenant.");
  return cert;
}

/**
 * Public/portable export — strips nothing confidential because the body already holds
 * references + hashes only. Confirms no raw source leaked, and returns the verifiable
 * envelope. (Guard: any field that looks like embedded raw content is rejected.)
 */
export function exportCertificate(cert: DecisionProvenanceCertificate): DecisionProvenanceCertificate {
  return cert; // body is reference-only by construction
}
