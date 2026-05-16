# Decision Provenance: A Two-Minute Walkthrough

*For boards, principals, and serious decision-makers. No technical background required.*

---

## What provenance means

Provenance is the documented record of a decision — not just what was decided, but what was known at the time, who was accountable for it, what changed during the process, and whether the record itself has remained intact since it was sealed.

A provenance record is not a summary you write afterwards. It is built as the decision unfolds, capturing evidence, accountability assignments, and governance milestones in a tamper-evident structure.

---

## What it proves

A governed provenance record can prove:

- **What was recorded.** The specific evidence inputs, confidence levels, and governance assessments that existed at the time.
- **When it was recorded.** Timestamps bound to the record — not editable after the fact.
- **Who was accountable.** Named accountability owners, not diffuse "the team decided."
- **What changed.** Every revision is traceable. The system records what changed, not just the final state.
- **Whether the record is intact.** A cryptographic hash of the canonical record is computed and stored. If the record is altered after sealing, the hash no longer matches — and verification fails.

If a governed decision is later challenged, the system can show what was recorded, when it was recorded, what changed, and whether the client-safe record still matches its stored hash.

---

## What it does not prove

Provenance is not an audit opinion. It does not prove:

- That the decision was correct.
- That the evidence was accurate (only that it was captured and classified).
- That the outcome was good.
- That the record complies with any specific regulatory standard unless that compliance layer has been explicitly built and verified.

Provenance proves *process integrity* — not outcome quality.

---

## Why a board cares

A board is ultimately accountable for material decisions, even ones delegated to management. When a decision is challenged — by regulators, investors, counterparties, or in litigation — the board needs to demonstrate that:

1. A structured process was followed.
2. Material risks were identified and assessed.
3. Named individuals were accountable, not committees.
4. The record of that process has not been altered.

Without provenance, "we followed a proper process" is an assertion. With provenance, it is a verifiable record.

---

## Why a regulator cares

Regulators increasingly require evidence of *how* decisions were made, not just *what* was decided. Governance frameworks in financial services, professional services, and regulated industries often require:

- Documented decision rationale
- Identified accountability
- Evidence of risk consideration
- Audit trails that survive personnel changes

A governed provenance record provides a structured, hash-verified audit trail that can be produced in response to regulatory enquiry — without requiring manual reconstruction from emails and meeting notes.

---

## Why a client cares

A client commissioning a significant decision — a restructuring, a transaction, a strategic pivot — has a legitimate interest in knowing that the process was defensible. Provenance gives a client:

- A client-safe summary of what was recorded (without exposing internal review notes or suppressed fields)
- A hash they can verify independently
- A chain of custody showing when key milestones occurred
- Confidence that the record has not been altered since it was sealed

This is especially relevant for clients who face their own governance obligations — institutional investors, professional services firms, regulated entities — who need to demonstrate due diligence in the decisions they commission.

---

## What happens when a record changes

Every governed record has a canonical form — a precise, stable serialisation of its contents. When the record is sealed, a SHA-256 hash of that canonical form is stored.

If anything in the record changes after sealing — a field is edited, a note is added, a date is corrected — the canonical form changes. The new hash no longer matches the stored hash. Verification returns MISMATCH.

This means tampering is structurally detectable, not merely prohibited. You do not need to trust that no one edited the record. You can verify it.

---

## How verification works in plain English

1. The system holds a governed record — a structured object capturing a decision and its governance history.
2. It also holds a hash: a 64-character string computed from the exact content of that record when it was sealed.
3. When you click "Verify integrity," the system recomputes the hash from the current record — using the same algorithm, the same field ordering, the same rules.
4. It compares the recomputed hash to the stored hash.
5. If they match: **MATCH** — the record is intact.
6. If they differ: **MISMATCH** — something changed after sealing. Do not rely on this record until it has been reviewed.
7. If the record cannot be reached or the hash cannot be computed: **UNAVAILABLE** — verification is temporarily not possible.

The hash is not a password. It is a fingerprint. Change one character in the record, and the fingerprint changes entirely. This property — called collision resistance — is why SHA-256 is used in cryptographic systems worldwide.

---

*This document describes the provenance model used by Abraham of London for supported governed records. It does not constitute legal advice. The verification system demonstrates structural tamper-evidence — it does not replace independent legal or regulatory review.*
