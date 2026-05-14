# Provenance Verification Protocol

**Internal Design Document — Third-Party Verification Specification**

---

## Status: Current Admin Verification + Future External Verification Design

This document defines what authorised users can verify today, what third parties cannot verify yet without authorised disclosure, and the target architecture for a formal external verification protocol.

Current implementation includes record hash verification, client-safe/internal hash continuity, persisted archive hash comparison, internal chain-anchored provenance, a database-enforced append-only anchor ledger, and an admin chain continuity verification endpoint. External WORM retention, RFC3161 timestamping, public verification, and third-party verification receipts are not live.

---

## 1. What a Third Party Can Verify Today

### 1.1 Client-Safe Summary Hash

Any party in possession of a `ClientSafeProvenanceSummary` can verify that the hash is internally consistent:

```
1. Take the client-safe summary JSON
2. The provenanceHash field is a SHA-256 hex string
3. This hash is the same hash that was computed over the full internal
   DecisionProvenanceRecord at composition time
4. The hash can be presented to the platform operator for verification
```

**Limitation:** The third party cannot independently recompute the hash without authorised access to the full internal record. They can only verify that the hash is well-formed and can request platform verification.

### 1.2 Internal Record Hash (If Disclosed)

If the platform operator discloses the full `DecisionProvenanceRecord` to a third party (e.g., during an audit or legal proceeding), the third party can independently verify:

```
1. Take the full record JSON
2. Canonicalize it (sort all keys alphabetically, sort all arrays)
3. Compute SHA-256 over the canonicalized JSON
4. Compare to the provenanceHash field in the record
5. If match: the record has not been modified since hash computation
6. The same hash should match the client-safe summary the party holds
```

**Limitation:** The third party needs access to the full internal record, which is not normally disclosed.

### 1.3 Archived Hash (If Accessible)

If the third party has access to the oversight cycle archive (via platform API or export), they can verify:

```
1. Load the archive record for the cycle
2. Extract provenanceHash from the archive metadata
3. Compare to the provenanceHash from the client-safe summary
4. If match: the hash persisted at archive time matches the current record
```

**Limitation:** The archive hash is stored in the same application database boundary as the source records. A database administrator with sufficient privilege remains outside the guarantee.

### 1.4 Anchor Chain Continuity (Admin)

An authorised admin can verify the internal anchor ledger for a scope/scopeId:

```
1. Load ProvenanceChainAnchor rows ordered by computedAt and id
2. Recompute each anchor chainHash
3. Verify each anchor previousRoot equals the prior anchor merkleRoot
4. Return CONTINUOUS, BROKEN, or UNAVAILABLE
```

**Limitation:** This verifies internal chain continuity over stored anchors. It does not prove external immutability, WORM retention, or third-party timestamping.

---

## 2. What They Cannot Verify Yet

| Capability | Why Not | Prerequisite |
|---|---|---|
| **WORM storage proof** | Anchor rows are database-enforced append-only, not write-once-read-many storage | WORM object storage such as S3 Object Lock or equivalent |
| **External Merkle root anchoring** | Batch Merkle roots are stored internally, not anchored to an external timestamping or storage provider | RFC3161, WORM storage, or external anchor provider |
| **External timestamping** | No trusted timestamp authority is involved | Integration with RFC 3161 TSA or blockchain timestamping |
| **Independent hash recomputation** | Third parties do not have access to the full internal record | Future verification API (see Section 4) |
| **Third-party independent verification without disclosure** | Third parties cannot recompute internal hashes without access to the underlying internal record or a future receipt | External verifier and receipt model |
| **Public chain continuity proof** | Admin chain continuity verification exists, but no public verifier exists | Authenticated/public verification endpoint design |

---

## 3. Future Verification Receipt

When the verification API is implemented, it should produce a structured receipt:

```typescript
type ProvenanceVerificationReceipt = {
  version: 1;
  subjectType: string;
  subjectId: string;
  provenanceHash: string;
  clientSafeHash?: string;
  archiveHash?: string;
  verifiedAt: string;
  verificationStatus: "MATCH" | "MISMATCH" | "UNAVAILABLE";
  signedBy?: string;
};
```

### 3.1 Receipt Generation

