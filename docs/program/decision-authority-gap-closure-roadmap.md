# Decision Authority Gap Closure Roadmap

Status: ACTIVE PLAN
Created: 2026-07-18
Scope: Public decision signal, persistence flywheel, paid fulfilment, outcome verification, monitoring, and later router rationalisation.

## Operating Rule

This roadmap is the continuation anchor. Before any future implementation session, read this file first, then inspect only the files named in the active phase. Do not restart with a whole-repo audit unless this file is stale against the current code.

Router migration is deferred. The near-term work must stabilise the current public and commercial paths in place before moving routes between Pages Router and App Router.

## Verified Corrections

The initial gap analysis was directionally right, but two points need precision:

- `lib/decision/kernel.ts` is not a total ghost. `evaluateDecision()` is used by production/runtime paths including `app/api/executive-reporting/run/route.ts`, `app/api/strategy-room/execution/[id]/state/route.ts`, `lib/server/strategy-room/return-brief.server.ts`, `lib/alignment/enterprise-pipeline.ts`, and instrument engines.
- The real gap is narrower and more important: the public acquisition path, `pages/api/public/kernel-signal.ts`, does not feed durable public evidence, contradiction graph state, prediction records, or outcome verification into a compounding flywheel.

There is also a guardrail: `scripts/intelligence-boundary-guard.mjs` forbids public surfaces from importing `@/lib/decision/kernel` directly. Any public use of decision-kernel output must go through a server-side adapter that preserves the public aperture and does not expose internal methods or paid dossier fields.

## Current Evidence Anchors

Public signal route:
- `pages/api/public/kernel-signal.ts`
- `lib/intelligence/decision-intelligence-kernel.ts`
- `lib/intelligence/decision-intelligence-orchestrator.ts`
- `lib/product/diagnostic-journey-store.ts`
- `lib/product/recommendation-outcome-ledger.ts`

Decision kernel:
- `lib/decision/kernel.ts`
- `lib/engine/contradiction-graph.ts`
- `lib/engine/outcome-feedback.ts`
- `lib/engine/decision-simulation.ts`
- `lib/engine/constraint-engine.ts`

Outcome loop:
- `lib/outcomes/evidence.ts`
- `lib/product/outcome-verification-service.ts`
- `components/outcomes/OutcomeVerificationPanel.tsx`
- `scripts/outcome-verification-guard.mjs`

Commercial and fulfilment:
- `pages/api/billing/checkout.ts`
- `pages/api/billing/webhook.ts`
- `pages/api/webhooks/stripe.ts`
- `app/api/stripe/webhook/route.ts`
- `lib/commercial/payment-event-processor.ts`
- `lib/commercial/paid-er-generation.ts`
- `lib/product/product-fulfilment-contract.ts`
- `lib/product/fulfilment-readiness-validator.ts`
- `lib/product/fulfilment-evidence-gates.ts`
- `lib/product/product-knowledge-graph.ts`
- `lib/product/semantic-destination-resolver.ts`

Router governance:
- `docs/architecture/api-surface-rationalisation-ledger.md`
- `docs/security/router-governance.md`
- `docs/security/router-auth-consistency.md`

## Phase 0: Contract Locks Before New Wiring

Objective: make current behaviour explicit, tested, and safe before adding persistence or automation.

Steps:
1. Add a short public-signal contract note to the public route or adjacent test fixture: no raw situation persistence, no paid dossier fields, no internal kernel method exposure.
2. Add or extend tests around `pages/api/public/kernel-signal.ts` so the response shape is pinned for free-signal output.
3. Fix Stripe metadata identity mismatch before increasing paid traffic. `pages/api/billing/checkout.ts` currently writes metadata in a way that can conflict with `lib/commercial/payment-event-processor.ts` identity resolution when entitlement slug, catalog code, and Stripe price ID differ.
4. Add a focused webhook identity test proving checkout metadata resolves to the intended catalog product and entitlement.

Acceptance gate:
- `pnpm test:decision`
- Targeted public aperture tests, especially `tests/product/public-aperture.spec.ts`
- Targeted commercial checkout/webhook identity tests
- No route movement

