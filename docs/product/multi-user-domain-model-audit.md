# Multi-User Domain Model Audit

**Date:** 2026-05-07
**Scope:** All Prisma models relevant to multi-user, paid ladder, and command centre architecture.

---

## Core User & Organisation Models

| Model | Status | Multi-user | Organisation | Payment | Evidence | Notes |
|-------|--------|-----------|-------------|---------|---------|-------|
| `User` | EXISTS | YES — id, email, role | Via memberships | Via Entitlement | Via DiagnosticJourney | Clerk-managed auth |
| `Organisation` | EXISTS | YES — members | YES — slug, sector, sizeBand | Via campaigns | Via campaigns | Full org model present |
| `OrganisationMembership` | EXISTS | YES — roleTitle, seniorityBand, isExecutive | YES — organisationId | N/A | N/A | Rich role metadata |
| `InnerCircleMember` | EXISTS | YES — admin tier | N/A | Via tier | N/A | Separate from User — admin/operator identity |

**Assessment:** Strong foundation. Organisation → Membership → Campaign chain exists. User and InnerCircleMember are separate identity pools (customer vs. operator).

---

## Entitlement & Access Models

| Model | Status | Multi-user | Organisation | Payment | Notes |
|-------|--------|-----------|-------------|---------|-------|
| `Entitlement` | EXISTS | YES — userId | N/A | YES — type, key, status | Fine-grained per-user |
| `ClientEntitlement` | EXISTS | YES — email | N/A | YES — productCode, tier | Email-based, fast lookup |
| `AccessKey` | EXISTS | YES | N/A | N/A | Code-based access grants |
| `BillingCustomer` | EXISTS | YES — email | N/A | YES — stripeCustomerId | Stripe binding |

**Assessment:** Dual-path entitlement (User-level + email-level). No organisation-level entitlement model yet. **Required change:** Add organisation-level entitlement or derive from member entitlements.

---

## Campaign & Assessment Models

| Model | Status | Multi-user | Organisation | Notes |
|-------|--------|-----------|-------------|-------|
| `AlignmentCampaign` | EXISTS | YES — participants | YES — organisationId | Full campaign lifecycle |
| `CampaignParticipant` | EXISTS | YES — email, inviteToken | Via campaign | Status tracking |
| `TeamAssessmentCampaign` | EXISTS | YES — invites, responses | Via campaign | Named/anonymous modes |
| `TeamAssessmentInvite` | EXISTS | YES — tokenHash, email | Via campaign | Expiring invites |
| `TeamAssessmentResponse` | EXISTS | YES — respondent | Via campaign | Scored responses |
| `EnterpriseAssessment` | EXISTS | YES — participantId | YES — organisationId | Per-participant scoring |

**Assessment:** Multi-respondent campaign flow is fully modelled. Named and anonymous modes supported via invite tokens. Aggregation models exist (TeamAssessmentSnapshot, TeamAssessmentAggregate, OrganisationAssessmentSnapshot).

---

## Diagnostic & Journey Models

| Model | Status | Multi-user | Organisation | Evidence | Notes |
|-------|--------|-----------|-------------|---------|-------|
| `DiagnosticJourney` | EXISTS | YES — email, userId | YES — organisationKey | YES — evidenceNodes, decisionObjects | Core Living Case source |
| `DiagnosticEvidenceNode` | EXISTS | YES — email, userId | Via journey | YES — sourceStage, kind, severity | Rich evidence taxonomy |
| `DiagnosticDecisionObject` | EXISTS | YES — email, userId | Via journey | YES — confidence, aiExposure | Canonical decision |
| `DiagnosticRecord` | EXISTS | YES — userEmail | N/A | YES — score, severity | Legacy diagnostic store |

**Assessment:** Journey model is strong. OrganisationKey on DiagnosticJourney enables org-level aggregation. Evidence nodes have rich taxonomy.

---

## Strategy Room & Execution Models

| Model | Status | Multi-user | Organisation | Payment | Notes |
|-------|--------|-----------|-------------|---------|-------|
| `StrategyInquiry` | EXISTS | YES — email | N/A | N/A | Enrollment intake |
| `StrategyRoomSession` | EXISTS | YES — userId | N/A | Via entitlement | Session management |
| `StrategyRoomExecutionSession` | EXISTS | YES — email | N/A | Via entitlement | Execution tracking |
| `StrategyDecisionLog` | EXISTS | YES — sessionId | N/A | N/A | Decision audit trail |
| `RetainerContract` | EXISTS | N/A | YES — organisationId | YES — billing | Enterprise retainer |

**Assessment:** Strategy Room is user-level. Retainer contracts are organisation-level. Good separation.

---

## Outcome & Proof Models

| Model | Status | Multi-user | Notes |
|-------|--------|-----------|-------|
| `OutcomeVerificationRecord` | EXISTS | YES — journeyId | Outcome at 14/30 days |
| `ProofEvidence` | EXISTS | N/A | Approval + publication workflow |
| `CalibrationState` / `CalibrationEvent` | EXISTS | N/A | System accuracy |

---

## Required Changes for Multi-User Architecture

| Change | Priority | Risk |
|--------|----------|------|
| Organisation-level entitlement (derive from member entitlements or add model) | NEXT | LOW |
| Decision Centre API route (`/api/decision-centre/cases`) | NOW | LOW |
| Control Room API route for org sponsors | NEXT | LOW |
| Operator Console navigation restructure | NEXT | LOW |
| Campaign completion threshold enforcement | NEXT | LOW |
| Respondent privacy rules documentation | NOW | NONE |
