# Adversarial Free Signal Adoption Layer

**Generated:** 2026-05-31

---

## Overview

Added one controlled adversarial challenge to the Free Signal output across all public kernel-backed apertures. The adversarial preview proves perception without revealing the full dossier.

## Routes Updated

| Route | Change |
|---|---|
| `POST /api/public/kernel-signal` | Added `adversarialPreview` field to response type |
| `components/kernel/FreeSignalResult.tsx` | Added "How this would be attacked" section |
| `lib/kernel/adversarial-preview.ts` | **Created** — selection logic for one controlled challenge |

## Field Added

```typescript
adversarialPreview: {
  label: string           // e.g. "Board governance challenge"
  challenge: string       // Plain-language attack vector
  challengedBy?: string   // e.g. "board", "investor", "regulator", "legal"
  whyItMatters: string    // Why this specific weakness matters
} | null
```

**Selection rules:**
- Choose highest-severity adversarial challenge
- Prefer specific challenge over generic
- If no meaningful challenge exists, omit field (null)
- Low-stakes cases always omit
- Never fabricate a challenge

## Challenge Library (16 mappings)

| Challenge ID | Label | Challenged By |
|---|---|---|
| `board-pressure-vs-reservations` | Board governance challenge | board |
| `executive-vs-governance` | Management pre-decision risk | board |
| `urgency-vs-legal-concern` | Legal risk vs urgency conflict | legal |
| `strategic-commitment-vs-capability` | Irrevocable commitment risk | operator |
| `reputational-threat-vs-response-gap` | Reputational response gap | journalist |
| `pr-vs-legal-conflict` | PR vs legal conflict | legal |
| `obligation-vs-resources` | Obligation vs resource constraint | regulator |
| `deadline-vs-cash` | Deadline vs cash constraint | regulator |
| `claim-vs-evidence` | Unsupported claim risk | investor |
| `launch-vs-readiness` | Launch readiness conflict | operator |
| `revenue-vs-readiness` | Revenue pressure vs readiness | operator |
| `supply-failure-vs-customer-obligation` | Supply chain vs customer obligation | customer |
| `ownership-vs-accountability` | Ownership accountability gap | operator |
| `commercial-claim-vs-evidence-gap` | Commercial proof gap | investor |
| `investor-claim-vs-evidence` | Investor claim proof gap | investor |
| `existential-threat-vs-resources` | Existential risk vs resource gap | regulator |

## Examples for Four Danger Scenarios

### Board Political Pressure
> **Board governance challenge — challenged by board**
> *"The board is being asked to decide while material reservations from directors remain undocumented. A dissenting director or later reviewer would attack the decision record first — not the decision itself, but whether proper process was followed before the vote."*
> *Why it matters: A decision reached without documented dissent is vulnerable to challenge regardless of its merits.*

### Strategic Asymmetric Partnership
> **Irrevocable commitment risk — challenged by operator**
> *"The proposed commitment would permanently restrict or eliminate a current capability — through IP transfer, exclusivity, or absence of exit rights. A future operator would attack the decision to accept permanent constraint without documenting the optionality lost."*
> *Why it matters: Irrevocable commitments cannot be undone.*

### Executive Reputational Exposure
> **PR vs legal conflict — challenged by legal**
> *"The PR team and legal team have conflicting recommendations on public response. Any statement made while this conflict is unresolved may prejudice potential proceedings."*
> *Why it matters: Legal clearance is not a procedural step — it is protection.*

### Market Claim
> **Unsupported claim risk — challenged by investor**
> *"A claim is being made — about market position, growth, or customer adoption — but the supporting evidence is absent or weak. An investor, buyer, or competitor would attack the claim first, not the product."*
> *Why it matters: A claim that cannot be substantiated is a liability.*

## Tier Boundary

| Field | Free Signal | Full Dossier |
|---|---|---|
| One adversarial preview | ✅ Allowed | ✅ Allowed |
| Full adversarial challenge list | ❌ Forbidden | ✅ Included |
| Self-adversarial challenge | ❌ Forbidden | ✅ Included |
| Evidence graph | ❌ Forbidden | ✅ Included |
| Authority map | ❌ Forbidden | ✅ Included |
| Constraint graph | ❌ Forbidden | ✅ Included |
| Complete fallback path | ❌ Forbidden | ✅ Included |
| Record reference | ❌ Forbidden | ✅ Included |

## Leak Checks

| Check | Result |
|---|---|
| No `adversarialChallenges` array in API response | ✅ |
| No `selfAdversarialChallenge` in API response | ✅ |
| No `evidenceGraph` in API response | ✅ |
| No `authorityMap` in API response | ✅ |
| No `constraintGraph` in API response | ✅ |
| No checkout/pricing in Free Signal routes | ✅ |

## Test Results

| # | Test | Result |
|---|---|---|
| 1 | Board scenario shows one adversarial preview | ✅ |
| 2 | Strategic partnership shows adversarial preview | ✅ |
| 3 | Reputational scenario shows adversarial preview | ✅ |
| 4 | Market claim shows adversarial preview | ✅ |
| 5 | Low-stakes preference has no adversarial preview | ✅ |
| 6 | No full adversarial list leaks in Free Signal | ✅ |
| 7 | No Full Dossier fields in adversarial preview | ✅ |
| 8 | All danger scenarios produce adversarial preview | ✅ |

## Integrity Checks

| Check | Result |
|---|---|
| Public route integrity | ✅ All passed |
| Commerce architecture integrity | ✅ All passed |
| Admin surface integrity | ✅ All passed |
| Decision brief commerce | ✅ All passed |
| Full test suite | ✅ 388 passed, 21 files |

## Readiness Verdict

**READY_FOR_STRIPE_TEST_SMOKE**

The adversarial preview layer is live across all public kernel-backed apertures. It proves perception without revealing paid dossier content. The adoption surface is strengthened — users now see not just what the system saw, but what an adversary would attack.