## Phase 1: Durable Public Signal Persistence

Objective: create the first real data flywheel without exposing or storing sensitive raw input.

Do not start by importing `evaluateDecision()` into `pages/api/public/kernel-signal.ts`. The lowest-risk first slice is to make the existing public path durable.

Steps:
1. Create a server-side public signal persistence adapter around `runDecisionIntelligence()` output.
2. For anonymous public `caseId`s, create a durable `DiagnosticJourney` or equivalent server-side journey record rather than falling back to process memory.
3. Persist only audience-safe fields:
   - `caseId`
   - `surface`
   - `inputHash`
   - safe situation class
   - safe contradiction count or summary
   - safe consequence class
   - recommendation id or product code, if generated
   - timestamps and consent/session boundary
4. Do not persist raw situation text, full living case object, full contradiction graph, paid dossier sections, or prediction claims in this phase.
5. Add idempotency keyed by `caseId` plus input hash so refreshes and retries do not duplicate events.

Acceptance gate:
- `tests/intelligence/orchestrator-journey-persistence.test.ts`
- `tests/product/public-aperture.spec.ts`
- A new test that anonymous public submissions create durable safe events
- A negative test that raw situation text is not persisted

## Phase 2: Public Kernel Adapter, Not Direct Public Kernel Import

Objective: let the public path benefit from accumulated decision-state mechanics without breaching the public aperture.

Steps:
1. Build a server-only adapter that maps public `DecisionIntelligenceResult` into `KernelInput`.
2. Feed only safe, derived signals into `evaluateDecision()`:
   - source: public diagnostic or fast diagnostic
   - condition: safe class or interpreted issue
   - evidenceChain: safe derived patterns
   - internalContradictions: safe contradiction labels
   - scores: safe confidence/pressure/evidence scores
   - existingGraph: loaded from durable public-safe graph snapshot
3. Store a redacted graph snapshot, not the full graph, unless a privacy review approves richer persistence.
4. Return only public-safe derived metrics, such as accumulated depth, pressure band, active contradiction count, and next admissible move.
5. Keep the direct `@/lib/decision/kernel` import out of public route files if the boundary guard requires it.

Acceptance gate:
- Boundary guard remains green
- Public response contains no internal graph nodes, raw evidence chain, paid-only sections, or method vocabulary
- Graph accumulation test proves second submission can extend prior safe state

## Phase 3: Pressure Index and Economic Anchoring

Objective: surface two low-effort, high-leverage conversion and truth signals after persistence exists.

Steps:
1. Add optional cost-of-delay capture to the public decision test UI.
2. Map cost-of-delay to safe derived fields used by the public signal adapter.
3. Compute a monotonic pressure band from unresolved contradiction count, decay, timing pressure, and cost-of-delay.
4. Show pressure as a decision-state metric, not manipulative urgency copy.
5. Feed pressure into product recommendation eligibility, but only for products whose checkout and fulfilment paths are real.

Acceptance gate:
- Public copy remains claim-safe and non-manipulative
- Pressure test proves unresolved repeat submissions do not reduce pressure without new resolving evidence
- No paid CTA points at mock or manual-only fulfilment as if automated

## Phase 4: Outcome Verification Loop

Objective: turn predictions and recommendations into measured efficacy.

Steps:
1. Add a public outcome capture route or reuse an existing outcome verification service with public-safe tokens.
2. Add a result-page follow-up affordance using `components/outcomes/OutcomeVerificationPanel.tsx` or a smaller public-safe variant.
3. Link outcome records to `caseId`, recommendation id, and public-safe journey id.
4. Feed verified outcomes into calibration records through `lib/product/outcome-verification-service.ts`.
5. Only after enough verified outcomes exist, expose aggregate accuracy metrics.

Acceptance gate:
- `scripts/outcome-verification-guard.mjs`
- Outcome submit test covers helpful, not-helpful, acted, not-acted, and insufficient evidence cases
- Calibration write is idempotent
- No public claim of accuracy until sample-size and confidence thresholds are defined

