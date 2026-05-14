# Decision Provenance — Market and Compliance Positioning

**Internal Doctrine — Commercial and Regulatory Positioning Source Material**

---

## 1. Core Thesis

> AI makes advice cheap. Provenance makes consequential advice trustworthy.

The platform does not compete on AI quality alone. AI quality is a commodity that improves across the industry every quarter. The platform competes on **accountability** — the durable, verifiable record of what happened to a governed decision, who touched it, what was suppressed, what was delivered, and what outcome was recorded.

This thesis applies across all buyer segments:

- **Institutional buyers** do not need better AI. They need proof that the AI-driven process is governed, auditable, and defensible.
- **Operators** do not need more dashboards. They need to know which decision chains are incomplete before a client asks.
- **Board and counsel** do not need more analysis. They need the accountable record, not just the final output.

---

## 2. Market Problem

AI-generated outputs create an accountability gap that existing tools do not address:

| Tool Category | What It Tracks | What It Misses |
|---|---|---|
| **Audit logs** | System events, API calls, user actions | Decision context, evidence chain, suppression rationale, outcome verification |
| **GRC platforms** | Policies, risks, controls, compliance evidence | Per-decision provenance, confidence weighting, deterministic hash chain |
| **Workflow history** | Task status, assignees, completion dates | Evidence inputs, governance events, delivery proof, outcome linkage |
| **AI governance dashboards** | Model metrics, bias scores, usage statistics | Per-instance accountability, human review trail, client-safe boundary |

The gap is not technical — it is structural. Existing tools track *what happened to the system*. Provenance tracks *what happened to the decision*.

---

## 3. Category Contrast

The platform operates in a category that is still being defined. The following table clarifies how provenance relates to adjacent categories:

| Category | Primary Question | Output | Time Horizon |
|---|---|---|---|
| **Process automation** | "Is the task done?" | Status dashboard | Real-time |
| **Decision intelligence** | "What should we decide?" | Analysis, score, recommendation | Forward-looking |
| **Decision accountability** | "What happened to the decision?" | Provenance record, hash, gap analysis | Historical + verifiable |

Provenance is not a replacement for process automation or decision intelligence. It is the **accountability layer** that sits beneath both, answering the question neither addresses: *"Can we prove what happened?"*

---

## 4. Buyer Anxiety

### 4.1 Institutional Buyer (General Counsel, Head of Governance)

| Anxiety | Provenance Answer |
|---|---|
| "Can I prove who reviewed this decision?" | Each operator review is recorded as a governance event with timestamp and decision outcome. The accountability statement counts reviews explicitly. |
| "Can I show what was suppressed and why?" | The suppression ledger records every withheld field, the reason, and whether an operator reviewed it. The client-safe summary confirms suppression count and severity class. |
| "Can I demonstrate delivery and outcome?" | Delivery approval and sent events are recorded with method and timestamp. Outcome verification is linked by subjectType/subjectId. Gaps are surfaced when either is missing. |
| "Can I defend this process to a board, client, regulator, or court?" | The accountability statement is a deterministic, restrained attestation of what the record covers. It does not overclaim. The hash enables independent verification. |

### 4.2 Operator (Head of Operations, Senior Operator)

| Anxiety | Provenance Answer |
|---|---|
| "Which cycles are incomplete?" | The gap monitor surfaces all cycles with missing delivery, missing outcome, unreviewed suppressions, or unavailable sources — sorted by severity. |
| "What needs my attention right now?" | The operator command centre queues show pending, overdue, and failed items across all operational surfaces. |
| "Will a client ask about something I missed?" | Provenance gaps are surfaced before delivery. The accountability statement honestly reports what is and is not recorded. |

### 4.3 Board and Counsel

| Anxiety | Provenance Answer |
|---|---|
| "Is this process defensible?" | The provenance record provides a deterministic, hash-verifiable chain of evidence inputs, governance events, and delivery proof. |
| "Can we see the full record, not just the summary?" | The internal DecisionProvenanceRecord is available to authorised operators. The client-safe summary is a structural subset with the same hash. |
| "What happens if we are audited?" | The provenance record can be produced for any governed cycle. The hash provides continuity between the live record and any exported copy. |

