# Provenance Chain and Immutable Storage — Design Specification

**Internal Design Document — Advisory Platform Governance Layer**

---

## Status: Current Internal Chain Ledger + Future External Anchoring Design

This document defines the current internal chain-anchored provenance boundary and the target architecture for stronger external anchoring. The current platform has a Merkle-root anchor ledger in Postgres, previous-root chain linkage, an admin chain continuity verification endpoint, and database-enforced append-only anchors. It does not have WORM retention, external timestamping, public verification, or third-party verification receipts.

Use the precise current claim: **database-enforced append-only anchor ledger for internal chain-anchored provenance, tamper-evident within the application database boundary**.

---

## 1. Threat Model

The Decision Provenance Record now combines record-level SHA-256 hashes, persisted archive hashes, client-safe hash continuity, and a scoped Merkle-root anchor ledger. This protects against accidental record drift and makes anchor deletion, replacement, or reordering detectable within the application database boundary when anchors exist.

| Threat | Description | Current Protection | Gap |
|---|---|---|---|
| **Record modification** | An operator or process changes the provenance data after the hash was stored | Hash mismatch detection (see integrity helper) | ✅ Covered |
| **Record deletion** | An entire AuditEvent row is deleted | Archive hash plus anchor continuity where the record hash was anchored | Partial |
| **Record replacement** | An old record is deleted and a new one created with different data but the same subjectId | Hash mismatch and Merkle-root mismatch where anchored | Partial |
| **Backdating** | A new record is created with a fabricated earlier timestamp | Anchor `computedAt` and previous-root linkage provide an internal continuity check | Partial |
| **Summary/internal mismatch** | Client-safe summary hash is replaced to match a modified internal record | Hash integrity check compares both | ✅ Covered |
| **Archive metadata tampering** | The AuditEvent metadata JSON is edited in-place | Hash stored in same metadata — both could be edited together | ❌ Not covered |
| **Reordering** | Records within a batch are reordered to change apparent sequence | Deterministic Merkle-root anchor plus previous-root chain continuity where anchored | ✅ Covered inside anchored scopes |

### Risk Acceptance for v1

The current internal architecture is acceptable for v1 because:

1. ProvenanceChainAnchor is append-only through a database trigger that blocks ordinary `UPDATE` and `DELETE`
2. The hash is computed from the full provenance record, not from the metadata that contains it
3. The client-safe summary carries the same hash, preserving client-safe hash continuity
4. Scoped Merkle roots and previous-root linkage support admin chain continuity verification
5. No external WORM retention or third-party anchoring is active yet

The external anchoring and WORM model defined below remains the target for later phases.

---

## Current Capability Boundary

| Capability | Status | Boundary |
|---|---|---|
| SHA-256 record hash | Current | Deterministic hash over canonical DecisionProvenanceRecord |
| Client-safe/internal hash continuity | Current | Client-safe summary carries the same hash without raw internal events |
| Persisted archive hash | Current | Archive metadata stores the provenance hash for later comparison |
| Merkle-root anchor ledger | Current | Scoped roots stored in `ProvenanceChainAnchor`; raw provenance payloads are not stored |
| Previous-root chain linkage | Current | Each anchor links to the prior anchor root for the same scope/scopeId |
| Database-enforced append-only anchors | Current | Postgres trigger blocks ordinary `UPDATE` and `DELETE`; `INSERT` remains allowed |
| Admin chain continuity verification | Current | Admin endpoint verifies previous-root linkage and chainHash recomputation |
| WORM object storage | Designed / next | Not live |
| RFC3161 timestamping | Designed / next | Not live |
| External verifier | Designed / next | Not live |
| Public verification endpoint | Designed / next | Not live |
| Third-party verification receipt | Designed / next | Not live |

Allowed claim: internal chain-anchored provenance with a database-enforced append-only anchor ledger. Do not claim WORM retention, external immutability, blockchain anchoring, regulator certification, or independent third-party verification without authorised disclosure.

---

## 2. Hash Model

### 2.1 Record Hash (Current)

Each `DecisionProvenanceRecord` produces a SHA-256 hash over its canonicalized JSON representation. This is already implemented in `buildDecisionProvenanceHash`.

```
recordHash = SHA256(canonicalize(record))
```

### 2.2 Previous Record Hash (Chain Link)

Each record SHOULD include the hash of the chronologically preceding record for the same subject scope. This creates a hash chain:

```
recordHash_N = SHA256(canonicalize(record_N) + previousRecordHash)
```

Where `previousRecordHash` is the `recordHash` of record `N-1` for the same subject scope, or `null` for the first record.

### 2.3 Batch Root Hash (Merkle Root)

A batch root hash is computed over all record hashes within a batch scope (daily, per-cycle, or per-account). Records are ordered by `createdAt` timestamp, and a Merkle tree is built:

```
leaves = sort(recordHashes, by createdAt)
batchRootHash = MerkleRoot(leaves)
```

The batch root hash is the single value that commits to the entire batch. Any change to any record in the batch changes the root.

### 2.4 Chain Scope

The hash chain operates at the following scope levels:

| Scope | Definition | Use Case |
|---|---|---|
| **Per subjectId** | Records linked by `subjectType + subjectId` | Tracking a single oversight cycle or report over time |
| **Per account** | Records linked by `accountId` | Tracking all cycles for a retained account |
| **Per organisation** | Records linked by `organisationId` | Organisation-level audit |
| **Daily global batch** | All records created in a UTC day | Global integrity check |
| **Cycle batch** | All records within a single oversight cycle | Cycle-level integrity |

### 2.5 Canonical Record for Storage

The stored provenance object should contain:

```typescript
type StoredProvenanceRecord = {
  version: 1;
  provenanceHash: string;          // SHA-256 of this record
  previousRecordHash: string | null; // SHA-256 of preceding record in chain
  batchRootHash: string | null;     // Merkle root of containing batch
  batchScope: "daily" | "cycle" | "account" | "organisation" | null;
  record: DecisionProvenanceRecord; // The full provenance record
  storedAt: string;                 // ISO timestamp of storage
  storageKey: string;               // Content-addressed key (hash)
};
```

---

## 3. Chain Scope Options

### Option A: Per-Subject Hash Chain (Recommended v1 Extension)

Link records by `subjectType + subjectId`. Each new record includes the hash of the previous record for the same subject.

**Pros:** Simple, no batch coordination, immediately useful for cycle-level audit.
**Cons:** Does not protect against deletion of the entire chain for a subject.

### Option B: Daily Merkle Root (Recommended v2)

Compute a single Merkle root over all provenance records created in a UTC day. Store the root externally (see storage options below).

**Pros:** Protects against deletion and reordering across all records. Single value to anchor.
**Cons:** Requires daily batch computation. Does not protect individual records within the batch independently.

### Option C: Cycle-Batch Merkle Root (Recommended v2 Alternative)

Compute a Merkle root over all records within a single oversight cycle. The root is stored in the cycle archive metadata alongside the record hash.

**Pros:** Natural batch boundary. Root is stored with the data it protects.
**Cons:** Does not protect against deletion of the entire cycle archive.

### Implemented v1 Anchor Path

**Use scoped Merkle-root anchors with previous-root linkage.** Each created anchor stores the root over included provenance hashes, the previous anchor root for the same scope/scopeId, and a deterministic `chainHash` over the anchor fields. The chain can be verified by recomputing each anchor hash and checking previous-root continuity.

**Defer automatic scheduling and external anchoring** until anchor timing, retention, and disclosure requirements are stable.

---

## 4. Immutable Storage Options

### 4.1 Current Interim Store: AuditEvent Metadata

**Status:** Current v1 storage.

**Strengths:**
- No new infrastructure required
- Already append-only by convention
- Already indexed by cycleId, accountId, organisationId

**Weaknesses:**
- Hash and data live in the same database row
- Database admin with write access can modify both
- No external anchoring

### 4.2 S3 Object Lock / WORM (Recommended v2)

Write each provenance record as a JSON object to S3 with Object Lock enabled (write-once-read-many). Key the object by its SHA-256 hash for content-addressed retrieval.

**Strengths:**
- True immutability at the storage layer
- Content-addressed: key = hash, so retrieval verifies integrity
- No database dependency for audit trail
- AWS CloudTrail logs all access

**Weaknesses:**
- Requires AWS infrastructure
- Object Lock has minimum retention periods (1 day minimum in governance mode)
- Cost per object

### 4.3 Write-Once Append Log (Recommended v2 Alternative)

Use a dedicated database table or log file that is append-only by application convention. No updates, no deletes. Each row contains the provenance hash, the storage key, and the storedAt timestamp.