## Phase 5: Commercial Fulfilment Hardening

Objective: make paid routes match fulfilment reality before scaling cross-sell.

Steps:
1. Treat `pages/api/billing/checkout.ts` and `pages/api/billing/webhook.ts` as canonical until a separate migration decision changes that.
2. Keep `pages/api/webhooks/stripe.ts` and `app/api/stripe/webhook/route.ts` as thin delegates only where needed for live Stripe dashboard compatibility.
3. Retire or quarantine mock/in-memory checkout flows from paid production paths:
   - `app/api/checkout/living-case/route.ts`
   - `app/api/checkout/living-case-confirm/route.ts`
   - `lib/commercial/checkout-entitlement.ts`
4. Extend the durable `processCheckoutCompleted()` path to create entitlement, order/artifact, admin queue item, and delivery obligation for each sellable product.
5. Keep Boardroom Brief human-reviewed until its delivery gates prove reliable.
6. Do not promote Strategy Room checkout further until durable booking/admin queue and confirmation exist.
7. Automate only products whose evidence and fulfilment contracts prove they can be fulfilled without founder review.

Acceptance gate:
- Checkout metadata identity tests pass
- Paid product fulfilment contract tests pass
- Every purchasable product has a durable post-payment path
- Manual products are labelled and routed as manual, not automated

## Phase 6: Cross-Sell Wiring

Objective: turn free signal results into truthful, context-aware commercial progression.

Steps:
1. Use `lib/product/product-knowledge-graph.ts` and `lib/product/semantic-destination-resolver.ts` after fulfilment truth is stable.
2. Recommendation inputs should be safe public metrics: contradiction class, pressure band, consequence class, accumulated depth, and outcome history if available.
3. CTA eligibility must check checkout safety, fulfilment readiness, product authority, and public claim boundaries.
4. For manual or review-gated products, route to request access or review, not direct checkout.

Acceptance gate:
- Cross-sell tests prove no unavailable/mock/manual-only product is presented as instant checkout
- Product authority gate remains green
- Public aperture tests remain green

## Phase 7: System Kill Switch

Objective: make degradation visible and operationally binding.

Steps:
1. Define metrics before code:
   - verified outcome accuracy
   - execution completion rate
   - refund/dispute rate
   - delivery SLA breach rate
   - manual override rate
2. Build a monitoring evaluator that reads calibration and fulfilment state.
3. Add thresholds and states: normal, watch, restricted, halted.
4. In restricted/halted state, block new commercial checkout for affected products while preserving existing customer access and fulfilment obligations.
5. Log all state changes to an audit ledger.

Acceptance gate:
- Unit tests cover threshold transitions
- Checkout path denies newly halted products
- Admin/status surface reports degraded state without over-disclosing sensitive internals

## Phase 8: Router Rationalisation, Deferred and Decision-Gated

Objective: reduce routing fragmentation only after the core flywheel and commercial truth are stable.

Do not begin this phase automatically. Start only after explicit decision and after Phases 0-7 have passed their acceptance gates or have documented exceptions.

Sequence when approved:
1. Checkout/webhooks first, because payment endpoint truth matters most.
2. Strategy Room APIs second.
3. Foundry/public signal APIs third.
4. Pages UI migration last, only when API ownership is clean.

Rules:
- Migrate one domain at a time.
- Keep compatibility shims until references and external dashboards are verified.
- Do not move live Stripe webhook endpoints until Stripe Dashboard endpoint registration is confirmed.
- Do not mix router migration with business-logic changes.

Acceptance gate:
- Route inventory updated
- Compatibility tests pass
- External webhook/dashboard configuration checked
- Rollback path documented

## Phase 9: Abstraction Debt Reduction

Objective: reduce maintenance drag only after behavioural wiring is proven.

Rules:
- Do not start with broad `lib/product` consolidation.
- Consolidate only files touched repeatedly by Phases 0-7.
- Prefer code generation for repetitive registry/surface definitions if the pattern is stable.
- Do not combine abstraction cleanup with public route or checkout logic changes.

