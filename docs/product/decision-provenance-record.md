# Decision Provenance Record

**Internal Doctrine — Advisory Platform Governance Layer**

---

AI makes advice cheap. Provenance makes consequential advice trustworthy.

The Decision Provenance Record is the accountability layer beneath every governed decision the platform produces. It does not replace judgment. It makes judgment auditable.

Current integrity boundary: the platform provides hash-verifiable Decision Provenance Records, client-safe hash continuity, persisted archive hashes, internal chain-anchored provenance, and a database-enforced append-only anchor ledger. This is tamper-evident within the application database boundary. It is designed for WORM/external anchoring, but external WORM retention and third-party anchoring are not live.

---

## 1. Strategic Thesis

Retained advisory relationships carry accountability that casual AI outputs do not. When a sponsor acts on an oversight brief, they act on a chain of inputs, verifications, and operator decisions — not on a model's confidence alone. The Decision Provenance Record encodes that chain durably, hashably, and in a form that survives the relationship.

The bet is simple: governance infrastructure becomes a competitive surface as AI advice proliferates. Platforms that can demonstrate how a decision was reached will be valued over platforms that can only demonstrate that a decision was reached.

---

## 2. What Provenance Is

The Decision Provenance Record is a structured, versioned artifact that traces a governed decision from its constituent inputs to its delivery state. It composes from eight source layers:

- **Cadence cycles** — the scheduled oversight rhythm that structured the analysis
- **Suppression ledger** — any information withheld from delivery and the basis for withholding
- **Delivery audit** — confirmation that the brief reached the intended recipient in the intended form
- **Outcome verification** — follow-on confirmation of whether stated positions held
- **Counsel history** — prior advisory positions relevant to this decision context
- **Boardroom archive** — referenced governance artifacts and resolutions
- **Cycle memory** — cross-cycle continuity records linking prior positions to current ones
- **Operator decisions** — explicit human overrides, flags, or sign-offs applied during review

Together these establish not just what was advised, but what was known, what was withheld, and who verified it.

---

## 3. What Provenance Is Not

The record is not a transcript of AI reasoning. It is not a litigation hold. It is not a compliance filing. It is not a substitute for legal counsel.

Provenance is an internal accountability artifact that produces a client-safe summary. The distinction between the full record and the summary is structural and intentional — the full record contains operational detail that is not appropriate for sponsor delivery.

---

## 4. Confidence Model

Every source claim in the record carries a confidence tier:

- **USER_REPORTED** — asserted by the client or their representatives; not independently verified
- **SYSTEM_INFERRED** — derived by platform logic from available inputs; confidence is bounded by input quality
- **OPERATOR_VERIFIED** — reviewed and confirmed by a human operator within the platform workflow
- **THIRD_PARTY** — sourced from an external data provider or reference system

Confidence tiers propagate to the client-safe summary as bands, not labels. Sponsors see aggregate confidence posture, not source-level attribution.

---

## 5. Hash Model

The `provenanceHash` field is a SHA-256 digest computed over the canonicalized record. Canonicalization is deterministic: all keys are sorted alphabetically, all arrays are sorted by a stable natural key before serialization. The hash covers the full internal record, not the client-safe summary.

The hash serves as a tamper-evident seal within the application database boundary. If the underlying record changes after hash computation, the hash no longer matches. The hash is included in the client-safe summary so that authorised parties can request verification against the platform record without exposing raw internal review material.

Record hashes can be linked into scoped Merkle roots stored in the `ProvenanceChainAnchor` ledger. Anchor rows are append-only at the database layer through a trigger that blocks ordinary `UPDATE` and `DELETE` operations while allowing new `INSERT` operations. This strengthens internal tamper evidence, but it is not WORM storage and not external immutability.

### 5a. Hash Mismatch Protocol

When a stored provenance hash (from AuditEvent metadata) is compared against a freshly recomputed hash, three outcomes are possible:

- **MATCH** — The stored hash equals the recomputed hash. Record integrity is consistent. No action required.
- **UNAVAILABLE** — No stored hash exists (e.g., pre-provenance archive records). The recomputed hash is available for initial storage. Not a defect.
- **MISMATCH** — The stored hash differs from the recomputed hash. This means the source data has changed since the hash was stored. This is expected when new evidence, deliveries, or outcomes are added to a cycle. It is NOT expected when no changes have occurred.

**Mismatch response (do not silently overwrite):**

1. Preserve both `storedHash` and `recomputedHash` for forensic comparison
2. Surface the mismatch as a CRITICAL provenance gap
3. Require operator/admin review before any automated resolution
4. The operator must confirm whether the source data change is legitimate (new delivery, updated outcome) or indicates a data integrity issue
5. Only after operator confirmation should the stored hash be updated to the recomputed value

The mismatch protocol exists to prevent silent hash overwrites from masking data corruption. It is not a tamper-detection system — the hash proves composition consistency, not data immutability.

---

## 6. Gap Model

Gaps are declared limitations in the provenance record. Every gap carries a severity:

- **CRITICAL** — blocks delivery or release. The brief cannot be issued until the gap is resolved or explicitly overridden by an operator. Examples: missing delivery confirmation, unresolved suppression conflict, no operator sign-off on a flagged position.
- **WARNING** — the governance process is incomplete but delivery is not blocked. Examples: outcome verification pending, counsel history not reconciled, cycle memory link missing.
- **INFO** — a known v1 limitation. The platform does not yet support this data layer. Disclosed transparently; does not affect delivery posture.

The client-safe summary exposes gap count and gap classes by severity only. Gap field names, event labels, and remediation notes are withheld.

---

## 7. Client-Safe Summary Model

The client-safe summary is the governed output delivered to sponsors. It is a projection of the internal record, not a copy of it. It exposes:

- `accountabilityStatement` — a plain-language attestation of what the record covers
- `provenanceHash` — the tamper-evident seal of the full record
- `deliveryPosture` — whether the brief reached its intended recipient
- `outcomePosture` — whether prior positions have been verified or remain open
- `gapCount` and `gapClasses` — severity-level gap disclosure only
- `confidenceBands` — aggregate confidence posture across source tiers
- `timelineSummary` — milestone-level timeline only; no raw event data

---

## 8. Internal vs Client-Safe Boundary

The following are withheld from the client-safe summary and must not appear in sponsor-facing output:

- Governance event labels and internal workflow state names
- Actor identifiers — operator names, reviewer IDs, system principals
- Suppression field names and suppression rationale text
- Internal hrefs and record-linking identifiers
- Operator notes and override justifications
- Raw timeline events
- Unavailable source details and their remediation paths

This boundary is a structural whitelist, not a case-by-case editorial judgment.

---

## 9. Future Regulatory Export Path

The record schema is designed to support structured regulatory export without redesign. Subject types active in v1 are `OVERSIGHT_CYCLE`, `RETAINER_ACCOUNT`, and `DELIVERY_ITEM`. `EXECUTIVE_REPORT` and `DECISION_CASE` are defined in the schema and deferred.

When export is required — by a regulator, acquirer, or institutional counterparty — the record produces a deterministic artifact from the existing structure. No reconstruction is required. The hash provides continuity between the live record and any exported copy, and chain anchors can provide internal continuity evidence where a scoped anchor exists.

External verifier receipts, WORM object storage, and RFC3161 timestamping remain designed next steps. They must not be described as active controls until implemented.

---

## 10. Market Positioning

The Decision Provenance Record is not a feature. It is the infrastructure that makes governed advisory credible at institutional scale.

AI makes advice cheap. That is not a threat to the platform — it is the condition the platform is built for. When advice is cheap, the scarce resource is accountability. The platform sells accountability: a durable, verifiable record of how a consequential position was reached, who verified it, and what was disclosed.

The positioning line for buyers is the same as the internal thesis: AI makes advice cheap. Provenance makes consequential advice trustworthy.

Platforms without this layer are advisory tools. Platforms with it are governance infrastructure. The distinction will matter.