**Strengths:**
- Simple, no cloud dependency
- Can be implemented with existing Prisma schema
- Easy to replicate to S3 later

**Weaknesses:**
- Not truly immutable at the storage layer (database admin could modify)
- Better than current co-located storage but not best-in-class

### 4.4 Current Storage Path

**Continue storing record hashes in AuditEvent/archive metadata and store batch anchor summaries in `ProvenanceChainAnchor`.** The anchor ledger stores safe metadata only: counts, subject types, roots, previous roots, and chain hashes. It does not store raw DecisionProvenanceRecord payloads, governance event labels, suppression details, or actor identifiers.

**Enforce append-only anchor behaviour in Postgres.** A trigger prevents ordinary updates and deletes against the anchor table while allowing inserts. This is database-enforced append-only behaviour, not WORM retention.

**Do not add S3/Azure/GCP dependencies in this phase.** WORM object storage, RFC3161 timestamping, and external verifier receipts remain designed next steps.

---

## 5. Verification Model

### 5.1 Single Record Verification

```
1. Load provenance record from storage by subjectType + subjectId
2. Recompute recordHash = SHA256(canonicalize(record))
3. Compare to stored provenanceHash
4. If match: record integrity confirmed
5. If mismatch: integrity failure — see mismatch protocol (doctrine doc section 5a)
```

### 5.2 Anchor Chain Verification

```
1. Load all ProvenanceChainAnchor rows for a scope/scopeId, ordered by computedAt and id
2. For each anchor N:
   a. Recompute chainHash_N from version, scope, scopeId, merkleRoot, previousRoot, timestamps
   b. Verify recomputed chainHash_N matches stored chainHash
   c. Verify previousRoot_N matches merkleRoot_(N-1)
3. If all links verify: anchor chain continuity is confirmed
4. If any link fails: anchor chain break detected
```

### 5.3 Batch Root Verification

```
1. Load all records in the batch scope
2. Sort by createdAt
3. Compute Merkle root from record hashes
4. Compare to stored batchRootHash
5. If match: batch integrity confirmed
```

### 5.4 Client-Safe Hash Verification

```
1. Load internal DecisionProvenanceRecord
2. Load ClientSafeProvenanceSummary
3. Compare provenanceHash fields
4. If match: summary was derived from the claimed internal record
5. If mismatch: structural integrity failure
```

---

## 6. Retention and GDPR Model

### 6.1 Retention by Record Class

| Record Class | Retention Period | Rationale |
|---|---|---|
| Oversight cycle provenance | Life of account + 6 years | Regulatory requirement for advisory records |
| Delivery records | Life of account + 6 years | Proof of delivery may be needed for dispute resolution |
| Outcome verification | Life of account + 3 years | Outcome data informs future cycles but is less critical than delivery proof |
| Suppression records | Life of account + 6 years | Suppression decisions may be subject to regulatory review |
| Counsel/Boardroom records | Life of account + 6 years | Escalation records have the longest retention requirement |

### 6.2 Pseudonymisation Strategy

Personal identifiers in provenance records should be pseudonymised at rest:

- **Email addresses:** Store as SHA-256 hash of lowercase email. The hash can be used for deduplication without exposing the raw address.
- **Operator IDs:** Store as application-internal identifiers only. Never expose in client-safe output.
- **User-reported evidence text:** Store in the provenance record but mark as `USER_REPORTED` confidence. Do not include in client-safe summary.
- **Suppression field names:** Store in the provenance record but never expose in client-safe output.

### 6.3 Legal Hold

When a legal hold is applied to an account or cycle:

1. The provenance records for that scope are flagged with a `legalHold: true` flag
2. Standard retention policies are suspended for flagged records
3. The hold is recorded in the provenance chain as a governance event
4. Release of the hold requires operator confirmation and is recorded as a subsequent event

### 6.4 Deletion Requests

When a deletion request is received (GDPR Article 17 or equivalent):

1. Personal identifiers within the provenance record are replaced with anonymised placeholders
2. The provenance hash is recomputed to reflect the anonymised state
3. The original hash is preserved as `previousRecordHash` to maintain chain continuity
4. The accountability statement is updated to note that personal identifiers have been removed
5. The record itself is NOT deleted — it is anonymised in place
6. A governance event is added: `type: "ACCESS_REVIEWED", label: "Personal identifiers anonymised per deletion request"`

