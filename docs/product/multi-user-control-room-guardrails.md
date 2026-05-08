# Multi-User Control Room Guardrails

**Date:** 2026-05-07
**Authority:** Decision Infrastructure by Abraham of London
**Rule:** Team/enterprise is not a copied individual dashboard. It is a governed institutional intelligence surface with privacy, role, and aggregation rules.

---

## Hard Rules

These rules are non-negotiable. They must be enforced in code, not just copy.

### 1. Raw respondent text must not be visible to sponsor by default
- Anonymous campaigns: sponsor sees aggregated signals only, never individual text.
- Named campaigns: sponsor sees identity + scores, never raw free-text answers unless explicitly designed and consented.
- Admin/operator: may see response metadata for audit purposes, never raw text in anonymous mode.

### 2. Anonymous campaigns must never expose identity through small sample sizes
- Minimum aggregation threshold: 3 respondents for any reported signal.
- If a domain has fewer than 3 responses, that domain's results are suppressed with: "Insufficient respondent sample for this domain."
- Never display per-respondent breakdowns when campaign is anonymous.

### 3. Divergence reports must aggregate unless named mode is explicit
- Divergence = gap between leadership perception and aggregated respondent signal.
- In anonymous mode: only aggregated divergence shown. No individual attribution.
- In named mode: individual divergence visible to sponsor only if respondent consented.

### 4. Enterprise Living Case must distinguish individual evidence from aggregate signal
- Individual evidence nodes (from a single user's diagnostic) are tagged `SELF_REPORTED` or `STRUCTURED_DIAGNOSTIC`.
- Aggregate evidence nodes (from multi-respondent campaigns) are tagged `MULTI_RESPONDENT`.
- Enterprise Living Case never conflates individual and aggregate evidence tiers.
- Display must clearly label: "Individual assessment" vs "Team aggregation" vs "Enterprise aggregation."

### 5. Payment must not override admission or privacy rules
- Paying for Executive Reporting does not grant access to raw respondent data.
- Paying for Strategy Room does not bypass admission gate.
- Organisation-level payment grants access to aggregated reports, not individual case data.

### 6. Admin operators must have role-scoped access
- Super Admin: full access including system health, audit logs.
- Operator: admissions, campaigns, queues — not financial data.
- Reviewer: evidence integrity, proof — not user identity.
- Finance: entitlements, revenue — not case content.
- Evidence Auditor: evidence integrity — not individual responses.
- Support: access management — not case intelligence.

---

## View Architecture

### Sponsor View (Organisation Control Room)
The sponsor sees:
- Organisation current state (aggregated)
- Active campaigns with completion rates
- Aggregated evidence tier
- Divergence map (aggregated)
- Admission readiness for ER / Strategy Room
- Intervention queue
- Outcome verification status
- Enterprise decision credit (aggregated)

The sponsor does NOT see:
- Individual respondent scores (anonymous mode)
- Raw response text
- Individual Living Cases (unless the sponsor is also the case owner)
- System audit logs
- Other organisations' data

### Respondent View
The respondent sees:
- Their own invitation and campaign context
- Assessment questions
- Confirmation of submission
- Anonymity assurance (anonymous mode)

The respondent does NOT see:
- Other respondents' answers
- Aggregated results (unless sponsor shares)
- Sponsor's leadership scores
- Divergence analysis

### Admin/Operator View
The operator sees:
- All organisations (role-scoped)
- Campaign completion and health
- Evidence integrity metrics
- Admission queues
- Audit logs

The operator does NOT see:
- Raw respondent text (anonymous mode)
- Individual financial data beyond entitlements
- Anything outside their role scope

---

## Organisation Roles

| Role | Scope | Can create campaigns | Can view aggregated results | Can view individual responses | Can commission ER/SR |
|------|-------|---------------------|-----------------------------|-----------------------------|--------------------|
| Sponsor | Organisation | YES | YES | Named mode only | YES |
| Decision Owner | Case | NO | Own case only | Own only | YES (own case) |
| Respondent | Campaign | NO | NO | Own only | NO |
| Observer | Organisation | NO | YES (read-only) | NO | NO |
| Reviewer | Organisation | NO | YES | NO | NO |
| Admin | Global | YES | YES | Audit-only metadata | YES |

---

## Campaign Modes

### Named Mode
- Respondent identity visible to sponsor
- Individual scores visible to sponsor
- Respondent must consent to named participation at invite acceptance
- Raw text answers still not visible (only scores and selections)

### Anonymous Mode
- Respondent identity never visible to sponsor
- Only aggregated signals visible
- Minimum 3 respondents for any reported domain
- Small-sample suppression enforced
- No per-respondent breakdown

---

## Multi-User Living Case Rules

| Rule | Enforcement |
|------|-------------|
| Individual Living Case owned by individual | System — `subjectKey` based on email |
| Enterprise Living Case aggregates campaign evidence | System — `organisationKey` on journey |
| Individual and aggregate evidence clearly labelled | UI — evidence origin classification |
| Individual cases are private to the case owner | System — API returns only authenticated user's cases |
| Enterprise aggregation requires campaign completion | System — threshold enforcement before aggregation |

---

## What Control Room v0 must NOT include

See `docs/product/control-room-v0-scope-lock.md` for full scope lock.
