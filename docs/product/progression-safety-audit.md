# Progression Safety Audit

**Date:** 2026-05-07
**Scope:** Whether progression prompts bypass evidence requirements
**Classification:** GOVERNED | PARTIALLY_GOVERNED | UNGOVERNED | STATIC_CTA_ONLY | UNKNOWN

---

## Progression Path Classification

| From | To | Classification | Gate Mechanism | Bypass Vector | Risk |
|------|-----|---------------|----------------|--------------|------|
| Homepage | `/diagnostics/fast` | **UNGOVERNED** | None — direct link | Anyone can start | LOW — intended as open entry |
| Homepage | `/diagnostics/enterprise-assessment` | **UNGOVERNED** | None — direct link | Anyone can start | LOW — intended as open entry |
| Homepage | `/diagnostics/executive-reporting` | **PARTIALLY_GOVERNED** | Server-side `enforceExecutiveReportingAccess()` redirects if no prior evidence | Direct URL with populated sessionStorage | MEDIUM |
| `/diagnostics/fast` result | Purpose Alignment | **STATIC_CTA_ONLY** | Direct link rendered in result panel | Anyone with result can click through | LOW — free layer, no evidence bypass |
| Purpose Alignment result | Constitutional Diagnostic | **STATIC_CTA_ONLY** | Direct link in post-result section | Anyone can navigate directly | LOW — free layer |
| Constitutional result | Team Assessment | **STATIC_CTA_ONLY** | Link rendered conditionally based on route decision, but href is static | Direct URL access | LOW — free layer |
| Constitutional result | Executive Reporting | **STATIC_CTA_ONLY** | Link rendered conditionally, but ER has server gate | Server gate catches direct access | LOW |
| Team Assessment result | Enterprise Assessment | **STATIC_CTA_ONLY** | Escalation messaging appears when gap is wide, but link is static | Direct URL access | LOW — free layer |
| Enterprise Assessment result | Executive Reporting | **PARTIALLY_GOVERNED** | Server-side `enforceExecutiveReportingAccess()` validates prior stage completion | sessionStorage manipulation | MEDIUM |
| Executive Reporting entry | Checkout/payment | **PARTIALLY_GOVERNED** | Micro-commitment checkpoint (client). `enforceExecutiveReportingAccess()` (server). Checkout requires email. | No payload integrity validation — sessionStorage data not verified server-side | MEDIUM |
| Executive Reporting | Strategy Room | **PARTIALLY_GOVERNED** | Conditional: requires 3+ assessments completed. Strategy Room has server entitlement check. | Entitlement check exists but decision authority gate is client-side advisory only | HIGH |
| Strategy Room enrollment | Execution chamber | **UNGOVERNED** | reCAPTCHA, form validation (name, email, intent >= 12 chars). `evaluateIntake()` and `vetStrategyInquiry()` assess quality. | No check for prior diagnostic completion | HIGH |

---

## Free diagnostic layer (all open — by design)

| Route | Gate | Notes |
|-------|------|-------|
| `/diagnostics/fast` | None | Open entry — intended |
| `/diagnostics/purpose-alignment` | None | Open entry — intended |
| `/diagnostics/constitutional-diagnostic` | None | Open entry — intended |
| `/diagnostics/team-assessment` | None | Open entry — intended |
| `/diagnostics/enterprise-assessment` | None | Open entry — intended |

All free diagnostic stages are intentionally ungoverned at the route level. Any visitor can reach any diagnostic. This is correct — free diagnostics are the entry door. Evidence governance happens at the result level (routing decisions, restriction classifications) and at the transition to paid surfaces.

---

## Paid surface gates

### Executive Reporting

**Server-side:** `enforceExecutiveReportingAccess()` in `getServerSideProps`
- Validates: prior stage completion (enterprise, constitutional, or prior ER run)
- Redirects to required prior stage if evidence is missing
- Classification: **PARTIALLY_GOVERNED**

**Client-side:** `ExecutiveReportingPaywall.tsx`
- Micro-commitment checkpoint: "Are you prepared to act on what this will show?"
- Reads evidence from sessionStorage — not server-validated
- Checkout proceeds if email is provided, regardless of evidence legitimacy
- Classification: **PARTIALLY_GOVERNED** (UX gate, not security gate)

**Vulnerability:** sessionStorage is client-side mutable. A user could inject fake diagnostic results and pass the client-side evidence checks. Server-side redirect catches naive direct URL access but does not validate evidence payload integrity.

### Strategy Room

**Server-side:** `resolveCanonicalEntitlement()` in `getServerSideProps`
- Checks entitlement against slug `"strategy-room.entry"`
- Verifies Stripe checkout session if present
- Classification: **PARTIALLY_GOVERNED**