---

## 5. Compliance Mapping

**Important:** This section maps platform capabilities to common compliance concepts. It does not claim legal compliance with any specific regulation (GDPR, SOC 2, ISO 27001, etc.). Certification against specific standards requires independent audit.

| Compliance Concept | Provenance Capability | Current Status |
|---|---|---|
| **Logging** | Governance events record every operator review, suppression, delivery, and outcome. Events include type, timestamp, and actor. | ✅ Implemented |
| **Records of processing** | The full DecisionProvenanceRecord is a structured record of what happened to a governed decision, from evidence inputs through delivery and outcome. | ✅ Implemented |
| **Audit trail** | The provenance hash provides tamper-evident integrity. The gap monitor surfaces incomplete chains. The integrity helper detects hash mismatches. | ✅ Implemented |
| **Access control** | The admin shell guards all provenance surfaces via `requireAdminServer` or `requireAdminPage`. The client-safe summary is a structural subset. | ✅ Implemented |
| **Evidence weighting** | Each evidence input carries a confidence tier (USER_REPORTED through THIRD_PARTY) with a deterministic reason and source type. | ✅ Implemented |
| **Retention** | Retention periods are defined by record class. Pseudonymisation strategy is documented. Legal hold and deletion workflows are specified. | 📋 Designed (not implemented) |
| **Human review** | Operator review events are recorded with decision outcome and timestamp. Gaps are surfaced when operator review is missing. | ✅ Implemented |
| **Outcome verification** | Outcome records are linked to subjects via subjectType/subjectId. Delivery-sent-without-outcome is surfaced as a WARNING gap. | ✅ Implemented |
| **Immutability** | Current: hash stored in AuditEvent metadata. Target: content-addressed storage + per-subject hash chain + daily Merkle roots + WORM storage. | 📋 Phased roadmap |

---

## 6. Differentiators

The following capabilities distinguish Decision Provenance from audit logs, GRC tools, workflow history, and AI governance dashboards:

### 6.1 Confidence-Weighted Evidence

Every evidence input carries a confidence tier: `USER_REPORTED`, `SYSTEM_INFERRED`, `OPERATOR_VERIFIED`, or `THIRD_PARTY`. The tier is never upgraded. The client-safe summary exposes aggregate confidence bands, not source-level attribution.

**Why it matters:** Not all evidence is equal. A system-inferred signal has different weight than an operator-verified outcome. Exposing this gradient is what makes provenance useful for decision-making, not just record-keeping.

### 6.2 Client-Safe Boundary

The client-safe summary is a structural whitelist, not a case-by-case editorial judgment. Governance event labels, actor identifiers, suppression field names, internal hrefs, operator notes, and raw timeline events are structurally excluded.

**Why it matters:** The boundary is deterministic and auditable. There is no judgment call about what to exclude — the structure defines it. This is defensible in a regulatory context.

### 6.3 Provenance Gaps

The provenance record does not just track what happened. It also tracks what *should have happened but did not*. Missing delivery, missing outcome, unreviewed suppressions, and unavailable sources are surfaced with severity levels and remediation guidance.

**Why it matters:** Most audit systems only show what exists. Provenance gaps show what is missing — turning provenance from a passive record into an active quality signal.

### 6.4 Deterministic Accountability Statement

The accountability statement is generated by deterministic rules, not by AI or human writing. It counts evidence inputs, operator reviews, suppressions, escalations, delivery status, and outcome status. It never fabricates verification.

**Why it matters:** The statement is reproducible and auditable. Any two operators composing the same record get the same statement. There is no variation, no interpretation, no overclaim.

### 6.5 Internal/Client Hash Linkage

The client-safe summary carries the same `provenanceHash` as the full internal record. This enables external verification without exposing internal detail: a client can verify that their summary was derived from the same record the operator reviewed.

**Why it matters:** The hash is the proof link between internal operations and client-facing output. Without it, the client has no way to verify that the summary corresponds to the actual record.

### 6.6 Future Immutable Chain

The design specification defines a path to per-subject hash chains, daily Merkle roots, and WORM storage. These are not implemented yet, but the architecture is designed to support them without breaking existing records.