```
1. Load the DecisionProvenanceRecord for the requested subject
2. Load the ClientSafeProvenanceSummary (if provided by requester)
3. Load the archive record (if available)
4. Compare hashes:
   a. Recompute record hash from canonicalized record
   b. Compare to stored provenanceHash
   c. Compare to clientSafeHash (if provided)
   d. Compare to archiveHash (if available)
5. Generate receipt with verificationStatus:
   - "MATCH" if all provided hashes match the recomputed hash
   - "MISMATCH" if any hash differs
   - "UNAVAILABLE" if the record cannot be loaded
6. Optionally sign the receipt with a platform key
```

### 3.2 Receipt Fields

| Field | Required | Description |
|---|---|---|
| `version` | Always | Schema version (currently 1) |
| `subjectType` | Always | Type of the verified subject |
| `subjectId` | Always | ID of the verified subject |
| `provenanceHash` | Always | The hash from the internal record |
| `clientSafeHash` | Optional | The hash from the client-safe summary, if provided by requester |
| `archiveHash` | Optional | The hash from the archive metadata, if available |
| `verifiedAt` | Always | ISO timestamp of verification |
| `verificationStatus` | Always | MATCH, MISMATCH, or UNAVAILABLE |
| `signedBy` | Optional | Platform key identifier, if signed |

### 3.3 Receipt Verification

A third party in possession of a signed receipt can verify:

```
1. Verify the receipt signature using the platform's public key
2. Confirm the provenanceHash matches the hash in their client-safe summary
3. Confirm the verifiedAt timestamp is within an acceptable window
4. The receipt proves that the platform confirmed hash consistency at a
   specific point in time
```

---

## 4. External Verifier (Future)

The current verification endpoints are admin-only. A public or third-party endpoint must not expose raw provenance, governance events, suppression details, actor IDs, or leaf payloads. It should issue a bounded receipt only after the external anchoring model is implemented.

### 4.1 API Design

```
GET /api/provenance/verify/{subjectType}/{subjectId}
```

**Authentication:** API key or signed request from authorised party (client, regulator, auditor).

**Request (optional body):**
```json
{
  "clientSafeHash": "abc123...",
  "archiveHash": "def456..."
}
```

**Response (200):**
```json
{
  "ok": true,
  "receipt": {
    "version": 1,
    "subjectType": "OVERSIGHT_CYCLE",
    "subjectId": "cycle_001",
    "provenanceHash": "abc123...",
    "clientSafeHash": "abc123...",
    "archiveHash": "def456...",
    "verifiedAt": "2026-05-14T12:00:00.000Z",
    "verificationStatus": "MATCH",
    "signedBy": "platform-key-001"
  }
}
```

**Response (404):**
```json
{
  "ok": false,
  "error": "No provenance record found for this subject.",
  "receipt": {
    "version": 1,
    "subjectType": "OVERSIGHT_CYCLE",
    "subjectId": "unknown_cycle",
    "provenanceHash": "",
    "verifiedAt": "2026-05-14T12:00:00.000Z",
    "verificationStatus": "UNAVAILABLE"
  }
}
```

### 4.2 Verification Logic

```
function verifyProvenance(input: {
  subjectType: string;
  subjectId: string;
  clientSafeHash?: string;
  archiveHash?: string;
}): ProvenanceVerificationReceipt {
  const record = loadProvenanceRecord(input.subjectType, input.subjectId);
  if (!record) {
    return unavailableReceipt(input.subjectType, input.subjectId);
  }

  const recomputedHash = buildDecisionProvenanceHash(record);
  const internalMatch = recomputedHash === record.provenanceHash;
  const clientSafeMatch = input.clientSafeHash
    ? recomputedHash === input.clientSafeHash
    : true; // not provided — not a mismatch
  const archiveMatch = input.archiveHash
    ? recomputedHash === input.archiveHash
    : true; // not provided — not a mismatch

  const allMatch = internalMatch && clientSafeMatch && archiveMatch;

  return {
    version: 1,
    subjectType: input.subjectType,
    subjectId: input.subjectId,
    provenanceHash: record.provenanceHash,
    clientSafeHash: input.clientSafeHash,
    archiveHash: input.archiveHash,
    verifiedAt: new Date().toISOString(),
    verificationStatus: allMatch ? "MATCH" : "MISMATCH",
    signedBy: "platform-key-001",
  };
}
```