**Client-side:** `StrategyRoomGate` reads `aol:tension-thread` from sessionStorage
- Calls `deriveDecisionDirective()` — returns "allow", "warn", "restrict", or "block"
- Gate is **advisory only** — page renders fully regardless of directive
- Form submission is not blocked by restriction state
- Classification: **UNGOVERNED** (advisory, not enforced)

**Enrollment:** `enrol-core.ts` validates form inputs and runs reCAPTCHA but does **not check for prior diagnostic completion**. A user can enroll directly without any evidence.

### Return Brief

**Server-side:** `assertStrategyRoomAccess()` validates session token
- Requires valid HMAC-signed token with purpose `["return_brief", "strategy_room_session"]`
- Writes security audit logs on denial
- Classification: **GOVERNED**

---

## Living Intelligence Spine

**File:** `lib/product/living-intelligence-spine.ts`

The spine tracks `stagesCompleted`, `evidenceTier`, and `decision.blocked` state. However:

- Lives in sessionStorage (client-side, mutable)
- No upstream code enforces spine state before granting access
- Spine is informational, not a security boundary

**Recommendation:** For production hardening, spine state should be persisted server-side (DB) and validated on paid surface access.

---

## Summary

| Classification | Count | Progression Paths |
|---------------|-------|-------------------|
| GOVERNED | 1 | Return Brief access |
| PARTIALLY_GOVERNED | 4 | Homepage→ER, Enterprise→ER, ER checkout, ER→Strategy Room |
| UNGOVERNED | 2 | Strategy Room enrollment, Strategy Room decision authority gate |
| STATIC_CTA_ONLY | 5 | All free-to-free transitions (Fast→Purpose, Purpose→Constitutional, Constitutional→Team, Team→Enterprise, Constitutional→ER) |

---

## Risk Assessment (Updated 2026-05-07)

| Risk | Surface | Issue | Mitigation | Status |
|------|---------|-------|-----------|--------|
| HIGH | Strategy Room enrollment | No prior diagnostic required | `lib/strategy-room/admission.ts` created — `evaluateStrategyRoomAdmission()` validates evidence, decision specificity, authority, pre-commitment. Returns typed ADMITTED/RESTRICTED. | **MITIGATED** — module created, pending route integration |
| HIGH | Strategy Room decision authority gate | Client-side advisory only | `admission.ts` calls `enforceStrategyRoomAccess()` server-side with durable thread lookup. Block/restrict directives enforced. | **MITIGATED** — module created, pending route integration |
| MEDIUM | Executive Reporting checkout | sessionStorage evidence not server-validated | `lib/diagnostics/executive-reporting/admission.ts` created — `evaluateERAdmission()` cross-validates client claims against server journey. Detects fabricated stages. | **MITIGATED** — module created, pending route integration |
| MEDIUM | Executive Reporting entry | sessionStorage can be injected | ER admission module validates evidence nodes exist server-side, checks consequence evidence. | **MITIGATED** — module created, pending route integration |
| LOW | Free diagnostic progression | Static CTAs between free layers | By design — no evidence bypass at free tier | N/A |

### Integration status (Updated 2026-05-07)

All admission modules are now wired into live route handlers:

1. **Strategy Room execution** (`app/api/strategy-room/execution/route.ts`): `evaluateStrategyRoomAdmission()` called before session creation. Returns 403 with structured RESTRICTED response if evidence/authority/decision requirements not met. Admission metadata attached to session record. **STATUS: ROUTE-ENFORCED.**

2. **Strategy Room enrollment** (`lib/strategy-room/enrol-core.ts`): `evaluateStrategyRoomAdmission()` called during enrollment. Admission result attached to inquiry metadata. Intake is captured regardless (for follow-up), but admission status is persisted. **STATUS: ROUTE-ENFORCED.**

3. **Executive Reporting checkout** (`pages/api/billing/checkout.ts`): `evaluateERAdmission()` called before Stripe session creation for `executive_reporting` products. Cross-validates client evidence against server journey. Blocks payment if evidence is insufficient or fabricated. **STATUS: ROUTE-ENFORCED.**

4. **Executive Reporting entry** (`pages/diagnostics/executive-reporting.tsx`): `enforceExecutiveReportingAccess()` already called in `getServerSideProps`. Server-side redirect if upstream evidence missing. **STATUS: ROUTE-ENFORCED.**

### Living Case authority

Server-side `deriveLivingCase()` in `lib/product/living-case-store.ts` provides authoritative view over existing Prisma models. sessionStorage remains as UX cache only. All admission modules query server-side journey data, not client state. **STATUS: SERVER-AUTHORITATIVE.**
