# Evidence Route Substance Audit

**Date:** 2026-05-07
**Scope:** All homepage evidence links and /evidence routes
**Standard:** Routes must exist, contain substantive content, and support Decision Infrastructure claims.

---

## Homepage evidence links

The homepage (`pages/index.tsx`) renders `HomeEvidenceSection` which links to three evidence routes:

| Link | Route | Exists? | Content Source | Substantive? | Status |
|------|-------|---------|---------------|-------------|--------|
| "When Growth Models Broke Under Tariff Shock" | `/evidence/tariff-shock-growth-break` | YES | Static: `ASSETS` object in `pages/evidence/[slug].tsx` | YES — 13+ sections | **STRONG** |
| "The Illusion of Team Alignment Under Pressure" | `/evidence/team-alignment-illusion` | YES | Static: `ASSETS` object | YES — 13+ sections | **STRONG** |
| "Why Escalation Was Denied (And That Saved the System)" | `/evidence/escalation-denied-case` | YES | Static: `ASSETS` object | YES — 13+ sections | **STRONG** |

---

## Evidence page structure

**File:** `pages/evidence/[slug].tsx`
**Data:** `const ASSETS: Record<string, EvidenceAsset>` — hardcoded TypeScript object
**Rendering:** Static generation via `getStaticPaths` / `getStaticProps`

### Content depth per case

Each evidence dossier contains:

1. **Classification** — condition type, domain, evidence basis
2. **Confidence** — scored confidence level with evidence basis labels (Observed, Modelled, Inferred)
3. **Signal register** — key observations from the case
4. **Decision frame** — the decision that was under pressure
5. **Timeline** — sequence of events
6. **Counterfactual** — what would have happened without intervention
7. **Board actions** — decisions taken by leadership
8. **Failure patterns** — structural failure modes identified
9. **System trace** — how the system detected and responded
10. **Intervention** — what the system recommended
11. **Outcome** — verified result
12. **Outcome verification** — evidence that intervention worked
13. **Institutional memory** — what the system learned

This is substantive, outcome-verified content. Not placeholder.

---

## Evidence index page

**File:** `pages/evidence/index.tsx`
**Route:** `/evidence`
**Content:** Listing page that links to the three case dossiers

---

## Public proof blocks (homepage)

**Components:** `components/proof/PublicProofBlocks.tsx`
**API:** `GET /api/proof/public`
**Data source:** `proof_evidence` table via Prisma

| Block | What it shows | Data source | Fallback |
|-------|-------------|-------------|----------|
| `AccuracyMetricsBlock` | Precision %, clarification %, next-step-changed % | DB: approved public proof evidence | Returns null if sample < 5 |
| `ObservedOutcomesBlock` | Anonymised outcome summaries | DB: approved public proof evidence | Falls back to 3 canned statements |

### Fallback content (when DB has insufficient approved evidence)

```
"Leadership misalignment identified → decision cadence stabilised within 30 days"
"Governance drift detected → execution clarity restored across teams"
"High-risk decisions surfaced early → escalation prevented structural damage"
```

**Assessment:** The fallback is generic but not misleading. It describes patterns the system is designed to detect. However, once real proof evidence accumulates, the fallback should be deprecated to maintain integrity.

---

## Classification

| Route | Content Type | Stale? | Thin? | Placeholder? | Strong? |
|-------|-------------|--------|-------|-------------|---------|
| `/evidence/tariff-shock-growth-break` | Static dossier | No | No | No | **YES** — full outcome-verified case |
| `/evidence/team-alignment-illusion` | Static dossier | No | No | No | **YES** — full outcome-verified case |
| `/evidence/escalation-denied-case` | Static dossier | No | No | No | **YES** — full outcome-verified case |
| `/evidence` (index) | Static listing | No | No | No | **YES** — links to all three cases |
| `/api/proof/public` | DB-backed API | N/A | Depends on DB | No | **CONDITIONAL** — strong when evidence exists, canned fallback otherwise |

---

## Does the evidence support Decision Infrastructure claims?

| Claim | Evidence support |
|-------|----------------|
| The system detects weak logic | YES — tariff shock case shows model assumptions exposed before updating |
| The system detects contradiction | YES — team alignment case shows hidden alignment failure |
| The system restricts or refuses | YES — escalation denied case shows system preventing premature escalation |
| The system shows consequence | YES — all three cases include counterfactual and cost analysis |
| The system remembers patterns | PARTIAL — evidence dossiers show institutional memory sections but these are static narratives, not live engine output |
| The system gives value before commitment | YES — all evidence is publicly accessible, no paywall |

---

## Remaining gaps

1. **Evidence is static, not engine-generated.** The three case dossiers are hardcoded TypeScript objects, not pulled from a database or generated by the assessment engine. They are substantive and outcome-verified, but they do not demonstrate live system capability.

2. **Only three cases exist.** For a system that claims to govern decisions across organisations, three anonymous cases is thin. Additional cases should be added as real outcomes accumulate.

3. **Proof blocks depend on DB population.** The homepage proof metrics (`AccuracyMetricsBlock`, `ObservedOutcomesBlock`) are designed to show real metrics but fall back to canned statements when the database has insufficient approved evidence. Monitor the `proof_evidence` table and ensure approval workflow is active.

4. **No evidence route links from diagnostic results.** When a user completes a diagnostic, the result surface does not link to evidence cases that match their condition. Adding contextual evidence links would strengthen the proof loop.
