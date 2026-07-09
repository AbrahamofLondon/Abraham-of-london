# Enterprise Diligence Demo — 30 Minutes

Purpose: diligence the four-pillar system through routes, state, evidence, and failure controls. No customer outcomes or revenue claims are asserted.

1. Accountable Judgement: `/decision-instruments/signal`
Input: live decision fixture from the 10-minute demo.
Expected result: method version, evidence posture, uncertainty, evidence links, not-yet-appropriate boundary.
Evidence: `tests/demo-journey/decision-signal-engine.test.ts`.

2. Compounding Continuity: `/api/demo/signal-consent-continuation`
Input: request continuation, establish identity, capture consent, bind case, record interaction, update twin.
Expected result: ANONYMOUS_RUN remains non-personal until consent; after case binding the state becomes durable and twin version increments.
Evidence: `tests/demo-journey/signal-consent-transition.test.ts`.

3. Governed Corridor: `/corridor?rec=<recommendationId>`
Input: the persisted recommendation context.
Expected result: one primary next move, unresolved blockers, stale recommendation detection, controlled/manual/self-serve access mode.
Evidence: `tests/demo-journey/corridor-recommendation-context.test.ts`.

4. Controlled Continuation: `/engagements/operator-pilot`
Input: high-materiality controlled pilot fixture.
Expected result: qualification only; no automatic acceptance.
Evidence: `tests/demo-journey/operator-pilot-qualification.test.ts`.

5. Operator Governance: `/admin/operator-pilot`
Input: admin session.
Expected result: review queue, state filters, ageing, next operation, transition authority.
Evidence: `lib/platform/admin-domain-registry.ts` registers `/admin/operator-pilot` as HIGH risk and audit-emitting.

6. Customer Safety: `/engagements/operator-pilot-status`
Input: exact reference.
Expected result: customer-safe status; no owner/operator notes or other-customer enumeration.
Evidence: `tests/demo-journey/pilot-intake-store.test.ts`.

7. Measurement: `/admin/conversion-dashboard`
Input: durable funnel events.
Expected result: aggregation by stage, no sensitive text persisted, journey version/date filtering available in store.
Evidence: `tests/demo-journey/funnel-event-store.test.ts`.

8. Commercial Truth
Input: `artifacts/validation/market-activation/current-commercial-truth.json`.
Expected result: separates live deployment, pricing/manual billing, customer/revenue unknowns, and no unsupported testimonials.
Buyer question: "What is proven vs not yet proven?"
Evidence-backed answer: architecture and local operational flow are proven by tests; customer/revenue repeatability remains evidence to be produced by the founding-customer programme.