## Sub-Agent Use Pattern

Use sub-agents for bounded, non-overlapping lanes:

- Public runtime explorer: public signal, persistence, outcome loop.
- Commercial explorer: checkout, webhook, fulfilment, product authority.
- Verification worker: targeted tests and guards after implementation.
- Router explorer: only during Phase 8, and only after approval.

Do not delegate the immediate blocking implementation slice if the main agent needs it next. Keep write scopes disjoint when using workers.

## Resume Protocol

At the start of each continuation:
1. Read this roadmap.
2. Run `git status --short`.
3. Identify the active phase and its files only.
4. Read the phase's evidence anchors.
5. Implement the smallest acceptance-gated slice.
6. Update this roadmap with:
   - completed step
   - changed files
   - tests run
   - next active step

## Progress Log

2026-07-18 — Phase 0 checkout identity slice completed.

Changed files:
- `pages/api/billing/checkout.ts`
- `lib/commercial/payment-event-processor.ts`
- `tests/commercial/payment-event-processor.test.ts`

Completed:
- Checkout now writes catalog `productCode`, `catalogCode`, `entitlementSlug`, `priceCode`, and `stripePriceId` metadata consistently.
- Webhook identity resolution accepts Stripe Price ID first, then catalog code, entitlement slug, and legacy catalog-code `priceCode` while old sessions age out.
- Payment processing grants and verifies the entitlement slug rather than the catalog key.

Verification run:
- `pnpm exec vitest run tests/commercial/payment-event-processor.test.ts`
- `pnpm exec vitest run tests/billing/boardroom-brief-entitlement-code.test.ts tests/billing/boardroom-brief-webhook-fulfilment.test.ts`
- `pnpm typecheck`

2026-07-18 — Phase 0 public aperture contract slice completed.

Changed files:
- `tests/product/public-aperture.spec.ts`

Completed:
- Added static API route guards proving `pages/api/public/kernel-signal.ts` stays behind the public intelligence aperture.
- Pinned absence of direct `@/lib/decision/kernel` / `evaluateDecision()` exposure from the public route.
- Pinned absence of route-level checkout, Prisma, Redis, paid dossier, internal graph, and prediction fields in the public API response type.

Verification run:
- `pnpm exec vitest run tests/product/public-aperture.spec.ts`
- `pnpm typecheck`

2026-07-18 — Phase 1 public-safe persistence adapter slice completed.

Changed files:
- `lib/product/public-signal-persistence.ts`
- `lib/product/diagnostic-journey-store.ts`
- `pages/api/public/kernel-signal.ts`
- `tests/product/public-signal-persistence.test.ts`

Completed:
- Added `persistPublicSignalFromDecisionIntelligence()` as the public-safe persistence adapter for free-signal output.
- Public API now runs `runDecisionIntelligence()` without the richer generic journey persistence and then persists only derived public-safe facts through the adapter.
- `getOrCreateDiagnosticJourney()` now attempts durable Prisma `DiagnosticJourney` creation for new journeys, with in-memory fallback unchanged.
- Added idempotency by `caseId`, event type, engine id, and input hash.
- Added tests proving safe events are written, raw situation text is not persisted, paid/internal fields are absent, and repeat persistence is idempotent.

Verification run:
- `pnpm exec vitest run tests/product/public-signal-persistence.test.ts tests/product/public-aperture.spec.ts`
- `pnpm exec vitest run tests/intelligence/orchestrator-journey-persistence.test.ts`
- `pnpm typecheck`
- `node scripts/check-public-route-integrity.mjs`

## Current Next Step

Continue Phase 1 / prepare Phase 2:

1. Inspect the stored public-safe event payloads and decide whether the next slice should add redacted graph snapshot storage or first expose a public-safe accumulated-depth metric.
2. Add a graph accumulation test proving a second submission for the same `caseId` can read prior public-safe events without exposing raw graph nodes.
3. Keep direct `@/lib/decision/kernel` imports out of public route files.

Router migration remains deferred.
