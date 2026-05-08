# Retainer Intake Consumption Audit

> Date: 2026-05-08
> Verdict: PERSISTED_NOT_CONSUMED

---

## What Exists

| Layer | Status | Detail |
|-------|--------|--------|
| Contract | EXISTS | `lib/product/retainer-intake-contract.ts` — 10 questions, types, validation, evidence mapping |
| Form UI | EXISTS | `pages/retainer/intake.tsx` — renders questions, validates, submits |
| API endpoint | EXISTS | `pages/api/retainer/intake.ts` — auth, validation, persistence |
| Persistence | EXISTS | `diagnosticRecord` with type `"retainer_intake"` in PostgreSQL |
| Evidence mapping | EXISTS | `retainerIntakeToEvidenceCapture()` maps fields to AssessmentEvidenceCapture |

## What Does NOT Exist

| Layer | Status | Required For |
|-------|--------|-------------|
| Oversight account loader consumption | MISSING | Oversight Brief to reference intake evidence |
| Oversight brief composer consumption | MISSING | Oversight Brief to include intake signals |
| Admin/operator display | MISSING | Operators to see submitted intakes |
| Retainer readiness calculation | MISSING | System to assess readiness from intake |
| Counsel workflow visibility | MISSING | Counsel to see relevant intake context |
| Client-safe retainer page reference | MISSING | Client to see their submitted intake |

## Classification

**FORM_ONLY + API_ONLY + PERSISTED_NOT_CONSUMED**

The form works. The API validates and persists. The data sits in `diagnosticRecord` and is never read by any downstream system. No operator, client, counsel, or automated system consumes the intake after submission.

## Honest Status Summary

A user who fills out the 10-question retainer intake and clicks submit will:
1. See a success message: "Oversight intake recorded. Governance review will follow."
2. Have their data stored in PostgreSQL
3. Never see their intake referenced anywhere in the product
4. Never have their intake influence any oversight, retainer, or governance decision

The success message promises "Governance review will follow" but no review workflow consumes the data.