### 4.3 Access Control

| Role | Can Verify | Can See Full Record |
|---|---|---|
| Client (via client-safe summary) | Hash match only | No |
| Operator | Hash match + full record | Yes |
| Admin | Hash match + full record | Yes |
| Regulator (with authorisation) | Hash match + full record | Conditional |
| Anonymous | Nothing | No |

### 4.4 Rate Limiting

The verification endpoint should be rate-limited to prevent automated scraping of hash state:

- 10 requests per minute per API key
- 100 requests per minute per authenticated session
- 1 request per second for unauthenticated requests (if allowed)

---

## 5. Non-Goals

The following are explicitly out of scope for v1 of the verification protocol:

| Non-Goal | Rationale |
|---|---|
| **Public record access** | Provenance records contain operational metadata not appropriate for public disclosure. All verification requires authentication. |
| **Raw suppression disclosure** | Suppression field names, reasons, and override details are internal operational data. The client-safe summary exposes only gap severity classes, not suppression internals. |
| **Anonymous external scraping** | The verification API is rate-limited and authenticated. There is no public endpoint for bulk hash retrieval. |
| **Real-time verification** | Verification is point-in-time. The receipt confirms hash consistency at the time of verification, not continuously. |
| **Blockchain anchoring** | No blockchain timestamping or anchoring is implemented. The verification protocol works with the existing hash model. |
| **Full record disclosure** | The verification API returns a receipt, not the full provenance record. Full record access requires separate authorisation. |

---

## 6. Verification Workflow Examples

### 6.1 Client Verifies Their Summary

```
1. Client receives oversight brief with embedded provenance summary
2. Client notes the provenanceHash: "abc123..."
3. Client contacts operator: "Please verify hash abc123..."
4. Operator runs verification via internal tool or future API
5. Operator confirms: "Hash abc123... matches the internal record for
   cycle_001 as of 2026-05-14T12:00:00.000Z"
6. Client has independent confirmation that their summary corresponds
   to the actual governed record
```

### 6.2 Auditor Verifies Batch Integrity (Future)

```
1. Auditor requests provenance records for Q2 2026
2. Platform provides: full records + daily Merkle roots + verification receipts
3. Auditor independently recomputes record hashes from canonicalized records
4. Auditor verifies each record hash matches the stored provenanceHash
5. Auditor verifies each record is included in the daily Merkle root
6. Auditor verifies the daily Merkle root against the stored anchor
7. Auditor has hash-verifiable evidence of record and batch consistency within the disclosed material
```

### 6.3 Regulator Requests Proof of Process (Future)

```
1. Regulator requests provenance for a specific oversight cycle
2. Platform provides: full DecisionProvenanceRecord + verification receipt
3. Regulator verifies:
   a. provenanceHash matches recomputed hash from canonicalized record
   b. accountability statement accurately reflects the governance events
   c. gap classes match the regulator's expectations for completeness
4. Regulator has deterministic, verifiable proof of the governance process
```

---

## 7. Summary

| Capability | Current | Designed / next |
|---|---|---|
| Client-safe hash verification | Admin endpoint can compare expected/recomputed/archive hashes | Signed receipt for authorised external parties |
| Internal record hash verification | Admin endpoint recomputes canonical provenance hash | External verifier without raw disclosure where possible |
| Archive hash verification | Admin endpoint compares archived hash when available | Formal receipt field |
| Merkle root verification | Internal anchor ledger stores scoped Merkle roots | Inclusion proofs over disclosed records |
| Chain continuity verification | Admin endpoint verifies previous-root linkage and chainHash recomputation | External receipt over chain state |
| Database-enforced append-only anchors | Postgres trigger blocks ordinary anchor update/delete | WORM/external anchoring |
| WORM storage proof | Not live | S3 Object Lock or equivalent |
| External timestamping | Not live | RFC3161 TSA or blockchain |
| Signed receipts | Not live | Platform-signed verification receipts |
| Public API | Not live | Authenticated, rate-limited verification endpoint |

The current admin verification path is sufficient for internal operations and authorised operator review. Public or third-party verification should be implemented only when external anchoring, receipt signing, and disclosure controls are ready.