**Why it matters:** The roadmap demonstrates that the provenance layer is designed for the future, not just for current needs. Buyers evaluating the platform for multi-year engagements can see the trajectory.

---

## 7. Buyer-Facing Language

### 7.1 Institutional

> "Verifiable chain-of-custody for governed decisions. Every oversight cycle produces a deterministic record of what evidence was used, who reviewed it, what was suppressed, what was delivered, and what outcome was recorded. The record is hash-verifiable and client-safe by structural design."

### 7.2 Operator

> "Know which decision chains are incomplete before the client asks. The operator command centre surfaces all cycles with missing delivery, missing outcome, unreviewed suppressions, or unavailable sources — sorted by severity, with remediation guidance."

### 7.3 Board / Counsel

> "Review the accountable record, not just the final output. The provenance record provides a deterministic, hash-verifiable chain from evidence through delivery and outcome. The client-safe summary carries the same hash as the internal record, enabling independent verification."

### 7.4 Short Form

> "AI makes advice cheap. Provenance makes consequential advice trustworthy."

---

## 8. Red Lines

The following claims must never be made in buyer-facing materials unless independently certified:

| Claim | Why It Is a Red Line |
|---|---|
| "Guarantees compliance" | Compliance is determined by regulatory bodies, not by platform architecture. No single feature guarantees compliance with any regulation. |
| "Immutable" | The current implementation stores hashes in a database that can be modified by administrators with sufficient access. True immutability requires WORM storage or blockchain anchoring, which are not yet implemented. |
| "Verified" | Evidence confidence tiers are assigned by the system based on source type, not by independent verification. Only `THIRD_PARTY` confidence represents external verification. |
| "Regulator-approved" | No regulatory body has reviewed or approved the provenance architecture. |
| "Tamper-proof" | The hash provides tamper *evidence*, not tamper *prevention*. A determined attacker with database access could modify both the record and the hash. |
| "Blockchain-secured" | No blockchain anchoring is implemented. The roadmap includes it as a future option, not a current capability. |

### Safe Alternatives

| Instead of | Say |
|---|---|
| "Guarantees compliance" | "Supports audit readiness by maintaining a deterministic record of governance events." |
| "Immutable" | "Hash-verifiable. Any change to the record produces a different hash, enabling detection." |
| "Verified" | "Confidence-weighted. Each evidence input is classified by source type, from user-reported through operator-verified." |
| "Tamper-proof" | "Tamper-evident. The hash changes when the record changes, enabling integrity checks." |

---

## 9. Future Assets

The following assets should be created as the provenance layer matures:

| Asset | Purpose | Priority | Prerequisite |
|---|---|---|---|
| **Compliance matrix** | Map each provenance capability to specific regulatory requirements (SOC 2, ISO 27001, GDPR). Useful for procurement questionnaires. | Medium | Stable feature set |
| **Provenance white paper** | Public-facing technical explainer. Establishes category leadership and educates buyers on why provenance matters. | High | Stable API + UI |
| **Client-safe sample provenance summary** | An anonymised example of the client-safe provenance output. Buyers can see exactly what they would receive. | High | Stable output format |
| **Regulatory export pack concept** | Design for a bundled export of all provenance records for a given period, with hash verification. Useful for regulatory submissions. | Low | Phase 2+ of immutability roadmap |
| **Buyer one-pager** | Single-page PDF answering "What is Decision Provenance and why does it matter?" | High | Stable messaging |
| **Competitive comparison** | Map provenance capabilities against audit log, GRC, workflow, and AI governance tool capabilities. | Medium | Competitor research |

---

## 10. Summary

Decision Provenance is the platform's core category-defining layer. It answers a question that no existing tool addresses: *"What happened to the decision?"*

- **For institutional buyers**, it is verifiable proof of process integrity.
- **For operators**, it is automatic gap detection across all managed cycles.
- **For board and counsel**, it is a deterministic, hash-verifiable accountable record.
- **For the business**, it is a defensible competitive moat that compounds with every additional governed surface.

The positioning must be honest, restrained, and structurally defensible. Never claim compliance, immutability, or verification that the architecture does not support. The architecture is designed to grow into these claims over time — but only certification and independent audit can validate them.