This approach preserves the audit chain while complying with deletion rights. The chain proves that a record existed and was modified for compliance reasons, rather than being silently deleted.

---

## 7. Non-Goals

The following are explicitly out of scope for v1 and this design document:

| Non-Goal | Rationale |
|---|---|
| **Public blockchain anchoring** | Unnecessary complexity for current operational needs. No customer has requested blockchain verification. |
| **Full external verifier API** | No external consumer exists yet. The hash is available in the client-safe summary for manual verification. |
| **Exposing raw provenance to clients** | The client-safe summary is the governed output. Raw provenance contains operational detail not appropriate for client delivery. |
| **Replacing source-of-truth models** | The provenance record is derived from existing data. It does not replace the underlying models (cycles, deliveries, outcomes). |
| **Real-time chain updates** | Provenance is historical by nature. Batch computation (daily or per-cycle) is sufficient. |
| **Cross-organisation chain** | Each organisation's records are independent. Cross-organisation chains would require shared infrastructure not yet justified. |

---

## 8. Implementation Roadmap

### Phase 1: Persisted Record Hash ✅ (Complete)

- SHA-256 hash stored in AuditEvent metadata
- Hash computed at archive time and recomputed at delivery
- Client-safe summary carries the same hash
- Integrity check helper available

**Status:** Complete. Shipped in `481aeb7a2`.

### Phase 2: Internal Chain Anchor Ledger ✅ (Complete)

- Store scoped Merkle roots in `ProvenanceChainAnchor`
- Link anchors with `previousRoot`
- Compute deterministic `chainHash`
- Query anchors through an admin-only endpoint
- Verify chain continuity through an admin-only endpoint

**Status:** Complete.

### Phase 3: Database-Enforced Append-Only Anchors ✅ (Complete)

- Add Postgres trigger to block ordinary `UPDATE` and `DELETE` operations on `ProvenanceChainAnchor`
- Allow `INSERT` so anchors remain append-only
- Keep raw provenance payloads out of the anchor table

**Status:** Complete locally. Deployment depends on valid database credentials and migration rollout.

### Phase 4: Anchor Generation from Existing Records

- Implement daily batch computation: collect all provenance records created in a UTC day
- Build Merkle tree from record hashes
- Store batch root hash
- Implement batch root verification

**Estimated effort:** 3-5 days
**Dependencies:** stable anchor timing and operator workflow

### Phase 5: WORM Storage

- Write provenance records to S3 with Object Lock enabled
- Key objects by SHA-256 hash
- Implement write-once, read-many access pattern
- Add CloudTrail monitoring for access audit

**Estimated effort:** 5-10 days
**Dependencies:** Phase 2, AWS infrastructure, security review

### Phase 6: Third-Party Verification Receipts

- Generate signed verification receipts for external parties
- Receipt contains: record hash, batch root hash, Merkle proof path, timestamp
- Receipt can be verified without access to the full provenance system

**Estimated effort:** 5-7 days
**Dependencies:** Phase 4 (batch roots must exist before batch proofs can be generated)

### Phase 7: External Verifier API

- Public API endpoint: `GET /api/provenance/verify/{hash}`
- Returns: verification status, record hash, batch root hash, timestamp
- Does NOT return the full provenance record
- Rate-limited and authenticated

**Estimated effort:** 3-5 days
**Dependencies:** Phase 5 or 6 (external anchoring must exist before external verification is meaningful)

---

## 9. Summary

| Component | Current | Designed / next |
|---|---|---|
| Record hash | SHA-256 per record | Same + external receipt support |
| Hash storage | AuditEvent/archive metadata | Content-addressed object store |
| Chain | Scoped Merkle roots with previous-root linkage | Scheduled daily/account/cycle anchoring |
| Batch root | Manual/internal anchor creation available | Automated anchor generation |
| Anchor mutation control | Database-enforced append-only trigger | WORM/external anchoring |
| External verification | Admin verification endpoints only | Signed verification receipts + authorised API |
| GDPR compliance | Manual | Pseudonymisation + legal hold + anonymised deletion |

The current implementation supports the claim: database-enforced append-only provenance anchor ledger with internal chain continuity verification. The next priorities are operational anchor generation, WORM object storage or RFC3161 timestamping, and authorised external verification receipts when customer assurance requirements justify them.
